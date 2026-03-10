import { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useDrag } from "./useDrag";

const STORAGE_KEY  = "pulsedesk_notes";
const ACTIVE_KEY   = "pulsedesk_notes_active";

// ─── helpers ──────────────────────────────────────────────────────────────
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function persist(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
  catch { /* storage lleno */ }
}
function makeNote() {
  return { id: Date.now().toString(), content: "", createdAt: new Date().toISOString() };
}
function preview(content) {
  const first = content.trim().split("\n")[0].trim();
  if (!first) return "Sin título";
  return first.length > 22 ? first.slice(0, 22) + "…" : first;
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });
}

// ─── Componente ────────────────────────────────────────────────────────────
export default function Notepad({ open, onClose }) {
  const { pos, onMouseDown } = useDrag({
    x: typeof window !== "undefined" ? Math.max(0, window.innerWidth - 590) : 20,
    y: 80,
  });

  const [notes, setNotes] = useState(() => {
    const saved = loadNotes();
    return saved.length ? saved : [makeNote()];
  });

  const [activeId, setActiveId] = useState(() => {
    const saved = loadNotes();
    const lastActive = localStorage.getItem(ACTIVE_KEY);
    if (saved.length && saved.find((n) => n.id === lastActive)) return lastActive;
    return saved[0]?.id ?? makeNote().id;
  });

  const active = notes.find((n) => n.id === activeId) ?? notes[0] ?? null;

  // Persistir notas cada vez que cambian
  useEffect(() => { persist(notes); }, [notes]);
  // Persistir nota activa
  useEffect(() => {
    try { localStorage.setItem(ACTIVE_KEY, activeId ?? ""); } catch { /* */ }
  }, [activeId]);

  const addNote = useCallback(() => {
    const n = makeNote();
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (next.length === 0) {
        const fresh = makeNote();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(next[0].id);
      }
      return next;
    });
  }, [activeId]);

  const updateContent = useCallback((value) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, content: value } : n))
    );
  }, [activeId]);

  if (!open) return null;

  return (
    <Paper
      elevation={10}
      sx={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 1500,
        width: 370,
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 6px 28px rgba(0,0,0,0.28)",
      }}
    >
      {/* ── Header / drag handle ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onMouseDown={onMouseDown}
        sx={{
          px: 1.5,
          py: 0.7,
          bgcolor: "primary.main",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: "primary.contrastText", fontSize: 13, fontWeight: 700 }}>
          📝 Bloc de notas
        </Typography>
        <Stack direction="row" alignItems="center">
          <Tooltip title="Nueva nota">
            <IconButton size="small" onClick={addNote} sx={{ color: "primary.contrastText", p: 0.5 }}>
              <AddIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: "primary.contrastText", p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* ── Cuerpo: lista + editor ── */}
      <Stack direction="row" sx={{ height: 290 }}>

        {/* Lista de notas */}
        <Box
          sx={{
            width: 110,
            borderRight: "1px solid",
            borderColor: "divider",
            overflowY: "auto",
            flexShrink: 0,
            bgcolor: "action.hover",
          }}
        >
          {notes.map((n) => {
            const isActive = n.id === activeId;
            return (
              <Box
                key={n.id}
                onClick={() => setActiveId(n.id)}
                sx={{
                  px: 1,
                  py: 0.8,
                  cursor: "pointer",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: isActive ? "primary.main" : "transparent",
                  "&:hover": { bgcolor: isActive ? "primary.main" : "action.selected" },
                  position: "relative",
                  "&:hover .del-btn": { opacity: 1 },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "primary.contrastText" : "text.primary",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {preview(n.content)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: isActive ? "rgba(255,255,255,0.65)" : "text.secondary",
                    mt: 0.2,
                  }}
                >
                  {fmtDate(n.createdAt)}
                </Typography>

                {/* Botón eliminar nota */}
                <Box
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 2,
                    opacity: 0,
                    transition: "opacity 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "3px",
                    bgcolor: isActive ? "rgba(255,255,255,0.2)" : "action.focus",
                    cursor: "pointer",
                  }}
                >
                  <DeleteOutlineIcon
                    sx={{
                      fontSize: 12,
                      color: isActive ? "primary.contrastText" : "error.main",
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Editor */}
        <Box
          component="textarea"
          value={active?.content ?? ""}
          onChange={(e) => updateContent(e.target.value)}
          placeholder="Escribe aquí tu nota…"
          sx={{
            flex: 1,
            p: 1.5,
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            fontSize: 13,
            lineHeight: 1.7,
            bgcolor: "background.paper",
            color: "text.primary",
            boxSizing: "border-box",
          }}
        />
      </Stack>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontSize: 10, opacity: 0.5 }}>
          {notes.length} nota{notes.length !== 1 ? "s" : ""} · guardado automáticamente
        </Typography>
        <Typography sx={{ fontSize: 10, opacity: 0.5 }}>
          {active?.content.length ?? 0} car.
        </Typography>
      </Box>
    </Paper>
  );
}
