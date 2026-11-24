package knowledge

import (
	"context"

	knowledgeRepo "tumbuhin-backend/repositories/admin/knowledge"
)

// Service defines business logic for Knowledge Base AI / RAG & Playground (Module 3.5)
type Service interface {
	ListKnowledgeChunks(ctx context.Context) ([]knowledgeRepo.KnowledgeChunkRecord, error)
	CreateKnowledgeChunk(ctx context.Context, in knowledgeRepo.KnowledgeChunkInput) (*knowledgeRepo.KnowledgeChunkRecord, error)
	UpdateKnowledgeChunk(ctx context.Context, id string, in knowledgeRepo.KnowledgeChunkInput) (*knowledgeRepo.KnowledgeChunkRecord, error)
	DeleteKnowledgeChunk(ctx context.Context, id string) error
	UploadAndChunkDocument(ctx context.Context, in knowledgeRepo.DocumentUploadInput) ([]knowledgeRepo.KnowledgeChunkRecord, error)
	ReindexAllVectors(ctx context.Context) (int, error)
	RunRAGPlayground(ctx context.Context, req knowledgeRepo.RAGPlaygroundRequest) (*knowledgeRepo.RAGPlaygroundResponse, error)
}

type service struct {
	repo knowledgeRepo.Repository
}

func NewService(repo knowledgeRepo.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListKnowledgeChunks(ctx context.Context) ([]knowledgeRepo.KnowledgeChunkRecord, error) {
	return s.repo.ListKnowledgeChunks(ctx)
}

func (s *service) CreateKnowledgeChunk(ctx context.Context, in knowledgeRepo.KnowledgeChunkInput) (*knowledgeRepo.KnowledgeChunkRecord, error) {
	return s.repo.CreateKnowledgeChunk(ctx, in)
}

func (s *service) UpdateKnowledgeChunk(ctx context.Context, id string, in knowledgeRepo.KnowledgeChunkInput) (*knowledgeRepo.KnowledgeChunkRecord, error) {
	return s.repo.UpdateKnowledgeChunk(ctx, id, in)
}

func (s *service) DeleteKnowledgeChunk(ctx context.Context, id string) error {
	return s.repo.DeleteKnowledgeChunk(ctx, id)
}

func (s *service) UploadAndChunkDocument(ctx context.Context, in knowledgeRepo.DocumentUploadInput) ([]knowledgeRepo.KnowledgeChunkRecord, error) {
	return s.repo.UploadAndChunkDocument(ctx, in)
}

func (s *service) ReindexAllVectors(ctx context.Context) (int, error) {
	return s.repo.ReindexAllVectors(ctx)
}

func (s *service) RunRAGPlayground(ctx context.Context, req knowledgeRepo.RAGPlaygroundRequest) (*knowledgeRepo.RAGPlaygroundResponse, error) {
	return s.repo.RunRAGPlayground(ctx, req)
}
