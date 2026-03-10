import React from "react";
import { useSearchParams } from "react-router-dom";
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
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const TIPIFICATIONS = ["Contacto", "Seguimiento", "Promesa", "Venta", "No contesta", "Cierre"];
const DAILY_GOAL = 5;
const GOAL_TYPES = ["Venta", "Promesa"];

function getDailyMessage(count) {
  if (count === 0) return "¡Hoy es un gran día! Tu meta: 5 ventas o promesas.";
  if (count === 1) return "¡Arrancaste! 1 de 5 — sigue el ritmo.";
  if (count === 2) return "¡Vas bien! Llevas 2 de 5.";
  if (count === 3) return "¡Buen ritmo! Pasaste la mitad — 3 de 5.";
  if (count === 4) return "¡Ya casi! Solo una más para la meta del día.";
  if (count === 5) return "🎉 ¡Meta cumplida! Excelente trabajo hoy.";
  return `🔥 ¡Superaste la meta! Llevas ${count} en total hoy.`;
}

function getDailyColor(count) {
  if (count >= DAILY_GOAL) return "success";
  if (count >= 3) return "warning";
  return "primary";
}

function statusChipProps(status) {
  if (status === "nuevo") return { label: "Nuevo", color: "info" };
  if (status === "en proceso") return { label: "En proceso", color: "warning" };
  if (status === "cerrado") return { label: "Cerrado", color: "success" };
  return { label: status, color: "default" };
}

