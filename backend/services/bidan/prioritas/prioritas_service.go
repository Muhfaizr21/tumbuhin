package prioritas

import (
	"context"

	prioritasRepo "tumbuhin-backend/repositories/bidan/prioritas"
)

// Service defines business logic for Bidan priority triage
type Service interface {
	GetPriorityList(ctx context.Context, villageName string) ([]prioritasRepo.PriorityChild, error)
	CreatePriorityChild(ctx context.Context, villageName string, req prioritasRepo.CreatePriorityRequest) (*prioritasRepo.PriorityChild, error)
	UpdatePriorityChild(ctx context.Context, villageName string, childID string, req prioritasRepo.UpdatePriorityRequest) (*prioritasRepo.PriorityChild, error)
	DeletePriorityChild(ctx context.Context, villageName string, childID string) error
}

type service struct {
	repo prioritasRepo.Repository
}

// NewService instantiates new Priority Service
func NewService(repo prioritasRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetPriorityList(ctx context.Context, villageName string) ([]prioritasRepo.PriorityChild, error) {
	return s.repo.GetPriorityList(ctx, villageName)
}

func (s *service) CreatePriorityChild(ctx context.Context, villageName string, req prioritasRepo.CreatePriorityRequest) (*prioritasRepo.PriorityChild, error) {
	return s.repo.CreatePriorityChild(ctx, villageName, req)
}

func (s *service) UpdatePriorityChild(ctx context.Context, villageName string, childID string, req prioritasRepo.UpdatePriorityRequest) (*prioritasRepo.PriorityChild, error) {
	return s.repo.UpdatePriorityChild(ctx, villageName, childID, req)
}

func (s *service) DeletePriorityChild(ctx context.Context, villageName string, childID string) error {
	return s.repo.DeletePriorityChild(ctx, villageName, childID)
}
