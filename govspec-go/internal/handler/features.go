package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/markdown"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/repository"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/service"
)

type FeatureHandler struct {
	features *repository.FeatureRepo
	audit    *repository.AuditRepo
	notifs   *repository.NotificationRepo
	parser   *markdown.Parser
	sync     *service.SyncService
}

func NewFeatureHandler(
	features *repository.FeatureRepo,
	audit *repository.AuditRepo,
	notifs *repository.NotificationRepo,
	parser *markdown.Parser,
	syncSvc *service.SyncService,
) *FeatureHandler {
	return &FeatureHandler{
		features: features,
		audit:    audit,
		notifs:   notifs,
		parser:   parser,
		sync:     syncSvc,
	}
}

// ListFeatures handles GET /api/v1/features
func (h *FeatureHandler) ListFeatures(w http.ResponseWriter, r *http.Request) {
	if _, err := h.sync.SyncFromMarkdown(); err != nil {
		slog.Error("sync failed", "error", err)
	}

	features, err := h.features.FindAll()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch features")
		return
	}
	if features == nil {
		features = []model.Feature{}
	}
	writeJSON(w, http.StatusOK, features)
}

// GetFeature handles GET /api/v1/features/{id}
func (h *FeatureHandler) GetFeature(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if _, err := h.sync.SyncFromMarkdown(); err != nil {
		slog.Error("sync failed", "error", err)
	}

	feature, err := h.features.FindByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch feature")
		return
	}
	if feature == nil {
		writeError(w, http.StatusNotFound, "Feature not found")
		return
	}

	// Find and parse the feature document
	docs, _ := h.parser.ListFeatureDocuments()
	var document *model.FeatureDocument
	for _, d := range docs {
		if strings.HasPrefix(d, id+"_") {
			doc, err := h.parser.ParseFeatureDocument(d)
			if err == nil {
				document = doc
			}
			break
		}
	}

	// Get audit logs
	auditLogs, _ := h.audit.FindAll(id)
	if auditLogs == nil {
		auditLogs = []model.AuditLog{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"feature":   feature,
		"document":  document,
		"auditLogs": auditLogs,
	})
}

// CreateFeature handles POST /api/v1/features
func (h *FeatureHandler) CreateFeature(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name       string `json:"name"`
		Purpose    string `json:"purpose"`
		Motivation string `json:"motivation"`
		Priority   string `json:"priority"`
		Notes      string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if body.Name == "" || body.Purpose == "" {
		writeError(w, http.StatusBadRequest, "Name and purpose are required")
		return
	}

	featureID, err := h.parser.GetNextFeatureID()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate feature ID")
		return
	}

	today := time.Now().Format("2006-01-02")

	// Create the feature document from template
	filename, err := h.parser.CreateFeatureDocument(featureID, body.Name, body.Purpose, body.Motivation)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create feature document")
		return
	}

	priority := body.Priority
	if priority == "" {
		priority = "normal"
	}

	// Add to registry
	pf := model.ParsedFeature{
		ID:          featureID,
		Name:        body.Name,
		Status:      "draft",
		Priority:    priority,
		RequestedBy: "Project Owner",
		RequestedAt: today,
		RelatedDocs: fmt.Sprintf("`docs/features/%s`", filename),
		Notes:       body.Notes,
	}
	if err := h.parser.AddFeatureToRegistry(pf); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update registry")
		return
	}

	// Sync to DB
	if _, err := h.sync.SyncFromMarkdown(); err != nil {
		slog.Error("sync after create failed", "error", err)
	}

	// Create audit log
	_ = h.audit.Create(model.AuditLog{
		FeatureID: featureID,
		ToStatus:  "draft",
		ChangedBy: "Project Owner",
		Reason:    strPtr("New feature created"),
	})

	// Create notification
	_ = h.notifs.Create(model.Notification{
		FeatureID: &featureID,
		Type:      "new_draft",
		Title:     fmt.Sprintf("New Feature: %s", body.Name),
		Message:   fmt.Sprintf("Feature %s \"%s\" has been created as a draft.", featureID, body.Name),
	})

	feature, _ := h.features.FindByID(featureID)
	writeJSON(w, http.StatusCreated, feature)
}

