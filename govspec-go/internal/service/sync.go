package service

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/markdown"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/repository"
)

type SyncService struct {
	parser    *markdown.Parser
	features  *repository.FeatureRepo
	audit     *repository.AuditRepo
	notifs    *repository.NotificationRepo
	meta      *repository.MetaRepo
}

func NewSyncService(
	parser *markdown.Parser,
	features *repository.FeatureRepo,
	audit *repository.AuditRepo,
	notifs *repository.NotificationRepo,
	meta *repository.MetaRepo,
) *SyncService {
	return &SyncService{
		parser:   parser,
		features: features,
		audit:    audit,
		notifs:   notifs,
		meta:     meta,
	}
}

type SyncResult struct {
	FeaturesSync      int    `json:"featuresSync"`
	GovernanceVersion string `json:"governanceVersion"`
}

func (s *SyncService) SyncFromMarkdown() (*SyncResult, error) {
	parsed, err := s.parser.ParseFeatureRegistry()
	if err != nil {
		return nil, fmt.Errorf("parse registry: %w", err)
	}

	govInfo, err := s.parser.GetGovernanceInfo()
	if err != nil {
		return nil, fmt.Errorf("get governance info: %w", err)
	}

	synced := 0
	for _, pf := range parsed {
		f := parsedToFeature(pf)
		if err := s.features.Upsert(f); err != nil {
			slog.Warn("failed to upsert feature", "id", pf.ID, "error", err)
			continue
		}
		synced++
	}

	// Remove features from DB that are no longer in the registry
	registryIDs := make(map[string]bool)
	for _, pf := range parsed {
		registryIDs[pf.ID] = true
	}

	dbIDs, err := s.features.AllIDs()
	if err != nil {
		slog.Warn("failed to get DB feature IDs", "error", err)
	} else {
		for _, id := range dbIDs {
			if !registryIDs[id] {
				_ = s.audit.DeleteByFeature(id)
				_ = s.notifs.DeleteByFeature(id)
				_ = s.features.Delete(id)
				slog.Info("removed orphaned feature from DB", "id", id)
			}
		}
	}

	// Store governance version
	if err := s.meta.Set("governance_version", govInfo.Version); err != nil {
		slog.Warn("failed to store governance version", "error", err)
	}

	return &SyncResult{
		FeaturesSync:      synced,
		GovernanceVersion: govInfo.Version,
	}, nil
}

func parsedToFeature(pf model.ParsedFeature) model.Feature {
	now := time.Now()
	f := model.Feature{
		ID:          pf.ID,
		Name:        pf.Name,
		Status:      strings.ToLower(pf.Status),
		RequestedBy: pf.RequestedBy,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if pf.Priority != "" {
		p := strings.ToLower(pf.Priority)
		f.Priority = &p
	}
	if pf.DependsOn != "" {
		f.DependsOn = &pf.DependsOn
	}
	if pf.RelatedDocs != "" {
		f.RelatedDocs = &pf.RelatedDocs
	}
	if pf.Notes != "" {
		f.Notes = &pf.Notes
	}

	f.RequestedAt = parseDate(pf.RequestedAt)
	f.ApprovedAt = parseDatePtr(pf.ApprovedAt)
	f.RejectedAt = parseDatePtr(pf.RejectedAt)
	f.CompletedAt = parseDatePtr(pf.CompletedAt)

	return f
}

func parseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", strings.TrimSpace(s))
	if err != nil {
		return time.Now()
	}
	return t
}

func parseDatePtr(s string) *time.Time {
	s = strings.TrimSpace(s)
	if s == "" || s == "—" || s == "-" {
		return nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil
	}
	return &t
}
