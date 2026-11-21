package balita

import (
	"context"
	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
)

type Service interface {
	GetChildren(ctx context.Context, posyanduID string) ([]kaderBalitaRepo.Child, error)
}

type service struct {
	repo kaderBalitaRepo.Repository
}

func NewService(repo kaderBalitaRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetChildren(ctx context.Context, posyanduID string) ([]kaderBalitaRepo.Child, error) {
	return s.repo.GetAllChildren(ctx, posyanduID)
}
