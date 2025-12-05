# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.2.0] - 2024-05-23

### Release Notes
Initial public beta release. Consolidated all rapid iteration patches (0.1.1 - 0.1.5) into this milestone. This version establishes the core topology features, external link handling, UI refinements, and distribution pipeline.

### Added
- **External Link Icons:** Links in markdown now show an "open in new tab" icon.
- **Changelog:** Project update tracking.
- **Distribution:** Standalone `dist/index.html` tracking via `.gitignore` updates.
- **Status Bar:** Added version number display.

### Changed
- **UI Polishing:** Adjusted section label positioning (finalized at 5px offset) for optimal aesthetics and nesting.
- **Branding:** Renamed application to "JaRoet PKM".
- **Link Behavior:** External links now securely open in new tabs (`_blank`).
- **Data Safety:** Enhanced git tracking rules for distribution builds.
