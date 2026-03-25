chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "flipTheShell",
    title: "Flip this Shell 🐚",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "flipTheShell" && info.srcUrl) {
    // Attempt to send message and handle potential "Receiving end does not exist" error
    chrome.tabs.sendMessage(tab.id, { 
      action: "contextMenuDecode", 
      srcUrl: info.srcUrl 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Flip the Shell: Content script not ready. Please refresh the page.");
        // Optional: You could show a notification here if desired
      }
    });
  }
});
