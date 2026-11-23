package nutrichef

import (
	"context"
	"encoding/json"
	"fmt"
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

func lookupFood(key string) (foodSpec, bool) {
	for _, f := range foodCatalog {
		if f.key == key {
			return f, true
		}
	}
	return foodSpec{}, false
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

	var fullName, phone, notes, birthDateStr string
	var nutritionStatus string
	var zWFA, zHFA, zWFH float64

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
		WHERE c.id = $1::uuid`, req.BalitaId).
		Scan(&fullName, &phone, &notes, &birthDateStr, &nutritionStatus, &zWFA, &zHFA, &zWFH)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("balita dengan id %s tidak ditemukan", req.BalitaId)
		}
		return nil, fmt.Errorf("gagal memuat balita: %v", err)
	}

	ageMonths := 12
	if birthDate, perr := time.Parse("2006-01-02", birthDateStr); perr == nil && !birthDate.IsZero() {
		ageMonths = int(time.Since(birthDate).Hours() / (24 * 30.44))
		if ageMonths < 0 {
			ageMonths = 0
		}
		if ageMonths > 36 {
			ageMonths = 36
		}
	}

	targetAge, texture := "6-8 Bulan", "Lumat / Saring"
	switch {
	case ageMonths >= 12:
		targetAge, texture = "12-24 Bulan", "Makanan Keluarga"
	case ageMonths >= 9:
		targetAge, texture = "9-11 Bulan", "Cincang Halus / Lembik"
	}

	// Z-score context: status rendah menaikkan prioritas protein hewani.
	needProteinBoost := zWFA < -2 || zHFA < -2 || zWFH < -2 ||
		nutritionStatus == "stunted" || nutritionStatus == "severely_stunted" ||
		nutritionStatus == "wasted" || nutritionStatus == "severely_wasted" ||
		nutritionStatus == "underweight"

	// Filter alergi dari catatan balita.
	allergyText := strings.ToLower(notes)
	blocked := map[string]bool{}
	for _, f := range foodCatalog {
		if f.allergen != "" && strings.Contains(allergyText, f.allergen) {
			blocked[f.key] = true
		}
	}

	ingredients := []Ingredient{}
	totalCost := 0
	totalEnergy := 120 + ageMonths*5
	totalProtein := 4.0

	added := map[string]bool{}

	// Karbohidrat dasar selalu ada.
	ingredients = append(ingredients, Ingredient{Name: "Beras / Nasi Tim", Qty: "3 sdm", Cost: 500})
	totalCost += 500
	totalEnergy += 110
	totalProtein += 2.2

	addFood := func(spec foodSpec) bool {
		if added[spec.key] {
			return false
		}
		if totalCost+spec.cost > req.Budget {
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
	for _, key := range req.Foods {
		spec, ok := lookupFood(key)
		if !ok || blocked[key] {
			continue
		}
		if addFood(spec) && spec.animal {
			selectedAnimal = true
		}
	}

	// Wajib satu protein hewani bila balita berisiko; bahan yang dipilih tidak ada protein hewani.
	if needProteinBoost && !selectedAnimal {
		for _, key := range []string{"telur", "hati", "lele"} {
			spec, _ := lookupFood(key)
			if blocked[key] {
				continue
			}
			if addFood(spec) {
				selectedAnimal = true
				break
			}
		}
	}

	// Lemak tambahan untuk penyerapan vitamin.
	if spec, ok := lookupFood("minyak"); ok && !blocked["minyak"] {
		addFood(spec)
	}

	if len(ingredients) < 3 {
		return nil, fmt.Errorf("anggaran Rp %d terlalu kecil untuk menyusun menu bergizi; naikkan minimal Rp 5.000", req.Budget)
	}

	title := "Bubur Lumat Pangan Lokal Gurih"
	steps := []string{
		"Cuci bersih semua bahan pangan lokal segar.",
		"Rebus sumber protein hewani (ikan/telur/hati) hingga matang sempurna.",
		"Masak karbohidrat (nasi/beras) bersama sayuran hingga bertekstur " + texture + ".",
		"Campurkan seluruh bahan, tambahkan sumber lemak (minyak kelapa) untuk penyerapan vitamin.",
		"Sajikan hangat untuk " + fullName + " sesuai porsi makan anak.",
	}
	if ageMonths >= 12 {
		title = "Nasi Tim Pangan Lokal Keluarga"
	}
	if selectedAnimal && added["lele"] {
		title = "Bubur Saring Ikan Lele Kelor"
	} else if selectedAnimal && added["telur"] {
		title = "Bubur Lumat Telur Pangan Lokal"
	} else if selectedAnimal && added["hati"] {
		title = "Nasi Tim Hati Ayam Cincang"
	}

	recipe := &RecipeResponse{
		Title:        title,
		TargetAge:    targetAge,
		Texture:      texture,
		Energy:       fmt.Sprintf("%d kkal", totalEnergy),
		Protein:      fmt.Sprintf("%.1f g", totalProtein),
		Ingredients:  ingredients,
		Steps:        steps,
		Citation:     "Buku Resep Makanan Lokal Balita dan Ibu Hamil Kemenkes RI 2024, Hal. 35.",
		TotalCost:    totalCost,
		BalitaNama:   fullName,
		NutritionTag: nutritionStatus,
		RecipientWa:  phone,
	}

	payloadBytes, err := json.Marshal(recipe)
	if err != nil {
		return nil, fmt.Errorf("gagal membentuk payload resep: %v", err)
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
