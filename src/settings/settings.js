import SettingsStyle from "./style.scss";
import API from "../api.js";
import utils from "../utils.js";

const actionStack = acode.require("actionStack");
const Page = acode.require("page");
const loader = acode.require("loader");

export async function createSettingsPage() {
  const $style = await utils.addStyle(API.getStyleID("plugin-settings-style"), SettingsStyle);
  const $settings = Page("BetterUI Settings");
  $settings.id = API.getStyleID("settings");

  const oldHide = $settings.hide.bind($settings);
  $settings.hide = () => {
    oldHide();
    setTimeout(() => $style.remove(), 500);
  };

  $settings.show = () => {
    actionStack.push({
      id: "better-ui-settings",
      action: $settings.hide
    });

    app.append($settings);
  };

  // Show the page
  const $mainSection = await createSection("$root$", "main", API.config, handleOnEvents);
  $settings.body.append($mainSection);
  $settings.show();
}

async function handleOnEvents(type, data) {
  loader.create("Updating...", "Please wait for it...", {
    callback: () => window.toast("Done :3")
  });

  if (type === "switch") {
    const { location, key, value } = data;

    if (API.UI_TYPES.includes(key)) {
      // load UI type
      value ? await API.loadUI(key) : await API.unloadUI(key);
    } else if (API.CUSTOM_CSS === key) {
      // Load Custom CSS
      value ? await API.loadCustomCSS() : await API.unloadCustomCSS();
    } else {
      // Set Property
      setValueFromLocation(API.config, location, value);
    }

    loader.destroy();
  }
}

function createSection(location, key, config, on) {
  let $content, $subSections;
  const $section = tag("div", {
    className: "section",
    dataset: {
      type: "section",
      location
    },
    children: [
      tag("div", {
        className: "title",
        textContent: key.toUpperCase()
      }),
      ($content = tag("div", {
        className: "content"
      })),
      ($subSections = tag("div", {
        className: "sub-sections"
      }))
    ]
  });

  const contentChilds = [];
  const subSectionsChilds = [];

  for (const key in config) {
    const value = config[key];

    if (typeof value === "boolean") {
      contentChilds.push(createSwitchItem(`${location}.${key}`, key, value, on));
    } else if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
      subSectionsChilds.push(createSection(`${location}.${key}`, key, value, on));
    }
  }

  $content.append(...contentChilds);
  $subSections.append(...subSectionsChilds);
  return $section;
}

function createSwitchItem(location, key, value, on) {
  let $input;
  const $item = tag("div", {
    className: "item",
    dataset: {
      type: "switch",
      location
    },
    children: [
      tag("div", {
        className: "name",
        textContent: firstUpperCase(key || "???")
      }),
      tag("div", {
        className: "tail",
        children: [
          tag("label", {
            className: "switch",
            children: [
              ($input = tag("input", {
                type: "checkbox"
              })),
              tag("span", {
                className: "slider"
              })
            ]
          })
        ]
      })
    ]
  });

  $input.checked = value;
  $input.addEventListener(
    "change",
    async e =>
      await on("switch", {
        location,
        key,
        value: $input.checked,
        before: !$input.checked,
        e
      })
  );

  return $item;
}

function firstUpperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function getValueFromLocation(obj, location) {
  const parts = location.split(".");
  if (parts[0] === "$root$") parts.shift();

  let current = obj;
  for (const part of parts) {
    if (!current?.hasOwnProperty(part)) return undefined;
    current = current[part];
  }
  return current;
}

function setValueFromLocation(obj, location, val) {
  const parts = location.split(".");
  if (parts[0] === "$root$") parts.shift();

  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current?.hasOwnProperty(part)) break;
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (current?.hasOwnProperty(lastPart)) {
    current[lastPart] = val;
  }
}
