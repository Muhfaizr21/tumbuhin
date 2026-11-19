package dashboard

import (
	"context"

	bidanDashRepo "tumbuhin-backend/repositories/bidan/dashboard"
)

// Service defines business logic for Bidan Desa dashboard
type Service interface {
	GetOverview(ctx context.Context, villageName string) (*bidanDashRepo.EpidemiologyData, error)
}

type service struct {
	repo bidanDashRepo.Repository
}

// NewService instantiates a new Bidan dashboard Service
func NewService(repo bidanDashRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetOverview(ctx context.Context, villageName string) (*bidanDashRepo.EpidemiologyData, error) {
	return s.repo.GetEpidemiologySummary(ctx, villageName)
}
