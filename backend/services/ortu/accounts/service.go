package accounts

import (
	"context"
	"errors"
	"strings"

	accountsRepo "tumbuhin-backend/repositories/ortu/accounts"
	registerSvc "tumbuhin-backend/services/auth/register"
)

var (
	ErrValidation = errors.New("data akun orang tua belum lengkap atau tidak valid")
)

type Service interface {
	List(ctx context.Context, scope accountsRepo.Scope) (*accountsRepo.ListResult, error)
	Register(ctx context.Context, input accountsRepo.NewParent, scope accountsRepo.Scope) (*accountsRepo.ParentRecord, error)
	UpdateChildren(ctx context.Context, parentID int64, childIDs []string, scope accountsRepo.Scope) (*accountsRepo.ParentRecord, error)
}

type service struct {
	repo accountsRepo.Repository
}

func NewService(repo accountsRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) List(ctx context.Context, scope accountsRepo.Scope) (*accountsRepo.ListResult, error) {
	return s.repo.List(ctx, scope)
}

func (s *service) Register(ctx context.Context, input accountsRepo.NewParent, scope accountsRepo.Scope) (*accountsRepo.ParentRecord, error) {
	input.FullName = strings.TrimSpace(input.FullName)
	if input.FullName == "" {
		return nil, ErrValidation
	}
	if len(strings.TrimSpace(input.Password)) < 6 {
		return nil, ErrValidation
	}

	email, phone := registerSvc.NormalizeContact(input.Email, input.Phone)
	if email == "" || phone == "" {
		return nil, ErrValidation
	}

	hashed, err := registerSvc.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	input.Email = email
	input.Phone = phone
	input.PasswordHash = hashed
	input.MagicToken = registerSvc.BuildOrtuMagicToken(email, phone)
	input.ChildIDs = normalizeChildIDs(input.ChildIDs)
	if len(input.ChildIDs) == 0 {
		return nil, ErrValidation
	}

	return s.repo.Register(ctx, input, scope)
}

func (s *service) UpdateChildren(ctx context.Context, parentID int64, childIDs []string, scope accountsRepo.Scope) (*accountsRepo.ParentRecord, error) {
	childIDs = normalizeChildIDs(childIDs)
	if parentID <= 0 {
		return nil, ErrValidation
	}
	return s.repo.UpdateChildren(ctx, parentID, childIDs, scope)
}

func normalizeChildIDs(ids []string) []string {
	seen := make(map[string]bool)
	out := make([]string, 0, len(ids))
	for _, id := range ids {
		clean := strings.TrimSpace(id)
		if clean == "" || seen[clean] {
			continue
		}
		seen[clean] = true
		out = append(out, clean)
	}
	return out
}
