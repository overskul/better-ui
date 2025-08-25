const fs = acode.require("fs");
const Url = acode.require("url");

export default {
  async addStyle(id, content) {
    const existingElement = document.getElementById(id);
    if (existingElement) existingElement.remove();

    if (this.isFilePath(content)) {
      try {
        // Try to use toInternalUrl first
        const url = await acode.toInternalUrl(content);
        if (url) {
          const sLink = tag("link", { 
            id, 
            rel: "stylesheet", 
            href: url,
            onload: () => console.log(`[BUI] Loaded stylesheet: ${id}`),
            onerror: () => console.error(`[BUI] Failed to load stylesheet: ${id}`)
          });
          document.head.append(sLink);
          return sLink;
        }
      } catch (e) {
        console.warn(`[BUI] toInternalUrl failed for ${id}, trying to read file:`, e.message);
      }
      
      try {
        // Fallback: read file content directly
        const style = await fs(content).readFile("utf8");
        if (!style || style.trim().length === 0) {
          console.warn(`[BUI] Empty or invalid CSS file: ${content}`);
          return null;
        }

        const sTag = tag("style", { 
          id, 
          innerHTML: style,
          'data-source': content
        });
        document.head.append(sTag);
        console.log(`[BUI] Loaded inline styles: ${id}`);
        return sTag;
      } catch (e) {
        console.error(`[BUI] Failed to read CSS file ${content}:`, e.message);
        throw new Error(`Failed to load CSS file: ${e.message}`);
      }
    }
    if (this.isCssCode(content)) {
      if (!content.trim()) {
        console.warn(`[BUI] Empty CSS content for: ${id}`);
        return null;
      }
      
      const sTag = tag("style", { 
        id, 
        innerHTML: content,
        'data-source': 'inline'
      });
      document.head.append(sTag);
      console.log(`[BUI] Loaded CSS code: ${id}`);
      return sTag;
    }

    throw new Error(`Invalid content provided for style ${id}: not a file path or CSS code`);
  },

  isFilePath(input) {
    if (typeof input !== "string" || !input.trim()) return false;
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(input);
    const hasPathSeparators = /[\/\\]/.test(input);
    if (!hasFileExtension) return false;
    const filename = input.split(/[\\/]/).pop();
    const parts = filename.split(".");

    return (
      parts.length > 1 && // Must have an extension
      parts[0].length > 0 && // Filename can't be empty
      parts[parts.length - 1].length > 0 && // Extension can't be empty
      !/\s/.test(parts[parts.length - 1]) && // Extension can't contain spaces
      parts[parts.length - 1].length <= 10 // Reasonable extension length
    );
  },

  isCssCode(input) {
    if (typeof input !== "string" || !input.trim()) return false;
    const cssPatterns = [
      /[\w-]+\s*:\s*[^:;{}]+[;}]/, // Property-value pairs
      /[^{]*\{[^}]*\}/, // Selector blocks
      /@(media|keyframes|import|font-face|supports|charset|namespace)/i, // At-rules
      /\/\*[\s\S]*?\*\//, // CSS comments
      /:\s*(hover|active|focus|before|after|nth-child|first-child|last-child)/i // Pseudo selectors
    ];

    const matchesCssPattern = cssPatterns.some(pattern => pattern.test(input));
    const looksLikeFilePath = this.isFilePath(input);
    return matchesCssPattern && !looksLikeFilePath;
  }
};