package nutrichef

import (
	"context"
	nutrichefRepo "tumbuhin-backend/repositories/kader/nutrichef"
)

type Service interface {
	GenerateRecipe(ctx context.Context, req nutrichefRepo.GenerateRequest) (*nutrichefRepo.RecipeResponse, error)
}

type service struct {
	repo nutrichefRepo.Repository
}

func NewService(repo nutrichefRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GenerateRecipe(ctx context.Context, req nutrichefRepo.GenerateRequest) (*nutrichefRepo.RecipeResponse, error) {
	return s.repo.SaveAndGenerateRecipe(ctx, req)
}
