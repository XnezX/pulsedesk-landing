import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

const mockRows = [
  { id: "C-1001", name: "César Olaf Gutiérrez", campaign: "Cobranza", status: "En proceso", color: "warning" },
  { id: "C-1002", name: "María Fernanda López", campaign: "Ventas", status: "Nuevo", color: "info" },
  { id: "C-1003", name: "Jorge Ramírez", campaign: "Cobranza", status: "Cerrado", color: "success" },
];

const statusColors = {
  warning: { bg: "#FFF3E0", text: "#E65100" },
  info: { bg: "#E3F2FD", text: "#0D47A1" },
  success: { bg: "#E8F5E9", text: "#1B5E20" },
};

const statusColorsDark = {
  warning: { bg: "rgba(255,152,0,0.18)", text: "#FFB74D" },
  info: { bg: "rgba(33,150,243,0.15)", text: "#90CAF9" },
  success: { bg: "rgba(76,175,80,0.15)", text: "#A5D6A7" },
};

export default function Hero() {
  return (
    <Box sx={{ py: { xs: 7, md: 10 } }}>
      <Container>
        <Stack spacing={3} alignItems="flex-start">
          <Chip
            icon={<BoltOutlinedIcon />}
            label="CRM ligero para equipos de contact center"
            variant="outlined"
          />

          <Typography variant="h2" sx={{ lineHeight: 1.05 }}>
            Gestiona contactos y seguimientos
            <Box component="span" sx={{ display: "block", opacity: 0.9 }}>
              sin perder velocidad.
            </Box>
          </Typography>

          <Typography sx={{ fontSize: 18, maxWidth: 720, opacity: 0.85 }}>
            PulseDesk centraliza tus contactos, tipificaciones e historial en
            una interfaz clara. Ideal para operación diaria: rápido, ordenado y
            enfocado.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              size="large"
              variant="contained"
              component={RouterLink}
              to="/demo"
            >
              Probar ahora
            </Button>
            <Button size="large" variant="outlined" href="#features">
              Ver cómo funciona
            </Button>
          </Stack>

          {/* Mockup del dashboard */}
          <Paper sx={{ p: { xs: 2, md: 3 }, width: "100%", mt: 2, overflow: "hidden" }}>
            {/* Header del mock */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography sx={{ fontWeight: 800 }}>Panel de Contactos</Typography>
              <Stack direction="row" spacing={1.5}>
                {[
                  { icon: <PeopleOutlinedIcon sx={{ fontSize: 16 }} />, label: "3 contactos" },
                  { icon: <SpeedOutlinedIcon sx={{ fontSize: 16 }} />, label: "2 activos" },
                  { icon: <HistoryOutlinedIcon sx={{ fontSize: 16 }} />, label: "5 gestiones" },
                ].map((s) => (
                  <Stack
                    key={s.label}
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ opacity: 0.75 }}
                  >
                    {s.icon}
                    <Typography sx={{ fontSize: 13 }}>{s.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Filas de contactos mock */}
            <Stack spacing={1}>
              {mockRows.map((row) => (
                <Box
                  key={row.id}
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "rgba(0,0,0,0.02)"
                        : "rgba(255,255,255,0.03)",
                  })}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ fontSize: 12, opacity: 0.6, fontWeight: 700, minWidth: 52 }}>
                      {row.id}
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {row.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: 12, opacity: 0.65 }}>
                      {row.campaign}
                    </Typography>
                    <Box
                      sx={(theme) => {
                        const palette =
                          theme.palette.mode === "light"
                            ? statusColors
                            : statusColorsDark;
                        return {
                          px: 1,
                          py: 0.25,
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: palette[row.color].bg,
                          color: palette[row.color].text,
                        };
                      }}
                    >
                      {row.status}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
