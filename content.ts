import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}


let server_services = new Set<string>()
let layer_services = new Set<string>()
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === "new_server") {
    server_services.add(request.data)
  }  else if (request.greeting === "new_layer") {
    layer_services.add(request.data)
  }else if (request.greeting === "servers") {
    sendResponse([...server_services])
  } else if (request.greeting === "layers") {
    sendResponse([...layer_services])
  }
  return false
})
