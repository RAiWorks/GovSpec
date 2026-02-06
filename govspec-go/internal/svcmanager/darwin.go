//go:build darwin

package svcmanager

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func init() {
	platformManager = &darwinManager{}
}

type darwinManager struct{}

func plistPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Library", "LaunchAgents", "com.govspec.service.plist")
}

func (m *darwinManager) Install() error {
	exePath, err := ExePath()
	if err != nil {
		return err
	}

	plist := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.govspec.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>%s</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/govspec.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/govspec.err</string>
</dict>
</plist>
`, exePath)

	path := plistPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	if err := os.WriteFile(path, []byte(plist), 0644); err != nil {
		return fmt.Errorf("write plist: %w", err)
	}

	fmt.Printf("Service installed at %s\n", path)
	fmt.Println("Run 'govspec start' to start the service.")
	return nil
}

func (m *darwinManager) Uninstall() error {
	path := plistPath()
	exec.Command("launchctl", "unload", path).Run()

	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove plist: %w", err)
	}

	fmt.Printf("Service '%s' uninstalled.\n", ServiceName)
	return nil
}

func (m *darwinManager) Start() error {
	cmd := exec.Command("launchctl", "load", plistPath())
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("launchctl load failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' started.\n", ServiceName)
	return nil
}

func (m *darwinManager) Stop() error {
	cmd := exec.Command("launchctl", "unload", plistPath())
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("launchctl unload failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' stopped.\n", ServiceName)
	return nil
}
