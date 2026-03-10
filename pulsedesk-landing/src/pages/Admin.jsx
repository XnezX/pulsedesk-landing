import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ROLES = ["agent", "supervisor", "admin"];

const roleColor = {
  agent: "default",
  supervisor: "warning",
  admin: "error",
};

const emptyForm = { full_name: "", email: "", password: "", role: "agent" };

export default function Admin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog crear usuario
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  if (profile && profile.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: true });

    if (err) setError("Error al cargar usuarios: " + err.message);
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId);
    setError("");
    setSuccess("");

    const { error: err } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (err) {
      setError("Error al actualizar rol: " + err.message);
    } else {
      setSuccess("Rol actualizado correctamente.");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setSaving(null);
  };

  const handleCreateUser = async () => {
    if (!form.email || !form.password || !form.full_name) {
      setCreateError("Nombre, email y contraseña son obligatorios.");
      return;
    }
    setCreating(true);
    setCreateError("");

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });

    if (signUpErr) {
      setCreateError("Error al crear usuario: " + signUpErr.message);
      setCreating(false);
      return;
    }

    const newUserId = data.user?.id;

    // 2. Si el rol no es 'agent' (default del trigger), actualizarlo
    if (newUserId && form.role !== "agent") {
      await supabase
        .from("profiles")
        .update({ role: form.role, full_name: form.full_name })
        .eq("id", newUserId);
    } else if (newUserId) {
      // Asegurar que el full_name quede guardado
      await supabase
        .from("profiles")
        .update({ full_name: form.full_name })
        .eq("id", newUserId);
    }

    setOpenAdd(false);
    setForm(emptyForm);
    setSuccess(`Usuario "${form.full_name}" creado correctamente. Recibirá un email de confirmación.`);
    await fetchUsers();
    setCreating(false);
  };

  return (
    <Box sx={{ py: { xs: 4, md: 5 } }}>
      <Container>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack spacing={0.5}>
              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                Panel de Administración
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>
                Gestiona los roles y usuarios del sistema.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<PersonAddOutlinedIcon />}
              onClick={() => { setForm(emptyForm); setCreateError(""); setOpenAdd(true); }}
            >
              Agregar usuario
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Resumen de roles */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {ROLES.map((r) => {
              const count = users.filter((u) => u.role === r).length;
              return (
                <Paper key={r} sx={{ p: 2, flex: 1 }}>
                  <Typography sx={{ opacity: 0.75, textTransform: "capitalize" }}>
                    {r}s
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {count}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>

          {/* Tabla de usuarios */}
          <Paper sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography sx={{ fontWeight: 900 }}>
                Usuarios ({users.length})
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Rol actual</TableCell>
                      <TableCell>Registrado</TableCell>
                      <TableCell align="right">Cambiar rol</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>
                            {u.full_name || "Sin nombre"}
                          </Typography>
                          <Typography sx={{ fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>
                            {u.id.slice(0, 8)}…
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.role}
                            size="small"
                            color={roleColor[u.role] ?? "default"}
                          />
                        </TableCell>
                        <TableCell sx={{ opacity: 0.7 }}>
                          {new Date(u.created_at).toLocaleDateString("es-MX")}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            <TextField
                              select
                              size="small"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={saving === u.id}
                              sx={{ minWidth: 130 }}
                            >
                              {ROLES.map((r) => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                              ))}
                            </TextField>
                            {saving === u.id && <CircularProgress size={18} />}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ py: 4 }}>
                          <Typography sx={{ opacity: 0.7 }}>
                            No hay usuarios registrados aún.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          {/* Instrucción primer admin */}
          <Paper sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
              ¿Cómo convertirte en admin por primera vez?
            </Typography>
            <Typography sx={{ opacity: 0.8, fontSize: 14 }}>
              Corre este SQL en Supabase → SQL Editor, reemplazando el email:
            </Typography>
            <Typography
              component="pre"
              sx={{ fontFamily: "monospace", fontSize: 13, mt: 1, opacity: 0.85, overflowX: "auto" }}
            >
              {`update public.profiles\nset role = 'admin'\nwhere id = (select id from auth.users where email = 'tu@email.com');`}
            </Typography>
          </Paper>
        </Stack>
      </Container>

      {/* Dialog: agregar usuario */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Nombre completo"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <TextField
              label="Contraseña temporal"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              helperText="Mínimo 6 caracteres. El usuario puede cambiarla después."
              required
            />
            <TextField
              select
              label="Rol"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={creating || !form.email || !form.password || !form.full_name}
          >
            {creating ? <CircularProgress size={18} color="inherit" /> : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
