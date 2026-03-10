import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import Calculator from "../tools/Calculator";
import Notepad from "../tools/Notepad";
import Spreadsheet from "../tools/Spreadsheet";

export default function AppLayout({ children, mode, onToggleMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de herramientas flotantes
  const [openTools, setOpenTools] = useState({ notepad: false, calc: false, sheet: false });

  const toggleTool = (key) =>
    setOpenTools((prev) => ({ ...prev, [key]: !prev[key] }));

  const searchValue = searchParams.get("q") ?? "";

  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        openTools={openTools}
        onToolToggle={toggleTool}
      />

      {/* Main area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${sidebarW}px` },
          transition: "margin-left 0.2s ease",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            width: "100%",
            backdropFilter: "blur(10px)",
            backgroundColor:
              theme.palette.mode === "light"
                ? "rgba(255,255,255,0.8)"
                : "rgba(18,26,43,0.7)",
            borderBottom: "1px solid",
            borderColor: "divider",
            color: "text.primary",
          }}
        >
          <Toolbar disableGutters sx={{ px: 2, gap: 1 }}>
            {/* Hamburger mobile */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Search */}
            <TextField
              size="small"
              placeholder="Buscar por nombre o teléfono…"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 420 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchValue ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleSearch("")}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            {/* Theme toggle */}
            <IconButton onClick={onToggleMode} aria-label="Cambiar tema">
              {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
      </Box>

      {/* Herramientas flotantes */}
      <Calculator  open={openTools.calc}    onClose={() => setOpenTools((p) => ({ ...p, calc: false }))} />
      <Notepad     open={openTools.notepad} onClose={() => setOpenTools((p) => ({ ...p, notepad: false }))} />
      <Spreadsheet open={openTools.sheet}   onClose={() => setOpenTools((p) => ({ ...p, sheet: false }))} />
    </Box>
  );
}
