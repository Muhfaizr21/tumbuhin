package timbang

import (
	"context"
	"fmt"
	"time"

	kaderTimbangRepo "tumbuhin-backend/repositories/kader/timbang"
)

type Service interface {
	SaveMeasurement(ctx context.Context, req kaderTimbangRepo.MeasurementRequest) (*kaderTimbangRepo.MeasurementResult, error)
}

type service struct {
	repo kaderTimbangRepo.Repository
}

func NewService(repo kaderTimbangRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) SaveMeasurement(ctx context.Context, req kaderTimbangRepo.MeasurementRequest) (*kaderTimbangRepo.MeasurementResult, error) {
	// Validasi input dasar
	if req.Berat <= 0 || req.Tinggi <= 0 {
		return nil, fmt.Errorf("berat dan tinggi harus lebih dari 0")
	}

	// Parse tanggal
	tanggal, err := time.Parse("2006-01-02", req.Tanggal)
	if err != nil {
		return nil, fmt.Errorf("format tanggal tidak valid: %v", err)
	}
	// Set measured_at ke tanggal yang diberikan (bukan created_at)
	req.Tanggal = tanggal.Format("2006-01-02")

	return s.repo.SaveMeasurement(ctx, req)
}