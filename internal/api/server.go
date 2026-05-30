package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/gyanankur/sci-crush/internal/access"
	"github.com/gyanankur/sci-crush/internal/config"
	"github.com/gyanankur/sci-crush/internal/content"
	"github.com/gyanankur/sci-crush/internal/db"
)

type Server struct {
	cfg   config.Config
	store *content.Store
	db    *db.Store
}

func NewServer(cfg config.Config, store *content.Store, dbStore *db.Store) *Server {
	return &Server{cfg: cfg, store: store, db: dbStore}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", s.handleIndex)
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("GET /api/access", s.handleAccess)
	mux.HandleFunc("POST /api/register", s.handleRegister)
	mux.HandleFunc("POST /api/login", s.handleLogin)
	mux.HandleFunc("GET /api/classes", s.handleListClasses)
	mux.HandleFunc("GET /api/classes/{id}", s.handleGetClass)
	mux.HandleFunc("GET /api/classes/{id}/chapters/{chapterId}", s.handleGetChapter)
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.Dir("web/static"))))
	mux.Handle("GET /data/", http.StripPrefix("/data/", http.FileServer(http.Dir(s.cfg.DataDir))))
	return withCORS(mux)
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	http.ServeFile(w, r, "web/templates/index.html")
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	status := "ok"
	if s.db == nil {
		status = "degraded"
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": status})
}

func (s *Server) handleAccess(w http.ResponseWriter, r *http.Request) {
	email := userEmailFromRequest(r)
	if email == "" {
		email = access.NormalizeEmail(r.URL.Query().Get("email"))
	}
	writeJSON(w, http.StatusOK, s.accessPayloadFor(r.Context(), email))
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		writeError(w, http.StatusServiceUnavailable, "registration unavailable")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<16))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var req struct {
		Name  string `json:"name"`
		Class string `json:"class"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	reg, err := s.db.CreateRegistration(r.Context(), db.RegisterInput{
		Name:  req.Name,
		Class: req.Class,
		Email: req.Email,
		Phone: req.Phone,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	email := access.NormalizeEmail(reg.Email)
	writeJSON(w, http.StatusCreated, map[string]any{
		"user":   reg,
		"access": s.accessPayloadFor(r.Context(), email),
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		writeError(w, http.StatusServiceUnavailable, "login unavailable")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<16))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	reg, err := s.db.Login(r.Context(), req.Email, req.Name)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	email := access.NormalizeEmail(reg.Email)
	writeJSON(w, http.StatusOK, map[string]any{
		"user":   reg,
		"access": s.accessPayloadFor(r.Context(), email),
	})
}

func (s *Server) accessPayloadFor(ctx context.Context, email string) map[string]any {
	email = access.NormalizeEmail(email)
	if access.HasFullAccess(email) {
		return map[string]any{
			"fullAccess":       true,
			"unlockedChapters": nil,
		}
	}
	registered := s.isRegistered(ctx, email)
	if !registered {
		return map[string]any{
			"fullAccess":       false,
			"unlockedChapters": []string{},
		}
	}
	return map[string]any{
		"fullAccess":       false,
		"unlockedChapters": access.UnlockedChapters(email),
	}
}

func (s *Server) isRegistered(ctx context.Context, email string) bool {
	if s.db == nil || email == "" {
		return false
	}
	ok, err := s.db.EmailIsRegistered(ctx, email)
	return err == nil && ok
}

func (s *Server) userCanAccessChapter(ctx context.Context, email, chapterID string) bool {
	email = access.NormalizeEmail(email)
	if email == "" {
		return false
	}
	if access.HasFullAccess(email) {
		return true
	}
	if !s.isRegistered(ctx, email) {
		return false
	}
	return access.IsFreeChapter(chapterID)
}

func (s *Server) handleListClasses(w http.ResponseWriter, r *http.Request) {
	classes, err := s.store.ListClasses()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load classes")
		return
	}

	type summary struct {
		ID           string `json:"id"`
		Grade        int    `json:"grade"`
		Name         string `json:"name"`
		Tagline      string `json:"tagline"`
		Description  string `json:"description"`
		Icon         string `json:"icon"`
		Color        string `json:"color"`
		ChapterCount int    `json:"chapterCount"`
	}

	out := make([]summary, 0, len(classes))
	for _, c := range classes {
		out = append(out, summary{
			ID:           c.ID,
			Grade:        c.Grade,
			Name:         c.Name,
			Tagline:      c.Tagline,
			Description:  c.Description,
			Icon:         c.Icon,
			Color:        c.Color,
			ChapterCount: len(c.Chapters),
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"classes": out})
}

func (s *Server) handleGetClass(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	class, err := s.store.GetClass(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "class not found")
		return
	}

	email := userEmailFromRequest(r)
	type chapterOut struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Subject  string `json:"subject"`
		Icon     string `json:"icon"`
		Summary  string `json:"summary"`
		ReadTime string `json:"readTime"`
		Locked   bool   `json:"locked"`
	}

	chapters := make([]chapterOut, 0, len(class.Chapters))
	for _, ch := range class.Chapters {
		chapters = append(chapters, chapterOut{
			ID:       ch.ID,
			Name:     ch.Name,
			Subject:  ch.Subject,
			Icon:     ch.Icon,
			Summary:  ch.Summary,
			ReadTime: ch.ReadTime,
			Locked:   !s.userCanAccessChapter(r.Context(), email, ch.ID),
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":          class.ID,
		"grade":       class.Grade,
		"name":        class.Name,
		"tagline":     class.Tagline,
		"description": class.Description,
		"icon":        class.Icon,
		"color":       class.Color,
		"subjects":    class.Subjects,
		"chapters":    chapters,
		"access":      s.accessPayloadFor(r.Context(), email),
	})
}

func (s *Server) handleGetChapter(w http.ResponseWriter, r *http.Request) {
	classID := r.PathValue("id")
	chapterID := r.PathValue("chapterId")
	email := userEmailFromRequest(r)

	if email == "" {
		writeError(w, http.StatusUnauthorized, "registration required")
		return
	}
	if !s.userCanAccessChapter(r.Context(), email, chapterID) {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"error":            "chapter locked",
			"chapterId":        chapterID,
			"unlockedChapters": s.betaUnlockedChapters(r.Context(), email),
		})
		return
	}

	chapter, err := s.store.GetChapter(classID, chapterID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, "chapter not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not load chapter")
		return
	}
	writeJSON(w, http.StatusOK, chapter)
}

func (s *Server) betaUnlockedChapters(ctx context.Context, email string) []string {
	if access.HasFullAccess(email) {
		return nil
	}
	if !s.isRegistered(ctx, email) {
		return []string{}
	}
	return access.UnlockedChapters(email)
}

func userEmailFromRequest(r *http.Request) string {
	return access.NormalizeEmail(r.Header.Get("X-User-Email"))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Email")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
