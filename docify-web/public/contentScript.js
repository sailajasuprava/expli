function getFullPageHTML() {
  const doc = document.cloneNode(true);

  // Inline stylesheets
  [...document.styleSheets].forEach((sheet) => {
    try {
      const style = document.createElement("style");
      [...sheet.cssRules].forEach((rule) => {
        style.appendChild(document.createTextNode(rule.cssText));
      });
      doc.head.appendChild(style);
    } catch (e) {}
  });

  return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
}

chrome.runtime.sendMessage({
  action: "PAGE_HTML",
  html: getFullPageHTML(),
});
