import plugin from "../plugin.json";
import * as Styles from "./styles/index.js";

const actionStack = acode.require("actionStack");
const appSettings = acode.require("settings");
const Confirm = acode.require("confirm");
const EditorFile = acode.require("EditorFile");
const fs = acode.require("fs");

class BetterUi {
  static UI_TYPES = Object.keys(Styles);
  static UI_PATH = `${window.DATA_STORAGE}/ui`;
  static CUSTOM_CSS_PATH = `${BetterUi.UI_PATH}/BetterUI.custom.css`;

  #initialized = false;

  constructor() {
    this.$styles = new Map();
    this.$custom = null;

    if (!appSettings.value[plugin.id]) {
      appSettings.value[plugin.id] = {
        activeTypes: [...BetterUi.UI_TYPES]
      };
      appSettings.update(false);
    }
  }

  get settings() {
    return appSettings.value[plugin.id];
  }

  async init() {
    try {
      await this.#checkCustomCssFile();
      await this.loadStyle(...this.settings.activeTypes, "custom_css");

      if (!this.#initialized) return;

      const confirm = await Confirm(
        "Note",
        "Do Want to reload app ? (recommended)"
      );
      if (!confirm) return;
      this.#initialized = true;
      location.reload();
    } catch (e) {
      console.error("BetterUI initialization failed:", e);
      acode.alert("Error", "Failed to initialize BetterUI plugin");
    }
  }

  async destroy() {
    try {
      const allTypes = [...this.settings.activeTypes, "custom_css"];

      this.removeStyle(...allTypes);
      this.$styles.clear();
      this.$custom = null;

      delete appSettings.value[plugin.id];
      appSettings.update(false);

      const confirm = await Confirm(
        "Note",
        "Do Want to reload app ? (recommended)"
      );
      if (confirm) location.reload();
    } catch (e) {
      console.error("BetterUI destroy failed:", e);
    }
  }

  async resetUi(...types) {
    try {
      this.removeStyle(...types);
      await this.loadStyle(...types);
    } catch (e) {
      console.error("Failed to reset UI:", e);
      acode.alert("Error", "Failed to reset UI styles");
    }
  }

  getSettings() {
    return {
      list: [
        {
          key: "custom_css",
          text: "Add Custom CSS",
          info: "Make your imaginations real.\nPlease edit content in separate place and paste it here for better control.\n(NOTE: be careful this may break the app)"
        },
        ...BetterUi.UI_TYPES.map(type => ({
          key: type,
          text: firstUpperCase(type),
          checkbox: this.settings.activeTypes.includes(type)
        }))
      ],
      cb: async (key, value) => {
        try {
          if (key === "custom_css") {
            const filename = BetterUi.CUSTOM_CSS_PATH.split("/").pop();
            const editorFile = new EditorFile(filename, {
              uri: BetterUi.CUSTOM_CSS_PATH
            });

            editorFile.on("save", async () => {
              await this.resetUi("custom_css");
            });

            actionStack.pop(actionStack.length);
            return;
          }

          const activeTypes = this.settings.activeTypes;
          if (value && !activeTypes.includes(key)) {
            await this.loadStyle(key);
          } else if (!value && activeTypes.includes(key)) {
            this.removeStyle(key);
          }
        } catch (e) {
          console.error("Settings callback failed:", e);
          acode.alert("Error", "Failed to update settings");
        }
      }
    };
  }

  async #checkCustomCssFile() {
    try {
      // Check if ui dir exists, create if not
      const uiDir = fs(BetterUi.UI_PATH);
      const isUiDirExist = await uiDir.exists();
      if (!isUiDirExist) {
        await fs(window.DATA_STORAGE).createDirectory("ui");
      }

      // Check if custom css file exists, create if not
      const customCssFile = fs(BetterUi.CUSTOM_CSS_PATH);
      const isCustomCssExist = await customCssFile.exists();
      if (!isCustomCssExist) {
        await fs(BetterUi.UI_PATH).createFile(
          "BetterUI.custom.css",
          '/* A custom css file for "Better UI" plugin */\n' +
            "/* WARNING: Use carefully this might break app */\n"
        );
      }
    } catch (e) {
      console.error("Failed to check/create custom CSS file:", e);
      throw e;
    }
  }

  async loadStyle(...types) {
    for (const type of types) {
      if (type === "custom_css" && !this.$custom) {
        const url = `${await acode.toInternalUrl(
          BetterUi.CUSTOM_CSS_PATH
        )}?v=${Date.now()}`;
        this.$custom = tag("link");
        this.$custom.id = "better-ui_custom-css";
        this.$custom.rel = "stylesheet";
        this.$custom.href = url;
        document.head.append(this.$custom);
        continue;
      }

      if (this.$styles.has(type)) continue;
      const $style = tag("style");
      $style.id = `better-ui_${type}`;
      $style.innerHTML = Styles[type] ?? "";
      this.$styles.set(type, $style);
      this.settings.activeTypes.push(type);
      document.head.append($style);
    }

    appSettings.update(false);
  }

  removeStyle(...types) {
    for (const type of types) {
      if (type === "custom_css" && this.$custom) {
        this.$custom.remove();
        this.$custom = null;
        continue;
      }

      const $style = this.$styles.get(type);
      const index = this.settings.activeTypes.indexOf(type);
      if (!$style || index === -1) continue;
      $style.remove();
      this.$styles.delete(type);
      this.settings.activeTypes.splice(index, 1);
    }

    appSettings.update(false);
  }
}

function firstUpperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

if (window.acode) {
  const betterUI = new BetterUi();
  acode.define("@better/ui", {
    // constants
    UiTypes: BetterUi.UI_TYPES,
    UiPath: BetterUi.UI_PATH,
    CustomCssPath: BetterUi.CUSTOM_CSS_PATH,

    // methods
    resetUi: betterUI.resetUi.bind(betterUI),
    loadStyle: betterUI.loadStyle.bind(betterUI),
    removeStyle: betterUI.removeStyle.bind(betterUI),
    getActiveTypes: () => betterUI.settings.activeTypes
  });

  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, cache) => {
      try {
        betterUI.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        await betterUI.init();
      } catch (e) {
        console.error("Plugin initialization failed:", e);
      }
    },
    betterUI.getSettings()
  );

  acode.setPluginUnmount(plugin.id, async () => {
    try {
      await betterUI.destroy();
    } catch (e) {
      console.error("Plugin unmount failed:", e);
    }
  });
}
