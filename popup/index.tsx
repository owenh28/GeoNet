import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { MaterialReactTable, MRT_ActionMenuItem, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useEffect, useMemo, useState } from "react";





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
function prepareDownload(data: Service[]){

}

function IndexPopup() {
  const [data, setData] = useState<Service[]>([])
  const [ref_btn, setRef_btn]=useState(0)
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

  const table = useMaterialReactTable({
    data,
    columns,
    enableGlobalFilter: false,
    enableClickToCopy: true,
    enableCellActions: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableColumnActions: false,
    renderEmptyRowsFallback: ({ table }) => (
      <h3 id={"no-rows"}>No ArcGIS Servers found</h3>
    ),
    renderCellActionMenuItems: ({ closeMenu, cell, row, table }) => [
      <MRT_ActionMenuItem
        icon={<OpenInNewIcon />}
        label={"Open"}
        onClick={() => {
          const url:string = cell.getValue().toString()
          window.open(url)
          closeMenu()
        }}
        table={table}
      />
    ]
  })

  return (
    <div
      style={{
        padding: 16
      }}>
      <h1>ArcGIS Servers found on this site:</h1>
      <div>
        <button id="refresh" onClick={() =>getData()}>Refresh</button>
        <button id="download">
          Download List
        </button>
      </div>
      <MaterialReactTable table={table} />
    </div>
  )
}

export default IndexPopup
