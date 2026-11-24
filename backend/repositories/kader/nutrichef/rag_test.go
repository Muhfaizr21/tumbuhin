package nutrichef

import (
	"strings"
	"testing"
)

func TestVectorLiteral(t *testing.T) {
	vec := make([]float32, 768)
	vec[0] = 0.125
	vec[767] = -0.5
	lit := vectorLiteral(vec)
	if !strings.HasPrefix(lit, "[0.125,0,") {
		t.Fatalf("unexpected prefix: %s", lit[:20])
	}
	if !strings.HasSuffix(lit, ",-0.5]") {
		t.Fatalf("unexpected suffix: %s", lit[len(lit)-10:])
	}
	if got := strings.Count(lit, ",") + 1; got != 768 {
		t.Fatalf("dimensions %d, want 768", got)
	}
}

func TestBuildRagQuery(t *testing.T) {
	cx := &childContext{AgeMonths: 10, NutritionStatus: "stunted"}
	q := buildRagQuery(cx, []string{"telur", "bayam"})
	for _, want := range []string{"10 bulan", "stunted", "telur bayam"} {
		if !strings.Contains(q, want) {
			t.Fatalf("query missing %q: %s", want, q)
		}
	}
}
