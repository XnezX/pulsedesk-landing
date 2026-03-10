import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(0); // 0 = login, 1 = registro
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (tab === 0) {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        navigate("/app");
      }
    } else {
      if (!fullName.trim()) {
        setError("Escribe tu nombre completo.");
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, fullName);
      if (err) {
        setError(err.message);
      } else {
        setInfo(
          "Revisa tu correo para confirmar tu cuenta y luego inicia sesión."
        );
        setTab(0);
      }
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={3} alignItems="center">
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(57,67,183,1), rgba(68,157,209,1))",
              }}
            />
            <Typography sx={{ fontWeight: 800, letterSpacing: -0.4, fontSize: 20 }}>
              PulseDesk
            </Typography>
          </Stack>

          <Paper sx={{ p: 3, width: "100%" }}>
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                setError("");
                setInfo("");
              }}
              sx={{ mb: 2 }}
            >
              <Tab label="Iniciar sesión" />
              <Tab label="Crear cuenta" />
            </Tabs>

            <Divider sx={{ mb: 2 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {info && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {info}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {tab === 1 && (
                  <TextField
                    label="Nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                    required
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ minLength: 6 }}
                  helperText={tab === 1 ? "Mínimo 6 caracteres" : ""}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading
                    ? "Procesando..."
                    : tab === 0
                    ? "Entrar"
                    : "Crear cuenta"}
                </Button>
              </Stack>
            </form>
          </Paper>

          <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
            PulseDesk — CRM para contact center
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
