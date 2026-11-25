package parents

import (
	"context"

	bidanParentsRepo "tumbuhin-backend/repositories/bidan/parents"
)

type Service interface {
	ListParentsAndUnlinkedChildren(ctx context.Context, villageName string) (*bidanParentsRepo.ParentsListPayload, error)
	RegisterParent(ctx context.Context, in bidanParentsRepo.RegisterParentInput) (*bidanParentsRepo.ParentAccount, error)
	UpdateParentChildren(ctx context.Context, parentID int64, childIDs []string) (*bidanParentsRepo.ParentAccount, error)
}

type service struct {
	repo bidanParentsRepo.Repository
}

func NewService(repo bidanParentsRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListParentsAndUnlinkedChildren(ctx context.Context, villageName string) (*bidanParentsRepo.ParentsListPayload, error) {
	return s.repo.ListParentsAndUnlinkedChildren(ctx, villageName)
}

func (s *service) RegisterParent(ctx context.Context, in bidanParentsRepo.RegisterParentInput) (*bidanParentsRepo.ParentAccount, error) {
	return s.repo.RegisterParent(ctx, in)
}

func (s *service) UpdateParentChildren(ctx context.Context, parentID int64, childIDs []string) (*bidanParentsRepo.ParentAccount, error) {
	return s.repo.UpdateParentChildren(ctx, parentID, childIDs)
}
