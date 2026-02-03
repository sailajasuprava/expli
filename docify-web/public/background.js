// background.js (MV3-correct)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "CAPTURE_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];

      if (!tab || !tab.url) {
        sendResponse({ ok: false, error: "No active tab" });
        return;
      }

      // Block restricted pages
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("https://chrome.google.com/")
      ) {
        sendResponse({
          ok: false,
          error: "This page cannot be captured due to browser restrictions.",
        });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["contentScript.js"],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            sendResponse({ ok: false });
          } else {
            sendResponse({ ok: true });
          }
        },
      );
    });

    return true;
  }

  // Receive HTML and open viewer
  if (msg.action === "PAGE_HTML") {
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL("viewer.html"),
      },
      (tab) => {
        // Store HTML temporarily
        chrome.storage.session.set({
          capturedHTML: msg.html,
        });
      },
    );

    sendResponse({ ok: true });
    return true;
  }
});
