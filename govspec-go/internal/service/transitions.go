package service

// ValidTransitions defines the allowed status transitions per GovSpec governance rules.
var ValidTransitions = map[string][]string{
	"draft":     {"pending", "rejected"},
	"pending":   {"approved", "rejected", "draft"},
	"approved":  {"completed", "rejected"},
	"rejected":  {"draft"},
	"completed": {},
}

// GetValidTransitions returns the list of valid next statuses for a given current status.
func GetValidTransitions(currentStatus string) []string {
	return ValidTransitions[currentStatus]
}

// IsValidTransition checks if a status transition is allowed.
func IsValidTransition(from, to string) bool {
	valid, ok := ValidTransitions[from]
	if !ok {
		return false
	}
	for _, v := range valid {
		if v == to {
			return true
		}
	}
	return false
}
