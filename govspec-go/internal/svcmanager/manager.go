package svcmanager

import (
	"fmt"
	"os"
	"path/filepath"
)

const ServiceName = "govspec"
const ServiceDisplayName = "GovSpec Service"
const ServiceDescription = "GovSpec governance-driven development framework service"

// ExePath returns the absolute path to the current executable.
func ExePath() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Abs(exe)
}

// platformManager is set by platform-specific init() functions.
var platformManager PlatformManager

// PlatformManager defines the interface for OS-specific service management.
type PlatformManager interface {
	Install() error
	Uninstall() error
	Start() error
	Stop() error
}

func Install() error {
	if platformManager == nil {
		return fmt.Errorf("service management not supported on this platform")
	}
	return platformManager.Install()
}

func Uninstall() error {
	if platformManager == nil {
		return fmt.Errorf("service management not supported on this platform")
	}
	return platformManager.Uninstall()
}

func Start() error {
	if platformManager == nil {
		return fmt.Errorf("service management not supported on this platform")
	}
	return platformManager.Start()
}

func Stop() error {
	if platformManager == nil {
		return fmt.Errorf("service management not supported on this platform")
	}
	return platformManager.Stop()
}
