package parents

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrParentNotFound     = errors.New("akun orang tua tidak ditemukan")
	ErrDuplicateIdentity  = errors.New("email atau nomor telepon sudah terdaftar")
	ErrInvalidInput       = errors.New("data pendaftaran orang tua tidak lengkap")
)

type LinkedChildSummary struct {
	ID           string `json:"id"`
	FullName     string `json:"full_name"`
	Gender       string `json:"gender"`
	BirthDate    string `json:"birth_date"`
	AgeMonths    int    `json:"age_months"`
	PosyanduName string `json:"posyandu_name"`
	ParentName   string `json:"parent_name"`
	ParentPhone  string `json:"parent_phone"`
	MagicToken   string `json:"magic_token"`
}

type ParentAccount struct {
	ID           int64                `json:"id"`
	FullName     string               `json:"full_name"`
	Email        string               `json:"email"`
	Phone        string               `json:"phone"`
	Role         string               `json:"role"`
	PosyanduName string               `json:"posyandu_name"`
	VillageName  string               `json:"village_name"`
	IsActive     bool                 `json:"is_active"`
	CreatedAt    string               `json:"created_at"`
	Children     []LinkedChildSummary `json:"children"`
}

type ParentsListPayload struct {
	Parents          []ParentAccount      `json:"parents"`
	UnlinkedChildren []LinkedChildSummary `json:"unlinked_children"`
}

type RegisterParentInput struct {
	FullName     string   `json:"full_name"`
	Name         string   `json:"name"`
	Email        string   `json:"email"`
	Phone        string   `json:"phone"`
	Password     string   `json:"password"`
	PosyanduName string   `json:"posyandu_name"`
	VillageName  string   `json:"village_name"`
	ChildIDs     []string `json:"child_ids"`
}

type UpdateParentChildrenInput struct {
	ChildIDs []string `json:"child_ids"`
}

