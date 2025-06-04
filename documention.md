# Better UI Plugin Documentation

## Overview
The Better UI plugin provides a api for enhancing the Acode editor's user interface with customizable styles and features. This documentation covers the `@better/ui` and `@better/ui/utils` modules.

---

## Module: `@better/ui`
```js
const API = acode.require("@better/ui");
```

### Properties
| Property | Type | Description |
|----------|------|-------------|
| `UI_TYPES` | `Array<string>` | Available UI style types |
| `UI_DIRECTORY` | `string` | Path to UI assets directory |
| `CONFIG_FILE` | `string` | Path to configuration file |
| `CUSTOM_CSS` | `string` | Key for custom CSS in config |
| `CUSTOM_CSS_FILE` | `string` | Path to custom CSS file |
| `config` | `Proxy` | Reactive configuration object |

### Methods

#### `updateConfig(data = this.#config)`
Persist configuration changes to file.

```javascript
await API.updateConfig();
```

#### `getStyleID(type)`
Generate a unique style ID for a UI type.

```javascript
const styleID = API.getStyleID('sidebar');
```

#### `loadUI(type)`
Load a specific UI style.

```javascript
await API.loadUI('editor');
```

#### `unloadUI(type)`
Unload a specific UI style.

```javascript
await API.unloadUI('statusbar');
```

#### `loadCustomCSS()`
Enable and load custom CSS.

```javascript
await API.loadCustomCSS();
```

#### `unloadCustomCSS()`
Disable and unload custom CSS.

```javascript
await API.unloadCustomCSS();
```

### Events
| Event | Description |
|-------|-------------|
| `config:change` | Emitted when a config value changes |
| `config:delete` | Emitted when a config property is deleted |
| `config:save` | Emitted after config is saved to disk |
| `error` | Emitted on plugin errors |

---

## Module: `@better/ui/utils`
```js
const utils = acode.require("@better/ui/utils");
```

### Methods

#### `addStyle(id, content)`
Adds a style to the document head. Accepts CSS code or file paths.

```javascript
// Add CSS from string
const styleElement = await utils.addStyle('my-style', `
  body {
    background: #1e1e2e;
  }
`);

// Add CSS from file
const fileStyle = await utils.addStyle('file-style', '/path/to/styles.css');
```

#### `isFilePath(input)`
Checks if a string is a valid file path.

```javascript
const isPath = utils.isFilePath('/ui/custom.css'); // true
const isPath = utils.isFilePath('body { color: red }'); // false
```

#### `isCssCode(input)`
Checks if a string contains valid CSS code.

```javascript
const isCSS = utils.isCssCode('.class { color: blue }'); // true
const isCSS = utils.isCssCode('This is not CSS'); // false
```
