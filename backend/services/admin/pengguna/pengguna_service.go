package pengguna

import (
	"context"

	penggunaRepo "tumbuhin-backend/repositories/admin/pengguna"
)

// Service defines business logic for Manajemen Akun, RBAC & Magic Token (Module 3.3)
type Service interface {
	ListUsersAndTokens(ctx context.Context) (*penggunaRepo.UsersAndTokensPayload, error)
	CreateUser(ctx context.Context, in penggunaRepo.AdminUserInput) (*penggunaRepo.AdminUserRecord, error)
	UpdateUser(ctx context.Context, id int64, in penggunaRepo.AdminUserInput) (*penggunaRepo.AdminUserRecord, error)
	ToggleUserActive(ctx context.Context, id int64) (*penggunaRepo.AdminUserRecord, error)
	DeleteUser(ctx context.Context, id int64) error
	RegenerateChildMagicToken(ctx context.Context, childID string) (*penggunaRepo.ChildTokenRecord, error)
}

type service struct {
	repo penggunaRepo.Repository
}

func NewService(repo penggunaRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListUsersAndTokens(ctx context.Context) (*penggunaRepo.UsersAndTokensPayload, error) {
	return s.repo.ListUsersAndTokens(ctx)
}

func (s *service) CreateUser(ctx context.Context, in penggunaRepo.AdminUserInput) (*penggunaRepo.AdminUserRecord, error) {
	return s.repo.CreateUser(ctx, in)
}

func (s *service) UpdateUser(ctx context.Context, id int64, in penggunaRepo.AdminUserInput) (*penggunaRepo.AdminUserRecord, error) {
	return s.repo.UpdateUser(ctx, id, in)
}

func (s *service) ToggleUserActive(ctx context.Context, id int64) (*penggunaRepo.AdminUserRecord, error) {
	return s.repo.ToggleUserActive(ctx, id)
}

func (s *service) DeleteUser(ctx context.Context, id int64) error {
	return s.repo.DeleteUser(ctx, id)
}

func (s *service) RegenerateChildMagicToken(ctx context.Context, childID string) (*penggunaRepo.ChildTokenRecord, error) {
	return s.repo.RegenerateChildMagicToken(ctx, childID)
}
