# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.2.2] - 2024-05-23

### Added
- **UI Customization:** Added new "General" settings to toggle the visibility of the "Favorites" and "Content" sections.
- **Dynamic Layout:** When "Favorites" or "Content" are hidden, the adjacent sections ("Related" and "Siblings" respectively) now automatically expand vertically to fill the available space.
- **Navigation Update:** Keyboard navigation logic updated to respect hidden sections, preventing focus on invisible elements and redirecting flow to visible sections.

## [0.2.1] - 2024-05-23

### Changed
- **UI Update:** Updated the "Favorites List" icon (dropdown) to display three smaller stars instead of a single star, distinguishing it from the "Toggle Favorite" action.
- **Version:** Bumped version number to 0.2.1.

## [0.2.0] - 2024-05-23

### Added
- **Chronological Journaling:** Introduced a new Journal Mode accessible via a calendar icon in the top bar or `Ctrl+J`.
  - Automatically creates a time-based hierarchy: `Journal Hub` -> `Journal YYYY` -> `YYYY-MM (Month)` -> `YYYY-MM-DD (Day)`.
  - Links "Today" to "Yesterday" laterally (Related) for easy traversing.
  - Links "Today" to "Same Day, Previous Years" laterally (Related) for "On This Day" functionality.
  - Injects a daily markdown template for new entries.

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