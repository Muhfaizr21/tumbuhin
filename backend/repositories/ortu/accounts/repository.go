package accounts

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserAlreadyExists   = errors.New("email atau nomor telepon sudah terdaftar")
	ErrParentNotFound      = errors.New("akun orang tua tidak ditemukan")
	ErrChildNotFound       = errors.New("balita tidak ditemukan")
	ErrChildOutOfScope     = errors.New("balita di luar lingkup posyandu kader")
	ErrChildAlreadyLinked  = errors.New("balita sudah tertaut ke akun orang tua lain")
	ErrDatabaseUnavailable = errors.New("database tidak tersedia")
)

type Scope struct {
	PosyanduName string
	VillageName  string
}

type LinkedChild struct {
	ID           string `json:"id"`
	FullName     string `json:"full_name"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
}

type ParentRecord struct {
	ID           int64         `json:"id"`
	FullName     string        `json:"full_name"`
	Email        string        `json:"email"`
	Phone        string        `json:"phone"`
	Role         string        `json:"role"`
	PosyanduName string        `json:"posyandu_name"`
	VillageName  string        `json:"village_name"`
	IsActive     bool          `json:"is_active"`
	Children     []LinkedChild `json:"children"`
}

type ChildOption struct {
	ID           string `json:"id"`
	FullName     string `json:"full_name"`
	ParentName   string `json:"parent_name"`
	ParentPhone  string `json:"parent_phone"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
	RTCode       string `json:"rt_code"`
	RWCode       string `json:"rw_code"`
}

type ListResult struct {
	Parents          []ParentRecord `json:"parents"`
	UnlinkedChildren []ChildOption  `json:"unlinked_children"`
}

type NewParent struct {
	FullName     string   `json:"full_name"`
	Email        string   `json:"email"`
	Phone        string   `json:"phone"`
	Password     string   `json:"password"`
	PasswordHash string   `json:"-"`
	MagicToken   string   `json:"-"`
	ChildIDs     []string `json:"child_ids"`
}

type Repository interface {
	List(ctx context.Context, scope Scope) (*ListResult, error)
	Register(ctx context.Context, input NewParent, scope Scope) (*ParentRecord, error)
	UpdateChildren(ctx context.Context, parentID int64, childIDs []string, scope Scope) (*ParentRecord, error)
}

type queryer interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func matchScope(value, expected string) bool {
	return expected == "" || strings.EqualFold(strings.TrimSpace(value), strings.TrimSpace(expected))
}

func isDuplicate(err error) bool {
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique")
}

func (r *repository) List(ctx context.Context, scope Scope) (*ListResult, error) {
	payload := &ListResult{
		Parents:          []ParentRecord{},
		UnlinkedChildren: []ChildOption{},
	}
	if r.db == nil {
		return payload, nil
	}

	parentRows, err := r.db.Query(ctx, `
		SELECT id, full_name, COALESCE(email, ''), COALESCE(phone, ''), role,
		       COALESCE(posyandu_name, ''), COALESCE(village_name, ''), COALESCE(is_active, TRUE)
		FROM tumbuhin_users
		WHERE role = 'ortu'
		  AND ($1 = '' OR COALESCE(posyandu_name, '') = $1)
		  AND ($2 = '' OR COALESCE(village_name, 'Desa Sukamaju') = $2)
		ORDER BY full_name ASC
	`, scope.PosyanduName, scope.VillageName)
	if err != nil {
		return nil, err
	}
	defer parentRows.Close()

	parentIndex := make(map[int64]int)
	for parentRows.Next() {
		var parent ParentRecord
		if err := parentRows.Scan(
			&parent.ID,
			&parent.FullName,
			&parent.Email,
			&parent.Phone,
			&parent.Role,
			&parent.PosyanduName,
			&parent.VillageName,
			&parent.IsActive,
		); err != nil {
			return nil, err
		}
		parent.Children = []LinkedChild{}
		payload.Parents = append(payload.Parents, parent)
		parentIndex[parent.ID] = len(payload.Parents) - 1
	}
	if err := parentRows.Err(); err != nil {
		return nil, err
	}

	if len(parentIndex) > 0 {
		ids := make([]int64, 0, len(parentIndex))
		for id := range parentIndex {
			ids = append(ids, id)
		}

		childRows, err := r.db.Query(ctx, `
			SELECT parent_user_id, id::text, full_name, COALESCE(posyandu_name, ''), COALESCE(village_name, '')
			FROM children
			WHERE parent_user_id = ANY($1) AND COALESCE(is_active, TRUE) = TRUE
			ORDER BY full_name ASC
		`, ids)
		if err != nil {
			return nil, err
		}
		defer childRows.Close()

		for childRows.Next() {
			var parentID int64
			var child LinkedChild
			if err := childRows.Scan(&parentID, &child.ID, &child.FullName, &child.PosyanduName, &child.VillageName); err != nil {
				return nil, err
			}
			if index, ok := parentIndex[parentID]; ok {
				payload.Parents[index].Children = append(payload.Parents[index].Children, child)
			}
		}
		if err := childRows.Err(); err != nil {
			return nil, err
		}
	}

	availableRows, err := r.db.Query(ctx, `
		SELECT id::text, COALESCE(parent_name, ''), COALESCE(parent_phone, ''), full_name,
		       COALESCE(posyandu_name, ''), COALESCE(village_name, 'Desa Sukamaju'),
		       COALESCE(rt_code, ''), COALESCE(rw_code, '')
		FROM children
		WHERE COALESCE(is_active, TRUE) = TRUE
		  AND parent_user_id IS NULL
		  AND ($1 = '' OR COALESCE(posyandu_name, '') = $1)
		  AND ($2 = '' OR COALESCE(village_name, 'Desa Sukamaju') = $2)
		ORDER BY full_name ASC
	`, scope.PosyanduName, scope.VillageName)
	if err != nil {
		return nil, err
	}
	defer availableRows.Close()

	for availableRows.Next() {
		var child ChildOption
		if err := availableRows.Scan(
			&child.ID,
			&child.ParentName,
			&child.ParentPhone,
			&child.FullName,
			&child.PosyanduName,
			&child.VillageName,
			&child.RTCode,
			&child.RWCode,
		); err != nil {
			return nil, err
		}
		payload.UnlinkedChildren = append(payload.UnlinkedChildren, child)
	}
	if err := availableRows.Err(); err != nil {
		return nil, err
	}

	return payload, nil
}

