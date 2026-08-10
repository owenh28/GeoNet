export const REST_SERVER_TYPES = [
  "FeatureServer",
  "MapServer",
  "ImageServer",
  "VectorTileServer",
  "SceneServer",
  "StreamServer",
  "GeocodeServer",
  "GeometryServer",
  "GPServer"
] as const

export type restServerTypes = (typeof REST_SERVER_TYPES)[number] | "OtherServer"

export const SERVICE_ROOTS = ["/rest/services/", "/geoservices/fgis/"] as const

export type ServiceRoot = (typeof SERVICE_ROOTS)[number]

export interface CaptureItem {
  /** Raw request URL as observed by the webRequest listener. */
  fullUrl: string
  /** Which catalogue root this capture came from. */
  serviceRoot: ServiceRoot
  /** Service catalogue root of the real service, proxy prefix removed. */
  serverUrl: string
  /** Service endpoint up to and including the `*Server` segment, proxy removed. */
  serviceUrl: string
  serviceType: restServerTypes
  /** Folder path plus service name, e.g. `Utilities/Electric`. */
  serviceName?: string
  layerId?: string
  /** Proxy prefix including its trailing `?`, when the request was proxied. */
  proxy?: string
}

function isRestServerType(segment: string): segment is restServerTypes {
  return (REST_SERVER_TYPES as readonly string[]).includes(segment)
}

/**
 * webRequest URL filters covering every catalogue root. Two patterns per root because a
 * match pattern's path must match from the start: one for roots at the path root, one for
 * roots nested under a web-adaptor segment (`/arcgis/rest/services/`).
 */
export function serviceRootUrlFilters(): string[] {
  return SERVICE_ROOTS.flatMap((root) => [`*://*${root}*`, `*://*/*${root}*`])
}

/**
 * Earliest catalogue root present in the URL. Earliest rather than first-declared so a
 * proxy prefix that happens to contain one root does not shadow the real target's root.
 */
export function findServiceRoot(
  url: string
): { root: ServiceRoot; index: number } | null {
  let found: { root: ServiceRoot; index: number } | null = null
  for (const root of SERVICE_ROOTS) {
    const index = url.indexOf(root)
    if (index === -1) continue
    if (!found || index < found.index) found = { root, index }
  }
  return found
}

/**
 * Proxied requests look like `https://host/proxy.ashx?https://gis/arcgis/rest/services/...`.
 * A second scheme only counts as a proxy when it appears before the service root, so
 * query parameters that happen to carry a URL are not mistaken for one.
 */
function splitProxy(rawUrl: string): { proxy?: string; target: string } {
  const rootIndex = findServiceRoot(rawUrl)?.index ?? -1
  const firstScheme = rawUrl.indexOf("http")
  const secondScheme =
    firstScheme === -1 ? -1 : rawUrl.indexOf("http", firstScheme + 1)

  if (secondScheme > 0 && rootIndex > -1 && secondScheme < rootIndex) {
    return {
      proxy: rawUrl.slice(0, secondScheme),
      target: rawUrl.slice(secondScheme)
    }
  }
  return { target: rawUrl }
}

export function parseCaptureUrl(rawUrl: string): CaptureItem | null {
  const { proxy, target } = splitProxy(rawUrl)
  const match = findServiceRoot(target)
  if (!match) return null

  const { root: serviceRoot, index: rootIndex } = match
  const serverUrl = target.slice(0, rootIndex + serviceRoot.length)
  const segments = target
    .slice(rootIndex + serviceRoot.length)
    .split("?")[0]
    .split("/")
    .filter(Boolean)

  const typeIndex = segments.findIndex((segment) => segment.endsWith("Server"))

  if (typeIndex === -1) {
    return {
      fullUrl: rawUrl,
      serviceRoot,
      serverUrl,
      serviceUrl: serverUrl + segments.join("/"),
      serviceType: "OtherServer",
      serviceName: segments.join("/") || undefined,
      proxy
    }
  }

  const typeSegment = segments[typeIndex]
  const layerSegment = segments[typeIndex + 1]

  return {
    fullUrl: rawUrl,
    serviceRoot,
    serverUrl,
    serviceUrl: serverUrl + segments.slice(0, typeIndex + 1).join("/"),
    serviceType: isRestServerType(typeSegment) ? typeSegment : "OtherServer",
    serviceName: segments.slice(0, typeIndex).join("/") || undefined,
    layerId: /^\d+$/.test(layerSegment ?? "") ? layerSegment : undefined,
    proxy
  }
}

/** Service or layer endpoint, without the proxy prefix. */
export function layerUrl(item: CaptureItem): string {
  return item.layerId ? `${item.serviceUrl}/${item.layerId}` : item.serviceUrl
}

/** Endpoint to actually fetch from — routed back through the proxy when there is one. */
export function requestUrl(item: CaptureItem): string {
  return (item.proxy ?? "") + layerUrl(item)
}

/** Dedupe key at layer granularity. */
export function captureKey(item: CaptureItem): string {
  return requestUrl(item)
}

/** Dedupe key at service granularity — every layer of a service collapses to one entry. */
export function serviceKey(item: CaptureItem): string {
  return (item.proxy ?? "") + item.serviceUrl
}