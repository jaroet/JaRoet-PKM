# Settings & Configuration

The Settings modal (accessible via the ⚙️ icon) allows you to customize the application's appearance, behavior, and data management.

## General
*   **Font Size**: Adjust the interface text size for all note lists. The central active note will be scaled relative to this size.
*   **Section Visibility**: Toggle the "Favorites" and "Content" sections on or off. Hiding a section allows the adjacent section (Related/Siblings) to expand and fill the vertical space.
*   **Home Note**: Set your default Home note. You can either set the currently active note as home or search for a specific note by title.

## Theme
This tab contains a full-featured theme editor with a live preview.
*   **Select Theme**: Choose from a list of default and custom-created themes.
*   **Create/Duplicate**: Use the `+` button to duplicate the currently selected theme as a starting point for a new one.
*   **Edit Colors**: Modify the color values for Backgrounds, Sections, Bars, and Accents. Changes are reflected in the live preview pane.
*   **Save**: Save your changes to the current theme. This will apply the theme to the entire application.

## Database
This tab provides tools for managing your data vaults.
*   **Current Vault**: Shows the name and underlying storage location of the active vault.
*   **New Vault**: Create a new, empty vault. The application will immediately switch to it.
*   **Danger Zone**:
    *   **Reset Current Vault**: Clears all data from the current vault, leaving it empty.
    *   **Delete Current Vault**: Permanently deletes the entire vault and all its data.

## Attachments
This tab allows you to configure aliases for linking to external files on your local file system.

*   **Alias**: A short name you will use to refer to a folder (e.g., `docs`).
*   **Path**: The full, absolute path to the folder on your computer (e.g., `/Users/YourName/Documents`).

Once an alias is configured, you can link to any file within that folder from your notes using the syntax `[[alias:filename.ext]]`. This will generate a clickable `file:///` link.