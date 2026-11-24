package pengaturan

import (
	"context"

	pengaturanRepo "tumbuhin-backend/repositories/admin/pengaturan"
)

// Service defines business logic for Log Sinkronisasi & Pengaturan Desa (Module 3.7)
type Service interface {
	GetSettingsAndAudit(ctx context.Context) (*pengaturanRepo.SettingsAndAuditPayload, error)
	UpdateVillageSettings(ctx context.Context, in pengaturanRepo.VillageSettingsRecord) (*pengaturanRepo.VillageSettingsRecord, error)
	ResolveSyncLog(ctx context.Context, id string) (*pengaturanRepo.SyncAuditItem, error)
}

type service struct {
	repo pengaturanRepo.Repository
}

func NewService(repo pengaturanRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetSettingsAndAudit(ctx context.Context) (*pengaturanRepo.SettingsAndAuditPayload, error) {
	return s.repo.GetSettingsAndAudit(ctx)
}

func (s *service) UpdateVillageSettings(ctx context.Context, in pengaturanRepo.VillageSettingsRecord) (*pengaturanRepo.VillageSettingsRecord, error) {
	return s.repo.UpdateVillageSettings(ctx, in)
}

func (s *service) ResolveSyncLog(ctx context.Context, id string) (*pengaturanRepo.SyncAuditItem, error) {
	return s.repo.ResolveSyncLog(ctx, id)
}
