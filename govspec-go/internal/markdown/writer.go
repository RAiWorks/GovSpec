package markdown

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
)

// UpdateFeatureInRegistry updates a feature row in project_features.md.
func (p *Parser) UpdateFeatureInRegistry(featureID string, updates map[string]string) error {
	registryPath := filepath.Join(p.GovernancePath(), "project_features.md")
	data, err := os.ReadFile(registryPath)
	if err != nil {
		return fmt.Errorf("read registry: %w", err)
	}

	lines := strings.Split(string(data), "\n")

	headerIdx := -1
	for i, line := range lines {
		if strings.Contains(line, "Feature ID") && strings.Contains(line, "Feature Name") && strings.Contains(line, "Status") {
			headerIdx = i
			break
		}
	}
	if headerIdx == -1 {
		return fmt.Errorf("feature index table not found in registry")
	}

	dataStart := headerIdx + 2

	for i := dataStart; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if !strings.HasPrefix(line, "|") {
			break
		}

		cells := parseCells(line)
		if len(cells) < 8 || cells[0] != featureID {
			continue
		}

		// Apply updates
		applyUpdate := func(idx int, key string, cells []string) string {
			if v, ok := updates[key]; ok {
				return v
			}
			if idx < len(cells) {
				return cells[idx]
			}
			return "—"
		}

		dash := func(s string) string {
			if s == "" {
				return "—"
			}
			return s
		}

		name := applyUpdate(1, "name", cells)
		status := applyUpdate(2, "status", cells)
		priority := dash(applyUpdate(3, "priority", cells))
		dependsOn := dash(applyUpdate(4, "dependsOn", cells))
		requestedBy := applyUpdate(5, "requestedBy", cells)
		requestedAt := applyUpdate(6, "requestedAt", cells)
		approvedAt := dash(applyUpdate(7, "approvedAt", cells))
		rejectedAt := dash(applyUpdate(8, "rejectedAt", cells))
		completedAt := dash(applyUpdate(9, "completedAt", cells))
		relatedDocs := dash(applyUpdate(10, "relatedDocs", cells))
		notes := dash(applyUpdate(11, "notes", cells))

		lines[i] = fmt.Sprintf("| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |",
			featureID, name, status, priority, dependsOn, requestedBy, requestedAt,
			approvedAt, rejectedAt, completedAt, relatedDocs, notes)
		break
	}

	return writeFileAtomic(registryPath, strings.Join(lines, "\n"))
}

// AddFeatureToRegistry appends a new row to the feature index table.
func (p *Parser) AddFeatureToRegistry(f model.ParsedFeature) error {
	registryPath := filepath.Join(p.GovernancePath(), "project_features.md")
	data, err := os.ReadFile(registryPath)
	if err != nil {
		return fmt.Errorf("read registry: %w", err)
	}

	lines := strings.Split(string(data), "\n")

	headerIdx := -1
	for i, line := range lines {
		if strings.Contains(line, "Feature ID") && strings.Contains(line, "Feature Name") && strings.Contains(line, "Status") {
			headerIdx = i
			break
		}
	}
	if headerIdx == -1 {
		return fmt.Errorf("feature index table not found")
	}

	// Find the last table row
	lastRowIdx := headerIdx + 2
	for i := lastRowIdx; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) != "" && strings.HasPrefix(strings.TrimSpace(lines[i]), "|") {
			lastRowIdx = i + 1
		} else {
			break
		}
	}

	dash := func(s string) string {
		if s == "" {
			return "—"
		}
		return s
	}

	newRow := fmt.Sprintf("| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |",
		f.ID, f.Name, f.Status, dash(f.Priority), dash(f.DependsOn),
		f.RequestedBy, f.RequestedAt, dash(f.ApprovedAt), dash(f.RejectedAt),
		dash(f.CompletedAt), dash(f.RelatedDocs), dash(f.Notes))

	// Insert the new row
	newLines := make([]string, 0, len(lines)+1)
	newLines = append(newLines, lines[:lastRowIdx]...)
	newLines = append(newLines, newRow)
	newLines = append(newLines, lines[lastRowIdx:]...)

	return writeFileAtomic(registryPath, strings.Join(newLines, "\n"))
}

// UpdateFeatureDocStatus updates the STATUS and IMPLEMENTATION lines in a feature document.
func (p *Parser) UpdateFeatureDocStatus(filename string, newStatus string) error {
	filePath := filepath.Join(p.FeaturesPath(), filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("read feature doc: %w", err)
	}

	content := string(data)

	// Update STATUS line
	statusRe := regexp.MustCompile(`(?m)^STATUS:\s*.+$`)
	content = statusRe.ReplaceAllString(content, "STATUS: "+strings.ToUpper(newStatus))

	// Update IMPLEMENTATION line
	impl := "FORBIDDEN"
	if strings.ToLower(newStatus) == "approved" {
		impl = "ALLOWED"
	}
	implRe := regexp.MustCompile(`(?m)^IMPLEMENTATION:\s*.+$`)
	content = implRe.ReplaceAllString(content, "IMPLEMENTATION: "+impl)

	return writeFileAtomic(filePath, content)
}

// CreateFeatureDocument generates a new feature document from the minimal template.
func (p *Parser) CreateFeatureDocument(featureID, name, purpose, motivation string) (string, error) {
	templatePath := filepath.Join(p.FeaturesPath(), "_template_minimal_feature.md")
	data, err := os.ReadFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("read template: %w", err)
	}

	safeName := strings.ToLower(name)
	safeName = strings.ReplaceAll(safeName, " ", "_")
	safeName = regexp.MustCompile(`[^a-z0-9_]`).ReplaceAllString(safeName, "")
	filename := fmt.Sprintf("%s_%s.md", featureID, safeName)

	today := currentDate()
	content := string(data)
	content = strings.Replace(content, "[NN]", featureID, 1)
	content = strings.Replace(content, "[Name]", name, 1)
	content = strings.Replace(content, "`docs/features/NN_feature_name.md`", fmt.Sprintf("`docs/features/%s`", filename), 1)
	content = strings.Replace(content, "[version of project_development_instructions.md at time of creation]", "v2.0", 1)
	content = strings.Replace(content, "[Project Owner / AI Project Contributor]", "Project Owner", 1)
	content = strings.Replace(content, "[YYYY-MM-DD]", today, 2)
	content = strings.Replace(content, "Describe the problem this feature intends to solve. Be specific about the pain point or gap.", purpose, 1)
	if motivation != "" {
		content = strings.Replace(content, "Explain why this feature is needed and what value it provides. What happens if this feature is not built?", motivation, 1)
	}

	filePath := filepath.Join(p.FeaturesPath(), filename)
	if err := writeFileAtomic(filePath, content); err != nil {
		return "", err
	}

	return filename, nil
}

// writeFileAtomic writes content to a file using a temp file + rename pattern.
func writeFileAtomic(path string, content string) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".govspec-tmp-*")
	if err != nil {
		// Fallback to direct write
		return os.WriteFile(path, []byte(content), 0644)
	}
	tmpName := tmp.Name()

	if _, err := tmp.WriteString(content); err != nil {
		tmp.Close()
		os.Remove(tmpName)
		return err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpName)
		return err
	}

	if err := os.Rename(tmpName, path); err != nil {
		// On Windows, rename can fail if target exists. Fallback.
		os.Remove(tmpName)
		return os.WriteFile(path, []byte(content), 0644)
	}
	return nil
}

func currentDate() string {
	return time.Now().Format("2006-01-02")
}
