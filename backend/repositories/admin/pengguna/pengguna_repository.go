package pengguna

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// AdminUserRecord represents a user account in RBAC management (Module 3.3)
type AdminUserRecord struct {
	ID           int64  `json:"id"`
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Role         string `json:"role"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
	MagicToken   string `json:"magic_token"`
	IsActive     bool   `json:"is_active"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

type AdminUserInput struct {
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Password     string `json:"password"`
	Role         string `json:"role"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
	IsActive     *bool  `json:"is_active"`
}

type ChildTokenRecord struct {
	ID           string `json:"id"`
	FullName     string `json:"full_name"`
	ParentName   string `json:"parent_name"`
	ParentPhone  string `json:"parent_phone"`
	PosyanduName string `json:"posyandu_name"`
	RWCode       string `json:"rw_code"`
	NIKHash      string `json:"nik_hash"`
	MagicToken   string `json:"magic_token"`
	UpdatedAt    string `json:"updated_at"`
}

type UsersAndTokensPayload struct {
	Users    []AdminUserRecord  `json:"users"`
	Children []ChildTokenRecord `json:"children"`
}

// Repository defines CRUD operations for RBAC users and child Magic Tokens
type Repository interface {
	ListUsersAndTokens(ctx context.Context) (*UsersAndTokensPayload, error)
	CreateUser(ctx context.Context, in AdminUserInput) (*AdminUserRecord, error)
	UpdateUser(ctx context.Context, id int64, in AdminUserInput) (*AdminUserRecord, error)
	ToggleUserActive(ctx context.Context, id int64) (*AdminUserRecord, error)
	DeleteUser(ctx context.Context, id int64) error
	RegenerateChildMagicToken(ctx context.Context, childID string) (*ChildTokenRecord, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) ListUsersAndTokens(ctx context.Context) (*UsersAndTokensPayload, error) {
	payload := &UsersAndTokensPayload{
		Users:    []AdminUserRecord{},
		Children: []ChildTokenRecord{},
	}
	if r.db == nil {
		return payload, nil
	}

	uRows, err := r.db.Query(ctx, `
		SELECT
			id,
			full_name,
			email,
			phone,
			role,
			COALESCE(posyandu_name, ''),
			COALESCE(village_name, 'Desa Sukamaju'),
			COALESCE(magic_token, ''),
			COALESCE(is_active, TRUE),
			to_char(COALESCE(created_at, NOW()), 'YYYY-MM-DD HH24:MI'),
			to_char(COALESCE(updated_at, NOW()), 'YYYY-MM-DD HH24:MI')
		FROM tumbuhin_users
		ORDER BY
			CASE role
				WHEN 'admin' THEN 1
				WHEN 'bidan' THEN 2
				WHEN 'kader' THEN 3
				ELSE 4
			END,
			id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer uRows.Close()

	for uRows.Next() {
		var u AdminUserRecord
		if err := uRows.Scan(
			&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role,
			&u.PosyanduName, &u.VillageName, &u.MagicToken, &u.IsActive,
			&u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		payload.Users = append(payload.Users, u)
	}

	cRows, err := r.db.Query(ctx, `
		SELECT
			id::text,
			full_name,
			COALESCE(parent_name, '-'),
			COALESCE(parent_phone, '-'),
			COALESCE(posyandu_name, 'Posyandu Melati 04'),
			COALESCE(rw_code, '001'),
			nik_hash,
			COALESCE(magic_token, ''),
			to_char(COALESCE(updated_at, created_at, NOW()), 'YYYY-MM-DD HH24:MI')
		FROM children
		WHERE COALESCE(is_active, TRUE) = TRUE
		ORDER BY updated_at DESC NULLS LAST, full_name ASC
	`)
	if err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var c ChildTokenRecord
			if err := cRows.Scan(
				&c.ID, &c.FullName, &c.ParentName, &c.ParentPhone,
				&c.PosyanduName, &c.RWCode, &c.NIKHash, &c.MagicToken, &c.UpdatedAt,
			); err == nil {
				payload.Children = append(payload.Children, c)
			}
		}
	}

	return payload, nil
}

func validateRole(role string) string {
	r := strings.ToLower(strings.TrimSpace(role))
	switch r {
	case "kader", "bidan", "admin", "ortu":
		return r
	default:
		return "kader"
	}
}

