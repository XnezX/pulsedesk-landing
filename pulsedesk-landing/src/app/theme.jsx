import { createTheme } from "@mui/material/styles";

const baseTokens = {
  radius: 16,
};

const lightPalette = {
  mode: "light",
  primary: { main: "#3943B7" },
  secondary: { main: "#449DD1" },
  background: { default: "#F7F7FB", paper: "#FFFFFF" },
  text: { primary: "#201E1F", secondary: "rgba(32, 30, 31, 0.7)" },
};

const darkPalette = {
  mode: "dark",
  primary: { main: "#78C0E0" },
  secondary: { main: "#449DD1" },
  background: { default: "#0B1220", paper: "#121A2B" },
  text: { primary: "#ECE2C6", secondary: "rgba(236, 226, 198, 0.75)" },
};

function getCommonComponentsOverrides(theme) {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            theme.palette.mode === "light"
              ? "radial-gradient(800px circle at 10% 10%, rgba(68,157,209,0.18), transparent 60%), radial-gradient(700px circle at 90% 20%, rgba(57,67,183,0.16), transparent 55%)"
              : "radial-gradient(800px circle at 10% 10%, rgba(120,192,224,0.12), transparent 60%), radial-gradient(700px circle at 90% 20%, rgba(68,157,209,0.10), transparent 55%)",
          backgroundAttachment: "fixed",
        },
        a: { color: "inherit" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: baseTokens.radius,
          border:
            theme.palette.mode === "light"
              ? "1px solid rgba(32,30,31,0.08)"
              : "1px solid rgba(236,226,198,0.08)",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },
    MuiContainer: {
      defaultProps: { maxWidth: "lg" },
    },
  };
}

export function buildTheme(mode = "light") {
  const palette = mode === "dark" ? darkPalette : lightPalette;

  const theme = createTheme({
    palette,
    shape: { borderRadius: baseTokens.radius },
    typography: {
      fontFamily:
        'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 800, letterSpacing: -1.2 },
      h2: { fontWeight: 800, letterSpacing: -0.8 },
      h3: { fontWeight: 750 },
      button: { fontWeight: 700 },
    },
  });

  theme.components = getCommonComponentsOverrides(theme);
  return theme;
}
