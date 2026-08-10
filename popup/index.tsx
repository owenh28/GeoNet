import { getLayer } from "@esri/arcgis-rest-feature-service"
import {
  ActionIcon,
  Badge,
  Box,
  Flex,
  MantineProvider,
  Tooltip
} from "@mantine/core"
import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconRefresh
} from "@tabler/icons-react"
import { download, generateCsv, mkConfig } from "export-to-csv"
import { DataTable } from "mantine-datatable"
import { useEffect, useState } from "react"

import { theme } from "~/theme/theme"
import { requestUrl, type CaptureItem } from "~capture_item"





require("./popup.css")

const TABLE_HEIGHT = 420

interface LayerRow extends CaptureItem {
  layerName: string
  /** Fetchable endpoint — proxied when the capture came through a proxy. */
  url: string
}

async function resolveLayer(item: CaptureItem): Promise<LayerRow> {
  const url = requestUrl(item)
  const fallback = item.serviceName ?? item.serviceUrl
  const nameable =
    item.layerId !== undefined &&
    !url.includes("tilemap") &&
    (item.serviceType === "FeatureServer" || item.serviceType === "MapServer")

  if (!nameable) {
    return { ...item, url, layerName: fallback }
  }

  try {
    const layer = await getLayer({ url })
    return { ...item, url, layerName: String(layer.name ?? fallback) }
  } catch (error) {
    console.log(error.message)
    return { ...item, url, layerName: "Failed to fetch layer name" }
  }
}

async function update(): Promise<LayerRow[]> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })

  const response: CaptureItem[] = await chrome.tabs.sendMessage(tab.id, {
    greeting: "layers"
  })

  return Promise.all((response ?? []).map(resolveLayer))
}

const csvConfig = mkConfig({
  fieldSeparator: ",",
  decimalSeparator: ".",
  useKeysAsHeaders: true
})

function UrlCell({ url }: { url: string }) {
  // URLs carry no spaces, so normal wrapping alone leaves the cell overflowing;
  // `anywhere` lets the break land mid-token.
  return (
    <Box
      style={{
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }}>
      {url}
    </Box>
  )
}

function ActionsCell({ url }: { url: string }) {
  function handleAuxClick(e: React.MouseEvent, target: string) {
    e.preventDefault()
    if (e.button === 1) {
      window.open(target)
    }
  }

  return (
    <Flex gap={4} align="center" justify="center" wrap="nowrap">
      <Tooltip label={"Open Link"}>
        <ActionIcon
          size="sm"
          variant={"transparent"}
          onClick={() => window.open(url)}
          onAuxClick={(e) => handleAuxClick(e, url)}>
          <IconExternalLink size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={"Copy Link to Clipboard"}>
        <ActionIcon
          size="sm"
          variant={"transparent"}
          onClick={() => navigator.clipboard.writeText(url)}
          color={"red"}>
          <IconCopy size={16} />
        </ActionIcon>
      </Tooltip>
    </Flex>
  )
}

function IndexPopup() {
  const [data, setData] = useState<LayerRow[]>([])
  const [ref_btn] = useState(0)

  const getData = async () => {
    const dat = await update()
    setData(dat)
  }

  useEffect(() => {
    getData().then()
  }, [ref_btn])

  const exportData = () => {
    // @ts-ignore
    const dataDownload = generateCsv(csvConfig)(data)
    download(csvConfig)(dataDownload)
  }
  const handleCellClick = (event, record, index, column, columnIndex) => {
    navigator.clipboard.writeText(record[column.accessor])
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme={"auto"}>
      <div
        style={{
          padding: 16
        }}>
        <Flex justify="space-between" align="center" mb="md">
          <h3>ArcGIS layers found on this site:</h3>
          <Flex gap={"xs"} align={"center"}>
            <Tooltip label={"Download List"}>
              <ActionIcon onClick={() => exportData()} variant={"transparent"}>
                <IconDownload />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={"Refresh Data"}>
              <ActionIcon onClick={() => getData()} variant={"transparent"}>
                <IconRefresh />
              </ActionIcon>
            </Tooltip>
          </Flex>
        </Flex>
        <DataTable
          withTableBorder
          borderRadius="sm"
          withColumnBorders
          striped
          highlightOnHover
          pinLastColumn
          verticalAlign="top"
          height={TABLE_HEIGHT}
          idAccessor="url"
          records={data}
          className={"mantine-datatable"}
          onCellClick={({ event, record, index, column, columnIndex }) =>
            handleCellClick(event, record, index, column, columnIndex)
          }
          noRecordsText="No ArcGIS Servers found"
          columns={[
            {
              accessor: "layerName",
              title: "Layer Name",
              width: 200,
              ellipsis: true,
              resizable: true
            },
            {
              accessor: "serviceName",
              title: "Service",
              width: 180,
              ellipsis: true,
              resizable: true,
              render: ({ serviceName }) => serviceName ?? "—"
            },
            {
              accessor: "serviceType",
              title: "Type",
              width: 160,
              render: ({ serviceType, serviceRoot, proxy }) => (
                <Flex gap={4} align="center" wrap="wrap">
                  <Badge size="sm" variant="light">
                    {serviceType}
                  </Badge>
                  {serviceRoot === "/geoservices/fgis/" ? (
                    <Badge size="sm" variant="outline" color="grape">
                      fgis
                    </Badge>
                  ) : null}
                  {proxy ? (
                    <Tooltip label={proxy}>
                      <Badge size="sm" variant="outline" color="orange">
                        proxy
                      </Badge>
                    </Tooltip>
                  ) : null}
                </Flex>
              )
            },
            {
              accessor: "layerId",
              title: "Layer",
              width: 70,
              textAlign: "center",
              render: ({ layerId }) => layerId ?? "—"
            },
            {
              accessor: "url",
              title: "URL",
              width: 320,
              resizable: true,
              noWrap: false,
              render: ({ url }) => <UrlCell url={url} />
            },
            {
              accessor: "actions",
              title: "Actions",
              width: 90,
              textAlign: "center",
              sortable: false,
              render: ({ url }) => <ActionsCell url={url} />
            }
          ]}
        />
      </div>
    </MantineProvider>
  )
}

export default IndexPopup