export default function Demo() {
  const { profile } = useAuth();
  const isAgent = profile?.role === "agent";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [contacts, setContacts] = React.useState([]);
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [campaignFilter, setCampaignFilter] = React.useState("all");

  const [selectedId, setSelectedId] = React.useState(null);
  const [drawerTab, setDrawerTab] = React.useState(0);
  const [interactions, setInteractions] = React.useState([]);
  const [loadingInteractions, setLoadingInteractions] = React.useState(false);

  const [openAdd, setOpenAdd] = React.useState(false);
  const [tip, setTip] = React.useState(TIPIFICATIONS[0]);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Progreso diario (solo agentes)
  const [dailyCount, setDailyCount] = React.useState(0);

  const selected = React.useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  const fetchDailyProgress = React.useCallback(async () => {
    if (!isAgent) return;
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .in("type", GOAL_TYPES)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);
    setDailyCount(count ?? 0);
  }, [isAgent]);

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const [{ data: contactsData, error: cErr }, { data: campaignsData }] =
      await Promise.all([
        supabase.from("contacts").select("*, campaigns(name)").order("updated_at", { ascending: false }),
        supabase.from("campaigns").select("id, name").order("name"),
      ]);
    if (cErr) setError("Error al cargar contactos: " + cErr.message);
    else setContacts(contactsData ?? []);
    setCampaigns(campaignsData ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchContacts(); }, [fetchContacts]);
  React.useEffect(() => { fetchDailyProgress(); }, [fetchDailyProgress]);

  React.useEffect(() => {
    if (!selectedId) { setInteractions([]); return; }
    setLoadingInteractions(true);
    supabase
      .from("interactions").select("*, profiles(full_name)")
      .eq("contact_id", selectedId).order("created_at", { ascending: false })
      .then(({ data }) => { setInteractions(data ?? []); setLoadingInteractions(false); });
  }, [selectedId]);

  const metrics = React.useMemo(() => ({
    total: contacts.length,
    nuevos: contacts.filter((c) => c.status === "nuevo").length,
    enProceso: contacts.filter((c) => c.status === "en proceso").length,
    cerrados: contacts.filter((c) => c.status === "cerrado").length,
  }), [contacts]);

  const filtered = React.useMemo(() => {
    const q = urlQuery.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchesQuery = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.display_id ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesCampaign = campaignFilter === "all" || (c.campaigns?.name ?? "") === campaignFilter;
      return matchesQuery && matchesStatus && matchesCampaign;
    });
  }, [contacts, urlQuery, statusFilter, campaignFilter]);

  const handleSaveInteraction = async () => {
    if (!selected || !note.trim()) return;
    setSaving(true);
    const { error: err } = await supabase.from("interactions").insert({
      contact_id: selected.id,
      type: tip,
      note: note.trim(),
      agent_id: profile?.id ?? null,
    });
    if (err) {
      setError("Error al guardar: " + err.message);
    } else {
      setOpenAdd(false);
      setDrawerTab(1);
      await fetchContacts();
      if (GOAL_TYPES.includes(tip)) await fetchDailyProgress();
      const { data } = await supabase.from("interactions").select("*, profiles(full_name)")
        .eq("contact_id", selected.id).order("created_at", { ascending: false });
      setInteractions(data ?? []);
    }
    setSaving(false);
  };

  const dailyProgress = Math.min((dailyCount / DAILY_GOAL) * 100, 100);
  const dailyColor = getDailyColor(dailyCount);

  return (
    <Box sx={{ py: { xs: 4, md: 5 } }}>
      <Container>
        <Stack spacing={2.2}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Progreso diario — solo agentes */}
          {isAgent && (
            <Paper
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: dailyCount >= DAILY_GOAL ? "success.main" : "divider",
                transition: "border-color 0.4s",
              }}
            >
              <Stack spacing={1.2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEventsOutlinedIcon
                    sx={{
                      color: dailyCount >= DAILY_GOAL ? "success.main" : "text.secondary",
                      transition: "color 0.4s",
                    }}
                  />
                  <Typography sx={{ fontWeight: 800 }}>
                    Mi progreso del día
                  </Typography>
                  <Chip
                    label={`${dailyCount} / ${DAILY_GOAL}`}
                    size="small"
                    color={dailyColor}
                    sx={{ ml: "auto !important", fontWeight: 700 }}
                  />
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={dailyProgress}
                  color={dailyColor}
                  sx={{ height: 10, borderRadius: 5 }}
                />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, opacity: 0.85 }}>
                    {getDailyMessage(dailyCount)}
                  </Typography>
                  <Typography sx={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap", ml: 1 }}>
                    Ventas y Promesas
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* Métricas */}
          <Grid container spacing={2}>
            {[
              { label: "Total", value: metrics.total },
              { label: "Nuevos", value: metrics.nuevos },
              { label: "En proceso", value: metrics.enProceso },
              { label: "Cerrados", value: metrics.cerrados },
            ].map((m) => (
              <Grid key={m.label} size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{m.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{m.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Filtros secundarios */}
          <Paper sx={{ p: 1.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
              <TextField
                select label="Status" value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small" sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">Todos los status</MenuItem>
                <MenuItem value="nuevo">Nuevo</MenuItem>
                <MenuItem value="en proceso">En proceso</MenuItem>
                <MenuItem value="cerrado">Cerrado</MenuItem>
              </TextField>

              <TextField
                select label="Campaña" value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                size="small" sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">Todas las campañas</MenuItem>
                {campaigns.map((c) => (
                  <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined" size="small"
                onClick={() => {
                  setStatusFilter("all");
                  setCampaignFilter("all");
                  setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("q"); return n; });
                }}
              >
                Limpiar filtros
              </Button>
            </Stack>
          </Paper>

          {/* Tabla */}
          <Paper sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography sx={{ fontWeight: 900 }}>Contactos</Typography>
              <Typography sx={{ opacity: 0.75 }}>{filtered.length} resultado(s)</Typography>
            </Box>

            {loading ? (
              <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Campaña</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{c.display_id}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.campaigns?.name ?? "—"}</TableCell>
                        <TableCell><Chip size="small" {...statusChipProps(c.status)} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => { setSelectedId(c.id); setDrawerTab(0); }}>
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 4 }}>
                          <Typography sx={{ opacity: 0.8 }}>No hay resultados.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Drawer detalle */}
      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 440 } } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 900 }}>Detalle</Typography>
            <IconButton onClick={() => setSelectedId(null)}><ChevronLeftIcon /></IconButton>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ px: 2, pt: 1 }}>
          <Tabs value={drawerTab} onChange={(_, v) => setDrawerTab(v)}>
            <Tab label="Info" /><Tab label="Historial" /><Tab label="Actividad" />
          </Tabs>
        </Box>
        {selected && (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.2}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{selected.name}</Typography>
              <Typography sx={{ opacity: 0.85 }}>{selected.phone}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" label={selected.campaigns?.name ?? "—"} variant="outlined" />
                <Chip size="small" {...statusChipProps(selected.status)} />
              </Stack>

              {drawerTab === 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Información</Typography>
                  <Stack spacing={0.8}>
                    <Typography sx={{ opacity: 0.85 }}><b>ID:</b> {selected.display_id}</Typography>
                    <Typography sx={{ opacity: 0.85 }}><b>Campaña:</b> {selected.campaigns?.name ?? "—"}</Typography>
                    <Typography sx={{ opacity: 0.85 }}><b>Status:</b> {selected.status}</Typography>
                    <Typography sx={{ opacity: 0.85 }}>
                      <b>Última actualización:</b>{" "}
                      {new Date(selected.updated_at).toLocaleDateString("es-MX")}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {drawerTab === 1 && (
                <>
                  <Button
                    startIcon={<AddOutlinedIcon />}
                    variant="contained"
                    onClick={() => { setTip(TIPIFICATIONS[0]); setNote(""); setOpenAdd(true); }}
                  >
                    Registrar gestión
                  </Button>
                  <Paper sx={{ p: 2, mt: 1 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Historial</Typography>
                    {loadingInteractions ? <CircularProgress size={20} /> : (
                      <Stack spacing={1}>
                        {interactions.length === 0 && (
                          <Typography sx={{ opacity: 0.8 }}>Sin historial.</Typography>
                        )}
                        {interactions.map((h) => (
                          <Box key={h.id} sx={{ pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                              <Typography sx={{ fontWeight: 800 }}>{h.type}</Typography>
                              {GOAL_TYPES.includes(h.type) && (
                                <Chip
                                  label="meta"
                                  size="small"
                                  color="success"
                                  sx={{ height: 16, fontSize: 10 }}
                                />
                              )}
                              <Typography sx={{ opacity: 0.6, fontSize: 12, ml: "auto !important" }}>
                                {new Date(h.created_at).toLocaleDateString("es-MX")}
                              </Typography>
                            </Stack>
                            <Typography sx={{ opacity: 0.85, mt: 0.3 }}>{h.note}</Typography>
                            {h.profiles?.full_name && (
                              <Typography sx={{ opacity: 0.6, fontSize: 12 }}>
                                por {h.profiles.full_name}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </>
              )}

              {drawerTab === 2 && (
                <Paper sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Actividad</Typography>
                  <Stack spacing={1}>
                    <Typography sx={{ opacity: 0.8 }}>
                      Total de gestiones: <b>{interactions.length}</b>
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {Object.entries(
                        interactions.reduce((acc, x) => {
                          acc[x.type] = (acc[x.type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([k, v]) => (
                        <Chip
                          key={k}
                          label={`${k}: ${v}`}
                          variant="outlined"
                          color={GOAL_TYPES.includes(k) ? "success" : "default"}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Dialog nueva gestión */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva gestión</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Tipificación"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
            >
              {TIPIFICATIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{t}</span>
                    {GOAL_TYPES.includes(t) && (
                      <Chip label="meta" size="small" color="success" sx={{ height: 16, fontSize: 10 }} />
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nota"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={3}
              placeholder="Escribe una nota breve…"
              helperText="Obligatoria."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveInteraction}
            disabled={!note.trim() || saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
