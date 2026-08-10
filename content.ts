import type { PlasmoCSConfig } from "plasmo"

import { captureKey, serviceKey, type CaptureItem } from "~capture_item"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// Keyed maps rather than Sets: every webRequest event yields a fresh object, so a
// Set<CaptureItem> would never dedupe.
const server_services = new Map<string, CaptureItem>()
const layer_services = new Map<string, CaptureItem>()

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const item = request.data as CaptureItem

  if (request.greeting === "new_server") {
    const key = serviceKey(item)
    if (!server_services.has(key)) {
      // Service-level entry: the layer id belongs to the request, not the service.
      server_services.set(key, { ...item, layerId: undefined })
    }
  } else if (request.greeting === "new_layer") {
    const key = captureKey(item)
    if (!layer_services.has(key)) {
      layer_services.set(key, item)
    }
  } else if (request.greeting === "servers") {
    sendResponse([...server_services.values()])
  } else if (request.greeting === "layers") {
    sendResponse([...layer_services.values()])
  }
  return false
})
