package nutrichef

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GenerateRequest struct {
	BalitaId string   `json:"balitaId"`
	Budget   int      `json:"budget"`
	Foods    []string `json:"foods"`
}

type Ingredient struct {
	Name string `json:"name"`
	Qty  string `json:"qty"`
	Cost int    `json:"cost"`
}

type RecipeResponse struct {
	Title        string       `json:"title"`
	TargetAge    string       `json:"targetAge"`
	Texture      string       `json:"texture"`
	Energy       string       `json:"energy"`
	Protein      string       `json:"protein"`
	Ingredients  []Ingredient `json:"ingredients"`
	Steps        []string     `json:"steps"`
	Citation     string       `json:"citation"`
	TotalCost    int          `json:"totalCost"`
	BalitaNama   string       `json:"balitaNama"`
	NutritionTag string       `json:"nutritionTag"`
	RecipientWa  string       `json:"recipientWa"`
	PlanId       string       `json:"planId"`
	Source       string       `json:"source"`
	RagSources   []RagSource  `json:"ragSources,omitempty"`
}

type Repository interface {
	SaveAndGenerateRecipe(ctx context.Context, req GenerateRequest) (*RecipeResponse, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

// Katalog bahan lokal: harga per porsi rumahan, satuan tampil di UI.
type foodSpec struct {
	key      string
	name     string
	qty      string
	cost     int
	animal   bool
	energy   int
	protein  float64
	allergen string
}

var foodCatalog = []foodSpec{
	{key: "telur", name: "Telur Ayam", qty: "1 butir", cost: 2000, animal: true, energy: 78, protein: 6.3, allergen: "telur"},
	{key: "lele", name: "Ikan Lele", qty: "1 ekor kecil", cost: 5000, animal: true, energy: 95, protein: 15.0, allergen: "ikan"},
	{key: "hati", name: "Hati Ayam", qty: "1 potong", cost: 3000, animal: true, energy: 90, protein: 12.0, allergen: ""},
	{key: "tempe", name: "Tempe Lokal", qty: "1 potong", cost: 1000, energy: 80, protein: 7.5, allergen: "kedelai"},
	{key: "bayam", name: "Bayam Hijau", qty: "1/2 ikat", cost: 2000, energy: 20, protein: 1.5, allergen: ""},
	{key: "kelor", name: "Daun Kelor", qty: "1 genggam", cost: 500, energy: 25, protein: 2.5, allergen: ""},
	{key: "labu", name: "Labu Kuning", qty: "1 potong", cost: 2000, energy: 45, protein: 1.0, allergen: ""},
	{key: "minyak", name: "Minyak Kelapa", qty: "1 sdt", cost: 500, energy: 45, protein: 0, allergen: ""},
}

func lookupFoodFromCatalog(catalog []foodSpec, key string) (foodSpec, bool) {
	for _, f := range catalog {
		if f.key == key {
			return f, true
		}
	}
	return foodSpec{}, false
}

// loadActiveFoodCatalog fetches available local food items managed by Super Admin
// from local_foods, falling back to the built-in foodCatalog if empty/error.
func (r *repository) loadActiveFoodCatalog(ctx context.Context) []foodSpec {
	if r.db == nil {
		return foodCatalog
	}
	rows, err := r.db.Query(ctx, `
		SELECT food_key, name, unit_label, estimated_price_idr,
		       is_animal_protein, calories_kcal, protein_grams, COALESCE(allergen_tag, '')
		FROM local_foods
		WHERE is_available = TRUE
		ORDER BY is_animal_protein DESC, estimated_price_idr ASC
	`)
	if err != nil {
		return foodCatalog
	}
	defer rows.Close()

	var list []foodSpec
	for rows.Next() {
		var f foodSpec
		if err := rows.Scan(&f.key, &f.name, &f.qty, &f.cost, &f.animal, &f.energy, &f.protein, &f.allergen); err == nil {
			list = append(list, f)
		}
	}
	if len(list) == 0 {
		return foodCatalog
	}
	return list
}

type childContext struct {
	Name             string
	Phone            string
	Notes            string
	AgeMonths        int
	NutritionStatus  string
	ZWFA, ZHFA, ZWFH float64
}

func (r *repository) SaveAndGenerateRecipe(ctx context.Context, req GenerateRequest) (*RecipeResponse, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	if strings.TrimSpace(req.BalitaId) == "" {
		return nil, fmt.Errorf("balitaId wajib diisi")
	}
	if req.Budget <= 0 {
		req.Budget = 15000
	}

	cx, err := r.loadChild(ctx, req.BalitaId)
	if err != nil {
		return nil, err
	}

	needProteinBoost := cx.ZWFA < -2 || cx.ZHFA < -2 || cx.ZWFH < -2 ||
		cx.NutritionStatus == "stunted" || cx.NutritionStatus == "severely_stunted" ||
		cx.NutritionStatus == "wasted" || cx.NutritionStatus == "severely_wasted" ||
		cx.NutritionStatus == "underweight"

	activeCatalog := r.loadActiveFoodCatalog(ctx)

	// Filter alergi dari catatan balita.
	allergyText := strings.ToLower(cx.Notes)
	blocked := map[string]bool{}
	for _, f := range activeCatalog {
		if f.allergen != "" && strings.Contains(allergyText, f.allergen) {
			blocked[f.key] = true
		}
	}

	recipe := buildRuleBasedRecipe(cx, req.Budget, req.Foods, blocked, needProteinBoost, activeCatalog)
	recipe.BalitaNama = cx.Name
	recipe.NutritionTag = cx.NutritionStatus
	recipe.RecipientWa = cx.Phone
	recipe.Source = "rule-based"

	// Gemini structured output: responseSchema memaksa JSON valid. Kalau key
	// kosong / panggilan gagal, resep rule-based tetap dipakai agar endpoint
	// tidak pernah mati karena kuota/API key.
	if geminiAPIKey() != "" {
		// RAG: isi korpus bila kosong, lalu ambil pedoman paling relevan.
		var ragSources []RagSource
		if serr := r.seedKnowledge(ctx); serr != nil {
			log.Printf("[NUTRICHEF RAG] seeding dilewati: %v", serr)
		}
		if sources, rerr := r.retrieveKnowledge(ctx, buildRagQuery(cx, req.Foods), 3); rerr != nil {
			log.Printf("[NUTRICHEF RAG] retrieval gagal, lanjut tanpa konteks: %v", rerr)
		} else if len(sources) > 0 {
			ragSources = sources
		}

		aiRecipe, aiErr := generateWithGemini(ctx, buildGeminiPrompt(cx, req.Budget, req.Foods, blocked, ragSources, activeCatalog))
		if aiErr != nil {
			log.Printf("[NUTRICHEF] Gemini gagal, fallback rule-based: %v", aiErr)
		} else if sanitized, serr := sanitizeGeminiRecipe(aiRecipe, cx, req.Budget, strings.ToLower(cx.Notes)); serr != nil {
			log.Printf("[NUTRICHEF] Resep Gemini tidak lolos validasi (%v), fallback rule-based", serr)
		} else {
			sanitized.BalitaNama = cx.Name
			sanitized.NutritionTag = cx.NutritionStatus
			sanitized.RecipientWa = cx.Phone
			sanitized.Source = "gemini-structured"
			sanitized.RagSources = ragSources
			recipe = sanitized
		}
	}

	payloadBytes, err := json.Marshal(recipe)
	if err != nil {
		return nil, fmt.Errorf("gagal membentuk payload resep: %v", err)
	}

	if recipe.Source == "rule-based" && len(recipe.Ingredients) < 3 {
		return nil, fmt.Errorf("anggaran Rp %d terlalu kecil untuk menyusun menu bergizi; naikkan minimal Rp 5.000", req.Budget)
	}

	available := strings.Join(req.Foods, ",")
	err = r.db.QueryRow(ctx, `
		INSERT INTO mpasi_plans (child_id, daily_budget_idr, available_ingredients, recipe_payload, kemenkes_citation)
		VALUES ($1::uuid, $2, $3, $4::jsonb, $5)
		RETURNING id`,
		req.BalitaId, req.Budget, available, string(payloadBytes), recipe.Citation).Scan(&recipe.PlanId)
	if err != nil {
		return nil, fmt.Errorf("gagal menyimpan resep: %v", err)
	}

	return recipe, nil
}

func (r *repository) loadChild(ctx context.Context, balitaID string) (*childContext, error) {
	var cx childContext
	var birthDateStr string

	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(c.full_name, ''), COALESCE(c.parent_phone, ''), COALESCE(c.notes, ''),
		       COALESCE(to_char(c.birth_date, 'YYYY-MM-DD'), ''),
		       COALESCE(m.nutrition_status, 'normal'),
		       COALESCE(m.zscore_wfa, 0.0)::float8,
		       COALESCE(m.zscore_hfa, 0.0)::float8,
		       COALESCE(m.zscore_wfh, 0.0)::float8
		FROM children c
		LEFT JOIN LATERAL (
			SELECT nutrition_status, zscore_wfa, zscore_hfa, zscore_wfh
			FROM measurements
			WHERE child_id = c.id
			ORDER BY measured_at DESC, created_at DESC
			LIMIT 1
		) m ON TRUE
		WHERE c.id = $1::uuid`, balitaID).
		Scan(&cx.Name, &cx.Phone, &cx.Notes, &birthDateStr,
			&cx.NutritionStatus, &cx.ZWFA, &cx.ZHFA, &cx.ZWFH)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("balita dengan id %s tidak ditemukan", balitaID)
		}
		return nil, fmt.Errorf("gagal memuat balita: %v", err)
	}

	cx.AgeMonths = 12
	if birthDate, perr := time.Parse("2006-01-02", birthDateStr); perr == nil && !birthDate.IsZero() {
		cx.AgeMonths = int(time.Since(birthDate).Hours() / (24 * 30.44))
		if cx.AgeMonths < 0 {
			cx.AgeMonths = 0
		}
		if cx.AgeMonths > 36 {
			cx.AgeMonths = 36
		}
	}
	return &cx, nil
}

func targetAgeTexture(ageMonths int) (string, string) {
	switch {
	case ageMonths >= 12:
		return "12-24 Bulan", "Makanan Keluarga"
	case ageMonths >= 9:
		return "9-11 Bulan", "Cincang Halus / Lembik"
	default:
		return "6-8 Bulan", "Lumat / Saring"
	}
}

func buildRuleBasedRecipe(cx *childContext, budget int, foods []string, blocked map[string]bool, needProteinBoost bool, catalog []foodSpec) *RecipeResponse {
	targetAge, texture := targetAgeTexture(cx.AgeMonths)

	ingredients := []Ingredient{}
	totalCost := 0
	totalEnergy := 120 + cx.AgeMonths*5
	totalProtein := 4.0
	added := map[string]bool{}

	// Karbohidrat dasar selalu ada.
	ingredients = append(ingredients, Ingredient{Name: "Beras / Nasi Tim", Qty: "3 sdm", Cost: 500})
	totalCost += 500
	totalEnergy += 110
	totalProtein += 2.2

	addFood := func(spec foodSpec) bool {
		if added[spec.key] || totalCost+spec.cost > budget {
			return false
		}
		added[spec.key] = true
		ingredients = append(ingredients, Ingredient{Name: spec.name, Qty: spec.qty, Cost: spec.cost})
		totalCost += spec.cost
		totalEnergy += spec.energy
		totalProtein += spec.protein
		return true
	}

	selectedAnimal := false
	for _, key := range foods {
		spec, ok := lookupFoodFromCatalog(catalog, key)
		if !ok || blocked[key] {
			continue
		}
		if addFood(spec) && spec.animal {
			selectedAnimal = true
		}
	}

	if needProteinBoost && !selectedAnimal {
		for _, key := range []string{"telur", "hati", "lele", "kembung", "puyuh"} {
			spec, ok := lookupFoodFromCatalog(catalog, key)
			if !ok || blocked[key] {
				continue
			}
			if addFood(spec) {
				selectedAnimal = true
				break
			}
		}
	}

	if spec, ok := lookupFoodFromCatalog(catalog, "minyak"); ok && !blocked["minyak"] {
		addFood(spec)
	}

	title := "Bubur Lumat Pangan Lokal Gurih"
	if cx.AgeMonths >= 12 {
		title = "Nasi Tim Pangan Lokal Keluarga"
	}
	if selectedAnimal && added["lele"] {
		title = "Bubur Saring Ikan Lele Kelor"
	} else if selectedAnimal && added["telur"] {
		title = "Bubur Lumat Telur Pangan Lokal"
	} else if selectedAnimal && added["hati"] {
		title = "Nasi Tim Hati Ayam Cincang"
	}

	return &RecipeResponse{
		Title:       title,
		TargetAge:   targetAge,
		Texture:     texture,
		Energy:      fmt.Sprintf("%d kkal", totalEnergy),
		Protein:     fmt.Sprintf("%.1f g", totalProtein),
		Ingredients: ingredients,
		Steps: []string{
			"Cuci bersih semua bahan pangan lokal segar.",
			"Rebus sumber protein hewani (ikan/telur/hati) hingga matang sempurna.",
			"Masak karbohidrat (nasi/beras) bersama sayuran hingga bertekstur " + texture + ".",
			"Campurkan seluruh bahan, tambahkan sumber lemak (minyak kelapa) untuk penyerapan vitamin.",
			"Sajikan hangat untuk " + cx.Name + " sesuai porsi makan anak.",
		},
		Citation:  "Buku Resep Makanan Lokal Balita dan Ibu Hamil Kemenkes RI 2024, Hal. 35.",
		TotalCost: totalCost,
	}
}

func buildGeminiPrompt(cx *childContext, budget int, foods []string, blocked map[string]bool, rag []RagSource, catalog []foodSpec) string {
	targetAge, texture := targetAgeTexture(cx.AgeMonths)

	catalogLines := make([]string, 0, len(catalog))
	for _, f := range catalog {
		status := "tersedia"
		if blocked[f.key] {
			status = "DILARANG (alergi)"
		}
		catalogLines = append(catalogLines, fmt.Sprintf("- %s: Rp %d (%s, %s)", f.name, f.cost, f.qty, status))
	}

	ragBlock := "Tidak ada konteks pedoman tambahan."
	if len(rag) > 0 {
		lines := make([]string, 0, len(rag))
		for i, src := range rag {
			lines = append(lines, fmt.Sprintf("[%d] %s\n%s", i+1, src.SourceDoc, src.Snippet))
		}
		ragBlock = strings.Join(lines, "\n\n")
	}

	return fmt.Sprintf(`Anda ahli gizi anak Indonesia. Susun SATU resep MPASI lokal.

DATA BALITA
- Nama: %s
- Usia: %d bulan
- Status gizi: %s (Z BB/U %.2f, Z TB/U %.2f, Z BB/TB %.2f)
- Catatan/alergi: %s

TARGET
- Kelompok usia: %s
- Tekstur wajib: %s
- Anggaran harian maksimum: Rp %d
- Bahan yang dipilih kader: %s

KONTEKS PEDOMAN (RAG, hasil retrieval)
%s

KATALOG BAHAN (pakai hanya bahan ini, harga mengikuti katalog)
%s

ATURAN
1. Jangan gunakan bahan yang ditandai DILARANG.
2. Total biaya semua bahan tidak boleh melebihi anggaran.
3. Wajib ada minimal satu protein hewani bila balita berisiko stunting/wasting.
4. Langkah memasak 4-6 langkah, bahasa Indonesia, praktis untuk kader posyandu.
5. Sitasi WAJIB mengutip salah satu sumber pada KONTEKS PEDOMAN di atas, tulis judul dokumennya.
6. Isi energy dan protein sebagai string dengan satuan, contoh "430 kkal" dan "14.0 g".
7. totalCost = jumlah cost seluruh ingredients.
8. Ikuti porsi, frekuensi, tekstur, dan batas gula/garam dari konteks pedoman.
Kembalikan HANYA JSON sesuai schema.`,
		cx.Name, cx.AgeMonths, cx.NutritionStatus, cx.ZWFA, cx.ZHFA, cx.ZWFH,
		fallbackText(cx.Notes, "tidak ada"),
		targetAge, texture, budget,
		fallbackText(strings.Join(foods, ", "), "belum dipilih"),
		ragBlock,
		strings.Join(catalogLines, "\n"),
	)
}

func fallbackText(s, def string) string {
	if strings.TrimSpace(s) == "" {
		return def
	}
	return s
}

func sanitizeGeminiRecipe(in *geminiRecipe, cx *childContext, budget int, allergyText string) (*RecipeResponse, error) {
	if in == nil {
		return nil, fmt.Errorf("resep kosong")
	}

	targetAge, texture := targetAgeTexture(cx.AgeMonths)

	ingredients := []Ingredient{}
	total := 0
	for _, ing := range in.Ingredients {
		name := strings.TrimSpace(ing.Name)
		if name == "" {
			continue
		}
		lower := strings.ToLower(name)
		if (strings.Contains(allergyText, "telur") && strings.Contains(lower, "telur")) ||
			(strings.Contains(allergyText, "ikan") && (strings.Contains(lower, "ikan") || strings.Contains(lower, "lele"))) ||
			(strings.Contains(allergyText, "kedelai") && (strings.Contains(lower, "tempe") || strings.Contains(lower, "kedelai"))) {
			continue
		}
		cost := ing.Cost
		if cost < 0 {
			cost = 0
		}
		if cost > budget {
			continue
		}
		ingredients = append(ingredients, Ingredient{
			Name: name,
			Qty:  fallbackText(strings.TrimSpace(ing.Qty), "1 porsi"),
			Cost: cost,
		})
		total += cost
	}

	// Buang bahan termahal dari belakang sampai masuk anggaran.
	for total > budget && len(ingredients) > 2 {
		total -= ingredients[len(ingredients)-1].Cost
		ingredients = ingredients[:len(ingredients)-1]
	}
	if len(ingredients) < 2 {
		return nil, fmt.Errorf("bahan tidak cukup setelah filter alergi/anggaran")
	}

	steps := []string{}
	for _, s := range in.Steps {
		if t := strings.TrimSpace(s); t != "" {
			steps = append(steps, t)
		}
	}
	if len(steps) == 0 {
		return nil, fmt.Errorf("langkah memasak kosong")
	}

	return &RecipeResponse{
		Title:       fallbackText(strings.TrimSpace(in.Title), "Menu MPASI Pangan Lokal"),
		TargetAge:   targetAge,
		Texture:     texture,
		Energy:      fallbackText(strings.TrimSpace(in.Energy), "-"),
		Protein:     fallbackText(strings.TrimSpace(in.Protein), "-"),
		Ingredients: ingredients,
		Steps:       steps,
		Citation:    fallbackText(strings.TrimSpace(in.Citation), "Buku Resep Makanan Lokal Balita dan Ibu Hamil Kemenkes RI 2024."),
		TotalCost:   total,
	}, nil
}
