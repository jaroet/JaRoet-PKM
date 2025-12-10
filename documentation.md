# JaRoet PKM Documentation

**JaRoet PKM** is a local-first, keyboard-centric personal knowledge management system designed for speed and fluidity. Unlike traditional note-taking apps that use folders, JaRoet uses a **Topological** approach. Notes are organized by their relationships to one another (Parents, Children, Siblings, Related), allowing you to traverse your knowledge graph naturally.

## Interface Overview

The main view is divided into three columns, representing the "Topology" (surroundings) of the currently active note.

### 1. Left Column
*   **Related (Top)**: Notes that have a lateral (side-by-side) relationship with the active note. Useful for "See Also" connections or linking sequential days (Yesterday/Today).
*   **Favorites (Bottom)**: A list of your pinned notes for quick access. *This section can be hidden in Settings.*

### 2. Center Column
*   **Parents (Top)**: Notes that link *down* to the active note. (e.g., "Fruits" is a parent of "Apple").
*   **Active Note (Center)**: The note you are currently focused on.
    *   *Dynamic Subtitle*: If the note is a Journal entry (ISO Date), the day of the week or month name is displayed automatically below the title.
*   **Children (Bottom)**: Notes that the active note links *down* to. (e.g., "Apple" is a child of "Fruits").

### 3. Right Column
*   **Siblings (Top)**: Notes that share the same parents as the active note. (e.g., "Banana" is a sibling of "Apple" if both are children of "Fruits").
*   **Content (Bottom)**: A preview of the active note's content. *This section can be hidden in Settings.*

---

## Top Bar Icons (Left to Right)

| Icon | Name | Function |
| :--- | :--- | :--- |
| **☰** | **Menu** | Open the main menu to access **Settings**, **Themes**, **Vault Switching**, and **Import/Export**. |
| **🏠** | **Home** | Navigate instantly to your designated Home note. |
| **📅** | **Journal** | Jump to today's daily note. Creates the `YYYY > YYYY-MM > YYYY-MM-DD` hierarchy automatically. |
| **⭐ (List)** | **Favorites List** | A dropdown menu showing all your favorite notes. |
| **⭐** | **Toggle Favorite** | Pin/Unpin the current note to your Favorites list. |
| **👁️ / 📝** | **View/Edit** | Open the Markdown Editor for the active note (`Shift + Enter` or `Ctrl + Enter`). |
| **F2** | **Rename** | Rename the active note (`F2`). |
| **🗑️** | **Delete** | Delete the active note or all selected notes (`Ctrl + Backspace`). |
| **🔗⃠** | **Unlink** | Break the connection between the selected note(s) and the active note (`Backspace`). |
| **←** | **Link Related** | Link selected note(s) as **Related** (`Ctrl + Left`). |
| **↑** | **Link Parent** | Link selected note(s) as **Parents** (`Ctrl + Up`). |
| **↓** | **Link Child** | Link selected note(s) as **Children** (`Ctrl + Down`). |
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
    *   *Note*: In list views, Left/Right keys navigate columns first before jumping sections.
*   **Enter**: Recenter the focus on the currently **Active Center Note**.
*   **Space**: Navigate into the currently focused note (Make it the new **Active Center Note**).
*   **/**: Focus the Search bar.
*   **Esc**: Close modals, search, or clear selection.

### Selection
*   **x**: Toggle selection of the focused note and automatically move to the next one (useful for rapid multi-selection).
*   **Shift + Up/Down**: Select a range of notes in a list.

### Linking & Organizing
*The Linker functions work relative to the **Currently Focused Note**. If no note is specifically focused (halo effect), they apply to the Central Note.*

*   **Ctrl + Up**: Link to a **Parent**. (Opens Linker Modal).
*   **Ctrl + Down**: Link to a **Child**. (Opens Linker Modal).
*   **Ctrl + Left**: Link to a **Related** note. (Opens Linker Modal).
*   **Backspace**: **Unlink** the focused note from the central note.
*   **Ctrl + Backspace**: **Delete** the focused note(s) permanently.

*   **Bulk Creation**: In the Linker Modal, you can type multiple titles separated by semicolons (e.g., `Apple; Banana; Orange`) to create and link multiple notes at once.

### Editor Shortcuts
*   **Shift + Enter**: Open Editor in **Preview Mode**.
*   **Ctrl + Enter**: Open Editor in **Edit Mode**.

**Inside the Editor:**
*   **Shift + Enter**: 
    *   If in Edit Mode: **Save** changes and switch to Preview.
    *   If in Preview Mode: **Close** the editor.
*   **Ctrl + Enter**:
    *   If in Preview Mode: Switch to **Edit Mode**.
    *   If in Edit Mode: **Cancel/Close** (Be careful, use Shift+Enter to save first!).
*   **[[**: Type two open brackets to trigger the **Internal Link Autocomplete**.

---

## Journaling Function
Press `Ctrl + J` or click the Calendar icon to enter Journal Mode.

1.  **Hierarchy**: Automatically creates/navigates to: `Journal Hub` → `YYYY` → `YYYY-MM` → `YYYY-MM-DD`.
    *   *Standard*: Uses ISO 8601 Date formats for easy sorting.
2.  **Previous Day**: Automatically links "Today" to "Yesterday" as a **Related** note.
3.  **On This Day**: Automatically links "Today" to the same date in previous years (up to 5 years back) as **Related** notes.

---

## Markdown & WikiLinks
The editor supports Github Flavored Markdown (GFM) and WikiLinks.

*   **Internal Linking**: Type `[[` to open the autocomplete menu. Select a note to link it.
    *   Syntax: `[[Note Title]]` or `[[Note Title|Alias]]`.
    *   *Navigation*: Clicking an internal link in the Editor or Preview instantly jumps to that note.
*   **Headers**: `# Title`, `## Section`
*   **Emphasis**: `**Bold**`, `*Italic*`, `~~Strikethrough~~`
*   **Lists**: `- Bullet point`, `1. Numbered list`, `[ ] Task`
*   **External Links**: `[Link Text](https://example.com)`.

---

## Settings
Accessible via the Main Menu (☰).

*   **General**:
    *   **Font Size**: Adjust the interface text size.
    *   **Section Visibility**: Toggle "Favorites" and "Content" sections on/off. Hiding a section allows the adjacent section (Related/Siblings) to expand vertically.
    *   **Home Note**: Set or Search for your default Home note.
*   **Theme**: Customize colors for Backgrounds, Sections, Bars, and Accents for both Light and Dark modes.
*   **Database**:
    *   **Vaults**: Create new vaults or switch between existing ones.
    *   **Export**: Backup your data to JSON.
    *   **Import**: Import JSON data.
        *   **Merge**: Adds notes to current vault. Handles duplicates by renaming (`Note (1)`) and linking to an audit log.
        *   **Overwrite**: Wipes the current vault and replaces it with the imported data.

---

## Standalone Tools
The release includes `obsidian_to_jaroet.html`, a tool to convert an Obsidian Vault folder into a JSON file compatible with JaRoet's import. It preserves folder structures and converts journal entries to the JaRoet ISO format. This is not a 100% release ready so use with care (I have succesfully used it to convert my Obsidian Vault). I will make some improvements to it and release it in a future release. For now you can use it at your own risk!

