package dashboard

import "context"

// SystemStats holds system-wide statistics for Super Admin Desa
type SystemStats struct {
	ActivePosyandus      int    `json:"active_posyandus"`
	TotalUsers           int    `json:"total_users"`
	LocalFoodCommodities int    `json:"local_food_commodities"`
	KnowledgeChunksCount int    `json:"knowledge_chunks_count"`
	VectorIndexStatus    string `json:"vector_index_status"`
}

// Repository defines the data contract for Admin dashboard feature
type Repository interface {
	GetSystemStats(ctx context.Context) (*SystemStats, error)
}

type repository struct{}

// NewRepository instantiates a new Admin dashboard Repository
func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetSystemStats(_ context.Context) (*SystemStats, error) {
	return &SystemStats{
		ActivePosyandus:      8,
		TotalUsers:           28,
		LocalFoodCommodities: 42,
		KnowledgeChunksCount: 156,
		VectorIndexStatus:    "Optimal (pgvector ivfflat)",
	}, nil
}
