import {
  AppShell,
  Box,
  Combobox,
  Input,
  InputBase,
  MantineProvider,
  useCombobox,
  Container
} from "@mantine/core"
import { useState } from "react"



import { theme } from "~theme/theme";





require('./options.css')




const themeModes = ['dark','light','auto']

function OptionsIndex(){
  // const [color, setColor] = useState("")
  const [mode, setMode] = useState('auto')
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const options = themeModes.map((item) => (
    <Combobox.Option value={item} key={item}>
      item
    </Combobox.Option>
  ));
  return(
        <div>
      <h1>
        Options Page
      </h1>
      <div>
      <h2>Theme Settings</h2>
        <Combobox width={300} classNames={{group:'cbx-group'}} store={combobox} onOptionSubmit={(val)=> {setMode(val);
        combobox.closeDropdown();}}>
          <Combobox.Target>
            <InputBase
              component="button"
              type="button"
              pointer
              rightSection={<Combobox.Chevron />}
              rightSectionPointerEvents="none"
              onClick={() => combobox.toggleDropdown()}
            >
              {mode || <Input.Placeholder>Change Theme Mode</Input.Placeholder>}
            </InputBase>
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </div>
      {/*<input onChange={(e) => setColor(e.target.value)} value={color}/>*/}
    </div>

  )
}
function Application(){
  return(
    <MantineProvider theme={theme} defaultColorScheme={"auto"}>
    <AppShell
      padding="md"
      header={{ height: 60 }}


    >
      <AppShell.Main>
        <Container>
        <Box w={1000}>
        <OptionsIndex/>
        </Box>
        </Container>
      </AppShell.Main>
    </AppShell>
  </MantineProvider>
  )
}

    export default Application