// UpdateStatus handles PUT /api/v1/features/{id}/status
func (h *FeatureHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		NewStatus string `json:"newStatus"`
		Reason    string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if body.NewStatus == "" {
		writeError(w, http.StatusBadRequest, "newStatus is required")
		return
	}

	// Sync first
	if _, err := h.sync.SyncFromMarkdown(); err != nil {
		slog.Error("sync failed", "error", err)
	}

	feature, err := h.features.FindByID(id)
	if err != nil || feature == nil {
		writeError(w, http.StatusNotFound, "Feature not found")
		return
	}

	currentStatus := feature.Status

	// Validate transition
	if !service.IsValidTransition(currentStatus, body.NewStatus) {
		valid := service.GetValidTransitions(currentStatus)
		writeError(w, http.StatusBadRequest, fmt.Sprintf(
			"Invalid transition from \"%s\" to \"%s\". Valid transitions: %s",
			currentStatus, body.NewStatus, strings.Join(valid, ", ")))
		return
	}

	// Require reason for rejection
	if body.NewStatus == "rejected" && body.Reason == "" {
		writeError(w, http.StatusBadRequest, "A reason is required when rejecting a feature")
		return
	}

	// Check dependencies for approved → completed
	if body.NewStatus == "completed" && feature.DependsOn != nil {
		depIDs := strings.Split(*feature.DependsOn, ",")
		for i := range depIDs {
			depIDs[i] = strings.TrimSpace(depIDs[i])
		}
		for _, depID := range depIDs {
			if depID == "" {
				continue
			}
			dep, err := h.features.FindByID(depID)
			if err != nil || dep == nil || dep.Status != "completed" {
				status := "unknown"
				if dep != nil {
					status = dep.Status
				}
				writeError(w, http.StatusBadRequest, fmt.Sprintf(
					"Cannot complete: dependency %s is not completed (status: %s)", depID, status))
				return
			}
		}
	}

	today := time.Now().Format("2006-01-02")

	// Build registry updates
	updates := map[string]string{"status": body.NewStatus}
	switch body.NewStatus {
	case "approved":
		updates["approvedAt"] = today
	case "rejected":
		updates["rejectedAt"] = today
	case "completed":
		updates["completedAt"] = today
	}
	if currentStatus == "rejected" && body.NewStatus == "draft" {
		updates["rejectedAt"] = "—"
	}

	// Update markdown registry
	if err := h.parser.UpdateFeatureInRegistry(id, updates); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update registry")
		return
	}

	// Update feature document status
	docs, _ := h.parser.ListFeatureDocuments()
	for _, d := range docs {
		if strings.HasPrefix(d, id+"_") {
			_ = h.parser.UpdateFeatureDocStatus(d, body.NewStatus)
			break
		}
	}

	// Sync DB
	if _, err := h.sync.SyncFromMarkdown(); err != nil {
		slog.Error("sync after status change failed", "error", err)
	}

	// Create audit log
	_ = h.audit.Create(model.AuditLog{
		FeatureID:  id,
		FromStatus: &currentStatus,
		ToStatus:   body.NewStatus,
		ChangedBy:  "Project Owner",
		Reason:     strPtrOrNil(body.Reason),
	})

	// Create notification
	notifType := "status_change"
	if body.NewStatus == "pending" {
		notifType = "pending_review"
	}
	msg := fmt.Sprintf("Feature \"%s\" moved to %s.", feature.Name, body.NewStatus)
	if body.Reason != "" {
		msg = fmt.Sprintf("Feature \"%s\" moved to %s. Reason: %s", feature.Name, body.NewStatus, body.Reason)
	}
	_ = h.notifs.Create(model.Notification{
		FeatureID: &id,
		Type:      notifType,
		Title:     fmt.Sprintf("Feature %s: %s → %s", id, currentStatus, body.NewStatus),
		Message:   msg,
	})

	// Dependency alerts on rejection
	if body.NewStatus == "rejected" {
		dependents, _ := h.features.FindByDependency(id)
		for _, dep := range dependents {
			depID := dep.ID
			_ = h.notifs.Create(model.Notification{
				FeatureID: &depID,
				Type:      "dependency_alert",
				Title:     fmt.Sprintf("Dependency Alert: Feature %s", dep.ID),
				Message:   fmt.Sprintf("Feature \"%s\" depends on Feature %s which has been rejected.", dep.Name, id),
			})
		}
	}

	updated, _ := h.features.FindByID(id)
	writeJSON(w, http.StatusOK, updated)
}
