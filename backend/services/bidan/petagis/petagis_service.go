package petagis

import (
	"context"

	petagisRepo "tumbuhin-backend/repositories/bidan/petagis"
)

// Service defines business logic for Bidan GIS mapping
type Service interface {
	GetGISClusters(ctx context.Context, villageName string) ([]petagisRepo.GISCluster, error)
}

type service struct {
	repo petagisRepo.Repository
}

// NewService instantiates new GIS service
func NewService(repo petagisRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetGISClusters(ctx context.Context, villageName string) ([]petagisRepo.GISCluster, error) {
	return s.repo.GetGISClusters(ctx, villageName)
}
