package model

import "time"

type Feature struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Status      string     `json:"status"`
	Priority    *string    `json:"priority"`
	DependsOn   *string    `json:"dependsOn"`
	RequestedBy string     `json:"requestedBy"`
	RequestedAt time.Time  `json:"requestedAt"`
	ApprovedAt  *time.Time `json:"approvedAt"`
	RejectedAt  *time.Time `json:"rejectedAt"`
	CompletedAt *time.Time `json:"completedAt"`
	RelatedDocs *string    `json:"relatedDocs"`
	Notes       *string    `json:"notes"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type AuditLog struct {
	ID         int       `json:"id"`
	FeatureID  string    `json:"featureId"`
	FromStatus *string   `json:"fromStatus"`
	ToStatus   string    `json:"toStatus"`
	ChangedBy  string    `json:"changedBy"`
	Reason     *string   `json:"reason"`
	CreatedAt  time.Time `json:"createdAt"`
	// Joined field
	FeatureName string `json:"featureName,omitempty"`
}

type Notification struct {
	ID        int       `json:"id"`
	FeatureID *string   `json:"featureId"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

type GovSpecMeta struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// ParsedFeature represents a feature parsed from the markdown registry.
type ParsedFeature struct {
	ID          string
	Name        string
	Status      string
	Priority    string
	DependsOn   string
	RequestedBy string
	RequestedAt string
	ApprovedAt  string
	RejectedAt  string
	CompletedAt string
	RelatedDocs string
	Notes       string
}

// FeatureDocument represents a parsed feature markdown document.
type FeatureDocument struct {
	Filename       string `json:"filename"`
	FeatureID      string `json:"featureId"`
	FeatureName    string `json:"featureName"`
	Status         string `json:"status"`
	Implementation string `json:"implementation"`
	Content        string `json:"content"`
}

// GovernanceInfo holds governance document metadata.
type GovernanceInfo struct {
	Version string `json:"version"`
	Content string `json:"content"`
}

// Config holds application configuration.
type Config struct {
	Port     int
	DocsPath string
	DBPath   string
	LogLevel string
}
