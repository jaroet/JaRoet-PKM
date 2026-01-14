# Core Features

This page details some of the key features that make JaRoet PKM a powerful tool for thought.

## Topological Linking
Instead of folders, notes are organized by their relationships. This allows you to build a web of knowledge that reflects how you think. The main interface is built around this concept, showing you the local "topology" of any given note.

## Journaling
Press `Ctrl + J` or click the Calendar icon to enter Journal Mode. This feature is designed for daily notes and reflections.

1.  **Automatic Hierarchy**: The app automatically creates or navigates to a date-based structure: `Journal Hub` → `YYYY` → `YYYY-MM` → `YYYY-MM-DD`. This uses the ISO 8601 Date format for easy, predictable sorting.
2.  **Previous Day Linking**: "Today's" note is automatically linked to "Yesterday's" as a **Related** note, making it easy to review sequential entries.
3.  **"On This Day" Linking**: "Today's" note is also automatically linked to the same date in previous years (up to 5 years back), providing a quick way to see historical context.

## Mentions (Backlinks)
The **Mentions** tab in the top-right pane shows all notes that link *to* the currently active note. This is a powerful way to discover connections and see how your ideas relate to each other, even if you didn't explicitly link them from the current note.

## Markdown & WikiLinks
The editor supports Github Flavored Markdown (GFM) and adds special syntax for linking notes and attachments.

*   **Internal Note Linking**: Type `[[` to open an autocomplete menu of your existing notes.
    *   Syntax: `[[Note Title]]` or `[[Note Title|Custom Display Text]]`.
    *   *Navigation*: Clicking an internal link in the Editor or Preview instantly jumps to that note.
*   **Attachment Linking**: Link to external files on your local machine using aliases.
    *   Syntax: `[[alias:filename.ext]]`
    *   This creates a link to `file:///path/to/your/folder/filename.ext`.
    *   Aliases are configured in the **Settings > Attachments** tab.
*   **Standard Markdown**:
    *   **Headers**: `# Title`, `## Section`
    *   **Emphasis**: `**Bold**`, `*Italic*`, `~~Strikethrough~~`
    *   **Lists**: `- Bullet point`, `1. Numbered list`, `[ ] Task`
    *   **External Links**: `Link Text`.