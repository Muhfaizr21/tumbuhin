package dashboard

import (
	"context"

	adminDashRepo "tumbuhin-backend/repositories/admin/dashboard"
)

// Service defines business logic for Super Admin dashboard overview (Module 3.1)
type Service interface {
	GetOverview(ctx context.Context) (*adminDashRepo.SystemStats, error)
}

type service struct {
	repo adminDashRepo.Repository
}

// NewService instantiates a new Admin dashboard Service
func NewService(repo adminDashRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetOverview(ctx context.Context) (*adminDashRepo.SystemStats, error) {
	return s.repo.GetSystemStats(ctx)
}
