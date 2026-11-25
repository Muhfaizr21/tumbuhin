package dashboard

import (
	"context"
	"math"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TrendPoint is one month of weighing participation.
type TrendPoint struct {
	Bulan  string  `json:"bulan"`
	Persen float64 `json:"persen"`
}

// ActivityItem is one recent weighing record.
type ActivityItem struct {
	ChildID    string  `json:"child_id"`
	ChildName  string  `json:"child_name"`
	MeasuredAt string  `json:"measured_at"`
	WeightKg   float64 `json:"weight_kg"`
	Status     string  `json:"status"`
}

// SummaryData holds summary metrics for Kader Posyandu dashboard
type SummaryData struct {
	PosyanduName         string         `json:"posyandu_name"`
	TotalBalita          int            `json:"total_balita"`
	SudahDitimbangBulan  int            `json:"sudah_ditimbang_bulan_ini"`
	RisikoFalteringCount int            `json:"risiko_faltering_count"`
	OfflineQueuePending  int            `json:"offline_queue_pending"`
	TrendPartisipasi     []TrendPoint   `json:"trend_partisipasi"`
	DeltaPartisipasi     float64        `json:"delta_partisipasi"`
	RecentActivity       []ActivityItem `json:"recent_activity"`
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

func (r *repository) GetSummary(ctx context.Context, posyanduName string) (*SummaryData, error) {
	if posyanduName == "" {
		posyanduName = "Posyandu Melati 04"
	}

	summary := &SummaryData{PosyanduName: posyanduName}

	if r.db == nil {
		return summary, nil
	}

	if ctx == nil {
		ctx = context.Background()
	}

	// Total balita aktif
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM children WHERE is_active = true`,
	).Scan(&summary.TotalBalita)

	// Balita yang sudah ditimbang pada bulan berjalan
	_ = r.db.QueryRow(ctx,
		`SELECT COUNT(DISTINCT child_id) FROM measurements
		 WHERE measured_at >= date_trunc('month', CURRENT_DATE)
		   AND measured_at < date_trunc('month', CURRENT_DATE) + interval '1 month'`,
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

	summary.TrendPartisipasi = r.getTrend(ctx, summary.TotalBalita)
	if n := len(summary.TrendPartisipasi); n >= 2 {
		summary.DeltaPartisipasi = math.Round((summary.TrendPartisipasi[n-1].Persen-summary.TrendPartisipasi[n-2].Persen)*10) / 10
	}
	summary.RecentActivity = r.getRecentActivity(ctx)

	return summary, nil
}

// getRecentActivity returns the latest weighing records for the activity feed.
func (r *repository) getRecentActivity(ctx context.Context) []ActivityItem {
	rows, err := r.db.Query(ctx,
		`SELECT m.child_id::text,
		        c.full_name,
		        COALESCE(to_char(m.measured_at, 'YYYY-MM-DD'), ''),
		        COALESCE(m.weight_kg, 0)::float8,
		        COALESCE(m.nutrition_status, 'normal')
		 FROM measurements m
		 JOIN children c ON c.id = m.child_id
		 ORDER BY m.measured_at DESC, m.created_at DESC
		 LIMIT 8`)
	if err != nil {
		return []ActivityItem{}
	}
	defer rows.Close()

	items := make([]ActivityItem, 0, 8)
	for rows.Next() {
		var it ActivityItem
		if err := rows.Scan(&it.ChildID, &it.ChildName, &it.MeasuredAt, &it.WeightKg, &it.Status); err != nil {
			return items
		}
		items = append(items, it)
	}
	return items
}

var bulanSingkat = [...]string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}

// getTrend returns weighing participation for the last 12 months.
func (r *repository) getTrend(ctx context.Context, totalBalita int) []TrendPoint {
	rows, err := r.db.Query(ctx,
		`WITH months AS (
			SELECT date_trunc('month', CURRENT_DATE) - make_interval(months => n) AS bulan
			FROM generate_series(11, 0, -1) AS n
		)
		SELECT EXTRACT(MONTH FROM m.bulan)::int AS bulan_ke,
		       COUNT(DISTINCT me.child_id) AS hadir
		FROM months m
		LEFT JOIN measurements me
		       ON me.measured_at >= m.bulan
		      AND me.measured_at < m.bulan + interval '1 month'
		GROUP BY m.bulan
		ORDER BY m.bulan`)
	if err != nil {
		return []TrendPoint{}
	}
	defer rows.Close()

	trend := make([]TrendPoint, 0, 12)
	for rows.Next() {
		var bulanKe, hadir int
		if err := rows.Scan(&bulanKe, &hadir); err != nil {
			return trend
		}
		persen := 0.0
		if totalBalita > 0 {
			persen = math.Round(float64(hadir)/float64(totalBalita)*1000) / 10
		}
		trend = append(trend, TrendPoint{Bulan: bulanSingkat[bulanKe-1], Persen: persen})
	}
	return trend
}
