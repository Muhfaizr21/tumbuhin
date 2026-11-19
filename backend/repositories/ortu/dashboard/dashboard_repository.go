package dashboard

import "context"

// ChildGrowthCard holds summary data for Orang Tua Balita (Kartu Gizi Digital / Magic Link)
type ChildGrowthCard struct {
	ChildName         string  `json:"child_name"`
	AgeMonths         int     `json:"age_months"`
	PosyanduName      string  `json:"posyandu_name"`
	LastWeightKg      float64 `json:"last_weight_kg"`
	LastHeightCm      float64 `json:"last_height_cm"`
	ZScoreHFA         float64 `json:"zscore_hfa"`
	ZScoreWFA         float64 `json:"zscore_wfa"`
	FriendlyStatus    string  `json:"friendly_status"`
	RecommendedMenu   string  `json:"recommended_menu"`
	DailyBudgetIDR    int     `json:"daily_budget_idr"`
	NextPosyanduDate  string  `json:"next_posyandu_date"`
	MagicToken        string  `json:"magic_token"`
}

// Repository defines the data contract for Orang Tua portal
type Repository interface {
	GetChildCard(ctx context.Context, magicToken string) (*ChildGrowthCard, error)
}

type repository struct{}

// NewRepository instantiates a new Ortu dashboard Repository
func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetChildCard(_ context.Context, magicToken string) (*ChildGrowthCard, error) {
	if magicToken == "" {
		magicToken = "magic-balita-andi-2026-tumbuhin-sehat"
	}
	return &ChildGrowthCard{
		ChildName:        "Andi Pratama",
		AgeMonths:        14,
		PosyanduName:     "Posyandu Melati 04",
		LastWeightKg:     9.8,
		LastHeightCm:     76.5,
		ZScoreHFA:        -0.85,
		ZScoreWFA:        -0.42,
		FriendlyStatus:   "Pertumbuhan Tinggi & Berat Badan Ananda Sangat Baik (Pita Hijau KMS)",
		RecommendedMenu:  "Nasi Tim Ikan Lele & Sari Daun Kelor (Tinggi Protein Hewani)",
		DailyBudgetIDR:   13500,
		NextPosyanduDate: "12 Desember 2026 (Pukul 08.30 WIB)",
		MagicToken:       magicToken,
	}, nil
}
