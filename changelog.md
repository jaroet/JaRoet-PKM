
# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.3.14] - 2024-05-24

### Fixed
- **Search Dropdown Navigation:** Fixed an issue where the search result list would not scroll to follow the selected item when navigating with the Up/Down arrow keys.

## [0.3.13] - 2024-05-24

### Improved
- **Visuals:** Restored the accent color to top bar icons. Icons now consistently use the user-defined theme accent color (default blue), with inactive toggles fading to gray.
- **Status Bar:** 
    - Increased font size for better readability.
    - Updated layout to `Notes: XXX | <vaultname> | <version>`.
    - The version number is now a clickable link pointing to the GitHub releases page.

## [0.3.12] - 2024-05-24

### Refactor
- **Component Extraction:** Extracted `TopBar` and `StatusBar` from `App.js` into their own component files for better modularity and maintainability.
- **CSS Extraction:** Moved all application styles from `index.html` into a dedicated `dist/css/style.css` file.
- **UI Polish:** 
    - Updated `TopBar` and `StatusBar` to use the theme's bar color variable (`--theme-bars`) consistently.
    - Added subtle borders (`border-b` for TopBar, `border-t` for StatusBar) to create better visual separation from the canvas.
    - Improved vertical alignment of icons and text in the top navigation.

## [0.3.11] - 2024-05-24

### Refactor (Major)
- **Modular Architecture:** The monolithic `App.js` in the distribution build has been split into smaller, maintainable modules to improve code organization and readability.
    - **`js/components/NoteSection.js`**: Handles the rendering of note lists.
    - **`js/hooks/useHistory.js`**: Reusable hook for navigation history management.
    - **`js/globals.js`**: Centralized namespace management.
    - **`index.html`**: Updated to load these modules in the correct dependency order.

### Features
- **Settings Overhaul:** The Settings modal has been completely redesigned to match the full feature set of the development version.
    - **Tabbed Interface**: Organized into General, Theme, and Database tabs.
    - **Advanced Theme Editor**: Fine-grained control over colors (Background, Section, Bars, Accent) for both Light and Dark modes.
    - **Home Note Search**: Added a search bar to easily find and set your specific Home note.
    - **Vault Management**: New UI controls to create new vaults and reset or delete the current one directly from settings.

### Fixed
- **Unlink Logic:** The "Unlink" button in the top bar now correctly enables when a *single* note is focused in a relational section (Parents, Children, or Related). Previously, it only activated when multiple notes were explicitly selected via `x`.

## [0.3.9] - 2024-05-23

### Fixed
- **Release Build:** Fixed a critical syntax error in the `index.html` distribution file caused by incorrect merging of the React application logic.
- **Dependencies:** Clarified the split between the UI layer (React) and the Logic layer (`jaroet-lib.js`). The App now correctly imports all database and utility functions from the global `window.JaroetLib` namespace.

## [0.3.8] - 2024-05-23

### Refactor
- **Versioning Strategy:** Decoupled the version number from the main application view (`App.tsx`). The version is now defined in the core library/service. This allows future updates to bump the version number without requiring changes to the UI layer, simplifying the release process for the split-file architecture.
- **Split-File Support:** Optimized the application to run seamlessly as a 2-file deployment (`index.html` + `jaroet-lib.js`), bypassing single-file generation limits.

## [0.3.7] - 2024-05-23

### Refactor
- **Library Architecture:** Refactored the monolithic `index.html` into a split architecture. 
    - **`jaroet-lib.js`**: Contains all heavy logic (Database, Markdown, Journaling).
    - **`index.html`**: Contains the React UI and references the external library.
    - Added a **Web-based Builder** (`builder.html`) to merge these two files back into a standalone single-file app if desired.

## [0.3.6] - 2024-05-23

### Refactor
- **Codebase Clean-up**: Centralized logic for Markdown rendering and Date handling into shared services. This eliminates code duplication between the main view and the editor, ensuring consistent link styling and behavior.
- **Standalone Build**: Updated the monolithic release build to include the new shared architecture.

## [0.3.5] - 2024-05-23

### Features
- **Navigation History:** Added browser-style Back and Forward navigation to the app.
    - **History Stack:** The app now remembers your navigation path (up to 50 items).
    - **UI Buttons:** Added Back (`<`) and Forward (`>`) buttons to the top bar, which enable/disable based on history availability.
    - **Hotkeys:** 
        - `Alt + Left`: Navigate Back.
        - `Alt + Right`: Navigate Forward.

## [0.3.4] - 2024-05-23

### Fixed
- **Calendar Visibility:** Fixed an issue where the calendar indicators for future dates or non-today entries were too faint or invisible. The indicator line is now a solid accent color for all dates that contain a note, regardless of whether it is "Today" or not.

## [0.3.3] - 2024-05-23

### Changed
- **Calendar UI:** Refined the visual design of the calendar dropdown. 
    - Today's date is now highlighted with **accent-colored text** (instead of a background pill) for a cleaner look.
    - The "has note" indicator is now a distinct line at the bottom of the cell, separated from the number to improve legibility.
    - Increased day cell size for better touch targets and spacing.
- **Version:** Bumped version number to 0.3.3.

## [0.3.2] - 2024-05-23

### Fixed
- **Calendar:** Fixed an issue where days with existing entries were not being underlined in the calendar dropdown. This was due to an over-optimized database query. Reverted to a robust `toArray()` fetch to ensure data consistency.
- **UI Adjustment:** Increased the visibility of the calendar date indicators (made them larger and explicitly blue) to improve readability.

## [0.3.1] - 2024-05-23

### Changed
- **Calendar Logic:** Changed the calendar week start from Sunday to Monday for better alignment with international standards.
- **UI Adjustment:** Adjusted the positioning of the Calendar Dropdown to anchor to the left of the button, ensuring it expands into the screen rather than off the left edge.
- **Version:** Bumped version number to 0.3.1.

## [0.3.0] - 2024-05-23

### Features
- **Chronological Journaling:** Introduced a robust journaling engine (`Ctrl+J`) that creates a time-based hierarchy (`Journal Hub -> Year -> Month -> Day`). Includes automated "Today" navigation and "On This Day" linking to previous years.
- **Internal WikiLinks:** Added support for `[[Note Title]]` syntax in the editor. Includes an intelligent autocomplete popup and instant navigation when clicking links in both Edit and View modes.
- **Import/Export:** 
    - Added JSON export and import capabilities.
    - **Merge Import:** Smartly merges imported notes into existing vaults, handling name collisions by renaming (`Note (1)`) and linking to an audit parent.
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
