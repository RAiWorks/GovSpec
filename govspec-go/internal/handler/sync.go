package handler

import (
	"net/http"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/service"
)

type SyncHandler struct {
	sync *service.SyncService
}

func NewSyncHandler(syncSvc *service.SyncService) *SyncHandler {
	return &SyncHandler{sync: syncSvc}
}

// TriggerSync handles POST /api/v1/sync
func (h *SyncHandler) TriggerSync(w http.ResponseWriter, r *http.Request) {
	result, err := h.sync.SyncFromMarkdown()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Sync failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":           true,
		"featuresSync":      result.FeaturesSync,
		"governanceVersion": result.GovernanceVersion,
	})
}
