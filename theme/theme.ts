import {
  createTheme,
  DEFAULT_THEME,
  mergeMantineTheme,
  Tooltip
} from "@mantine/core"

const themeOverride = createTheme({
  primaryColor: "blue",
  components: {
    Tooltip: Tooltip.extend({
      defaultProps: {
        transitionProps: { transition: 'fade', duration: 300 },
        position: "bottom",
        openDelay: 500,
      }
    })
  }
})
export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride)