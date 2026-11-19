package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"tumbuhin-backend/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserNotFound      = errors.New("akun tidak ditemukan")
	ErrUserAlreadyExists = errors.New("email atau nomor telepon sudah terdaftar")
)

// AuthRepository defines the data access contract for authentication (Dependency Inversion Principle)
type AuthRepository interface {
	FindByIdentifier(ctx context.Context, identifier string) (*models.User, error)
	FindByID(ctx context.Context, id int64) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) (*models.User, error)
}

type postgresAuthRepository struct {
	db *pgxpool.Pool
}

// NewPostgresAuthRepository creates a PostgreSQL-backed AuthRepository
func NewPostgresAuthRepository(db *pgxpool.Pool) AuthRepository {
	return &postgresAuthRepository{db: db}
}

func normalizePhoneVariants(input string) (string, string) {
	cleaned := strings.TrimSpace(input)
	if strings.HasPrefix(cleaned, "+62") {
		return cleaned, "0" + strings.TrimPrefix(cleaned, "+62")
	}
	if strings.HasPrefix(cleaned, "62") {
		return "+" + cleaned, "0" + strings.TrimPrefix(cleaned, "62")
	}
	if strings.HasPrefix(cleaned, "0") {
		return cleaned, "+62" + strings.TrimPrefix(cleaned, "0")
	}
	return cleaned, cleaned
}

func (r *postgresAuthRepository) FindByIdentifier(ctx context.Context, identifier string) (*models.User, error) {
	cleanID := strings.TrimSpace(identifier)
	emailCandidate := strings.ToLower(cleanID)
	phoneA, phoneB := normalizePhoneVariants(cleanID)

	query := `
		SELECT id, full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, created_at, updated_at
		FROM tumbuhin_users
		WHERE LOWER(email) = $1 OR phone = $2 OR phone = $3
		LIMIT 1
	`

	var u models.User
	err := r.db.QueryRow(ctx, query, emailCandidate, phoneA, phoneB).Scan(
		&u.ID,
		&u.FullName,
		&u.Email,
		&u.Phone,
		&u.PasswordHash,
		&u.Role,
		&u.PosyanduName,
		&u.VillageName,
		&u.MagicToken,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	u.Name = u.FullName
	return &u, nil
}

func (r *postgresAuthRepository) FindByID(ctx context.Context, id int64) (*models.User, error) {
	query := `
		SELECT id, full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, created_at, updated_at
		FROM tumbuhin_users
		WHERE id = $1
		LIMIT 1
	`

	var u models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.FullName,
		&u.Email,
		&u.Phone,
		&u.PasswordHash,
		&u.Role,
		&u.PosyanduName,
		&u.VillageName,
		&u.MagicToken,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	u.Name = u.FullName
	return &u, nil
}

func (r *postgresAuthRepository) CreateUser(ctx context.Context, user *models.User) (*models.User, error) {
	query := `
		INSERT INTO tumbuhin_users (
			full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $9)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	err := r.db.QueryRow(
		ctx,
		query,
		user.FullName,
		strings.ToLower(strings.TrimSpace(user.Email)),
		strings.TrimSpace(user.Phone),
		user.PasswordHash,
		user.Role,
		user.PosyanduName,
		user.VillageName,
		user.MagicToken,
		now,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrUserAlreadyExists
		}
		return nil, err
	}

	user.Name = user.FullName
	user.IsActive = true
	return user, nil
}
