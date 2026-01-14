# Interface Guide

The main view is divided into three columns, representing the "Topology" (surroundings) of the currently active note.

## 1. Left Column
*   **Related (Top)**: Notes that have a lateral (side-by-side) relationship with the active note. Useful for "See Also" connections or linking sequential days (Yesterday/Today).
*   **Favorites (Bottom)**: A list of your pinned notes for quick access. *This section can be hidden in Settings.*

## 2. Center Column
*   **Parents (Top)**: Notes that link *down* to the active note. (e.g., "Fruits" is a parent of "Apple").
*   **Active Note (Center)**: The note you are currently focused on.
    *   *Dynamic Subtitle*: If the note is a Journal entry (ISO Date), the day of the week or month name is displayed automatically below the title.
*   **Children (Bottom)**: Notes that the active note links *down* to. (e.g., "Apple" is a child of "Fruits").

## 3. Right Column
*   **Context Pane (Top)**: This area provides contextual information about the active note through a set of tabs.
    *   **Siblings Tab**: Shows notes that share the same parents as the active note. (e.g., "Banana" is a sibling of "Apple" if both are children of "Fruits").
    *   **Mentions Tab**: Shows all notes that link *to* the active note (also known as backlinks).
*   **Content (Bottom)**: A preview of the active note's content. *This section can be hidden in Settings.*

---

## Top Bar Interface

The top bar provides quick access to navigation, note actions, and application tools.

### Navigation (Left)
| Icon | Action | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **< / >** | **Back / Forward** | `Alt + ←` / `→` | Navigate through your history. |
| **🏠** | **Home** | | Jump to your configured Home note. |
| **📅** | **Journal** | `Ctrl + J` | Jump to today's note. Creates date hierarchy automatically. |
| **⭐ (List)** | **Favorites** | | Dropdown list of pinned notes. |
| **☰ (List)** | **All Notes** | | Open a modal to browse/filter all notes in the vault. |
| **🔀** | **Random** | `Ctrl + Alt + R` | Jump to a random note. |
| **Sort** | **Sort Order** | | Change sorting (Title, Created, Modified). |

### Active Note Actions (Center)
| Icon | Action | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **⭐** | **Favorite** | | Toggle favorite status for the focused note. |
| **📝** | **Edit** | `Ctrl + Enter` | Open the Markdown Editor. |
| **I** | **Rename** | `F2` | Rename the focused note. |
| **🗑️** | **Delete** | `Ctrl + Backspace` | Delete focused note(s). |

### Linking Tools (Right)
| Icon | Action | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **🔗⃠** | **Unlink** | `Backspace` | Remove link between focused note and center note. |
| **←** | **Link Related** | `Ctrl + ←` | Link as Related (Side-by-side). |
| **↑** | **Link Parent** | `Ctrl + ↑` | Link as Parent (Up). |
| **↓** | **Link Child** | `Ctrl + ↓` | Link as Child (Down). |

### App Tools (Far Right)
| Icon | Action | Description |
| :--- | :--- | :--- |
| **/☀️** | **Theme** | Toggle Light/Dark mode or select a specific theme. |
| **⚙️** | **Settings** | Configure font size, visibility, and database options. |
| **⬇️** | **Export** | Download vault as JSON. |
| **⬆️** | **Import** | Import notes from JSON. |

---

## Status Bar
Located at the bottom of the screen.
*   **Notes**: Total number of notes in the current vault.
*   **Vault Name**: Click to switch vaults. *Red text indicates CDN Fallback Mode (offline files missing).*
*   **Persistence**: A checkmark (✓) indicates data is protected from browser eviction. A cross (✕) means storage is temporary.
*   **Version**: Click to view release notes on GitHub.
*   **Hints**: Quick reminders for common keyboard shortcuts.