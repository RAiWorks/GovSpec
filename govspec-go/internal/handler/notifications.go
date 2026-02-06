package handler

import (
	"net/http"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/repository"
)

type NotificationHandler struct {
	notifs *repository.NotificationRepo
}

func NewNotificationHandler(notifs *repository.NotificationRepo) *NotificationHandler {
	return &NotificationHandler{notifs: notifs}
}

// ListNotifications handles GET /api/v1/notifications
func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	notifications, err := h.notifs.FindAll(50)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	unreadCount, _ := h.notifs.UnreadCount()

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"notifications": notifications,
		"unreadCount":   unreadCount,
	})
}

// MarkAllRead handles PUT /api/v1/notifications/read
func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	if err := h.notifs.MarkAllRead(); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update notifications")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}
