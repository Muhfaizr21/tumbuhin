package pangan

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LocalFoodItem represents a commodity in the village local food market (Module 3.4)
type LocalFoodItem struct {
	ID                string  `json:"id"`
	FoodKey           string  `json:"food_key"`
	Name              string  `json:"name"`
	Category          string  `json:"category"`
	UnitLabel         string  `json:"unit_label"`
	EstimatedPriceIDR int     `json:"estimated_price_idr"`
	CaloriesKcal      int     `json:"calories_kcal"`
	ProteinGrams      float64 `json:"protein_grams"`
	IsAnimalProtein   bool    `json:"is_animal_protein"`
	AllergenTag       string  `json:"allergen_tag"`
	IsAvailable       bool    `json:"is_available"`
	VillageName       string  `json:"village_name"`
	UpdatedAt         string  `json:"updated_at"`
}

type LocalFoodInput struct {
	FoodKey           string  `json:"food_key"`
	Name              string  `json:"name"`
	Category          string  `json:"category"`
	UnitLabel         string  `json:"unit_label"`
	EstimatedPriceIDR int     `json:"estimated_price_idr"`
	CaloriesKcal      int     `json:"calories_kcal"`
	ProteinGrams      float64 `json:"protein_grams"`
	IsAnimalProtein   bool    `json:"is_animal_protein"`
	AllergenTag       string  `json:"allergen_tag"`
	IsAvailable       *bool   `json:"is_available"`
	VillageName       string  `json:"village_name"`
}