func (r *repository) Register(ctx context.Context, input NewParent, scope Scope) (*ParentRecord, error) {
	if r.db == nil {
		return nil, ErrDatabaseUnavailable
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var parentID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO tumbuhin_users (
			full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, 'ortu', $5, $6, $7, TRUE, NOW(), NOW())
		RETURNING id
	`,
		input.FullName,
		input.Email,
		input.Phone,
		input.PasswordHash,
		scope.PosyanduName,
		scope.VillageName,
		input.MagicToken,
	).Scan(&parentID)
	if err != nil {
		if isDuplicate(err) {
			return nil, ErrUserAlreadyExists
		}
		return nil, err
	}

	if err := linkChildren(ctx, tx, parentID, input.ChildIDs, scope); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return getParent(ctx, r.db, parentID)
}

func (r *repository) UpdateChildren(ctx context.Context, parentID int64, childIDs []string, scope Scope) (*ParentRecord, error) {
	if r.db == nil {
		return nil, ErrDatabaseUnavailable
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var role, posyanduName, villageName string
	err = tx.QueryRow(ctx, `
		SELECT role, COALESCE(posyandu_name, ''), COALESCE(village_name, '')
		FROM tumbuhin_users WHERE id = $1
	`, parentID).Scan(&role, &posyanduName, &villageName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrParentNotFound
		}
		return nil, err
	}
	if role != "ortu" || !matchScope(posyanduName, scope.PosyanduName) || !matchScope(villageName, scope.VillageName) {
		return nil, ErrParentNotFound
	}

	if _, err := tx.Exec(ctx, `UPDATE children SET parent_user_id = NULL, updated_at = NOW() WHERE parent_user_id = $1`, parentID); err != nil {
		return nil, err
	}
	if err := linkChildren(ctx, tx, parentID, childIDs, scope); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return getParent(ctx, r.db, parentID)
}

func linkChildren(ctx context.Context, tx pgx.Tx, parentID int64, childIDs []string, scope Scope) error {
	if len(childIDs) == 0 {
		return nil
	}

	rows, err := tx.Query(ctx, `
		SELECT id::text, COALESCE(posyandu_name, ''), COALESCE(village_name, ''), parent_user_id
		FROM children
		WHERE id::text = ANY($1)
		FOR UPDATE
	`, childIDs)
	if err != nil {
		return err
	}
	defer rows.Close()

	seen := make(map[string]bool, len(childIDs))
	for rows.Next() {
		var id, posyanduName, villageName string
		var linkedTo sql.NullInt64
		if err := rows.Scan(&id, &posyanduName, &villageName, &linkedTo); err != nil {
			return err
		}
		seen[id] = true
		if !matchScope(posyanduName, scope.PosyanduName) || !matchScope(villageName, scope.VillageName) {
			return ErrChildOutOfScope
		}
		if linkedTo.Valid && linkedTo.Int64 != parentID {
			return ErrChildAlreadyLinked
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(seen) != len(childIDs) {
		return ErrChildNotFound
	}

	_, err = tx.Exec(ctx, `
		UPDATE children SET parent_user_id = $1, updated_at = NOW()
		WHERE id::text = ANY($2)
	`, parentID, childIDs)
	return err
}

func getParent(ctx context.Context, q queryer, parentID int64) (*ParentRecord, error) {
	var parent ParentRecord
	err := q.QueryRow(ctx, `
		SELECT id, full_name, COALESCE(email, ''), COALESCE(phone, ''), role,
		       COALESCE(posyandu_name, ''), COALESCE(village_name, ''), COALESCE(is_active, TRUE)
		FROM tumbuhin_users WHERE id = $1
	`, parentID).Scan(
		&parent.ID,
		&parent.FullName,
		&parent.Email,
		&parent.Phone,
		&parent.Role,
		&parent.PosyanduName,
		&parent.VillageName,
		&parent.IsActive,
	)
	if err != nil {
		return nil, err
	}
	parent.Children = []LinkedChild{}

	rows, err := q.Query(ctx, `
		SELECT id::text, full_name, COALESCE(posyandu_name, ''), COALESCE(village_name, '')
		FROM children
		WHERE parent_user_id = $1 AND COALESCE(is_active, TRUE) = TRUE
		ORDER BY full_name ASC
	`, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var child LinkedChild
		if err := rows.Scan(&child.ID, &child.FullName, &child.PosyanduName, &child.VillageName); err != nil {
			return nil, err
		}
		parent.Children = append(parent.Children, child)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &parent, nil
}
