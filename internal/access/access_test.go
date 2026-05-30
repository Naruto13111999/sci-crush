package access

import "testing"

func TestCanAccessChapter(t *testing.T) {
	free := []string{"cell-structure", "chemical-effects-electric-current"}
	for _, id := range free {
		if !CanAccessChapter("student@school.com", id) {
			t.Fatalf("expected free chapter %s unlocked", id)
		}
	}
	if CanAccessChapter("student@school.com", "combustion-flame") {
		t.Fatal("expected locked chapter for regular user")
	}
	if CanAccessChapter("", "cell-structure") {
		t.Fatal("empty email should not unlock chapters")
	}
	if !CanAccessChapter("ankurdey429@gmail.com", "combustion-flame") {
		t.Fatal("expected admin full access")
	}
	if !HasFullAccess("AnkurDey429@gmail.com") {
		t.Fatal("admin email should be case-insensitive")
	}
}
