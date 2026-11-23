package balita

import (
	"context"
	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
)

type Service interface {
	GetChildren(ctx context.Context, villageName string) ([]kaderBalitaRepo.ChildDTO, error)
	CreateChild(ctx context.Context, input kaderBalitaRepo.ChildInput) (kaderBalitaRepo.ChildDTO, error)
	UpdateChild(ctx context.Context, id string, input kaderBalitaRepo.ChildInput) error
	DeleteChild(ctx context.Context, id string) error
}

type service struct {
	repo kaderBalitaRepo.Repository
}

func NewService(repo kaderBalitaRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetChildren(ctx context.Context, villageName string) ([]kaderBalitaRepo.ChildDTO, error) {
	return s.repo.GetAllChildren(ctx, villageName)
}

func (s *service) CreateChild(ctx context.Context, input kaderBalitaRepo.ChildInput) (kaderBalitaRepo.ChildDTO, error) {
	id, err := s.repo.CreateChild(ctx, input)
	if err != nil {
		return kaderBalitaRepo.ChildDTO{}, err
	}
	// Simplified: return a DTO with the new ID and input data
	return kaderBalitaRepo.ChildDTO{
		ID:           id,
		Nama:         input.Nama,
		JenisKelamin: input.JenisKelamin,
		NamaOrtu:     input.NamaIbu,
		NoWa:         input.NoWa,
	}, nil
}

func (s *service) UpdateChild(ctx context.Context, id string, input kaderBalitaRepo.ChildInput) error {
	return s.repo.UpdateChild(ctx, id, input)
}

func (s *service) DeleteChild(ctx context.Context, id string) error {
	return s.repo.DeleteChild(ctx, id)
}
