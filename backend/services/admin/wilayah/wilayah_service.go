package wilayah

import (
	"context"

	wilayahRepo "tumbuhin-backend/repositories/admin/wilayah"
)

// Service defines business logic for Master Wilayah & Posyandu (Module 3.2)
type Service interface {
	ListPosyandus(ctx context.Context) ([]wilayahRepo.PosyanduUnit, error)
	CreatePosyandu(ctx context.Context, in wilayahRepo.PosyanduInput) (*wilayahRepo.PosyanduUnit, error)
	UpdatePosyandu(ctx context.Context, id string, in wilayahRepo.PosyanduInput) (*wilayahRepo.PosyanduUnit, error)
	TogglePosyandu(ctx context.Context, id string) (*wilayahRepo.PosyanduUnit, error)
	DeletePosyandu(ctx context.Context, id string) error
}

type service struct {
	repo wilayahRepo.Repository
}

func NewService(repo wilayahRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListPosyandus(ctx context.Context) ([]wilayahRepo.PosyanduUnit, error) {
	return s.repo.ListPosyandus(ctx)
}

func (s *service) CreatePosyandu(ctx context.Context, in wilayahRepo.PosyanduInput) (*wilayahRepo.PosyanduUnit, error) {
	return s.repo.CreatePosyandu(ctx, in)
}

func (s *service) UpdatePosyandu(ctx context.Context, id string, in wilayahRepo.PosyanduInput) (*wilayahRepo.PosyanduUnit, error) {
	return s.repo.UpdatePosyandu(ctx, id, in)
}

func (s *service) TogglePosyandu(ctx context.Context, id string) (*wilayahRepo.PosyanduUnit, error) {
	return s.repo.TogglePosyandu(ctx, id)
}

func (s *service) DeletePosyandu(ctx context.Context, id string) error {
	return s.repo.DeletePosyandu(ctx, id)
}
