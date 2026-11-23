package dashboard

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ChildGrowthCard holds summary data for Orang Tua Balita (Kartu Gizi Digital / Magic Link)
type ChildGrowthCard struct {
	ChildName        string  `json:"child_name"`
	AgeMonths        int     `json:"age_months"`
	PosyanduName     string  `json:"posyandu_name"`
	LastWeightKg     float64 `json:"last_weight_kg"`
	LastHeightCm     float64 `json:"last_height_cm"`
	ZScoreHFA        float64 `json:"zscore_hfa"`
	ZScoreWFA        float64 `json:"zscore_wfa"`
	FriendlyStatus   string  `json:"friendly_status"`
	RecommendedMenu  string  `json:"recommended_menu"`
	DailyBudgetIDR   int     `json:"daily_budget_idr"`
	NextPosyanduDate string  `json:"next_posyandu_date"`
	MagicToken       string  `json:"magic_token"`
}

var ErrChildNotFound = errors.New("kartu gizi tidak ditemukan")

// Repository defines the data contract for Orang Tua portal
type Repository interface {
	GetChildCard(ctx context.Context, magicToken string) (*ChildGrowthCard, error)
}

type repository struct {
	db *pgxpool.Pool
}

// NewRepository instantiates a new Ortu dashboard Repository
func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func friendlyStatus(status string) string {
	switch status {
	case "severely_stunted", "stunted", "Stunted":
		return "Perlu Pendampingan Tumbuh Kembang (Risiko Stunting)"
	case "severely_wasted", "wasted", "Wasted":
		return "Perlu Perhatian Berat Badan (Risiko Wasting)"
	case "overweight", "obese":
		return "Berat Badan di Atas Standar, Konsultasikan ke Bidan"
	default:
		return "Pertumbuhan Sesuai Standar (Pita Hijau KMS)"
	}
}

func (r *repository) GetChildCard(ctx context.Context, magicToken string) (*ChildGrowthCard, error) {
	if magicToken == "" || r.db == nil {
		return nil, ErrChildNotFound
	}

	query := `
	SELECT
		c.full_name,
		COALESCE(m.age_months,
			GREATEST(0, (EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) * 12
			+ EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.birth_date)))::int), 0),
		COALESCE(c.posyandu_name, ''),
		COALESCE(m.weight_kg, 0.0)::float8,
		COALESCE(m.height_cm, 0.0)::float8,
		COALESCE(m.zscore_hfa, 0.0)::float8,
		COALESCE(m.zscore_wfa, 0.0)::float8,
		COALESCE(m.nutrition_status, 'normal'),
		c.magic_token
	FROM children c
	LEFT JOIN LATERAL (
		SELECT age_months, weight_kg, height_cm, zscore_hfa, zscore_wfa, nutrition_status
		FROM measurements
		WHERE child_id = c.id
		ORDER BY measured_at DESC
		LIMIT 1
	) m ON TRUE
	WHERE c.magic_token = $1 AND COALESCE(c.is_active, TRUE)
	LIMIT 1;
	`

	var card ChildGrowthCard
	var nutritionStatus string
	err := r.db.QueryRow(ctx, query, magicToken).Scan(
		&card.ChildName,
		&card.AgeMonths,
		&card.PosyanduName,
		&card.LastWeightKg,
		&card.LastHeightCm,
		&card.ZScoreHFA,
		&card.ZScoreWFA,
		&nutritionStatus,
		&card.MagicToken,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrChildNotFound
		}
		return nil, fmt.Errorf("gagal memuat kartu gizi: %w", err)
	}

	card.FriendlyStatus = friendlyStatus(nutritionStatus)
	card.RecommendedMenu = "Nasi Tim Ikan Lele & Sari Daun Kelor (Tinggi Protein Hewani)"
	card.DailyBudgetIDR = 13500
	card.NextPosyanduDate = "Tanggal 12 bulan depan (Pukul 08.30 WIB)"

	return &card, nil
}
