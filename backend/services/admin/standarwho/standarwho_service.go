package standarwho

import (
	"context"

	standarwhoRepo "tumbuhin-backend/repositories/admin/standarwho"
)

// Service defines business logic for Standar Antropometri WHO & Simulator Kalibrasi (Module 3.6)
type Service interface {
	ListWhoStandards(ctx context.Context, indicator, gender string) ([]standarwhoRepo.WhoStandardRecord, error)
	UpsertWhoStandard(ctx context.Context, in standarwhoRepo.WhoStandardInput) (*standarwhoRepo.WhoStandardRecord, error)
	SimulateWhoZScore(ctx context.Context, req standarwhoRepo.WhoSimulationRequest) (*standarwhoRepo.WhoSimulationResult, error)
}

type service struct {
	repo standarwhoRepo.Repository
}

func NewService(repo standarwhoRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListWhoStandards(ctx context.Context, indicator, gender string) ([]standarwhoRepo.WhoStandardRecord, error) {
	return s.repo.ListWhoStandards(ctx, indicator, gender)
}

func (s *service) UpsertWhoStandard(ctx context.Context, in standarwhoRepo.WhoStandardInput) (*standarwhoRepo.WhoStandardRecord, error) {
	return s.repo.UpsertWhoStandard(ctx, in)
}

func (s *service) SimulateWhoZScore(ctx context.Context, req standarwhoRepo.WhoSimulationRequest) (*standarwhoRepo.WhoSimulationResult, error) {
	return s.repo.SimulateWhoZScore(ctx, req)
}
