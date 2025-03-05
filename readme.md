# BetterUI Plugin for Acode

Enhance your Acode editor experience with customizable UI styles.

## Features

- **Multiple UI Styles**: Choose from predefined UI enhancements
- **Custom CSS Support**: Add your own CSS rules with live reload
- **Toggleable Features**: Enable/disable specific UI components

## Installation

1. Open Acode editor
2. Navigate to Sidebar → Plugins
3. Search for "BetterUI"
4. Click Install

## Usage

### Access Settings
1. Go to Settings → Plugins
2. Find BetterUI in the list
3. Click the settings icon

### Toggle UI Components
- Check/uncheck features in the settings list
- Changes apply immediately

### Custom CSS
1. Click "Add Custom CSS" in plugin settings
2. Edit the `BetterUI.custom.css` file
3. Save changes (auto-reloads styles)

## Development
Contributions are welcome. Please open issues/pull requests on [GitHub](https://github.com/overskul/better-ui) for:
- New UI component suggestions
- CSS conflict reports
- Feature requests

## Support
Found this plugin useful? Consider:
- Leaving a ⭐ rating in the [plugin page](https://acode.app/plugin/x.better.ui) and [GitHub](https://github.com/overskul/better-ui)
- Reporting issues on [GitHub](https://github.com/overskul/better-ui)
- Contributing CSS improvements

---

This plugin is under [MIT License](./LICENSE).

---

## Plugin API Reference `+(v1.5.0)`

```javascript
const BetterUI = acode.require('@better/ui');
```

### Constants
```javascript
/**
 * Available UI component types
 * @constant {string[]}
 * @example
 * const { UiTypes } = acode.require('@better/ui');
 */
BetterUI.UiTypes

/**
 * Base directory for UI customization files
 * @constant {string}
 */
BetterUI.UiPath

/**
 * Path to custom CSS file
 * @constant {string}
 */
BetterUI.CustomCssPath
```

### Methods
```javascript
/**
 * Get currently active UI types
 * @returns {string[]} Array of active UI types
 */
BetterUI.getActiveTypes

/**
 * Reset UI styles for specified types
 * @async
 * @param {...string} types - UI component types to reset
 * @returns {Promise<void>}
 * @example
 * await BetterUI.resetUi('sidebar', 'settings');
 */
await BetterUI.resetUi

/**
 * Load styles for specified UI types
 * @async
 * @param {...string} types - UI component types to style
 * @returns {Promise<void>}
 */
await BetterUI.loadStyle

/**
 * Remove styles for specified UI types
 * @param {...string} types - UI component types to remove
 */
await BetterUI.removeStyle
```