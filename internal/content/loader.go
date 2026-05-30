package content

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Store struct {
	dataDir string
}

func NewStore(dataDir string) *Store {
	return &Store{dataDir: dataDir}
}

func (s *Store) ListClasses() ([]Class, error) {
	classesDir := filepath.Join(s.dataDir, "classes")
	entries, err := os.ReadDir(classesDir)
	if err != nil {
		return nil, fmt.Errorf("read classes: %w", err)
	}

	var classes []Class
	for _, entry := range entries {
		if !entry.IsDir() || isHiddenOrTemplateDir(entry.Name()) {
			continue
		}
		c, err := s.loadClass(entry.Name())
		if err != nil {
			return nil, err
		}
		classes = append(classes, *c)
	}

	sort.Slice(classes, func(i, j int) bool {
		return classes[i].Grade < classes[j].Grade
	})
	return classes, nil
}

func isHiddenOrTemplateDir(name string) bool {
	return strings.HasPrefix(name, "_") || strings.HasPrefix(name, ".")
}

func (s *Store) GetClass(id string) (*Class, error) {
	return s.loadClass(id)
}

func (s *Store) GetChapter(classID, chapterID string) (*Chapter, error) {
	path := filepath.Join(s.dataDir, "classes", classID, "chapters", chapterID+".json")
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("chapter not found")
		}
		return nil, err
	}

	var ch Chapter
	if err := json.Unmarshal(b, &ch); err != nil {
		return nil, fmt.Errorf("parse chapter %s: %w", chapterID, err)
	}
	return &ch, nil
}

func (s *Store) loadClass(id string) (*Class, error) {
	path := filepath.Join(s.dataDir, "classes", id, "class.json")
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("load class %s: %w", id, err)
	}

	var c Class
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("parse class %s: %w", id, err)
	}

	chaptersDir := filepath.Join(s.dataDir, "classes", id, "chapters")
	entries, err := os.ReadDir(chaptersDir)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	c.Chapters = nil
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		chapterID := strings.TrimSuffix(entry.Name(), ".json")
		ch, err := s.GetChapter(id, chapterID)
		if err != nil {
			continue
		}
		c.Chapters = append(c.Chapters, ChapterSummary{
			ID:       ch.ID,
			Name:     ch.Name,
			Subject:  ch.Subject,
			Icon:     ch.Icon,
			Summary:  ch.Summary,
			ReadTime: ch.ReadTime,
		})
	}

	sort.Slice(c.Chapters, func(i, j int) bool {
		return c.Chapters[i].Name < c.Chapters[j].Name
	})
	return &c, nil
}