// Repository defines CRUD operations for Harga Pangan Lokal Desa
type Repository interface {
	ListLocalFoods(ctx context.Context) ([]LocalFoodItem, error)
	CreateLocalFood(ctx context.Context, in LocalFoodInput) (*LocalFoodItem, error)
	UpdateLocalFood(ctx context.Context, id string, in LocalFoodInput) (*LocalFoodItem, error)
	ToggleLocalFood(ctx context.Context, id string) (*LocalFoodItem, error)
	DeleteLocalFood(ctx context.Context, id string) error
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) ListLocalFoods(ctx context.Context) ([]LocalFoodItem, error) {
	if r.db == nil {
		return []LocalFoodItem{}, nil
	}
	rows, err := r.db.Query(ctx, `
		SELECT
			id::text,
			food_key,
			name,
			category,
			unit_label,
			estimated_price_idr,
			calories_kcal,
			protein_grams,
			is_animal_protein,
			COALESCE(allergen_tag, ''),
			is_available,
			COALESCE(village_name, 'Desa Sukamaju'),
			to_char(COALESCE(updated_at, NOW()), 'DD Mon YYYY HH24:MI')
		FROM local_foods
		ORDER BY is_animal_protein DESC, category ASC, name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []LocalFoodItem{}
	for rows.Next() {
		var f LocalFoodItem
		if err := rows.Scan(
			&f.ID, &f.FoodKey, &f.Name, &f.Category, &f.UnitLabel,
			&f.EstimatedPriceIDR, &f.CaloriesKcal, &f.ProteinGrams,
			&f.IsAnimalProtein, &f.AllergenTag, &f.IsAvailable,
			&f.VillageName, &f.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, rows.Err()
}

func sanitizeFoodKey(key, name string) string {
	raw := strings.ToLower(strings.TrimSpace(key))
	if raw == "" {
		raw = strings.ToLower(strings.TrimSpace(name))
	}
	var b strings.Builder
	for _, ch := range raw {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') {
			b.WriteRune(ch)
		} else if ch == ' ' || ch == '-' || ch == '_' {
			b.WriteRune('_')
		}
	}
	res := strings.Trim(b.String(), "_")
	if res == "" {
		res = fmt.Sprintf("pangan_%d", time.Now().Unix()%10000)
	}
	if len(res) > 36 {
		res = res[:36]
	}
	return res
}

func (r *repository) CreateLocalFood(ctx context.Context, in LocalFoodInput) (*LocalFoodItem, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, fmt.Errorf("nama komoditas pangan wajib diisi")
	}
	key := sanitizeFoodKey(in.FoodKey, name)
	category := strings.TrimSpace(in.Category)
	if category == "" {
		category = "Protein Hewani"
	}
	unit := strings.TrimSpace(in.UnitLabel)
	if unit == "" {
		unit = "1 porsi"
	}
	price := in.EstimatedPriceIDR
	if price <= 0 {
		price = 2000
	}
	cal := in.CaloriesKcal
	if cal < 0 {
		cal = 0
	}
	prot := in.ProteinGrams
	if prot < 0 {
		prot = 0
	}
	avail := true
	if in.IsAvailable != nil {
		avail = *in.IsAvailable
	}
	village := strings.TrimSpace(in.VillageName)
	if village == "" {
		village = "Desa Sukamaju"
	}

	var f LocalFoodItem
	err := r.db.QueryRow(ctx, `
		INSERT INTO local_foods (
			food_key, name, category, unit_label, estimated_price_idr,
			calories_kcal, protein_grams, is_animal_protein, allergen_tag, is_available, village_name, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
		ON CONFLICT (food_key) DO UPDATE SET
			name = EXCLUDED.name,
			category = EXCLUDED.category,
			unit_label = EXCLUDED.unit_label,
			estimated_price_idr = EXCLUDED.estimated_price_idr,
			calories_kcal = EXCLUDED.calories_kcal,
			protein_grams = EXCLUDED.protein_grams,
			is_animal_protein = EXCLUDED.is_animal_protein,
			allergen_tag = EXCLUDED.allergen_tag,
			is_available = EXCLUDED.is_available,
			updated_at = NOW()
		RETURNING id::text, food_key, name, category, unit_label, estimated_price_idr,
		          calories_kcal, protein_grams, is_animal_protein, COALESCE(allergen_tag,''), is_available,
		          COALESCE(village_name,'Desa Sukamaju'), to_char(updated_at, 'DD Mon YYYY HH24:MI')
	`, key, name, category, unit, price, cal, prot, in.IsAnimalProtein, strings.TrimSpace(in.AllergenTag), avail, village).Scan(
		&f.ID, &f.FoodKey, &f.Name, &f.Category, &f.UnitLabel,
		&f.EstimatedPriceIDR, &f.CaloriesKcal, &f.ProteinGrams,
		&f.IsAnimalProtein, &f.AllergenTag, &f.IsAvailable,
		&f.VillageName, &f.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *repository) UpdateLocalFood(ctx context.Context, id string, in LocalFoodInput) (*LocalFoodItem, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, fmt.Errorf("nama komoditas pangan wajib diisi")
	}
	category := strings.TrimSpace(in.Category)
	if category == "" {
		category = "Protein Hewani"
	}
	unit := strings.TrimSpace(in.UnitLabel)
	if unit == "" {
		unit = "1 porsi"
	}
	avail := true
	if in.IsAvailable != nil {
		avail = *in.IsAvailable
	}

	var f LocalFoodItem
	err := r.db.QueryRow(ctx, `
		UPDATE local_foods
		SET name = $2,
		    category = $3,
		    unit_label = $4,
		    estimated_price_idr = $5,
		    calories_kcal = $6,
		    protein_grams = $7,
		    is_animal_protein = $8,
		    allergen_tag = $9,
		    is_available = $10,
		    updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING id::text, food_key, name, category, unit_label, estimated_price_idr,
		          calories_kcal, protein_grams, is_animal_protein, COALESCE(allergen_tag,''), is_available,
		          COALESCE(village_name,'Desa Sukamaju'), to_char(updated_at, 'DD Mon YYYY HH24:MI')
	`, id, name, category, unit, in.EstimatedPriceIDR, in.CaloriesKcal, in.ProteinGrams, in.IsAnimalProtein, strings.TrimSpace(in.AllergenTag), avail).Scan(
		&f.ID, &f.FoodKey, &f.Name, &f.Category, &f.UnitLabel,
		&f.EstimatedPriceIDR, &f.CaloriesKcal, &f.ProteinGrams,
		&f.IsAnimalProtein, &f.AllergenTag, &f.IsAvailable,
		&f.VillageName, &f.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *repository) ToggleLocalFood(ctx context.Context, id string) (*LocalFoodItem, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	var f LocalFoodItem
	err := r.db.QueryRow(ctx, `
		UPDATE local_foods
		SET is_available = NOT COALESCE(is_available, TRUE),
		    updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING id::text, food_key, name, category, unit_label, estimated_price_idr,
		          calories_kcal, protein_grams, is_animal_protein, COALESCE(allergen_tag,''), is_available,
		          COALESCE(village_name,'Desa Sukamaju'), to_char(updated_at, 'DD Mon YYYY HH24:MI')
	`, id).Scan(
		&f.ID, &f.FoodKey, &f.Name, &f.Category, &f.UnitLabel,
		&f.EstimatedPriceIDR, &f.CaloriesKcal, &f.ProteinGrams,
		&f.IsAnimalProtein, &f.AllergenTag, &f.IsAvailable,
		&f.VillageName, &f.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *repository) DeleteLocalFood(ctx context.Context, id string) error {
	if r.db == nil {
		return fmt.Errorf("database tidak tersedia")
	}
	_, err := r.db.Exec(ctx, `DELETE FROM local_foods WHERE id = $1::uuid`, id)
	return err
}
