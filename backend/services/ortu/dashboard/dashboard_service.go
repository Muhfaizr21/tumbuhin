package dashboard

import (
	"context"

	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
)

// Service defines business logic for Orang Tua portal
type Service interface {
	GetChildCard(ctx context.Context, magicToken string) (*ortuDashRepo.ChildGrowthCard, error)
}

type service struct {
	repo ortuDashRepo.Repository
}

// NewService instantiates a new Ortu dashboard Service
func NewService(repo ortuDashRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetChildCard(ctx context.Context, magicToken string) (*ortuDashRepo.ChildGrowthCard, error) {
	return s.repo.GetChildCard(ctx, magicToken)
}
