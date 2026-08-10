import { parseCaptureUrl, serviceRootUrlFilters } from "~capture_item"





chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return

    const capturedService = parseCaptureUrl(details.url)
    if (!capturedService) return

    // sendMessage rejects when the tab has no content script listening (chrome://,
    // pre-injection navigations); swallow it rather than logging an unhandled rejection.
    const notify = (greeting: string) =>
      chrome.tabs
        .sendMessage(details.tabId, { greeting, data: capturedService })
        .catch(() => undefined)

    notify("new_server")
    if (capturedService.layerId) {
      notify("new_layer")
    }
  },
  { urls: serviceRootUrlFilters() }
)
