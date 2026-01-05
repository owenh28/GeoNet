const agols = []
const regex = /\d\?/gm
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    let server:string = details.url.split("services/")[0] + "services/";
    
    chrome.tabs.sendMessage(details.tabId, { greeting:"new_server", data: server });
    if (details.url.match(regex)){
      let layerUrl: string = details.url.split("?")[0]
      chrome.tabs.sendMessage(details.tabId, { greeting:"new_layer", data: layerUrl });
    }
    

  },
  { urls: ["*://*/rest/services/*", "*://*/*/rest/services/*"] }
)
