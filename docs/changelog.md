
# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.5.0] - 2024-12-19

### Features
- **Global Sorting**: Added a sort icon to the top bar to sort note lists (Parents, Children, Siblings, Related, Favorites) by Title, Created, or Modified date (ascending/descending).
- **Status Bar Info**: Added Created and Modified timestamps for the active note to the status bar.

### Fixed
- **Search Navigation Bugs**: Resolved a series of complex bugs related to navigating from the search bar. The application now correctly handles focus, state updates, and event propagation, ensuring that all functionality (hotkeys, content previews) works reliably after a search.
- **Editor Focus**: Fixed a bug where the editor would not correctly receive focus after being opened.

---

## [0.4.0] - 2024-12-17

### Features
- **Settings Overhaul**: The Settings modal has been completely redesigned with a tabbed interface (General, Theme, Database), an advanced theme editor, home note search, and direct vault management controls.
- **Navigation History**: Added browser-style Back (`<`) and Forward (`>`) navigation with `Alt+Left`/`Alt+Right` hotkeys.
- **"All Notes" Modal**: A new modal to view all notes in the vault, with options to sort by creation or modification date.

### Improved
- **Search Relevance**: Implemented a scoring system to rank search results, ensuring the most probable notes appear at the top. The scoring is based on a set of heuristics like matching the start of a title, whole word matches, match position, and title length.
- **Linking Workflow**: You can now create compound note titles directly from the linker modal. Typing `, Stores` when linking from a note titled "Sport" will automatically create a new note titled "Sport Stores".
- **Visuals:** Restored the accent color to top bar icons. Icons now consistently use the user-defined theme accent color (default blue), with inactive toggles fading to gray.
- **Status Bar:** 
    - Increased font size for better readability.
    - Updated layout to `Notes: XXX | <vaultname> | <version>` for clarity.
    - The version number is now a clickable link pointing to the GitHub releases page.

### Changed
- **UI**: The vault name in the status bar is now underlined to make it clearer that it is a clickable button that opens the vault switcher.
- **Calendar UI**: Refined the visual design of the calendar dropdown for a cleaner look and better legibility. The calendar week now starts on Monday.

### Fixed
- **Focus Management**: The application now reliably maintains focus on a note. Focus is correctly returned to the active note after closing the search bar, and clicking on the empty canvas background no longer results in a lost focus state.
- **Editor Sync**: Fixed a bug where the content preview on the main canvas would not always update immediately after saving changes in the editor.
- **Autocomplete & Search Scrolling**: The autocomplete list for internal links (`[[...]]`) and the main search results now correctly scroll to keep the selected item in view when navigating with arrow keys.
- **Unlink Logic**: The "Unlink" button in the top bar now correctly enables when a *single* note is focused in a relational section (Parents, Children, or Related).
- **Calendar Visibility**: Fixed issues where calendar indicators for dates with notes were too faint or invisible.
- **Build & Dependencies**: Resolved various issues related to the split-file build process, ensuring the application runs correctly as a multi-file deployment.

### Refactor (Major Architectural Changes)
- **Modular Architecture**: The application has been refactored from a single monolithic file into a modular structure with dedicated components, services, and hooks. This includes:
    - **Component Extraction**: `TopBar`, `StatusBar`, `NoteSection`, and other UI elements are now separate components.
    - **Service Layer**: Logic for the database (`db.js`), journaling (`journal.js`), and Markdown rendering (`markdown.js`) has been centralized.
    - **Build Process**: The architecture now supports both a multi-file structure for development and a single-file build for distribution.
- **Vault Management**:
    - Vault switching has been moved from the main menu to a more accessible popup, triggered by clicking the vault name in the status bar.
    - The new popup includes a "Manage Vaults" option that opens the Settings modal directly to the database tab and focuses the "New Vault" input field.
- **Top Bar UI**:
    - The main hamburger menu has been removed.
    - All primary actions are now directly accessible as icons on the right side of the top bar.
    - The search bar now dynamically expands to fill the remaining space in the top bar.
- **Note List Layout**: The "Parents" and "Children" note lists now use a more dynamic grid layout. Columns are wider when there are fewer notes, making better use of space and improving title readability.

---

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