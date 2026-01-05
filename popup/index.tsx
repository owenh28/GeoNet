import { ActionIcon, Box, Flex, MantineProvider, Menu, Tooltip } from "@mantine/core";
import { IconCopy, IconDownload, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import clsx from "clsx";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useEffect, useMemo, useState } from "react";



import { theme } from "~/theme/theme";





import classes = Menu.classes

require("./popup.css")

interface Service {
  layer_name: string
  url: string
}

async function getLayerNames(layer_url: string[]): Promise<Set<Service>> {
  const return_set = new Set<Service>();
  for (const layer_url_value of layer_url) {
    try {
      const response = await fetch(layer_url_value + "?f=pjson")
      if (!response.ok) {
        throw new Error("Failed to fetch layer name")
      }
      const data = await response.json()
      return_set.add({ url: layer_url_value, layer_name: data.name })
    } catch (error) {
      console.log(error.message)
      return_set.add({ url: layer_url_value, layer_name: "Failed to fetch layer name" })
    }
  }
  return return_set
}

async function update(): Promise<Service[]> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })
  const response: string[] = await chrome.tabs.sendMessage(tab.id, {
    greeting: "layers"
  })
  const layer_infos = await getLayerNames(response)

  // console.log(response)
  const tmp_data: Service[] = []
  layer_infos.forEach((value) => {
    tmp_data.push(value)
  })

  return tmp_data
}
const csvConfig = mkConfig({
  fieldSeparator: ",",
  decimalSeparator: ".",
  useKeysAsHeaders: true
})

function IndexPopup() {
  const [data, setData] = useState<Service[]>([])
  const [ref_btn] = useState(0)
  const getData = async () => {
    const dat = await update()
    setData(dat)
  }
  useEffect(() => {
    getData()
  }, [ref_btn])

  const columns = useMemo<MRT_ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: "layer_name",
        header: "Layer Name",
        enableHiding: false
      },
      {
        accessorKey: "url",
        header: "URL",
        enableHiding: false,
        size: 50,
        grow: true
      }
    ],
    []
  )

  const exportData = () => {
    // @ts-ignore
    const dataDownload = generateCsv(csvConfig)(data)
    download(csvConfig)(dataDownload)
  }

  const table = useMantineReactTable({
    data,
    columns,
    enableGlobalFilter: false,
    enableClickToCopy: true,
    enableBottomToolbar: false,
    enableTopToolbar: true,
    renderToolbarInternalActions: () => (
      <Flex gap={'xs'} align={'center'}>
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
    ),
    enableColumnActions: false,
    mantineTableProps: {
      className: clsx(classes.table)
    },
    renderEmptyRowsFallback: () => (
      <h3 id={"no-rows"}>No ArcGIS Servers found</h3>
    ),
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Box display="flex">
        <Tooltip label={"Open Link"}>
        <ActionIcon variant={"transparent"}
          onClick={() => {
            const url: string = row.original.url
            window.open(url)
          }}>
          <IconExternalLink />
        </ActionIcon>
        </Tooltip>
        <Tooltip label={"Copy Link to Clipboard"}>
        <ActionIcon variant={"transparent"}
          onClick={() => navigator.clipboard.writeText(row.original.url)}
          color={"red"}>
          <IconCopy />
        </ActionIcon>
        </Tooltip>
      </Box>
    )
  })

  return (
    <MantineProvider theme={theme} defaultColorScheme={"auto"}>
      <div
        style={{
          padding: 16
        }}>
        <h1>ArcGIS Servers found on this site:</h1>
        <MantineReactTable table={table} />
      </div>
    </MantineProvider>
  )
}

export default IndexPopup
