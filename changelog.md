# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.3.0] - 2024-05-23

### Features
- **Chronological Journaling:** Introduced a robust journaling engine (`Ctrl+J`) that creates a time-based hierarchy (`Journal Hub -> Year -> Month -> Day`). Includes automated "Today" navigation and "On This Day" linking to previous years.
- **Internal WikiLinks:** Added support for `[[Note Title]]` syntax in the editor. Includes an intelligent autocomplete popup and instant navigation when clicking links in both Edit and View modes.
- **Import/Export:** 
    - Added JSON export and import capabilities.
    - **Merge Import:** Smartly merges imported notes into existing vaults, handling name collisions by renaming (`Note (1)`) and linking them to an audit parent.
    - **Obsidian Converter:** Included a standalone HTML tool to convert Obsidian vaults into a JaRoet-compatible JSON import file.
- **UI Customization:** Added "General" settings to toggle the visibility of the "Favorites" and "Content" sections. The layout dynamically expands adjacent sections to fill the space.

### Improvements
- **Navigation:**
    - **Column Jumping:** Arrow keys (`Left`/`Right`) now navigate between columns within list sections before jumping to the next section.
    - **Scroll Persistence:** List positions are remembered when navigating between sections (reset on central note change).
    - **Hotkeys:** Swapped `Space` (Navigate Into) and `Enter` (Refocus Center) for more intuitive browsing.
- **Linking Workflow:** 
    - The Linker tools (`Ctrl+Arrow`) now default to linking the **currently focused note**, allowing rapid graph construction without changing the central view.
    - Added a "Bulk Create" option in the linker modal using semicolons (e.g., `Apple; Banana; Orange`).
- **Journaling:** 
    - Standardized journal titles to ISO format (`YYYY-MM-DD`).
    - Added **Dynamic Subtitles** to the center card to display day names (e.g., "Monday") and month names below the ISO date.
- **Markdown Styling:** Unified "Compact" list styling across the Editor and Canvas Preview. Added external link icons.

### Fixes
- **Editor:** Fixed issues with focus flickering, task checkbox interactivity, and state management when switching modes.
- **Data:** Fixed a bug where deleting multiple selected notes would fail silently.
- **Performance:** Optimized internal link lookups and journal navigation to use IndexedDB indices.

## [0.1.9] - 2024-05-23

### Changed
- **UI Adjustment:** Reduced section label font size further to `fontSize - 10` (minimum 8px) for an even subtler appearance.
- **UI Adjustment:** Simplified status bar format to show version number directly after DB name without "Version:" prefix or extra separators.
- **Version:** Bumped version number to 0.1.9.

## [0.1.8] - 2024-05-23

### Changed
- **UI Adjustment:** Drastically reduced section label font size (`fontSize - 6`) to minimize visual dominance, as per user feedback.
- **Version:** Bumped version number to 0.1.8.

## [0.1.7] - 2024-05-23

### Changed
- **UI Adjustment:** Section labels now use Title Case instead of Uppercase.
- **UI Adjustment:** Section label font size is now dynamic (set to 2px smaller than the base note font size) rather than fixed.
- **Version:** Bumped version number to 0.1.7.

## [0.1.6] - 2024-05-23

### Changed
- **UI Adjustment:** Reduced section label font size to 10px to reduce visual noise.
- **Version:** Bumped version number to 0.1.6.

## [0.1.5] - 2024-05-23

### Changed
- **UI Adjustment:** Raised section labels to sit 5px above the section border for better visibility.
- **Version:** Bumped version number to 0.1.5.

## [0.1.4] - 2024-05-23

### Changed
- **UI Adjustment:** Lowered the section labels ("Related", "Parents", "Active Note", etc.) so they sit lower on the border line (offset -2px from top), creating a cleaner nested appearance.
- **Version:** Bumped version number to 0.1.4.

## [0.1.3] - 2024-05-23

### Changed
- **Git Tracking:** Added `.gitignore` configuration to ensure the standalone `dist/index.html` file is properly tracked in version control.
- **Version:** Bumped version number to 0.1.3.

## [0.1.2] - 2024-05-23

### Added
- **External Link Icons:** Links in the markdown editor and content preview that point to external websites now display a small "open in new tab" icon. This helps distinguish them from internal note links.
- **Changelog:** Started tracking project updates in this file.

## [0.1.1] - 2024-05-23

### Changed
- **App Title:** Renamed the application header and browser tab title from "NexusNode PKM" to "JaRoet PKM".
- **Status Bar:** Added version number display to the status bar.
- **Link Behavior:** Configured external links to open in a new browser tab by default.