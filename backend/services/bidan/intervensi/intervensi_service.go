package intervensi

import (
	"context"

	intervensiRepo "tumbuhin-backend/repositories/bidan/intervensi"
)

// Service defines business logic for home visit interventions
type Service interface {
	GetInterventionList(ctx context.Context, villageName string) ([]intervensiRepo.Intervention, error)
	GetInterventionByID(ctx context.Context, id string) (*intervensiRepo.Intervention, error)
	CreateIntervention(ctx context.Context, req intervensiRepo.CreateInterventionRequest) (*intervensiRepo.Intervention, error)
	UpdateIntervention(ctx context.Context, id string, req intervensiRepo.UpdateInterventionRequest) (*intervensiRepo.Intervention, error)
	DeleteIntervention(ctx context.Context, id string) error
}

type service struct {
	repo intervensiRepo.Repository
}

// NewService instantiates Intervention Service
func NewService(repo intervensiRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetInterventionList(ctx context.Context, villageName string) ([]intervensiRepo.Intervention, error) {
	return s.repo.GetInterventionList(ctx, villageName)
}

func (s *service) GetInterventionByID(ctx context.Context, id string) (*intervensiRepo.Intervention, error) {
	return s.repo.GetInterventionByID(ctx, id)
}

func (s *service) CreateIntervention(ctx context.Context, req intervensiRepo.CreateInterventionRequest) (*intervensiRepo.Intervention, error) {
	return s.repo.CreateIntervention(ctx, req)
}

func (s *service) UpdateIntervention(ctx context.Context, id string, req intervensiRepo.UpdateInterventionRequest) (*intervensiRepo.Intervention, error) {
	return s.repo.UpdateIntervention(ctx, id, req)
}

func (s *service) DeleteIntervention(ctx context.Context, id string) error {
	return s.repo.DeleteIntervention(ctx, id)
}
