import { NavLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import { useAuth } from "../../context/AuthContext";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const navItems = [
  {
    label: "Contactos",
    to: "/app",
    icon: <PeopleOutlinedIcon />,
    roles: ["agent", "supervisor", "admin"],
    exact: true,
  },
  {
    label: "Importar CSV / XML",
    to: "/app/import",
    icon: <UploadFileOutlinedIcon />,
    roles: ["admin"],
  },
  {
    label: "Administración",
    to: "/app/admin",
    icon: <AdminPanelSettingsOutlinedIcon />,
    roles: ["admin"],
    chip: "admin",
  },
];

// Herramientas solo para agentes
const toolItems = [
  { key: "notepad", label: "Bloc de notas", icon: <NoteAltOutlinedIcon /> },
  { key: "calc",    label: "Calculadora",   icon: <CalculateOutlinedIcon /> },
  { key: "sheet",   label: "Tabla / Excel", icon: <GridOnOutlinedIcon /> },
];

const roleColor = { agent: "default", supervisor: "warning", admin: "error" };

function SidebarContent({ onClose, collapsed, onToggle, openTools, onToolToggle }) {
  const theme = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role ?? "agent";

  const visibleItems = navItems.filter((i) => i.roles.includes(role));
  const isAgent = role === "agent";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Stack
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        height: "100%",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{ px: collapsed ? 1.5 : 2.5, py: 2.5, minHeight: 64, transition: "padding 0.2s" }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            flexShrink: 0,
            background:
              theme.palette.mode === "light"
                ? "linear-gradient(135deg, rgba(57,67,183,1), rgba(68,157,209,1))"
                : "linear-gradient(135deg, rgba(120,192,224,1), rgba(68,157,209,1))",
          }}
        />
        {!collapsed && (
          <Typography sx={{ fontWeight: 800, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
            PulseDesk
          </Typography>
        )}
      </Stack>

      <Divider />

      {/* Contenido scrollable */}
      <Box sx={{ flexGrow: 1, py: 1, overflowY: "auto", overflowX: "hidden" }}>

        {/* Nav principal */}
        <List disablePadding>
          {visibleItems.map((item) => (
            <Tooltip key={item.to} title={collapsed ? item.label : ""} placement="right" arrow>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.3,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  "&.active": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>{item.icon}</ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }}
                    />
                    {item.chip && (
                      <Chip label={item.chip} size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </>
                )}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>

        {/* Sección Herramientas — solo agentes */}
        {isAgent && (
          <>
            <Box sx={{ px: collapsed ? 0 : 2, pt: 2, pb: 0.5 }}>
              {!collapsed ? (
                <Typography
                  sx={{ fontSize: 10, fontWeight: 700, opacity: 0.45, textTransform: "uppercase", letterSpacing: 0.8 }}
                >
                  Herramientas
                </Typography>
              ) : (
                <Divider sx={{ mx: 1 }} />
              )}
            </Box>

            <List disablePadding>
              {toolItems.map((tool) => {
                const isOpen = openTools?.[tool.key] ?? false;
                return (
                  <Tooltip key={tool.key} title={collapsed ? tool.label : ""} placement="right" arrow>
                    <ListItemButton
                      onClick={() => { onToolToggle(tool.key); onClose(); }}
                      sx={{
                        mx: 1,
                        borderRadius: 2,
                        mb: 0.3,
                        justifyContent: collapsed ? "center" : "flex-start",
                        px: collapsed ? 1.5 : 2,
                        ...(isOpen && {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                          "&:hover": { bgcolor: "primary.dark" },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>{tool.icon}</ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={tool.label}
                          slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </>
        )}
      </Box>

      {/* Botón colapsar */}
      <Box sx={{ display: "flex", justifyContent: collapsed ? "center" : "flex-end", px: 1, pb: 0.5 }}>
        <Tooltip title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"} placement="right">
          <IconButton size="small" onClick={onToggle}>
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Usuario + logout */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? "center" : "flex-start"}
        spacing={collapsed ? 0 : 1.2}
        sx={{ px: collapsed ? 1 : 2, py: 1.8, transition: "padding 0.2s" }}
      >
        <Tooltip title={collapsed ? (profile?.full_name ?? "Usuario") : ""} placement="right">
          <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "primary.main", flexShrink: 0 }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </Avatar>
        </Tooltip>

        {!collapsed && (
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {profile?.full_name ?? "Usuario"}
            </Typography>
            <Chip
              label={role}
              size="small"
              color={roleColor[role] ?? "default"}
              sx={{ height: 16, fontSize: 10, width: "fit-content" }}
            />
          </Stack>
        )}

        <Tooltip title="Cerrar sesión" placement="right">
          <IconButton size="small" onClick={handleSignOut}>
            <LogoutOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

// Desktop: fija. Mobile: drawer controlado desde fuera
export default function Sidebar({ mobileOpen, onClose, collapsed, onToggle, openTools, onToolToggle }) {
  return (
    <>
      {/* Desktop */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: (t) => t.zIndex.drawer,
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          transition: "width 0.2s ease",
        }}
      >
        <SidebarContent
          onClose={() => {}}
          collapsed={collapsed}
          onToggle={onToggle}
          openTools={openTools}
          onToolToggle={onToolToggle}
        />
      </Box>

      {/* Mobile drawer (siempre expandido) */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
      >
        <SidebarContent
          onClose={onClose}
          collapsed={false}
          onToggle={() => {}}
          openTools={openTools}
          onToolToggle={onToolToggle}
        />
      </Drawer>
    </>
  );
}
