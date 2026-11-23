package nutrichef

import "testing"

func TestSanitizeGeminiRecipe(t *testing.T) {
	cx := &childContext{Name: "Budi", AgeMonths: 10, NutritionStatus: "stunted"}
	in := &geminiRecipe{
		Title:   "  Bubur Ikan  ",
		Energy:  "300 kkal",
		Protein: "10 g",
		Ingredients: []Ingredient{
			{Name: "Beras", Qty: "3 sdm", Cost: 1000},
			{Name: "Ikan Lele", Qty: "1 ekor", Cost: 5000},
			{Name: "Telur Ayam", Qty: "1 butir", Cost: 0},
			{Name: "Minyak", Qty: "1 sdt", Cost: 20000},
			{Name: "", Qty: "x", Cost: 999},
		},
		Steps:    []string{" Masak ", "", "Sajikan"},
		Citation: "Kemenkes 2024",
	}
	out, err := sanitizeGeminiRecipe(in, cx, 8000, "alergi telur")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if out.TargetAge != "9-11 Bulan" || out.Texture != "Cincang Halus / Lembik" {
		t.Fatalf("age mapping wrong: %s / %s", out.TargetAge, out.Texture)
	}
	for _, ing := range out.Ingredients {
		if ing.Name == "Telur Ayam" {
			t.Fatalf("allergen not filtered")
		}
		if ing.Name == "Minyak" {
			t.Fatalf("over-budget ingredient not dropped")
		}
	}
	if out.TotalCost > 8000 {
		t.Fatalf("total %d exceeds budget", out.TotalCost)
	}
	if len(out.Steps) != 2 {
		t.Fatalf("steps not trimmed: %v", out.Steps)
	}
}

func TestSanitizeRejectsEmpty(t *testing.T) {
	if _, err := sanitizeGeminiRecipe(&geminiRecipe{Ingredients: []Ingredient{{Name: "Air", Cost: 0}}}, &childContext{AgeMonths: 7}, 15000, ""); err == nil {
		t.Fatalf("expected error for <2 ingredients")
	}
}
