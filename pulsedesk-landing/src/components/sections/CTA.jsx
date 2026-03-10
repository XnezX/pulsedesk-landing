import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function CTA() {
  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.6}>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                ¿Listo para una demo?
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>
                Construido para verse bien y operar rápido. Perfecto como
                proyecto de book.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                size="large"
                variant="outlined"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver código
              </Button>
              <Button
                size="large"
                variant="contained"
                component={RouterLink}
                to="/demo"
              >
                Empezar ahora
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
