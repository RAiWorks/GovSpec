package handler

import (
	"net/http"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/repository"
)

type AuditHandler struct {
	audit *repository.AuditRepo
}

func NewAuditHandler(audit *repository.AuditRepo) *AuditHandler {
	return &AuditHandler{audit: audit}
}

// ListAuditLogs handles GET /api/v1/audit
func (h *AuditHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	featureID := r.URL.Query().Get("featureId")

	logs, err := h.audit.FindAll(featureID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch audit logs")
		return
	}
	if logs == nil {
		logs = []model.AuditLog{}
	}
	writeJSON(w, http.StatusOK, logs)
}
