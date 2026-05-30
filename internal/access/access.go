package access

import "strings"

const AdminEmail = "ankurdey429@gmail.com"

var FreeChapterIDs = []string{
	"cell-structure",
	"chemical-effects-electric-current",
}

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func HasFullAccess(email string) bool {
	return NormalizeEmail(email) == AdminEmail
}

func IsFreeChapter(chapterID string) bool {
	for _, id := range FreeChapterIDs {
		if id == chapterID {
			return true
		}
	}
	return false
}

func CanAccessChapter(email, chapterID string) bool {
	email = NormalizeEmail(email)
	if email == "" {
		return false
	}
	if HasFullAccess(email) {
		return true
	}
	return IsFreeChapter(chapterID)
}

func UnlockedChapters(email string) []string {
	if HasFullAccess(email) {
		return nil // nil signals full access on API
	}
	out := make([]string, len(FreeChapterIDs))
	copy(out, FreeChapterIDs)
	return out
}
