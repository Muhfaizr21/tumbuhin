package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SummaryData holds summary metrics for Kader Posyandu dashboard
type SummaryData struct {
	PosyanduName         string `json:"posyandu_name"`
	TotalBalita          int    `json:"total_balita"`
	SudahDitimbangBulan  int    `json:"sudah_ditimbang_bulan_ini"`
	RisikoFalteringCount int    `json:"risiko_faltering_count"`
	OfflineQueuePending  int    `json:"offline_queue_pending"`
}

// Repository defines the data contract for Kader dashboard feature
type Repository interface {
	GetSummary(ctx context.Context, posyanduName string) (*SummaryData, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) GetSummary(_ context.Context, posyanduName string) (*SummaryData, error) {
	if posyanduName == "" {
		posyanduName = "Posyandu Melati 04"
	}

	summary := &SummaryData{PosyanduName: posyanduName}

	if r.db == nil {
		return summary, nil
	}

	ctx := context.Background()

	// Total balita aktif
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM children WHERE is_active = true`,
	).Scan(&summary.TotalBalita)

	// Balita yang sudah punya minimal satu measurement
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(DISTINCT child_id) FROM measurements`,
	).Scan(&summary.SudahDitimbangBulan)

	// Balita berisiko faltering (status gizi stunted/wasted pada measurement terbaru)
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM (
			SELECT DISTINCT ON (child_id) child_id, nutrition_status
			FROM measurements
			ORDER BY child_id, measured_at DESC
		) latest
		WHERE latest.nutrition_status ILIKE '%stunted%'
		   OR latest.nutrition_status ILIKE '%wasted%'`,
	).Scan(&summary.RisikoFalteringCount)

	return summary, nil
}
