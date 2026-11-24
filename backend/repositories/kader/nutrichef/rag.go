package nutrichef

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var seedState struct {
	mu          sync.Mutex
	lastAttempt time.Time
	lastErr     error
}

type RagSource struct {
	SourceDoc string  `json:"sourceDoc"`
	Snippet   string  `json:"snippet"`
	Score     float64 `json:"score"`
}

type knowledgeChunk struct {
	SourceDoc  string
	ChunkIndex int
	Content    string
}

// Korpus ringkas pedoman MPASI/PMBA Kemenkes. Kalimat diparafrase, bukan
// salinan verbatim; tetap merujuk dokumen sumber agar bisa ditelusuri.
var knowledgeCorpus = []knowledgeChunk{
	{
		SourceDoc:  "Buku KIA Kemenkes RI 2024 - PMBA 6-8 Bulan",
		ChunkIndex: 0,
		Content:    "Usia 6-8 bulan: beri MPASI 2-3 kali makan utama dan 1-2 kali makanan selingan per hari. Porsi awal 2-3 sendok makan, tingkatkan bertahap. Tekstur lumat atau disaring. ASI tetap diberikan sampai 2 tahun.",
	},
	{
		SourceDoc:  "Buku KIA Kemenkes RI 2024 - PMBA 9-11 Bulan",
		ChunkIndex: 0,
		Content:    "Usia 9-11 bulan: beri 3-4 kali makan utama dan 1-2 kali selingan. Porsi sekitar setengah mangkuk ukuran 250 ml. Tekstur cincang halus atau makanan yang dapat dipegang bayi. Variasi bahan pangan lokal dianjurkan.",
	},
	{
		SourceDoc:  "Buku KIA Kemenkes RI 2024 - PMBA 12-24 Bulan",
		ChunkIndex: 0,
		Content:    "Usia 12-24 bulan: beri 3-4 kali makan utama dan 1-2 kali selingan, porsi sekitar tiga perempat mangkuk 250 ml. Tekstur makanan keluarga yang dicincang. ASI dapat diteruskan hingga usia 2 tahun.",
	},
	{
		SourceDoc:  "Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Protein Hewani",
		ChunkIndex: 0,
		Content:    "Setiap kali makan sebaiknya mengandung sumber protein hewani seperti telur, ikan, ayam, hati, atau daging. Protein hewani mendukung pertumbuhan linear dan pencegahan stunting. Telur dapat diberikan satu butir per hari bila tidak ada alergi.",
	},
	{
		SourceDoc:  "Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Lemak Tambahan",
		ChunkIndex: 0,
		Content:    "Tambahkan sumber lemak pada setiap porsi MPASI, misalnya satu sendok teh minyak kelapa, santan, atau alpukat. Lemak meningkatkan kepadatan energi dan membantu penyerapan vitamin larut lemak A, D, E, dan K.",
	},
	{
		SourceDoc:  "Buku Resep Makanan Lokal Balita dan Ibu Hamil Kemenkes RI 2024 - Gula dan Garam",
		ChunkIndex: 0,
		Content:    "Hindari penambahan gula dan garam pada makanan bayi di bawah 12 bulan. Untuk usia 12-24 bulan, batasi gula maksimal satu sendok teh per hari dan garam maksimal seperlima sendok teh per hari. Gunakan bumbu alami seperti bawang dan daun aromatik.",
	},
	{
		SourceDoc:  "Buku KIA Kemenkes RI 2024 - Pemberian Makan Responsif",
		ChunkIndex: 0,
		Content:    "Terapkan pemberian makan responsif: beri makan perlahan, kenali tanda lapar dan kenyang, jangan memaksa. Naikkan tekstur sesuai usia; setelah 9 bulan makanan tidak perlu disaring lagi. Sajikan variasi pangan lokal bergizi agar anak terbiasa.",
	},
	{
		SourceDoc:  "Petunjuk Teknis Pencegahan dan Penanganan Stunting Kemenkes RI",
		ChunkIndex: 0,
		Content:    "Balita dengan panjang atau tinggi badan menurut umur di bawah minus dua standar deviasi dikategorikan stunting. Intervensi mencakup pemberian MPASI padat gizi kaya protein hewani, pemantauan pertumbuhan bulanan, dan rujukan ke fasilitas kesehatan bila tidak membaik.",
	},
	{
		SourceDoc:  "Buku KIA Kemenkes RI 2024 - Pencegahan Alergi Makanan",
		ChunkIndex: 0,
		Content:    "Kenalkan satu bahan makanan baru setiap kali, beri selama tiga sampai lima hari sebelum menambah bahan lain. Hentikan bahan dan konsultasikan bila muncul ruam, muntah, diare, atau sesak setelah makan.",
	},
	{
		SourceDoc:  "Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Keamanan Pangan",
		ChunkIndex: 0,
		Content:    "Cuci tangan sebelum menyiapkan makanan, gunakan alat masak dan wadah bersih. Masak bahan hingga matang, sajikan segera, dan simpan sisa makanan paling lama dua jam pada suhu ruang. Hindari makanan mentah untuk balita.",
	},
}

