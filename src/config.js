import API from "./api.js";

export default function (data) {
  let timeout;
  return new Proxy(data, {
    get(target, key, rec) {
      return target[key];
    },
    set(target, key, value) {
      const oldValue = target[key];
      target[key] = value;
      API.emit("config:change", key, target[key], oldValue);

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await API.updateConfig(target);
        timeout = null;
      }, 200);

      return true;
    },
    deleteProperty(target, key) {
      const value = target[key];
      delete target[key];
      API.emit("config:delete", key, value);

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await API.updateConfig(target);
        timeout = null;
      }, 200);

      return true;
    }
  });
}

export function defaultConfig() {
  const sectionsList = API.UI_TYPES.reduce((acc, cur) => ((acc[cur] = false), acc), {});

  return {
    customCSS: true,
    sections: sectionsList
  };
}
