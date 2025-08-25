import * as YAML from "yaml";
import Config from './Config.js';
import ConfigQueue from './ConfigQueue.js';
import EventEmitter from 'eventemitter3';
import * as UI from './styles/index.js';
import utils from './utils.js';

const fs = acode.require('fs');
const Url = acode.require('url');

class BetterUIApi extends EventEmitter {
  #config;
  #isInit = false;
  #configQueue;
  _els = new Map();

  get UI_TYPES() {
    return [...Object.keys(UI)];
  }

  get UI_DIRECTORY() {
    return `${window.DATA_STORAGE}/ui`;
  }

  get CONFIG_FILE() {
    return `${this.UI_DIRECTORY}/BetterUI.config.yaml`;
  }

  get CUSTOM_CSS() {
    return 'customCSS';
  }

  get CUSTOM_CSS_FILE() {
    return `${this.UI_DIRECTORY}/BetterUI.custom.css`;
  }

  get QUEUE_STORAGE_KEY() {
    return 'betterui_config_queue';
  }

  get config() {
    return this.#config;
  }

  get defaultConfig() {
    const sectionsList = this.UI_TYPES.reduce((acc, cur) => ((acc[cur] = true), acc), {});
    return {
      [this.CUSTOM_CSS]: true,
      sections: sectionsList
    };
  }

  async __init() {
    if (this.#isInit) return;

    try {
      await this.#checkAssets();
      this.#configQueue = new ConfigQueue(
        this.QUEUE_STORAGE_KEY,
        this.#saveConfigFile.bind(this)
      );
      
      this.#configQueue.restore();
      
      let data;
      try {
        const configContent = await fs(this.CONFIG_FILE).readFile('utf8');
        data = YAML.parse(configContent);
      } catch (e) {
        console.warn('[BUI] Failed to read config file, using defaults:', e.message);
        data = this.defaultConfig;
        // await this.#saveConfigFile(data);
      }
      
      this.#config = Config(data, {
        emit: this.emit.bind(this),
        save: this.#queueUpdate.bind(this)
      });
      
      this.#isInit = true;
    } catch (e) {
      this.#catchError(e);
    }
  }

  async #checkAssets() {
    try {
      const uiDir = fs(this.UI_DIRECTORY);
      const isUiDirExist = await uiDir.exists();
      if (!isUiDirExist) {
        await fs(Url.dirname(this.UI_DIRECTORY)).createDirectory(Url.basename(this.UI_DIRECTORY));
      }

      await Promise.all(
        [
          [this.CUSTOM_CSS_FILE, `/* A custom css file for "Better UI" plugin */\n/* WARNING: Use carefully this might break app */\n`],
          [this.CONFIG_FILE, YAML.stringify(this.defaultConfig)]
        ].map(async ([path, content]) => {
          const file = fs(path);
          const isExist = await file.exists();
          if (isExist) return;
          await fs(Url.dirname(path)).createFile(Url.basename(path), content);
        })
      );
    } catch (e) {
      console.error('Failed to check/create:', e);
      throw e;
    }
  }

  #queueUpdate(data) {
    this.#configQueue.add(data);
  }

  async #saveConfigFile(data) {
    try {
      const yamlContent = YAML.stringify(data);
      await fs(this.CONFIG_FILE).writeFile(yamlContent);
      this.emit('config:save');
    } catch (e) {
      console.error('[BUI] Failed to save config file:', e);
      throw e;
    }
  }

  async updateConfig(data = this.#config) {
    this.#configQueue.add(data);
  }

  getStyleID(type) {
    return `bui-${type}`;
  }

  async loadUI(type) {
    const styleId = this.getStyleID(type);
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      this._els.delete(type);
    }

    try {
      const $style = await utils.addStyle(styleId, UI[type] ?? '');
      if (!$style) throw new Error(`Failed to create style element for ${type}`);
      
      this.config.sections[type] = true;
      this._els.set(type, $style);
      
      console.log(`[BUI] Loaded UI: ${type}`);
      return true;
    } catch (e) {
      this.#catchError(new Error(`Failed to load UI ${type}: ${e.message}`));
      return false;
    }
  }

  async unloadUI(type) {
    const styleId = this.getStyleID(type);
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) existingStyle.remove();
    if (this._els.has(type)) this._els.delete(type);
    
    this.config.sections[type] = false;
    console.log(`[BUI] Unloaded UI: ${type}`);
    return true;
  }

  async loadCustomCSS() {
    const styleId = this.getStyleID(this.CUSTOM_CSS);
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      this._els.delete(this.CUSTOM_CSS);
    }

    try {
      const $custom = await utils.addStyle(styleId, await acode.toInternalUrl(this.CUSTOM_CSS_FILE));
      if (!$custom) throw new Error('Failed to create custom CSS style element');
      
      this.config.customCSS = true;
      this._els.set(this.CUSTOM_CSS, $custom);
      
      console.log('[BUI] Loaded Custom CSS');
      return true;
    } catch (e) {
      this.#catchError(new Error(`Failed to load custom CSS: ${e.message}`));
      return false;
    }
  }

  async unloadCustomCSS() {
    const styleId = this.getStyleID(this.CUSTOM_CSS);
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) existingStyle.remove();
    if (this._els.has(this.CUSTOM_CSS)) this._els.delete(this.CUSTOM_CSS);
    
    this.config.customCSS = false;
    console.log('[BUI] Unloaded Custom CSS');
    return true;
  }

  async destroy() {
    // Process any remaining queue items before destroying
    if (this.#configQueue && !this.#configQueue.isEmpty) {
      await this.#configQueue.forceProcess();
    }
    
    // Note: We don't disable config sections here to preserve user preferences
    // Only remove DOM elements
    this._els.forEach(el => el?.remove());
    this._els.clear();
    
    // Clean up queue
    if (this.#configQueue) this.#configQueue.clear();
  }

  #catchError(e) {
    console.error('[BUI:ERROR]', e.message);
    this.emit('error', e);
  }
}

export default new BetterUIApi();