func embedModel() string {
	if m := strings.TrimSpace(os.Getenv("GEMINI_EMBED_MODEL")); m != "" {
		return m
	}
	return "gemini-embedding-001"
}

// embedText meminta embedding 768 dimensi dari Gemini. Dimensi harus sama
// dengan kolom knowledge_chunks.embedding vector(768).
func embedText(ctx context.Context, text, taskType string) ([]float32, error) {
	key := geminiAPIKey()
	if key == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY kosong")
	}

	payload := map[string]any{
		"model": "models/" + embedModel(),
		"content": map[string]any{
			"parts": []map[string]string{{"text": text}},
		},
		"taskType":             taskType,
		"outputDimensionality": 768,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent",
		embedModel(),
	)

	reqCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", key)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request embedding gagal: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding http %d: %s", resp.StatusCode, truncate(string(raw), 300))
	}

	var out struct {
		Embedding struct {
			Values []float32 `json:"values"`
		} `json:"embedding"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	if len(out.Embedding.Values) != 768 {
		return nil, fmt.Errorf("dimensi embedding %d, diharapkan 768", len(out.Embedding.Values))
	}
	return out.Embedding.Values, nil
}

func vectorLiteral(vec []float32) string {
	var b strings.Builder
	b.WriteByte('[')
	for i, v := range vec {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(strconv.FormatFloat(float64(v), 'f', -1, 32))
	}
	b.WriteByte(']')
	return b.String()
}

// seedKnowledge mengisi knowledge_chunks dengan embedding bila belum ada.
// Idempotent: baris dicek per (source_doc, chunk_index). Kegagalan di-cache
// 10 menit agar tiap request tidak mengulang panggilan embedding yang mahal.
func (r *repository) seedKnowledge(ctx context.Context) error {
	seedState.mu.Lock()
	if time.Since(seedState.lastAttempt) < 10*time.Minute {
		err := seedState.lastErr
		seedState.mu.Unlock()
		return err
	}
	seedState.mu.Unlock()

	err := r.seedKnowledgeUncached(ctx)

	seedState.mu.Lock()
	seedState.lastAttempt = time.Now()
	seedState.lastErr = err
	seedState.mu.Unlock()
	return err
}

func (r *repository) seedKnowledgeUncached(ctx context.Context) error {
	if r.db == nil {
		return fmt.Errorf("database not initialized")
	}
	if geminiAPIKey() == "" {
		return fmt.Errorf("GEMINI_API_KEY kosong")
	}

	seeded := 0
	for _, chunk := range knowledgeCorpus {
		var exists bool
		if err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM knowledge_chunks WHERE source_doc=$1 AND chunk_index=$2 AND embedding IS NOT NULL)`,
			chunk.SourceDoc, chunk.ChunkIndex).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}

		vec, err := embedText(ctx, chunk.Content, "RETRIEVAL_DOCUMENT")
		if err != nil {
			return fmt.Errorf("embed %q: %w", chunk.SourceDoc, err)
		}

		_, err = r.db.Exec(ctx, `
			INSERT INTO knowledge_chunks (source_doc, chunk_index, content, embedding)
			SELECT $1, $2, $3, $4::vector
			WHERE NOT EXISTS (
				SELECT 1 FROM knowledge_chunks WHERE source_doc=$1 AND chunk_index=$2 AND embedding IS NOT NULL
			)`,
			chunk.SourceDoc, chunk.ChunkIndex, chunk.Content, vectorLiteral(vec))
		if err != nil {
			return fmt.Errorf("simpan chunk %q: %w", chunk.SourceDoc, err)
		}
		seeded++
	}
	if seeded > 0 {
		fmt.Printf("[NUTRICHEF RAG] %d chunk pedoman di-embed dan disimpan\n", seeded)
	}
	return nil
}

// retrieveKnowledge: cosine distance pgvector (<=>), ambil top-k paling relevan.
func (r *repository) retrieveKnowledge(ctx context.Context, query string, topK int) ([]RagSource, error) {
	if topK <= 0 {
		topK = 3
	}
	vec, err := embedText(ctx, query, "RETRIEVAL_QUERY")
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT source_doc, content, 1 - (embedding <=> $1::vector) AS score
		FROM knowledge_chunks
		WHERE embedding IS NOT NULL
		ORDER BY embedding <=> $1::vector
		LIMIT $2`, vectorLiteral(vec), topK)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sources []RagSource
	for rows.Next() {
		var s RagSource
		var content string
		if err := rows.Scan(&s.SourceDoc, &content, &s.Score); err != nil {
			return nil, err
		}
		if s.Score < 0.2 {
			continue
		}
		s.Snippet = truncate(content, 220)
		sources = append(sources, s)
	}
	return sources, rows.Err()
}

func buildRagQuery(cx *childContext, foods []string) string {
	return fmt.Sprintf(
		"Pedoman MPASI balita usia %d bulan status gizi %s dengan bahan %s, protein hewani, tekstur, porsi, gula garam",
		cx.AgeMonths, cx.NutritionStatus, strings.Join(foods, " "),
	)
}
