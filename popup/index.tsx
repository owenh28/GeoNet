import {getLayer} from "@esri/arcgis-rest-feature-service";
import {ActionIcon, Box, Flex, MantineProvider, Tooltip} from "@mantine/core";
import {IconCopy, IconDownload, IconExternalLink, IconRefresh} from "@tabler/icons-react";
import {download, generateCsv, mkConfig} from "export-to-csv";
import {DataTable} from "mantine-datatable";
import {useEffect, useRef, useState} from "react";


import {theme} from "~/theme/theme";


require("./popup.css")

interface Service {
  layer_name: string
  url: string
}

async function getLayerNames(layer_url: string[]): Promise<Set<Service>> {
  const return_set = new Set<Service>();
  for (const layer_url_value of layer_url) {
    try {
      if (!layer_url_value.includes("tilemap")) {
        await getLayer({ url: layer_url_value }).then((layer) => {
          console.log(layer.name.toString())
          return_set.add({
            url: layer_url_value,
            layer_name: layer.name.toString()
          })
        })
      }
      else{
        return_set.add({
          url: layer_url_value,
          layer_name: "Failed to fetch layer name"
        })
      }

      // getService({url: layer_url_value}).then((layer) => {
      //   console.log(layer)
      //   return_set.add({ url: layer_url_value, layer_name: layer.layers[0].name })
      // })
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

function UrlCell({ url }: { url: string }) {
  const textRef = useRef<HTMLDivElement>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const check = () => setTruncated(el.scrollWidth > el.clientWidth)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [url])
  function handleAuxClick(e:MouseEvent, url:string){
    e.preventDefault();
    if(e.button === 1){
      window.open(url)
    }
  }

  return (
    <Box style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <Tooltip
        label={url}
        openDelay={1000}
        disabled={!truncated}
        multiline
        w={300}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <Box
          ref={textRef}
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
          {url}
        </Box>
      </Tooltip>
      <Tooltip label={"Open Link"}>
        <ActionIcon
          size="sm"
          variant={"transparent"}
          onClick={() => {
            window.open(url)
          }}
        onAuxClick={(e) => handleAuxClick(e, url) }>
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
    </Box>
  )
}

function IndexPopup() {
  const [data, setData] = useState<Service[]>([])
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

  return (
    <MantineProvider theme={theme} defaultColorScheme={"auto"}>
      <div
        style={{
          padding: 16
        }}>
        <Flex justify="space-between" align="center" mb="md">
          <h3>ArcGIS layers found on this site:</h3>
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
        </Flex>
        <DataTable
          withTableBorder
          borderRadius="sm"
          withColumnBorders
          striped
          highlightOnHover
          records={data}
          className={"mantine-datatable"}
          noRecordsText="No ArcGIS Servers found"
          columns={[
            {
              accessor: "layer_name",
              title: "Layer Name",
              width: "45%",
              ellipsis: true,
              resizable: true,
            },
            {
              accessor: "url",
              title: "URL",
              width: 100,
              resizable: true,
              ellipsis: true,
              render: ({ url }) => <UrlCell url={url} />
            }
          ]}
        />
      </div>
    </MantineProvider>
  )
}

export default IndexPopup
