# JaRoet PKM Documentation

**JaRoet PKM** is a local-first, keyboard-centric personal knowledge management system designed for speed and fluidity. Unlike traditional note-taking apps that use folders, JaRoet uses a **Topological** approach. Notes are organized by their relationships to one another (Parents, Children, Siblings, Related), allowing you to traverse your knowledge graph naturally.

## Interface Overview

The main view is divided into three columns, representing the "Topology" (surroundings) of the currently active note.

### 1. Left Column
*   **Related (Top)**: Notes that have a lateral (side-by-side) relationship with the active note. Useful for "See Also" connections or linking sequential days (Yesterday/Today).
*   **Favorites (Bottom)**: A list of your pinned notes for quick access. This section can be hidden in Settings.

### 2. Center Column
*   **Parents (Top)**: Notes that link *down* to the active note. (e.g., "Fruits" is a parent of "Apple").
*   **Active Note (Center)**: The note you are currently focused on.
*   **Children (Bottom)**: Notes that the active note links *down* to. (e.g., "Apple" is a child of "Fruits").

### 3. Right Column
*   **Siblings (Top)**: Notes that share the same parents as the active note. (e.g., "Banana" is a sibling of "Apple" if both are children of "Fruits").
*   **Content (Bottom)**: A preview of the active note's content. This section can be hidden in Settings.

---

## Top Bar Icons (Left to Right)

| Icon | Name | Function |
| :--- | :--- | :--- |
| **☰** | **Menu** | Open the main menu to access **Settings**, **Themes**, **Vault Switching**, and **Import/Export**. |
| **🏠** | **Home** | Navigate instantly to your designated Home note. |
| **📅** | **Journal** | Jump to today's daily note. Creates the `Year > Month > Day` hierarchy automatically. |
| **⭐ (List)** | **Favorites List** | A dropdown menu showing all your favorite notes. |
| **⭐** | **Toggle Favorite** | Pin/Unpin the current note to your Favorites list. |
| **👁️ / 📝** | **View/Edit** | Open the Markdown Editor for the active note (`Shift + Enter`). |
| **F2** | **Rename** | Rename the active note (`F2`). |
| **🗑️** | **Delete** | Delete the active note or all selected notes (`Ctrl + Backspace`). |
| **🔗⃠** | **Unlink** | Break the connection between the selected note(s) and the active note (`Backspace`). |
| **←** | **Link Related** | Link selected note(s) as **Related** (Lateral connection) (`Ctrl + Left`). |
| **↑** | **Link Parent** | Link selected note(s) as **Parents** (Hierarchical connection) (`Ctrl + Up`). |
| **↓** | **Link Child** | Link selected note(s) as **Children** (Hierarchical connection) (`Ctrl + Down`). |
| **Search** | **Search Bar** | Type to search for notes (`/`). |

---

## Status Bar
Located at the bottom of the screen.
*   **Notes**: Total number of notes in the current vault.
*   **DB**: Name of the current vault and App Version.
*   **Hints**: Quick reminders for common keyboard shortcuts.

---

## Keyboard Shortcuts

JaRoet PKM is designed to be used primarily with the keyboard.

### Navigation
*   **Arrow Keys**: Move focus between notes and sections.
*   **Enter**: Recenter the focus on the currently **Active Center Note**.
*   **Space**: Navigate into the currently focused note (Make it the new **Active Center Note**).
*   **/**: Focus the Search bar.
*   **Esc**: Close modals, search, or clear selection.

### Selection
*   **x**: Toggle selection of the focused note and automatically move to the next one (useful for rapid multi-selection).
*   **Shift + Up/Down**: Select a range of notes in a list.

### Linking & Organizing
*   **Ctrl + Up**: Link selected/focused note as a **Parent**.
*   **Ctrl + Down**: Link selected/focused note as a **Child**.
*   **Ctrl + Left**: Link selected/focused note as **Related**.
*   **Backspace**: **Unlink** the selected/focused note from the current center note.
*   **Ctrl + Backspace**: **Delete** the selected/focused note(s) permanently.

### Editing
*   **Shift + Enter**: Open the Markdown Editor.
*   **F2**: Rename the focused note.
*   **Ctrl + J**: Go to Today's Journal.

### In the Markdown Editor
*   **Ctrl + Enter**: Toggle between **Edit Mode** and **Preview Mode**.
*   **Ctrl + Shift + Enter**: **Save** changes and **Close** the editor.
*   **Esc**: Close without saving (unless saved via hotkey).

---

## Journaling Function
Press `Ctrl + J` or click the Calendar icon to enter Journal Mode.

1.  **Hierarchy**: Automatically creates/navigates to: `Journal Hub` → `Year` → `Month` → `Day`.
2.  **Previous Day**: Automatically links "Today" to "Yesterday" as a **Related** note.
3.  **On This Day**: Automatically links "Today" to the same date in previous years (up to 5 years back) as **Related** notes.
4.  **Empty Canvas**: New daily notes start empty, ready for your thoughts.

---

## Markdown Support
The editor supports Github Flavored Markdown (GFM).

*   **Headers**: `# Title`, `## Section`
*   **Emphasis**: `**Bold**`, `*Italic*`, `~~Strikethrough~~`
*   **Lists**: `- Bullet point`, `1. Numbered list`
*   **Links**: `[Link Text](https://example.com)`. External links open in a new tab with a specific icon.
*   **Code**: \`Inline Code\` or code blocks.

---

## Settings
Accessible via the Main Menu (☰).

*   **General**:
    *   **Font Size**: Adjust the interface text size.
    *   **Visibility**: Toggle "Favorites" and "Content" sections on/off to maximize screen space.
*   **Theme**: Customize colors for Backgrounds, Sections, Bars, and Accents for both Light and Dark modes.
*   **Database**:
    *   **Vaults**: Create new vaults or switch between existing ones.
    *   **Management**: Reset (clear data) or Delete vaults.
    *   **Export/Import**: Backup your data to JSON or restore from a backup.