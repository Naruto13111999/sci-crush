package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	outDir := "public"
	apiURL := os.Getenv("SCI_CRUSH_API_URL")
	if apiURL == "" {
		apiURL = "/api"
	}

	if err := os.RemoveAll(outDir); err != nil {
		log.Fatalf("clean public dir: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(outDir, "static"), 0o755); err != nil {
		log.Fatalf("create public dir: %v", err)
	}

	// Sync chapter JSON into static assets (same as make sync-data).
	if err := copyDir("data/classes", "web/static/data/classes"); err != nil {
		log.Fatalf("sync data/classes: %v", err)
	}
	_ = os.RemoveAll("web/static/data/classes/_template")

	html, err := os.ReadFile("web/templates/index.html")
	if err != nil {
		log.Fatalf("read index.html: %v", err)
	}

	htmlStr := string(html)
	htmlStr = strings.ReplaceAll(htmlStr, `href="/static/`, `href="static/`)
	htmlStr = strings.ReplaceAll(htmlStr, `src="/static/`, `src="static/`)

	configScript := fmt.Sprintf(
		`<script>window.__SCI_CRUSH_CONFIG__={apiBase:%q};</script>`+"\n  ",
		apiURL,
	)
	htmlStr = strings.Replace(htmlStr, `<script type="module"`, configScript+`<script type="module"`, 1)

	if err := os.WriteFile(filepath.Join(outDir, "index.html"), []byte(htmlStr), 0o644); err != nil {
		log.Fatalf("write index.html: %v", err)
	}

	if err := copyDir("web/static", filepath.Join(outDir, "static")); err != nil {
		log.Fatalf("copy static assets: %v", err)
	}

	if err := os.WriteFile(filepath.Join(outDir, ".nojekyll"), nil, 0o644); err != nil {
		log.Fatalf("write .nojekyll: %v", err)
	}

	log.Printf("static site exported to %s/ (API: %s)", outDir, apiURL)
}

func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() && (strings.HasPrefix(info.Name(), "_") || info.Name() == ".DS_Store") {
			if info.IsDir() && path != src {
				return filepath.SkipDir
			}
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		if strings.HasPrefix(filepath.Base(path), "_") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		return copyFile(path, target)
	})
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
