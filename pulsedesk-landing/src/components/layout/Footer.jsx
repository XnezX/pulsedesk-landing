import React from "react";
import { Box, Container, Divider, Stack, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box sx={{ py: 5 }}>
      <Container>
        <Divider sx={{ mb: 3 }} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Typography sx={{ fontWeight: 800 }}>PulseDesk</Typography>
          <Typography sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} — Demo de portafolio (SaaS landing).
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
