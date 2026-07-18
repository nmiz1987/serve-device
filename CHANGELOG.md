# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024

### Added
- Initial release of Serve Android
- Real-time Android device screen streaming via WebSocket
- Remote device control (tap, swipe, type, key events)
- Web-based UI for device control and streaming
- REST API for AI agents and automation
- FPS control with per-device configuration (1-60 FPS)
- Device auto-discovery via ADB
- Support for multiple concurrent device connections
- Screenshot capture endpoint
- Quality level settings (low, medium, high)
- Claude AI Skill SDK for device automation

### Fixed
- FPS setting now properly applied to frame capture
- Frame capture uses chained async operations to respect target FPS

[0.1.0]: https://github.com/your-username/serve-android/releases/tag/v0.1.0
