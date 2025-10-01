import {
  ActionIcon,
  Box,
  Button,
  DEFAULT_THEME,
  MantineProvider,
  Menu,
  Tooltip,
  useMantineColorScheme
} from "@mantine/core"
import {
  IconArrowsSort,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconRefresh
} from "@tabler/icons-react"
import clsx from "clsx"
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_Icons
} from "mantine-react-table"
import { useEffect, useMemo, useState } from "react"

import { theme } from "~/theme/theme"

import classes = Menu.classes

require("./popup.css")

interface Service {
  url: string
}

async function update(): Promise<Service[]> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })
  const response: string[] = await chrome.tabs.sendMessage(tab.id, {
    greeting: "servers"
  })
  // console.log(response)
  const tmp_data: Service[] = []
  response.forEach((value) => {
    let j: Service = { url: value }
    tmp_data.push(j)
  })

  return tmp_data
}
function downloadData(){
  // todo: create the function to download the table
}
function prepareDownload(data: Service[]) {}

function IndexPopup() {
  const [data, setData] = useState<Service[]>([])
  const [ref_btn, setRef_btn] = useState(0)
  // const colorScheme = useMantineColorScheme()
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
        accessorKey: "url",
        header: "URL",
        enableHiding: false
      }
    ],
    []
  )

  const table = useMantineReactTable({
    data,
    columns,
    enableGlobalFilter: false,
    enableClickToCopy: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableColumnActions: false,
    mantineTableProps: {
      className: clsx(classes.table)
    },
    renderEmptyRowsFallback: ({ table }) => (
      <h3 id={"no-rows"}>No ArcGIS Servers found</h3>
    ),
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Box display="flex">
        <ActionIcon
          onClick={() => {
            const url: string = row.original.url
            window.open(url)
          }}>
          <IconExternalLink />
        </ActionIcon>
        <ActionIcon
          onClick={() => navigator.clipboard.writeText(row.original.url)}
          color={"red"}>
          <IconCopy />
        </ActionIcon>
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
        <div>
          <Tooltip label={"Refresh list of servers"}>
            <Button
              id="refresh"
              onClick={() => getData()}
              variant={"outline"}
              leftSection={<IconRefresh />}>
              Refresh
            </Button>
          </Tooltip>
          <Tooltip label={"Download a list of all servers in table"}>
            <Button
              id="download"
              variant={"outline"}
              onClick={()=> downloadData()}
              leftSection={<IconDownload />}>

              Download List
            </Button>
          </Tooltip>
        </div>
        <MantineReactTable table={table} />
      </div>
    </MantineProvider>
  )
}

export default IndexPopup
