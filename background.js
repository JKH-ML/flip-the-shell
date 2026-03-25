chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "flipTheShell",
    title: "Flip this Shell 🐚",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "flipTheShell" && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, { 
      action: "contextMenuDecode", 
      srcUrl: info.srcUrl 
    });
  }
});
