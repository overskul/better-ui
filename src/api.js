import Config, { defaultConfig } from "./config.js";
import EventEmitter from "eventemitter3";
import * as UI from "./styles/index.js";
import utils from "./utils.js";

const fs = acode.require("fs");
const Url = acode.require("url");

class BetterUIApi extends EventEmitter {
  #config;
  #els = new Map();
  #isInit = false;

  get UI_TYPES() {
    return [...Object.keys(UI)];
  }

  get UI_DIRECTORY() {
    return `${window.DATA_STORAGE}/ui`;
  }

  get CONFIG_FILE() {
    return `${this.UI_DIRECTORY}/BetterUI.config`;
  }

  get CUSTOM_CSS() {
    return "customCSS";
  }

  get CUSTOM_CSS_FILE() {
    return `${this.UI_DIRECTORY}/BetterUI.custom.css`;
  }

  get config() {
    return this.#config;
  }

  async __init() {
    if (this.#isInit) return;

    try {
      await this.#checkAssets();
      this.#config = Config(await fs(this.CONFIG_FILE).readFile("json"));
      this.#isInit = true;
    } catch (e) {
      this.#catchError(e);
    }
  }

  async #checkAssets() {
    try {
      // Check if ui dir exists, create if not
      const uiDir = fs(this.UI_DIRECTORY);
      const isUiDirExist = await uiDir.exists();
      if (!isUiDirExist) {
        await fs(Url.dirname(this.UI_DIRECTORY)).createDirectory(Url.basename(this.UI_DIRECTORY));
      }

      await Promise.all(
        [
          [this.CUSTOM_CSS_FILE, `/* A custom css file for "Better UI" plugin */\n/* WARNING: Use carefully this might break app */\n`],
          [this.CONFIG_FILE, defaultConfig()]
        ].map(async ([path, content]) => {
          const file = fs(path);
          const isExist = await file.exists();
          if (isExist) return;
          await fs(Url.dirname(path)).createFile(Url.basename(path), content);
        })
      );
    } catch (e) {
      console.error("Failed to check/create:", e);
      throw e;
    }
  }

  async updateConfig(data = this.#config) {
    try {
      await fs(this.CONFIG_FILE).writeFile(JSON.stringify(data));
      this.#config = Config(data);
      this.emit("config:save");
    } catch (e) {
      this.#catchError(e);
    }
  }

  getStyleID(type) {
    return `bui-${type}`;
  }

  async loadUI(type) {
    if (this.#els.has(type)) return;

    try {
      const $style = await utils.addStyle(this.getStyleID(type), UI[type] ?? "");
      this.config.sections[type] = true;
      this.#els.set(type, $style);
      return true;
    } catch (e) {
      this.#catchError(e);
      return;
    }
  }

  async unloadUI(type) {
    if (!this.#els.has(type)) return;
    this.config.sections[type] = false;

    const $style = this.#els.get(type);
    $style?.remove();

    this.#els.delete(type);
    return true;
  }

  async loadCustomCSS() {
    if (this.#els.has(this.CUSTOM_CSS)) return;

    try {
      const $custom = await utils.addStyle(this.getStyleID(this.CUSTOM_CSS), await acode.toInternalUrl(this.CUSTOM_CSS_FILE));
      this.config.customCSS = true;
      this.#els.set(this.CUSTOM_CSS, $custom);
      return true;
    } catch (e) {
      this.#catchError(e);
      return;
    }
  }

  async unloadCustomCSS() {
    if (!this.#els.has(this.CUSTOM_CSS)) return;
    this.config.customCSS = false;

    const $style = this.#els.get(this.CUSTOM_CSS);
    $style?.remove();

    this.#els.delete(this.CUSTOM_CSS);
    return true;
  }

  #catchError(e) {
    console.error("[BUI:ERROR]", e.message);
    this.emit("error", e);
  }
}

export default new BetterUIApi();