func (r *repository) CreateUser(ctx context.Context, in AdminUserInput) (*AdminUserRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	fullName := strings.TrimSpace(in.FullName)
	email := strings.ToLower(strings.TrimSpace(in.Email))
	phone := strings.TrimSpace(in.Phone)
	pass := strings.TrimSpace(in.Password)
	if fullName == "" || email == "" || phone == "" {
		return nil, fmt.Errorf("nama lengkap, email, dan nomor telepon wajib diisi")
	}
	if pass == "" {
		pass = "tumbuhinsehat2026"
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	role := validateRole(in.Role)
	posyandu := strings.TrimSpace(in.PosyanduName)
	if posyandu == "" {
		posyandu = "Posyandu Melati 04"
	}
	village := strings.TrimSpace(in.VillageName)
	if village == "" {
		village = "Desa Sukamaju"
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}

	var u AdminUserRecord
	err = r.db.QueryRow(ctx, `
		INSERT INTO tumbuhin_users (full_name, email, phone, password_hash, role, posyandu_name, village_name, is_active, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		RETURNING id, full_name, email, phone, role, COALESCE(posyandu_name,''), COALESCE(village_name,''), COALESCE(magic_token,''), is_active,
		          to_char(created_at, 'YYYY-MM-DD HH24:MI'), to_char(updated_at, 'YYYY-MM-DD HH24:MI')
	`, fullName, email, phone, string(hashed), role, posyandu, village, active).Scan(
		&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role,
		&u.PosyanduName, &u.VillageName, &u.MagicToken, &u.IsActive,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat akun (pastikan email & nomor HP belum terdaftar): %w", err)
	}
	return &u, nil
}

func (r *repository) UpdateUser(ctx context.Context, id int64, in AdminUserInput) (*AdminUserRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	fullName := strings.TrimSpace(in.FullName)
	email := strings.ToLower(strings.TrimSpace(in.Email))
	phone := strings.TrimSpace(in.Phone)
	if fullName == "" || email == "" || phone == "" {
		return nil, fmt.Errorf("nama lengkap, email, dan nomor telepon wajib diisi")
	}
	role := validateRole(in.Role)
	posyandu := strings.TrimSpace(in.PosyanduName)
	village := strings.TrimSpace(in.VillageName)
	if village == "" {
		village = "Desa Sukamaju"
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}

	if pass := strings.TrimSpace(in.Password); pass != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		_, err = r.db.Exec(ctx, `UPDATE tumbuhin_users SET password_hash = $2 WHERE id = $1`, id, string(hashed))
		if err != nil {
			return nil, err
		}
	}

	var u AdminUserRecord
	err := r.db.QueryRow(ctx, `
		UPDATE tumbuhin_users
		SET full_name = $2,
		    email = $3,
		    phone = $4,
		    role = $5,
		    posyandu_name = $6,
		    village_name = $7,
		    is_active = $8,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, full_name, email, phone, role, COALESCE(posyandu_name,''), COALESCE(village_name,''), COALESCE(magic_token,''), is_active,
		          to_char(created_at, 'YYYY-MM-DD HH24:MI'), to_char(updated_at, 'YYYY-MM-DD HH24:MI')
	`, id, fullName, email, phone, role, posyandu, village, active).Scan(
		&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role,
		&u.PosyanduName, &u.VillageName, &u.MagicToken, &u.IsActive,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *repository) ToggleUserActive(ctx context.Context, id int64) (*AdminUserRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	var u AdminUserRecord
	err := r.db.QueryRow(ctx, `
		UPDATE tumbuhin_users
		SET is_active = NOT COALESCE(is_active, TRUE),
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, full_name, email, phone, role, COALESCE(posyandu_name,''), COALESCE(village_name,''), COALESCE(magic_token,''), is_active,
		          to_char(created_at, 'YYYY-MM-DD HH24:MI'), to_char(updated_at, 'YYYY-MM-DD HH24:MI')
	`, id).Scan(
		&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role,
		&u.PosyanduName, &u.VillageName, &u.MagicToken, &u.IsActive,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *repository) DeleteUser(ctx context.Context, id int64) error {
	if r.db == nil {
		return fmt.Errorf("database tidak tersedia")
	}
	_, err := r.db.Exec(ctx, `DELETE FROM tumbuhin_users WHERE id = $1`, id)
	return err
}

func generateSecureMagicToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return "magic-" + hex.EncodeToString(b)
}

func (r *repository) RegenerateChildMagicToken(ctx context.Context, childID string) (*ChildTokenRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	newToken := generateSecureMagicToken()
	var c ChildTokenRecord
	err := r.db.QueryRow(ctx, `
		UPDATE children
		SET magic_token = $2,
		    updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING id::text, full_name, COALESCE(parent_name,'-'), COALESCE(parent_phone,'-'),
		          COALESCE(posyandu_name,'Posyandu Melati 04'), COALESCE(rw_code,'001'),
		          nik_hash, magic_token, to_char(updated_at, 'YYYY-MM-DD HH24:MI')
	`, childID, newToken).Scan(
		&c.ID, &c.FullName, &c.ParentName, &c.ParentPhone,
		&c.PosyanduName, &c.RWCode, &c.NIKHash, &c.MagicToken, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}
