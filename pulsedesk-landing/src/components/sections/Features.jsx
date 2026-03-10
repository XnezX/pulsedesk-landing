import React from "react";
import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

const items = [
  {
    icon: <ManageSearchOutlinedIcon />,
    title: "Búsqueda veloz",
    desc: "Encuentra contactos por nombre o teléfono sin fricción.",
  },
  {
    icon: <HistoryOutlinedIcon />,
    title: "Historial claro",
    desc: "Cada gestión queda registrada con tipificación y notas.",
  },
  {
    icon: <ShieldOutlinedIcon />,
    title: "Roles simples",
    desc: "Agente, supervisor y admin con permisos coherentes.",
  },
];

export default function Features() {
  return (
    <Box id="features" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <Stack spacing={1}>
          <Typography variant="h3">Funciones que importan</Typography>
          <Typography sx={{ opacity: 0.8, maxWidth: 760 }}>
            Sin florituras innecesarias: lo esencial para operar bien todos los
            días.
          </Typography>
        </Stack>

        <Grid container spacing={2.5} sx={{ mt: 2 }}>
          {items.map((x) => (
            <Grid key={x.title} size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Stack spacing={1.2}>
                  <Box sx={{ fontSize: 28 }}>{x.icon}</Box>
                  <Typography sx={{ fontWeight: 800 }}>{x.title}</Typography>
                  <Typography sx={{ opacity: 0.8 }}>{x.desc}</Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
