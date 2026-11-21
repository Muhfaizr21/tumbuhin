package supervisi

import (
	"context"
	"strings"
	"time"

	supervisiRepo "tumbuhin-backend/repositories/bidan/supervisi"
)

// ValidationError represents client-side invalid payload.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// Service defines business logic for posyandu supervision and audit locking.
type Service interface {
	GetSupervisionOverview(ctx context.Context, villageName string, month, year int, posyanduID string) (*supervisiRepo.SupervisionOverview, error)
	SetSupervisionLock(ctx context.Context, req supervisiRepo.LockRequest) (*supervisiRepo.LockRecord, error)
}

type serviceImpl struct {
	repo supervisiRepo.Repository
}

// NewService instantiates the supervision service.
func NewService(repo supervisiRepo.Repository) Service {
	return &serviceImpl{repo: repo}
}

func (s *serviceImpl) GetSupervisionOverview(ctx context.Context, villageName string, month, year int, posyanduID string) (*supervisiRepo.SupervisionOverview, error) {
	if strings.TrimSpace(villageName) == "" {
		villageName = "Desa Sukamaju"
	}
	if month <= 0 || month > 12 {
		month = int(time.Now().Month())
	}
	if year <= 2020 {
		year = time.Now().Year()
	}

	return s.repo.GetSupervisionOverview(ctx, villageName, month, year, posyanduID)
}

func (s *serviceImpl) SetSupervisionLock(ctx context.Context, req supervisiRepo.LockRequest) (*supervisiRepo.LockRecord, error) {
	if strings.TrimSpace(req.VillageName) == "" {
		req.VillageName = "Desa Sukamaju"
	}
	if req.PeriodMonth <= 0 || req.PeriodMonth > 12 {
		return nil, &ValidationError{Message: "Bulan periode penguncian tidak valid (harus 1-12)"}
	}
	if req.PeriodYear < 2020 {
		return nil, &ValidationError{Message: "Tahun periode penguncian tidak valid"}
	}
	if req.IsLocked && strings.TrimSpace(req.AuditNotes) == "" {
		req.AuditNotes = "Data terverifikasi dan dikunci oleh Bidan Desa untuk sinkronisasi e-PPGBM."
	}
	if !req.IsLocked && strings.TrimSpace(req.AuditNotes) == "" {
		req.AuditNotes = "Kunci dibuka kembali oleh Bidan Desa untuk perbaikan audit antropometri."
	}

	return s.repo.SetSupervisionLock(ctx, req)
}
