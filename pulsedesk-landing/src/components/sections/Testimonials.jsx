import { Avatar, Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const quotes = [
  {
    name: "Laura Mendoza",
    role: "Supervisora de Contact Center",
    avatar: "LM",
    text: "El historial se entiende rápido. Menos fricción, más operación.",
  },
  {
    name: "Carlos Vega",
    role: "Agente senior",
    avatar: "CV",
    text: "Registrar una gestión es un clic, no un trámite. Me ahorra tiempo en cada llamada.",
  },
  {
    name: "Ana Torres",
    role: "Coordinadora de Operaciones",
    avatar: "AT",
    text: "Las métricas básicas están donde deben estar. Fácil de revisar en el día a día.",
  },
];

export default function Testimonials() {
  return (
    <Box id="testimonials" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <Stack spacing={1}>
          <Typography variant="h3">Lo que dicen los equipos</Typography>
          <Typography sx={{ opacity: 0.8, maxWidth: 760 }}>
            Opiniones de personas que trabajan en operación diaria de contact
            center.
          </Typography>
        </Stack>

        <Grid container spacing={2.5} sx={{ mt: 2 }}>
          {quotes.map((q) => (
            <Grid key={q.name} size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Stack spacing={2}>
                  <FormatQuoteIcon sx={{ opacity: 0.25, fontSize: 32 }} />
                  <Typography sx={{ opacity: 0.85, flexGrow: 1 }}>
                    "{q.text}"
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: "primary.main" }}>
                      {q.avatar}
                    </Avatar>
                    <Stack spacing={0}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {q.name}
                      </Typography>
                      <Typography sx={{ opacity: 0.65, fontSize: 13 }}>
                        {q.role}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
