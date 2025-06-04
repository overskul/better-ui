import API from "./api.js";
import { createSettingsPage } from "./settings/settings.js";
import { defaultConfig } from "./config.js";
import plugin from "../plugin.json";
import utils from "./utils.js";

const actionStack = acode.require("actionStack");
const appSettings = acode.require("settings");
const Confirm = acode.require("confirm");
const EditorFile = acode.require("editorFile");
const fs = acode.require("fs");
const Url = acode.require("url");

class BetterUIPlugin {
  constructor() {
    // this is for breaking change
    if (appSettings.value[plugin.id]) {
      delete appSettings.value[plugin.id];
      appSettings.update(false);
    }
  }

  async init() {
    try {
      await API.__init();
      acode.define("@better/ui", API);
      acode.define("@better/ui/utils", utils);

      Object.entries(API.config.sections).forEach(async ([key, value]) => {
        if (value) await API.loadUI(key);
      });
      if (API.config.customCSS) await API.loadCustomCSS();

      const isInitialized = localStorage.getItem("__$bui_isInitialized$__");
      if (isInitialized === "true") return;

      localStorage.setItem("__$bui_isInitialized$__", "true");
      await requestReload();
    } catch (e) {
      acode.alert("BUI:ERROR", 'Failed to initialize "BetterUI" plugin' + e.message);
      console.error("BetterUI initialization failed:", e);
    }
  }

  async destroy() {
    try {
      API.emit("destroy");
      Object.entries(API.config.sections).forEach(async ([key, value]) => {
        if (value) await API.unloadUI(key);
      });
      if (API.config.customCSS) await API.unloadCustomCSS();

      localStorage.removeItem("__$bui_isInitialized$__");

      acode.define("@better/ui", undefined);
      acode.define("@better/ui/utils", undefined);
      await requestReload();
    } catch (e) {
      console.error("BetterUI destroy failed:", e);
      acode.alert("BUI:ERROR", 'Failed to destroy "BetterUI" plugin (restart app recommended)' + e.message);
    }
  }

  getPluginSettings() {
    return {
      list: [
        {
          key: "settings",
          text: "Open Settings"
        },
        {
          key: "custom_css",
          text: "Edit Custom CSS"
        }
      ],
      cb: async key => {
        if (key === "settings") return await createSettingsPage();
        if (key === "custom_css") {
          const filename = Url.basename(API.CUSTOM_CSS_FILE);
          const editorFile = new EditorFile(filename, {
            uri: API.CUSTOM_CSS_FILE
          });

          editorFile.on("save", async () => {
            await API.unloadCustomCSS();
            await API.loadCustomCSS();
            console.log("saved");
          });
          actionStack.pop(actionStack.length);
          return;
        }
      }
    };
  }
}

async function requestReload() {
  const confirm = await Confirm("[BUI] NOTE", "Do you want to reload the app ? (recommended)");
  if (confirm) location.reload();
}

if (window.acode) {
  const betterUI = new BetterUIPlugin();
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
    betterUI.getPluginSettings()
  );

  acode.setPluginUnmount(plugin.id, async () => {
    try {
      await betterUI.destroy();
    } catch (e) {
      console.error("Plugin unmount failed:", e);
    }
  });
}
