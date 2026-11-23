package sinkronisasi

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	StatusPending  = "PENDING"
	StatusSynced   = "SYNCED"
	StatusConflict = "CONFLICT"
	StatusFailed   = "FAILED"
)

// ItemRecord is the persisted server-side state of one offline queue item.
type ItemRecord struct {
	ID        string    `json:"id"`
	ClientID  string    `json:"clientId"`
	ItemType  string    `json:"type"`
	Status    string    `json:"status"`
	ServerRef string    `json:"serverId,omitempty"`
	Message   string    `json:"message,omitempty"`
	Attempts  int       `json:"attempts"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// StatusSummary is the server-side view of the kader sync history.
type StatusSummary struct {
	TotalSynced   int          `json:"total_synced"`
	TotalConflict int          `json:"total_conflict"`
	TotalFailed   int          `json:"total_failed"`
	TotalPending  int          `json:"total_pending"`
	LastSyncedAt  *time.Time   `json:"last_synced_at"`
	RecentItems   []ItemRecord `json:"recent_items"`
}

type Repository interface {
	ClaimItem(ctx context.Context, kaderID int64, clientID, itemType string, payload []byte) (string, *ItemRecord, error)
	MarkSynced(ctx context.Context, itemID, serverRef, message string) error
	MarkConflict(ctx context.Context, itemID, message string) error
	MarkFailed(ctx context.Context, itemID, message string) error
	ChildExists(ctx context.Context, childID string) (bool, error)
	FindChildByNikHash(ctx context.Context, nikHash string) (id, fullName string, found bool, err error)
	FindMeasurementOnDate(ctx context.Context, childID, measuredAt string) (id string, weight, height float64, found bool, err error)
	GetStatus(ctx context.Context, kaderID int64, limit int) (*StatusSummary, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

// ClaimItem is the idempotency gate. The UNIQUE(kader_id, client_id) constraint means a
// retried batch item can never be applied twice; the existing record is returned instead.
func (r *repository) ClaimItem(ctx context.Context, kaderID int64, clientID, itemType string, payload []byte) (string, *ItemRecord, error) {
	if len(payload) == 0 {
		payload = []byte(`{}`)
	}

	var id string
	err := r.db.QueryRow(ctx,
		`INSERT INTO offline_sync_items (kader_id, client_id, item_type, payload, status)
		 VALUES ($1, $2, $3, $4::jsonb, $5)
		 ON CONFLICT (kader_id, client_id) DO NOTHING
		 RETURNING id::text`,
		kaderID, clientID, itemType, string(payload), StatusPending).Scan(&id)
	if err == nil {
		return id, nil, nil
	}
	if err != pgx.ErrNoRows {
		return "", nil, err
	}

	var rec ItemRecord
	err = r.db.QueryRow(ctx,
		`UPDATE offline_sync_items
		 SET attempts = attempts + 1, updated_at = NOW()
		 WHERE kader_id = $1 AND client_id = $2
		 RETURNING id::text, client_id, item_type, status,
		           COALESCE(server_ref_id, ''), COALESCE(message, ''), attempts, updated_at`,
		kaderID, clientID).Scan(
		&rec.ID, &rec.ClientID, &rec.ItemType, &rec.Status,
		&rec.ServerRef, &rec.Message, &rec.Attempts, &rec.UpdatedAt)
	if err != nil {
		return "", nil, err
	}
	return rec.ID, &rec, nil
}

func (r *repository) MarkSynced(ctx context.Context, itemID, serverRef, message string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE offline_sync_items
		 SET status = $2, server_ref_id = $3, message = $4, synced_at = NOW(), updated_at = NOW()
		 WHERE id = $1::uuid`,
		itemID, StatusSynced, serverRef, message)
	return err
}

func (r *repository) MarkConflict(ctx context.Context, itemID, message string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE offline_sync_items
		 SET status = $2, message = $3, updated_at = NOW()
		 WHERE id = $1::uuid`,
		itemID, StatusConflict, message)
	return err
}

func (r *repository) MarkFailed(ctx context.Context, itemID, message string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE offline_sync_items
		 SET status = $2, message = $3, updated_at = NOW()
		 WHERE id = $1::uuid`,
		itemID, StatusFailed, message)
	return err
}

func (r *repository) ChildExists(ctx context.Context, childID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM children WHERE id = $1::uuid)`, childID).Scan(&exists)
	return exists, err
}

func (r *repository) FindChildByNikHash(ctx context.Context, nikHash string) (id, fullName string, found bool, err error) {
	err = r.db.QueryRow(ctx,
		`SELECT id::text, full_name FROM children WHERE nik_hash = $1`, nikHash).Scan(&id, &fullName)
	if err == pgx.ErrNoRows {
		return "", "", false, nil
	}
	if err != nil {
		return "", "", false, err
	}
	return id, fullName, true, nil
}

func (r *repository) FindMeasurementOnDate(ctx context.Context, childID, measuredAt string) (id string, weight, height float64, found bool, err error) {
	err = r.db.QueryRow(ctx,
		`SELECT id::text, weight_kg, height_cm FROM measurements
		 WHERE child_id = $1::uuid AND measured_at = $2::date
		 ORDER BY created_at DESC LIMIT 1`,
		childID, measuredAt).Scan(&id, &weight, &height)
	if err == pgx.ErrNoRows {
		return "", 0, 0, false, nil
	}
	if err != nil {
		return "", 0, 0, false, err
	}
	return id, weight, height, true, nil
}

func (r *repository) GetStatus(ctx context.Context, kaderID int64, limit int) (*StatusSummary, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	summary := &StatusSummary{RecentItems: []ItemRecord{}}

	rows, err := r.db.Query(ctx,
		`SELECT status, COUNT(*)::int FROM offline_sync_items WHERE kader_id = $1 GROUP BY status`,
		kaderID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			rows.Close()
			return nil, err
		}
		switch status {
		case StatusSynced:
			summary.TotalSynced = count
		case StatusConflict:
			summary.TotalConflict = count
		case StatusFailed:
			summary.TotalFailed = count
		case StatusPending:
			summary.TotalPending = count
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	var lastSynced *time.Time
	if err := r.db.QueryRow(ctx,
		`SELECT MAX(synced_at) FROM offline_sync_items WHERE kader_id = $1`,
		kaderID).Scan(&lastSynced); err != nil {
		return nil, err
	}
	summary.LastSyncedAt = lastSynced

	recent, err := r.db.Query(ctx,
		`SELECT id::text, client_id, item_type, status,
		        COALESCE(server_ref_id, ''), COALESCE(message, ''), attempts, updated_at
		 FROM offline_sync_items
		 WHERE kader_id = $1
		 ORDER BY updated_at DESC
		 LIMIT $2`,
		kaderID, limit)
	if err != nil {
		return nil, err
	}
	defer recent.Close()
	for recent.Next() {
		var rec ItemRecord
		if err := recent.Scan(&rec.ID, &rec.ClientID, &rec.ItemType, &rec.Status,
			&rec.ServerRef, &rec.Message, &rec.Attempts, &rec.UpdatedAt); err != nil {
			return nil, err
		}
		summary.RecentItems = append(summary.RecentItems, rec)
	}
	return summary, recent.Err()
}
