package nutrichef

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type geminiRecipe struct {
	Title       string       `json:"title"`
	TargetAge   string       `json:"targetAge"`
	Texture     string       `json:"texture"`
	Energy      string       `json:"energy"`
	Protein     string       `json:"protein"`
	Ingredients []Ingredient `json:"ingredients"`
	Steps       []string     `json:"steps"`
	Citation    string       `json:"citation"`
	TotalCost   int          `json:"totalCost"`
}

func geminiAPIKey() string {
	return strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
}

func geminiModel() string {
	if m := strings.TrimSpace(os.Getenv("GEMINI_MODEL")); m != "" {
		return m
	}
	return "gemini-2.5-flash"
}

func geminiRecipeSchema() map[string]any {
	return map[string]any{
		"type": "OBJECT",
		"properties": map[string]any{
			"title":     map[string]any{"type": "STRING"},
			"targetAge": map[string]any{"type": "STRING"},
			"texture":   map[string]any{"type": "STRING"},
			"energy":    map[string]any{"type": "STRING"},
			"protein":   map[string]any{"type": "STRING"},
			"ingredients": map[string]any{
				"type": "ARRAY",
				"items": map[string]any{
					"type": "OBJECT",
					"properties": map[string]any{
						"name": map[string]any{"type": "STRING"},
						"qty":  map[string]any{"type": "STRING"},
						"cost": map[string]any{"type": "INTEGER"},
					},
					"required": []string{"name", "qty", "cost"},
				},
			},
			"steps": map[string]any{
				"type":  "ARRAY",
				"items": map[string]any{"type": "STRING"},
			},
			"citation":  map[string]any{"type": "STRING"},
			"totalCost": map[string]any{"type": "INTEGER"},
		},
		"required": []string{
			"title", "targetAge", "texture", "energy", "protein",
			"ingredients", "steps", "citation", "totalCost",
		},
	}
}

// generateWithGemini meminta resep terstruktur dari Gemini. responseMimeType
// application/json + responseSchema memaksa model mengembalikan JSON valid
// sesuai bentuk di geminiRecipeSchema, bukan teks bebas.
func generateWithGemini(ctx context.Context, prompt string) (*geminiRecipe, error) {
	key := geminiAPIKey()
	if key == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY kosong")
	}

	payload := map[string]any{
		"contents": []map[string]any{
			{
				"role":  "user",
				"parts": []map[string]string{{"text": prompt}},
			},
		},
		"generationConfig": map[string]any{
			"temperature":      0.4,
			"responseMimeType": "application/json",
			"responseSchema":   geminiRecipeSchema(),
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent",
		geminiModel(),
	)

	reqCtx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", key)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request gemini gagal: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini http %d: %s", resp.StatusCode, truncate(string(raw), 300))
	}

	var out struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("respons gemini tidak valid: %w", err)
	}
	if out.Error != nil {
		return nil, fmt.Errorf("gemini error: %s", out.Error.Message)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini tidak mengembalikan kandidat/parts")
	}

	text := out.Candidates[0].Content.Parts[0].Text
	var recipe geminiRecipe
	if err := json.Unmarshal([]byte(text), &recipe); err != nil {
		return nil, fmt.Errorf("JSON resep tidak valid: %w", err)
	}
	return &recipe, nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
