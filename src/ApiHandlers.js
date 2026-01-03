export async function handleConfig(key, value) {
  if (typeof value === "boolean") 
    return handleSwitch(key, value);
}

async function handleSwitch(key, value) {
  switch (key) {
    case "customPageLoader":
      value 
        ? app.classList.add("bui_custom-loader")
        : app.classList.remove("bui_custom-loader");
      break;
  }
}