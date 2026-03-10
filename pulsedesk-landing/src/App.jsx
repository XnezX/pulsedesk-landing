import React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { buildTheme } from "./app/theme";
import AppRouter from "./app/router";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const [mode, setMode] = React.useState(() => {
    const saved = localStorage.getItem("pulsedesk_theme_mode");
    return saved === "dark" ? "dark" : "light";
  });

  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("pulsedesk_theme_mode", next);
      return next;
    });
  };

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter mode={mode} onToggleMode={toggleMode} />
      </ThemeProvider>
    </AuthProvider>
  );
}
