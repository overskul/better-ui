const fs = acode.require("fs");
const Url = acode.require("url");

export default {
  async addStyle(id, content) {
    if (this.isFilePath(content)) {
      let style;
      try {
        style = await fs(content).readFile("utf8");
      } catch (e) {
        style = await fs(acode.toInternalUrl(content)).readFile("utf8");
      }

      if (!style) return;
      const sTag = tag("style", { id, innerHTML: style });
      document.head.append(sTag);
      return sTag;
    }

    if (this.isCssCode(content)) {
      const sTag = tag("style", { id, innerHTML: content });
      document.head.append(sTag);
      return sTag;
    }

    if (this.isStylesheetPath(content)) {
      const sLink = tag("link", { id, rel: "stylesheet", href: content });
      document.head.append(sLink);
      return sLink;
    }
  },

  isFilePath(input) {
    if (typeof input !== "string" || !input.trim()) return false;
    const filename = input.split(/[\\/]/).pop();
    const parts = filename.split(".");

    return (
      parts.length > 1 && // Must have an extension
      parts[0].length > 0 && // Filename can't be empty
      parts[parts.length - 1].length > 0 && // Extension can't be empty
      !/\s/.test(parts[parts.length - 1]) // Extension can't contain spaces
    );
  },

  isCssCode(input) {
    if (typeof input !== "string" || !input.trim()) return false;
    const hasPropertyValue = /[\w-]+\s*:\s*[^:;]+;/.test(input);
    const hasSelectorBlock = /[^{]+\{[^}]*\}/.test(input);
    const hasAtRule = /@(media|keyframes|import|font-face|supports|charset)/i.test(input);
    return hasPropertyValue || hasSelectorBlock || hasAtRule;
  },

  isStylesheetPath(input) {
    if (typeof input !== "string" || !input.trim()) return false;
    const cleanPath = input.split(/[?#]/)[0];
    return /\.css$/i.test(cleanPath);
  }
};
