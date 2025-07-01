import plugin from '../plugin.json';
import API from './api.js';
import utils from './utils.js';
import { createSettingsPage } from './settings/settings.js';

const actionStack = acode.require('actionStack');
const appSettings = acode.require('settings');
const Confirm = acode.require('confirm');
const EditorFile = acode.require('editorFile');
const fs = acode.require('fs');
const Url = acode.require('url');

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
      acode.define('@better/ui', API);
      acode.define('@better/ui/utils', utils);

      const promises = [];
      Object.entries(API.config.sections).forEach(([key, value]) => (value ? promises.push(API.loadUI(key)) : null));
      if (API.config.customCSS) promises.push(API.loadCustomCSS());
      await Promise.all(promises);

      const isInitialized = localStorage.getItem('__$bui_isInitialized$__');
      if (isInitialized === 'true') return;

      localStorage.setItem('__$bui_isInitialized$__', 'true');
      await requestReload();
    } catch (e) {
      acode.alert('BUI:ERROR', 'Failed to initialize "BetterUI" plugin' + e.message);
      console.error('BetterUI initialization failed:', e);
    }
  }

  async destroy() {
    try {
      API.emit('destroy');

      API._els.values().forEach(e => e.remove());
      localStorage.removeItem('__$bui_isInitialized$__');

      acode.define('@better/ui', undefined);
      acode.define('@better/ui/utils', undefined);
      await requestReload();
    } catch (e) {
      console.error('BetterUI destroy failed:', e);
      acode.alert('BUI:ERROR', 'Failed to destroy "BetterUI" plugin (restart app recommended)' + e.message);
    }
  }

  getPluginSettings() {
    return {
      list: [
        {
          key: 'settings',
          text: 'Open Settings'
        },
        {
          key: 'raw_settings',
          text: 'Edit Raw Settings'
        },
        {
          key: 'custom_css',
          text: 'Edit CustomCSS'
        }
      ],
      cb: async key => {
        if (key === 'settings') return await createSettingsPage();
        if (key === 'raw_settings') {
          const filename = Url.basename(API.CONFIG_FILE);
          const editorFile = new EditorFile(filename, {
            uri: API.CONFIG_FILE
          });

          editorFile.on('save', async ({ target }) => {
            setTimeout(async () => await API.updateConfig(JSON.parse(target.session.getValue())), 500);
          });
          actionStack.pop(actionStack.length);
          return;
        }
        if (key === 'custom_css') {
          const filename = Url.basename(API.CUSTOM_CSS_FILE);
          const editorFile = new EditorFile(filename, {
            uri: API.CUSTOM_CSS_FILE
          });

          editorFile.on('save', async () => {
            setTimeout(async () => await API.unloadCustomCSS(), 500);
            setTimeout(async () => await API.loadCustomCSS(), 500);
          });
          actionStack.pop(actionStack.length);
          return;
        }
      }
    };
  }
}

async function requestReload() {
  const confirm = await Confirm('[BUI] NOTE', 'Do you want to reload the app ? (recommended)');
  if (confirm) setTimeout(() => location.reload(), 1000);
}

if (window.acode) {
  const betterUI = new BetterUIPlugin();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, cache) => {
      try {
        betterUI.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        await betterUI.init();
      } catch (e) {
        console.error('Plugin initialization failed:', e);
      }
    },
    betterUI.getPluginSettings()
  );

  acode.setPluginUnmount(plugin.id, async () => {
    try {
      await betterUI.destroy();
    } catch (e) {
      console.error('Plugin unmount failed:', e);
    }
  });
}
