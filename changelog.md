# Changelog

All notable changes to the JaRoet PKM project will be documented in this file.

## [0.2.20] - 2024-05-23

### Added
- **Dynamic Journal Subtitles:** The "Active Note" card now intelligently detects if a note title is a Journal entry (format `YYYY-MM-DD` or `YYYY-MM`). If matched, it dynamically calculates and displays the day of the week (e.g., "Monday") or the month name (e.g., "October") below the title. This is calculated on the fly without modifying the database.

## [0.2.19] - 2024-05-23

### Changed
- **Journal Date Format:** Updated standard journal note naming convention to `YYYY-MM-DD`, `YYYY-MM`, and `YYYY` (removing day/month names and "Journal" prefix). This aligns better with other PKM tools and sorting standards.
- **Optimization:** Refactored the journal service to use the high-speed indexed database lookup function (`findNoteByTitle`) from the main DB service, significantly improving performance when navigating dates in large vaults.
- **Converter Tool:** Updated the standalone Obsidian converter to output journal entries using the new ISO date format hierarchy.

## [0.2.18] - 2024-05-23

### Added
- **Internal WikiLinks:** Added support for internal linking using `[[Note Title]]` or `[[Note Title|Alias]]` syntax.
- **Smart Navigation:** Clicking an internal link now instantly navigates to that note. If the Markdown Editor is open, it refreshes to show the new note's content; otherwise, it refocuses the canvas.
- **Performance Optimization:** Internal link lookups use the database index, ensuring instant navigation even with thousands of notes, without slowing down the initial page render.

## [0.2.17] - 2024-05-23

### Changed
- **Markdown Styling:** Unified the CSS styling for the Content Preview on the canvas and the Markdown Editor. Both now share a "compact" list style that reduces vertical spacing for lists and tasks, ensuring visual consistency.
- **Task Checkboxes:** The Content Preview now renders checkboxes with better alignment and spacing, matching the editor's look (though they remain read-only on the canvas).

## [0.2.16] - 2024-05-23

### Changed
- **Linking Workflow (Single Note):** When no notes are selected, using link hotkeys (`Ctrl+Arrows`) or clicking the top bar link buttons now opens the Linker Modal for the **currently focused note** instead of the central active note. This allows you to add relationships to any note without having to navigate to it first.
- **Top Bar Buttons:** The Link buttons (Parent/Child/Related) are now always enabled. Clicking them on a focused note (without a selection) triggers the "Add Link" modal for that specific note.
- **Selection Logic Preserved:** When multiple notes are selected, the linking tools continue to function as "Move/Relink" tools relative to the Central Note, preserving existing bulk editing workflows.

## [0.2.15] - 2024-05-23

### Added
- **Column Navigation:** Added support for column-to-column keyboard navigation within list sections (Children, Parents, Siblings, Related). 
  - Using `Left` and `Right` arrow keys inside a multi-column list will now jump horizontally between columns before moving to the adjacent section.

## [0.2.14] - 2024-05-23

### Fixed
- **Markdown Editor Lists:** Fixed the display of lists inside the Markdown Editor preview. They are now more compact and styled correctly.
- **Task Checkboxes:** Fixed an issue where clicking task checkboxes `[ ]` in the Editor View Mode would not toggle them. They are now fully interactive.
- **Editor Spacing:** Added a small margin to checkboxes for better readability.

## [0.2.13] - 2024-05-23

### Fixed
- **Markdown Editor Flicker:** Fixed a bug where switching from Edit to View mode (Shift+Enter) would momentarily flicker back to Edit mode if the editor was opened in Edit mode. This was caused by the editor state resetting when the note saved.
- **Editor Focus:** When entering Edit mode, the cursor is now automatically placed at the end of the text and the view scrolled to the bottom.
- **Event Bubbling:** Added event propagation stopping to the editor to prevent key presses from triggering background app navigation.

## [0.2.12] - 2024-05-23

### Fixed
- **Hotkey Conflict:** Fixed a bug where `Shift+Enter` (Edit Note) was being intercepted by `Enter` (Center Focus). The editor can now be opened correctly with the hotkey in all environments.
- **Version:** Bumped version number to 0.2.12.

## [0.2.11] - 2024-05-23

### Changed
- **Hotkeys Swapped:**
    - **Space Bar:** Now navigates into the focused note (makes it the Active Center Note). Previously this was `Enter`.
    - **Enter:** Now refocuses the cursor onto the Active Center Note. Previously this was `Space`.
- **UI Update:** Status bar hints updated to reflect new key bindings.
- **Documentation:** Updated `documentation.md` with new keyboard shortcuts.
- **Version:** Bumped version number to 0.2.11.

## [0.2.10] - 2024-05-23

### Added
- **README:** Added `README.md` for project overview and quick start guide.

### Changed
- **Version:** Bumped version number to 0.2.10.

## [0.2.9] - 2024-05-23

### Added
- **Documentation:** Added a comprehensive `documentation.md` file detailing app context, interface layout, icons, hotkeys, and features.

### Changed
- **Version:** Bumped version number to 0.2.9.

## [0.2.8] - 2024-05-23

### Changed
- **Markdown Editor Hotkeys:** 
    - Changed "Toggle Edit/Preview" from `Ctrl+E` to `Ctrl+Enter`.
    - Changed "Save & Close" from `Ctrl+Enter` to `Ctrl+Shift+Enter`.
- **Version:** Bumped version number to 0.2.8.

## [0.2.7] - 2024-05-23

### Changed
- **Bundling:** Re-generated standalone build with full functionality.

## [0.2.6] - 2024-05-23

### Changed
- **Journal Note Creation:** Creating a new journal day note (e.g. via Ctrl+J) now creates it as an empty note instead of pre-filling it with the "Morning Manifest/Log/Reflection" template.
- **Version:** Bumped version number to 0.2.6.

## [0.2.5] - 2024-05-23

### Changed
- **Export Data:** The exported JSON file now includes the vault name and a readable date/time (YYYY-MM-DD_HH-mm) in the filename for better organization.
- **Version:** Bumped version number to 0.2.5.

## [0.2.4] - 2024-05-23

### Changed
- **UI Adjustment:** Increased the minimum font size for section labels from 8px to 10px to improve legibility.
- **Version:** Bumped version number to 0.2.4.

## [0.2.3] - 2024-05-23

### Changed
- **Bug Fix:** Fixed an issue where deleting multiple selected notes would fail silently or only delete the focused note. This was resolved by using a `useRef` to track selection state, ensuring event handlers always access the most up-to-date selection list.
- **Selection Workflow:** The 'x' key now automatically advances focus to the next note in the list after toggling selection, allowing for rapid sequential multi-selection.

## [0.2.2] - 2024-05-23

### Added
- **UI Customization:** Added new "General" settings to toggle the visibility of the "Favorites" and "Content" sections.
- **Dynamic Layout:** When "Favorites" or "Content" are hidden, the adjacent sections ("Related" and "Siblings" respectively) now automatically expand vertically to fill the available space.
- **Navigation Update:** Keyboard navigation logic updated to respect hidden sections, preventing focus on invisible elements and redirecting flow to visible sections.

## [0.2.1] - 2024-05-23

### Changed
- **UI Update:** Updated the "Favorites List" icon (dropdown) to display three smaller stars instead of a single star, distinguishing them from the "Toggle Favorite" action.
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