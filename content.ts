import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
let services = new Set<string>()
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === "new") {
    services.add(request.data)
  } else if (request.greeting === "servers") {
    sendResponse([...services])
  }
  return false
})
