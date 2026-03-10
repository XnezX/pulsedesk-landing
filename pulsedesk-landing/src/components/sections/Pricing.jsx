import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const plans = [
  {
    name: "Starter",
    price: "$0",
    hint: "Para demo",
    features: ["Login simulado", "Contactos (mock)", "UI completa"],
    cta: "Explorar",
    variant: "outlined",
  },
  {
    name: "Team",
    price: "$19",
    hint: "por usuario/mes",
    features: ["Roles", "Historial", "Export CSV (básico)"],
    cta: "Empezar",
    variant: "contained",
    popular: true,
  },
  {
    name: "Ops",
    price: "$39",
    hint: "por usuario/mes",
    features: ["Métricas", "Filtros", "Plantillas de tipificación"],
    cta: "Hablar",
    variant: "outlined",
  },
];

export default function Pricing() {
  return (
    <Box id="pricing" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <Stack spacing={1}>
          <Typography variant="h3">Precios sencillos</Typography>
          <Typography sx={{ opacity: 0.8, maxWidth: 760 }}>
            Tres planes para comunicar producto. Los precios son placeholders
            para el portafolio.
          </Typography>
        </Stack>

        <Grid container spacing={2.5} sx={{ mt: 2 }}>
          {plans.map((p) => (
            <Grid key={p.name} size={{ xs: 12, md: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  position: "relative",
                  outline: p.popular ? "2px solid" : "none",
                  outlineColor: p.popular ? "primary.main" : "transparent",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography sx={{ fontWeight: 900 }}>{p.name}</Typography>
                    {p.popular && <Chip label="Popular" color="primary" />}
                  </Stack>

                  <Stack spacing={0.2}>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      {p.price}
                    </Typography>
                    <Typography sx={{ opacity: 0.75 }}>{p.hint}</Typography>
                  </Stack>

                  <Stack spacing={1} sx={{ opacity: 0.9 }}>
                    {p.features.map((f) => (
                      <Typography key={f}>• {f}</Typography>
                    ))}
                  </Stack>

                  <Button
                    variant={p.variant}
                    size="large"
                    component={RouterLink}
                    to="/demo"
                  >
                    {p.cta}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
