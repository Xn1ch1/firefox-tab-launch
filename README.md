# TabLaunch Firefox Addon

A customizable quick links home page extension for Firefox that lets you override the new tab page with your own organized link collection.

## Features

- **Custom New Tab Override**: Replace Firefox's default new tab page with your own quick links
- **JSON Configuration**: Define your links using JSON format for easy management
- **Settings Page**: Built-in settings page to paste and manage your links
- **Search Functionality**: Quickly search through your links and descriptions
- **Keyboard Navigation**: Use arrow keys to navigate, Enter to open, `/` to focus search
- **Theme Modes**: Choose dark, light, or auto (follow system theme)
- **Validation**: Automatic validation of JSON configuration with helpful error messages

## Installation

### Manual Installation (for development/testing)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from this folder
4. The addon will be loaded and active

### Building for Distribution

To package the addon for submission to Firefox Add-ons:

```bash
zip -r dist/tablaunch.xpi *.html *.js *.json icons/
```

Then submit to [Firefox Add-ons](https://addons.mozilla.org/)

## Usage

### Initial Setup

1. After installing, open a new tab (Ctrl+T or Cmd+T)
2. Click the settings icon (⚙️) in the top right
3. Use the "Load Example" button to see the expected JSON format, or paste your own configuration
4. Click "Save Configuration" to save your links

### JSON Format

The links must be formatted as a JSON array of categories:

```json
[
  {
    "title": "Category Name",
    "icon": "folder",
    "color": "#ff6b6b",
    "links": [
      {
        "title": "Link Title",
        "description": "Optional description",
        "url": "https://example.com",
        "icon": "open_in_new"
      }
    ]
  }
]
```

### Required Fields

- **Category level:**
  - `title` (string): The category name
  - `links` (array): Array of link objects

- **Link level:**
  - `title` (string): The link name
  - `url` (string): The URL (must be valid)

### Optional Fields

- **Category level:**
  - `icon` (string): Material Symbols icon name (default: "folder")
  - `color` (string): Hex color for the category accent (default: #b39bff)

- **Link level:**
  - `description` (string): A description of the link
  - `icon` (string): Material Symbols icon name (default: "open_in_new")

### Icon Names

Icons use [Material Symbols](https://fonts.google.com/icons). Popular options:

- `folder` - Generic folder/category
- `dns` - Server/database
- `database` - Database
- `language` - Website/language
- `code` - Development
- `settings` - Settings
- `open_in_new` - External link (default)

### Keyboard Shortcuts

- `/` - Focus the search box
- `Esc` - Clear search input
- `↑↓` - Navigate through results
- `Enter` - Open the selected link

## File Structure

```
tablaunch-ff-addon/
├── manifest.json         # Firefox addon manifest
├── new-tab.html          # New tab page
├── settings.html         # Settings page
├── styles/common.css     # Shared styles for addon pages
├── src/utils.js          # Shared utilities (validation, storage)
└── README.md             # This file
```

## Storage

The addon uses Firefox's `browser.storage.sync` API to store your links. This means:

- Your configuration syncs across Firefox instances if you use Firefox Sync
- Data is stored locally and not sent to external servers
- You can export/backup your configuration through the settings page

## Troubleshooting

### Links not appearing after saving

1. Check the browser console (F12) for validation errors
2. Ensure your JSON is valid (use online JSON validators)
3. Make sure each link has required fields: `title` and `url`
4. Verify URLs are complete and valid (e.g., `https://example.com`)

### Settings page won't load

1. Right-click the addon icon and select "Manage Extension"
2. Check if the addon is enabled
3. Try restarting Firefox

### New tab page shows "No links configured"

1. Open the settings page by clicking the settings icon on the new tab page
2. Load the example configuration
3. Customize as needed and save

## Development

To modify the addon:

1. Edit the HTML, CSS, or JavaScript files
2. Reload the addon in `about:debugging`
3. Test your changes

### Adding new features

- Core UI logic is in `new-tab.html` and `settings.html`
- Shared logic (validation, storage) is in `utils.js`
- Follow the existing code style for consistency

## License

This addon is provided as-is for personal use.

## Support

For issues or feature requests, check the code comments or review the validation error messages in the settings page for guidance on JSON format.

