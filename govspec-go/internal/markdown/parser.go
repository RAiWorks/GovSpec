package markdown

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
)

// Parser handles reading and writing GovSpec markdown files.
type Parser struct {
	docsRoot string
}

// NewParser creates a new markdown parser for the given docs directory.
func NewParser(docsRoot string) *Parser {
	return &Parser{docsRoot: docsRoot}
}

func (p *Parser) GovernancePath() string {
	return filepath.Join(p.docsRoot, "governance")
}

func (p *Parser) FeaturesPath() string {
	return filepath.Join(p.docsRoot, "features")
}

// ParseFeatureRegistry reads project_features.md and extracts all feature rows.
func (p *Parser) ParseFeatureRegistry() ([]model.ParsedFeature, error) {
	registryPath := filepath.Join(p.GovernancePath(), "project_features.md")
	data, err := os.ReadFile(registryPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read registry: %w", err)
	}

	lines := strings.Split(string(data), "\n")

	// Find the header row containing Feature ID, Feature Name, Status
	headerIdx := -1
	for i, line := range lines {
		if strings.Contains(line, "Feature ID") && strings.Contains(line, "Feature Name") && strings.Contains(line, "Status") {
			headerIdx = i
			break
		}
	}
	if headerIdx == -1 {
		return nil, nil
	}

	// Data starts after header + separator
	dataStart := headerIdx + 2
	var features []model.ParsedFeature

	for i := dataStart; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if !strings.HasPrefix(line, "|") {
			break
		}

		cells := parseCells(line)
		if len(cells) < 8 {
			slog.Warn("skipping malformed registry row", "line", i+1, "cells", len(cells))
			continue
		}

		features = append(features, model.ParsedFeature{
			ID:          cells[0],
			Name:        cells[1],
			Status:      cells[2],
			Priority:    dashToEmpty(cells[3]),
			DependsOn:   dashToEmpty(cells[4]),
			RequestedBy: cells[5],
			RequestedAt: cells[6],
			ApprovedAt:  safeGet(cells, 7),
			RejectedAt:  safeGet(cells, 8),
			CompletedAt: safeGet(cells, 9),
			RelatedDocs: safeGet(cells, 10),
			Notes:       safeGet(cells, 11),
		})
	}

	return features, nil
}

// ParseFeatureDocument reads and parses a single feature markdown file.
func (p *Parser) ParseFeatureDocument(filename string) (*model.FeatureDocument, error) {
	filePath := filepath.Join(p.FeaturesPath(), filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read feature doc %s: %w", filename, err)
	}

	content := string(data)
	lines := strings.Split(content, "\n")

	doc := &model.FeatureDocument{
		Filename: filename,
		Status:   "unknown",
		Content:  content,
	}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(trimmed, "STATUS:"):
			doc.Status = strings.TrimSpace(strings.TrimPrefix(trimmed, "STATUS:"))
		case strings.HasPrefix(trimmed, "IMPLEMENTATION:"):
			doc.Implementation = strings.TrimSpace(strings.TrimPrefix(trimmed, "IMPLEMENTATION:"))
		case strings.HasPrefix(trimmed, "- Feature ID:"):
			doc.FeatureID = strings.TrimSpace(strings.TrimPrefix(trimmed, "- Feature ID:"))
		case strings.HasPrefix(trimmed, "- Feature Name:"):
			doc.FeatureName = strings.TrimSpace(strings.TrimPrefix(trimmed, "- Feature Name:"))
		}
	}

	return doc, nil
}

// ListFeatureDocuments returns filenames of all feature documents (excluding templates).
func (p *Parser) ListFeatureDocuments() ([]string, error) {
	featuresDir := p.FeaturesPath()
	entries, err := os.ReadDir(featuresDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read features dir: %w", err)
	}

	var docs []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), "_template") {
			docs = append(docs, e.Name())
		}
	}
	return docs, nil
}

// GetGovernanceInfo reads the governance version from project_development_instructions.md.
func (p *Parser) GetGovernanceInfo() (*model.GovernanceInfo, error) {
	instrPath := filepath.Join(p.GovernancePath(), "project_development_instructions.md")
	data, err := os.ReadFile(instrPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &model.GovernanceInfo{Version: "unknown"}, nil
		}
		return nil, fmt.Errorf("read governance doc: %w", err)
	}

	content := string(data)
	re := regexp.MustCompile(`(?m)## Version\s*\n\s*(v[\d.]+)`)
	matches := re.FindStringSubmatch(content)
	version := "unknown"
	if len(matches) > 1 {
		version = matches[1]
	}

	return &model.GovernanceInfo{Version: version, Content: content}, nil
}

// GetNextFeatureID returns the next sequential feature ID.
func (p *Parser) GetNextFeatureID() (string, error) {
	features, err := p.ParseFeatureRegistry()
	if err != nil {
		return "", err
	}
	if len(features) == 0 {
		return "01", nil
	}

	maxID := 0
	for _, f := range features {
		var id int
		if _, err := fmt.Sscanf(f.ID, "%d", &id); err == nil && id > maxID {
			maxID = id
		}
	}
	return fmt.Sprintf("%02d", maxID+1), nil
}

// --- Helper functions ---

func parseCells(line string) []string {
	parts := strings.Split(line, "|")
	var cells []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			cells = append(cells, trimmed)
		}
	}
	return cells
}

func dashToEmpty(s string) string {
	s = strings.TrimSpace(s)
	if s == "—" || s == "-" || s == "" {
		return ""
	}
	return s
}

func safeGet(cells []string, idx int) string {
	if idx < len(cells) {
		return dashToEmpty(cells[idx])
	}
	return ""
}
