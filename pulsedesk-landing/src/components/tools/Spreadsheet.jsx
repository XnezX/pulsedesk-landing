import { useState, useEffect, useRef, useCallback } from "react";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import { useDrag } from "./useDrag";

// ─── Constantes ─────────────────────────────────────────────────────────────
const ROWS = 20;
const COLS = 8;
const CELL_W = 70;
const CELL_H = 24;
const ROW_HDR = 30;
const STORAGE_KEY = "pulsedesk_sheet";

// ─── Helpers de dirección ────────────────────────────────────────────────────
const colLetter = (i) => String.fromCharCode(65 + i);
const addrOf = (r, c) => `${colLetter(c)}${r + 1}`;

function parseAddr(addr) {
  const m = addr?.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { r: parseInt(m[2]) - 1, c: m[1].charCodeAt(0) - 65 };
}

// ─── Evaluación de fórmulas ──────────────────────────────────────────────────
function getRangeVals(from, to, cells, vis) {
  const a = parseAddr(from);
  const b = parseAddr(to);
  if (!a || !b) return [];
  const res = [];
  for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++)
    for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++)
      res.push(computeCell(addrOf(r, c), cells, vis));
  return res;
}

function computeCell(addr, cells, vis = new Set()) {
  if (vis.has(addr)) return "#CIRC";
  const raw = cells[addr] ?? "";
  if (!raw.startsWith("=")) return raw;

  vis = new Set([...vis, addr]);
  const expr = raw.slice(1).toUpperCase().trim();

  // Funciones con rango: SUM(A1:B3), AVG(A1:A5), etc.
  const m = expr.match(/^(SUM|AVG|PROMEDIO|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (m) {
    const vals = getRangeVals(m[2], m[3], cells, vis)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (!vals.length) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    if (m[1] === "SUM")                    return sum;
    if (m[1] === "AVG" || m[1] === "PROMEDIO") return sum / vals.length;
    if (m[1] === "MIN")                    return Math.min(...vals);
    if (m[1] === "MAX")                    return Math.max(...vals);
    if (m[1] === "COUNT")                  return vals.length;
  }

  // Reemplazar referencias de celdas con sus valores
  const resolved = expr.replace(/[A-Z]+\d+/g, (ref) => {
    const v = computeCell(ref, cells, vis);
    const n = Number(v);
    return isNaN(n) ? "0" : String(n);
  });

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${resolved})`)();
    if (typeof result === "number") {
      return isFinite(result) ? parseFloat(result.toFixed(10)) : "#ERR";
    }
    return result;
  } catch {
    return "#ERR";
  }
}

// ─── Persistencia ────────────────────────────────────────────────────────────
function loadCells() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveCells(c) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────
function exportCSV(cells) {
  const lines = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const v = computeCell(addrOf(r, c), cells, new Set());
      return `"${String(v ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  );
  const url = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  );
  Object.assign(document.createElement("a"), { href: url, download: "tabla_pulsedesk.csv" }).click();
  URL.revokeObjectURL(url);
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function Spreadsheet({ open, onClose }) {
  const { pos, onMouseDown } = useDrag({
    x: typeof window !== "undefined" ? Math.max(0, window.innerWidth - 620) : 20,
    y: 100,
  });

  const [cells, setCells] = useState(loadCells);
  const [sel, setSel] = useState("A1");
  const formulaRef = useRef(null);

  // Auto-guardar con debounce
  useEffect(() => {
    const t = setTimeout(() => saveCells(cells), 600);
    return () => clearTimeout(t);
  }, [cells]);

  const setCell = useCallback((addr, val) => {
    setCells((prev) => {
      if (val === "") { const n = { ...prev }; delete n[addr]; return n; }
      return { ...prev, [addr]: val };
    });
  }, []);

  const navigate = useCallback((dr, dc) => {
    setSel((cur) => {
      const p = parseAddr(cur);
      if (!p) return cur;
      return addrOf(
        Math.max(0, Math.min(ROWS - 1, p.r + dr)),
        Math.max(0, Math.min(COLS - 1, p.c + dc))
      );
    });
    // Mantener foco en barra de fórmula
    setTimeout(() => formulaRef.current?.focus(), 0);
  }, []);

  const selectCell = useCallback((addr) => {
    setSel(addr);
    setTimeout(() => {
      formulaRef.current?.focus();
      formulaRef.current?.select();
    }, 0);
  }, []);

  const handleFormulaKeyDown = (e) => {
    if (e.key === "Enter")  { e.preventDefault(); navigate(1, 0); }
    if (e.key === "Tab")    { e.preventDefault(); navigate(0, e.shiftKey ? -1 : 1); }
    if (e.key === "Escape") { e.preventDefault(); formulaRef.current?.blur(); }
    if (e.key === "ArrowUp")    { e.preventDefault(); navigate(-1, 0); }
    if (e.key === "ArrowDown")  { e.preventDefault(); navigate(1, 0); }
    if (e.key === "ArrowLeft" && formulaRef.current?.selectionStart === 0)  { e.preventDefault(); navigate(0, -1); }
    if (e.key === "ArrowRight" && formulaRef.current?.selectionEnd === formulaRef.current?.value.length) { e.preventDefault(); navigate(0, 1); }
  };

  const handleGridKeyDown = (e) => {
    if (document.activeElement === formulaRef.current) return;
    if (e.key === "ArrowUp")    { e.preventDefault(); navigate(-1, 0); }
    if (e.key === "ArrowDown")  { e.preventDefault(); navigate(1, 0); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); navigate(0, -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); navigate(0, 1); }
    if (e.key === "Delete" || e.key === "Backspace") { setCell(sel, ""); }
  };

  const selP = parseAddr(sel);
  const totalW = ROW_HDR + COLS * CELL_W;

  if (!open) return null;

  return (
    <Paper
      elevation={10}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      sx={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 1500,
        width: totalW + 2,
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 6px 28px rgba(0,0,0,0.28)",
        outline: "none",
      }}
    >
      {/* ── Header / drag ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onMouseDown={onMouseDown}
        sx={{
          px: 1.5, py: 0.7,
          bgcolor: "primary.main",
          cursor: "grab", "&:active": { cursor: "grabbing" },
          userSelect: "none", flexShrink: 0,
        }}
      >
        <Typography sx={{ color: "primary.contrastText", fontSize: 13, fontWeight: 700 }}>
          📊 Tabla / Excel
        </Typography>
        <Stack direction="row">
          <Tooltip title="Exportar CSV">
            <IconButton size="small" onClick={() => exportCSV(cells)} sx={{ color: "primary.contrastText", p: 0.5 }}>
              <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Limpiar todo">
            <IconButton size="small" onClick={() => { if (window.confirm("¿Borrar toda la tabla?")) setCells({}); }} sx={{ color: "primary.contrastText", p: 0.5 }}>
              <DeleteSweepOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: "primary.contrastText", p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* ── Barra de fórmula ── */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 1, py: 0.3, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", flexShrink: 0, gap: 0.8 }}
      >
        <Typography
          sx={{
            fontSize: 11, fontWeight: 700, color: "primary.main",
            bgcolor: "action.selected", px: 0.6, py: 0.15,
            borderRadius: "3px", fontFamily: "monospace", minWidth: 30, textAlign: "center",
          }}
        >
          {sel}
        </Typography>
        <Box
          component="input"
          ref={formulaRef}
          value={cells[sel] ?? ""}
          onChange={(e) => setCell(sel, e.target.value)}
          onKeyDown={handleFormulaKeyDown}
          placeholder="Valor o =SUM(A1:A5)"
          sx={{
            flex: 1, border: "none", outline: "none",
            fontSize: 12, fontFamily: "monospace",
            bgcolor: "transparent", color: "text.primary", p: 0,
          }}
        />
      </Stack>

      {/* ── Grid ── */}
      <Box sx={{ overflowY: "auto", overflowX: "hidden", maxHeight: 280 }}>
        {/* Cabeceras de columnas */}
        <Box
          sx={{
            display: "flex", position: "sticky", top: 0, zIndex: 2,
            bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider",
          }}
        >
          <Box sx={{ width: ROW_HDR, flexShrink: 0, height: CELL_H }} />
          {Array.from({ length: COLS }, (_, c) => (
            <Box
              key={c}
              sx={{
                width: CELL_W, flexShrink: 0, height: CELL_H,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                borderLeft: "1px solid", borderColor: "divider",
                ...(selP?.c === c && { bgcolor: "primary.main", color: "primary.contrastText" }),
              }}
            >
              {colLetter(c)}
            </Box>
          ))}
        </Box>

        {/* Filas de datos */}
        {Array.from({ length: ROWS }, (_, r) => (
          <Box key={r} sx={{ display: "flex", borderBottom: "1px solid", borderColor: "divider" }}>
            {/* Cabecera de fila */}
            <Box
              sx={{
                width: ROW_HDR, flexShrink: 0, height: CELL_H,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                bgcolor: "action.hover", borderRight: "1px solid", borderColor: "divider",
                ...(selP?.r === r && { bgcolor: "primary.main", color: "primary.contrastText" }),
              }}
            >
              {r + 1}
            </Box>

            {/* Celdas */}
            {Array.from({ length: COLS }, (_, c) => {
              const addr = addrOf(r, c);
              const isSel = sel === addr;
              const raw = cells[addr] ?? "";
              const displayed = raw.startsWith("=")
                ? computeCell(addr, cells, new Set())
                : raw;
              const isErr = String(displayed).startsWith("#");
              const isNum = !isNaN(Number(displayed)) && displayed !== "";

              return (
                <Box
                  key={c}
                  onClick={() => selectCell(addr)}
                  sx={{
                    width: CELL_W, flexShrink: 0, height: CELL_H,
                    borderLeft: "1px solid", borderColor: "divider",
                    cursor: "cell", overflow: "hidden", position: "relative",
                    bgcolor: isSel ? "action.selected" : "transparent",
                    ...(isSel && {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: -2,
                      zIndex: 1,
                    }),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12, px: 0.5, lineHeight: `${CELL_H}px`,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: isErr ? "error.main" : "text.primary",
                      textAlign: isNum ? "right" : "left",
                    }}
                  >
                    {String(displayed)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ px: 1.5, py: 0.3, borderTop: "1px solid", borderColor: "divider", bgcolor: "action.hover", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 10, opacity: 0.5 }}>
          Enter↓ · Tab→ · Flechas navegan · =SUM(A1:A5) · =AVG · =MIN · =MAX · =COUNT · =PROMEDIO
        </Typography>
      </Box>
    </Paper>
  );
}
