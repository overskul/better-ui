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

    case "HideFavoriteSidebarApp":
      let loop;
      loop = setInterval(() => {
        const $fav = tag.get("#sidebar .favorite");
        if (!$fav) return;
        $fav.classList.contains("hide")
          ? $fav.classList.remove("hide")
          : $fav.classList.add("hide")
        clearInterval(loop);
      }, 1000);
      break;
  }
}