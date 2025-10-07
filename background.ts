const agols = []
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    let server:string = details.url.split("services/")[0] + "services/"
    chrome.tabs.sendMessage(details.tabId, { greeting:"new", data: server })

  },
  { urls: ["*://*/rest/services/*", "*://*/*/rest/services/*"] }
)
