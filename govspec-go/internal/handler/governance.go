package handler

import (
	"net/http"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/markdown"
)

type GovernanceHandler struct {
	parser *markdown.Parser
}

func NewGovernanceHandler(parser *markdown.Parser) *GovernanceHandler {
	return &GovernanceHandler{parser: parser}
}

// GetGovernance handles GET /api/v1/governance
func (h *GovernanceHandler) GetGovernance(w http.ResponseWriter, r *http.Request) {
	info, err := h.parser.GetGovernanceInfo()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch governance info")
		return
	}
	writeJSON(w, http.StatusOK, info)
}