type Repository interface {
	ListParentsAndUnlinkedChildren(ctx context.Context, villageName string) (*ParentsListPayload, error)
	RegisterParent(ctx context.Context, in RegisterParentInput) (*ParentAccount, error)
	UpdateParentChildren(ctx context.Context, parentID int64, childIDs []string) (*ParentAccount, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func generateRandomToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return "magic-" + hex.EncodeToString(b)
}

func calcAgeMonths(birthDate time.Time) int {
	now := time.Now()
	total := (now.Year()-birthDate.Year())*12 + (int(now.Month()) - int(birthDate.Month()))
	if now.Day() < birthDate.Day() {
		total--
	}
	if total < 0 {
		return 0
	}
	return total
}

func (r *repository) ListParentsAndUnlinkedChildren(ctx context.Context, villageName string) (*ParentsListPayload, error) {
	payload := &ParentsListPayload{
		Parents:          []ParentAccount{},
		UnlinkedChildren: []LinkedChildSummary{},
	}
	if r.db == nil {
		return payload, nil
	}

	// 1. Fetch all ortu accounts from tumbuhin_users
	pQuery := `
		SELECT
			id,
			full_name,
			email,
			phone,
			role,
			COALESCE(posyandu_name, 'Posyandu Melati 04'),
			COALESCE(village_name, 'Desa Sukamaju'),
			COALESCE(is_active, TRUE),
			to_char(COALESCE(created_at, NOW()), 'YYYY-MM-DD HH24:MI')
		FROM tumbuhin_users
		WHERE role = 'ortu'
		  AND ($1 = '' OR LOWER(COALESCE(village_name, '')) = LOWER($1))
		ORDER BY id DESC
	`
	pRows, err := r.db.Query(ctx, pQuery, strings.TrimSpace(villageName))
	if err != nil {
		return nil, err
	}
	defer pRows.Close()

	parentIndex := make(map[int64]int)
	for pRows.Next() {
		var p ParentAccount
		if err := pRows.Scan(
			&p.ID, &p.FullName, &p.Email, &p.Phone, &p.Role,
			&p.PosyanduName, &p.VillageName, &p.IsActive, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		p.Children = []LinkedChildSummary{}
		parentIndex[p.ID] = len(payload.Parents)
		payload.Parents = append(payload.Parents, p)
	}

	// 2. Fetch all active children in the village to assign to parents or unlinked list
	cQuery := `
		SELECT
			id::text,
			full_name,
			gender,
			birth_date,
			COALESCE(posyandu_name, 'Posyandu Melati 04'),
			COALESCE(parent_name, ''),
			COALESCE(parent_phone, ''),
			COALESCE(magic_token, ''),
			parent_user_id
		FROM children
		WHERE COALESCE(is_active, TRUE) = TRUE
		  AND ($1 = '' OR LOWER(COALESCE(village_name, '')) = LOWER($1))
		ORDER BY full_name ASC
	`
	cRows, err := r.db.Query(ctx, cQuery, strings.TrimSpace(villageName))
	if err != nil {
		return nil, err
	}
	defer cRows.Close()

	for cRows.Next() {
		var c LinkedChildSummary
		var bDate time.Time
		var parentUserID *int64
		if err := cRows.Scan(
			&c.ID, &c.FullName, &c.Gender, &bDate, &c.PosyanduName,
			&c.ParentName, &c.ParentPhone, &c.MagicToken, &parentUserID,
		); err != nil {
			continue
		}
		c.BirthDate = bDate.Format("2006-01-02")
		c.AgeMonths = calcAgeMonths(bDate)

		if parentUserID != nil {
			if idx, ok := parentIndex[*parentUserID]; ok {
				payload.Parents[idx].Children = append(payload.Parents[idx].Children, c)
			}
		} else {
			payload.UnlinkedChildren = append(payload.UnlinkedChildren, c)
		}
	}

	return payload, nil
}

func (r *repository) RegisterParent(ctx context.Context, in RegisterParentInput) (*ParentAccount, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}

	fullName := strings.TrimSpace(in.FullName)
	if fullName == "" {
		fullName = strings.TrimSpace(in.Name)
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	phone := strings.TrimSpace(in.Phone)
	pass := strings.TrimSpace(in.Password)

	if fullName == "" || (email == "" && phone == "") {
		return nil, ErrInvalidInput
	}
	if email == "" && phone != "" {
		cleanDigits := strings.ReplaceAll(phone, "+", "")
		email = fmt.Sprintf("%s@ortu.tumbuhin.id", cleanDigits)
	}
	if phone == "" && email != "" {
		phone = fmt.Sprintf("08%d", time.Now().UnixNano()%10000000000)
	}
	if pass == "" {
		pass = "ortusehat2026"
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	posyanduName := strings.TrimSpace(in.PosyanduName)
	if posyanduName == "" {
		posyanduName = "Posyandu Melati 04"
	}
	villageName := strings.TrimSpace(in.VillageName)
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}
	magicToken := generateRandomToken()

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var out ParentAccount
	insertSQL := `
		INSERT INTO tumbuhin_users (
			full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, 'ortu', $5, $6, $7, TRUE, NOW(), NOW())
		RETURNING id, full_name, email, phone, role, COALESCE(posyandu_name, ''), COALESCE(village_name, ''), is_active, to_char(created_at, 'YYYY-MM-DD HH24:MI')
	`
	err = tx.QueryRow(
		ctx,
		insertSQL,
		fullName,
		email,
		phone,
		string(hashed),
		posyanduName,
		villageName,
		magicToken,
	).Scan(
		&out.ID, &out.FullName, &out.Email, &out.Phone, &out.Role,
		&out.PosyanduName, &out.VillageName, &out.IsActive, &out.CreatedAt,
	)
	if err != nil {
		lower := strings.ToLower(err.Error())
		if strings.Contains(lower, "duplicate") || strings.Contains(lower, "unique") {
			return nil, ErrDuplicateIdentity
		}
		return nil, err
	}

	out.Children = []LinkedChildSummary{}
	if len(in.ChildIDs) > 0 {
		updateChildrenSQL := `
			UPDATE children
			SET parent_user_id = $1,
				parent_name = CASE WHEN COALESCE(parent_name, '') = '' THEN $2 ELSE parent_name END,
				parent_phone = CASE WHEN COALESCE(parent_phone, '') = '' THEN $3 ELSE parent_phone END,
				updated_at = NOW()
			WHERE id::text = ANY($4)
		`
		if _, err := tx.Exec(ctx, updateChildrenSQL, out.ID, out.FullName, out.Phone, in.ChildIDs); err != nil {
			return nil, err
		}

		cRows, err := tx.Query(ctx, `
			SELECT id::text, full_name, gender, birth_date, COALESCE(posyandu_name, ''), COALESCE(parent_name, ''), COALESCE(parent_phone, ''), COALESCE(magic_token, '')
			FROM children
			WHERE parent_user_id = $1
			ORDER BY full_name ASC
		`, out.ID)
		if err == nil {
			defer cRows.Close()
			for cRows.Next() {
				var c LinkedChildSummary
				var bDate time.Time
				if scanErr := cRows.Scan(&c.ID, &c.FullName, &c.Gender, &bDate, &c.PosyanduName, &c.ParentName, &c.ParentPhone, &c.MagicToken); scanErr == nil {
					c.BirthDate = bDate.Format("2006-01-02")
					c.AgeMonths = calcAgeMonths(bDate)
					out.Children = append(out.Children, c)
				}
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &out, nil
}

func (r *repository) UpdateParentChildren(ctx context.Context, parentID int64, childIDs []string) (*ParentAccount, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var out ParentAccount
	err = tx.QueryRow(ctx, `
		SELECT id, full_name, email, phone, role, COALESCE(posyandu_name, ''), COALESCE(village_name, ''), COALESCE(is_active, TRUE), to_char(COALESCE(created_at, NOW()), 'YYYY-MM-DD HH24:MI')
		FROM tumbuhin_users
		WHERE id = $1 AND role = 'ortu'
		LIMIT 1
	`, parentID).Scan(
		&out.ID, &out.FullName, &out.Email, &out.Phone, &out.Role,
		&out.PosyanduName, &out.VillageName, &out.IsActive, &out.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrParentNotFound
		}
		return nil, err
	}

	// Unlink existing children of this parent first
	if _, err := tx.Exec(ctx, `UPDATE children SET parent_user_id = NULL, updated_at = NOW() WHERE parent_user_id = $1`, parentID); err != nil {
		return nil, err
	}

	out.Children = []LinkedChildSummary{}
	if len(childIDs) > 0 {
		if _, err := tx.Exec(ctx, `
			UPDATE children
			SET parent_user_id = $1,
				parent_name = CASE WHEN COALESCE(parent_name, '') = '' THEN $2 ELSE parent_name END,
				parent_phone = CASE WHEN COALESCE(parent_phone, '') = '' THEN $3 ELSE parent_phone END,
				updated_at = NOW()
			WHERE id::text = ANY($4)
		`, parentID, out.FullName, out.Phone, childIDs); err != nil {
			return nil, err
		}

		cRows, err := tx.Query(ctx, `
			SELECT id::text, full_name, gender, birth_date, COALESCE(posyandu_name, ''), COALESCE(parent_name, ''), COALESCE(parent_phone, ''), COALESCE(magic_token, '')
			FROM children
			WHERE parent_user_id = $1
			ORDER BY full_name ASC
		`, parentID)
		if err == nil {
			defer cRows.Close()
			for cRows.Next() {
				var c LinkedChildSummary
				var bDate time.Time
				if scanErr := cRows.Scan(&c.ID, &c.FullName, &c.Gender, &bDate, &c.PosyanduName, &c.ParentName, &c.ParentPhone, &c.MagicToken); scanErr == nil {
					c.BirthDate = bDate.Format("2006-01-02")
					c.AgeMonths = calcAgeMonths(bDate)
					out.Children = append(out.Children, c)
				}
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &out, nil
}
