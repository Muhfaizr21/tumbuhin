package pangan

import (
	"context"

	panganRepo "tumbuhin-backend/repositories/admin/pangan"
)

// Service defines business logic for Harga Pangan Lokal Desa (Module 3.4)
type Service interface {
	ListLocalFoods(ctx context.Context) ([]panganRepo.LocalFoodItem, error)
	CreateLocalFood(ctx context.Context, in panganRepo.LocalFoodInput) (*panganRepo.LocalFoodItem, error)
	UpdateLocalFood(ctx context.Context, id string, in panganRepo.LocalFoodInput) (*panganRepo.LocalFoodItem, error)
	ToggleLocalFood(ctx context.Context, id string) (*panganRepo.LocalFoodItem, error)
	DeleteLocalFood(ctx context.Context, id string) error
}

type service struct {
	repo panganRepo.Repository
}

func NewService(repo panganRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListLocalFoods(ctx context.Context) ([]panganRepo.LocalFoodItem, error) {
	return s.repo.ListLocalFoods(ctx)
}

func (s *service) CreateLocalFood(ctx context.Context, in panganRepo.LocalFoodInput) (*panganRepo.LocalFoodItem, error) {
	return s.repo.CreateLocalFood(ctx, in)
}

func (s *service) UpdateLocalFood(ctx context.Context, id string, in panganRepo.LocalFoodInput) (*panganRepo.LocalFoodItem, error) {
	return s.repo.UpdateLocalFood(ctx, id, in)
}

func (s *service) ToggleLocalFood(ctx context.Context, id string) (*panganRepo.LocalFoodItem, error) {
	return s.repo.ToggleLocalFood(ctx, id)
}

func (s *service) DeleteLocalFood(ctx context.Context, id string) error {
	return s.repo.DeleteLocalFood(ctx, id)
}
