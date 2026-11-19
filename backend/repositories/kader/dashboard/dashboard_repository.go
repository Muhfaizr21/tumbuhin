package dashboard

import "context"

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

type repository struct{}

// NewRepository instantiates a new Kader dashboard Repository
func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetSummary(_ context.Context, posyanduName string) (*SummaryData, error) {
	if posyanduName == "" {
		posyanduName = "Posyandu Melati 04"
	}
	return &SummaryData{
		PosyanduName:         posyanduName,
		TotalBalita:          48,
		SudahDitimbangBulan:  41,
		RisikoFalteringCount: 4,
		OfflineQueuePending:  0,
	}, nil
}
