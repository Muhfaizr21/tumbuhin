package dashboard

import (
	"context"

	kaderDashRepo "tumbuhin-backend/repositories/kader/dashboard"
)

// Service defines business logic for Kader dashboard
type Service interface {
	GetOverview(ctx context.Context, posyanduName string) (*kaderDashRepo.SummaryData, error)
}

type service struct {
	repo kaderDashRepo.Repository
}

// NewService instantiates a new Kader dashboard Service
func NewService(repo kaderDashRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetOverview(ctx context.Context, posyanduName string) (*kaderDashRepo.SummaryData, error) {
	return s.repo.GetSummary(ctx, posyanduName)
}
