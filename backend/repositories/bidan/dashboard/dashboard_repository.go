package dashboard

import "context"

// EpidemiologyData holds village epidemiology summary for Bidan Desa
type EpidemiologyData struct {
	VillageName         string  `json:"village_name"`
	TotalBalitaDesa     int     `json:"total_balita_desa"`
	StuntingPrevalence  float64 `json:"stunting_prevalence"`
	WastingCount        int     `json:"wasting_count"`
	HighRiskFaltering   int     `json:"high_risk_faltering"`
	PendingHomeVisits   int     `json:"pending_home_visits"`
}

// Repository defines the data contract for Bidan dashboard feature
type Repository interface {
	GetEpidemiologySummary(ctx context.Context, villageName string) (*EpidemiologyData, error)
}

type repository struct{}

// NewRepository instantiates a new Bidan dashboard Repository
func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetEpidemiologySummary(_ context.Context, villageName string) (*EpidemiologyData, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}
	return &EpidemiologyData{
		VillageName:        villageName,
		TotalBalitaDesa:    342,
		StuntingPrevalence: 8.4,
		WastingCount:       11,
		HighRiskFaltering:  19,
		PendingHomeVisits:  6,
	}, nil
}
