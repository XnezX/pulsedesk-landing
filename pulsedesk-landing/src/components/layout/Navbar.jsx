import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../context/AuthContext";

const publicLinks = [
  { label: "Funciones", href: "#features" },
  { label: "Precios", href: "#pricing" },
  { label: "Opiniones", href: "#testimonials" },
];

export default function Navbar({ mode, onToggleMode }) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, profile, signOut } = useAuth();
  const location = useLocation();

  const isApp = location.pathname.startsWith("/app");

  // Links del panel según rol
  const appLinks = [
    { label: "Contactos", to: "/app" },
    { label: "Importar CSV", to: "/app/import" },
    ...(profile?.role === "admin"
      ? [{ label: "Admin", to: "/app/admin", chip: "admin" }]
      : []),
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
          backgroundColor:
            theme.palette.mode === "light"
              ? "rgba(255,255,255,0.7)"
              : "rgba(18,26,43,0.6)",
          borderBottom:
            theme.palette.mode === "light"
              ? "1px solid rgba(32,30,31,0.08)"
              : "1px solid rgba(236,226,198,0.08)",
          color: "text.primary",
        }}
      >
        <Toolbar disableGutters>
          <Container>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              {/* Logo */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
                component={RouterLink}
                to={session ? "/app" : "/"}
                sx={{ textDecoration: "none", color: "inherit" }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    background:
                      theme.palette.mode === "light"
                        ? "linear-gradient(135deg, rgba(57,67,183,1), rgba(68,157,209,1))"
                        : "linear-gradient(135deg, rgba(120,192,224,1), rgba(68,157,209,1))",
                  }}
                />
                <Typography sx={{ fontWeight: 800, letterSpacing: -0.4 }}>
                  PulseDesk
                </Typography>
              </Stack>

              {/* Desktop links */}
              <Stack direction="row" alignItems="center" spacing={1}>
                {!isSm && (
                  <>
                    {isApp && session
                      ? appLinks.map((l) => (
                          <Button
                            key={l.to}
                            component={RouterLink}
                            to={l.to}
                            color="inherit"
                            endIcon={
                              l.chip ? (
                                <Chip
                                  label={l.chip}
                                  size="small"
                                  color="error"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              ) : null
                            }
                          >
                            {l.label}
                          </Button>
                        ))
                      : publicLinks.map((l) => (
                          <Button key={l.label} href={l.href} color="inherit">
                            {l.label}
                          </Button>
                        ))}
                  </>
                )}

                <IconButton onClick={onToggleMode} aria-label="Cambiar tema">
                  {mode === "light" ? (
                    <DarkModeOutlinedIcon />
                  ) : (
                    <LightModeOutlinedIcon />
                  )}
                </IconButton>

                {!isSm && (
                  <>
                    {session ? (
                      <Button variant="outlined" onClick={signOut}>
                        Cerrar sesión
                      </Button>
                    ) : (
                      <>
                        <Button
                          component={RouterLink}
                          to="/login"
                          variant="outlined"
                        >
                          Ver demo
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/login"
                          variant="contained"
                        >
                          Empezar
                        </Button>
                      </>
                    )}
                  </>
                )}

                {isSm && (
                  <IconButton
                    onClick={() => setMobileOpen(true)}
                    aria-label="Abrir menú"
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography sx={{ fontWeight: 800 }}>PulseDesk</Typography>
            <IconButton
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <List disablePadding>
            {(isApp && session ? appLinks : publicLinks).map((l) => (
              <ListItemButton
                key={l.label ?? l.to}
                component={l.to ? RouterLink : "a"}
                to={l.to}
                href={l.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={l.label} />
                {l.chip && (
                  <Chip label={l.chip} size="small" color="error" />
                )}
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            {session ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
              >
                Cerrar sesión
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  onClick={() => setMobileOpen(false)}
                >
                  Ver demo
                </Button>
                <Button
                  fullWidth
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  onClick={() => setMobileOpen(false)}
                >
                  Empezar
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
