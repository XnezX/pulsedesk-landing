import { useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDrag } from "./useDrag";

// ─── Lógica de cálculo ─────────────────────────────────────────────────────
function compute(a, op, b) {
  switch (op) {
    case "÷": return b !== 0 ? a / b : "Error";
    case "×": return a * b;
    case "−": return a - b;
    case "+": return a + b;
    default:  return b;
  }
}

// ─── Layout de botones ─────────────────────────────────────────────────────
//  Cada fila: array de { label, span? }
const ROWS = [
  [{ l: "C" }, { l: "±" }, { l: "%" }, { l: "÷", op: true }],
  [{ l: "7" }, { l: "8" }, { l: "9" }, { l: "×", op: true }],
  [{ l: "4" }, { l: "5" }, { l: "6" }, { l: "−", op: true }],
  [{ l: "1" }, { l: "2" }, { l: "3" }, { l: "+", op: true }],
  [{ l: "0", span: 2 }, { l: "." }, { l: "=", op: true }],
];

const OPS = ["÷", "×", "−", "+"];

function CalcButton({ label, op, special, span, onClick }) {
  const bg = op
    ? "primary.main"
    : special
    ? "rgba(255,255,255,0.18)"
    : "rgba(255,255,255,0.1)";

  return (
    <Box
      onClick={onClick}
      sx={{
        gridColumn: span ? `span ${span}` : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 44,
        borderRadius: "4px",
        bgcolor: bg,
        color: "#fff",
        fontSize: 17,
        fontWeight: 500,
        cursor: "pointer",
        userSelect: "none",
        transition: "opacity 0.1s",
        "&:active": { opacity: 0.65 },
      }}
    >
      {label}
    </Box>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function Calculator({ open, onClose }) {
  const { pos, onMouseDown } = useDrag({
    x: typeof window !== "undefined" ? window.innerWidth - 260 : 20,
    y: 80,
  });

  const [display, setDisplay]         = useState("0");
  const [prevValue, setPrevValue]     = useState(null);
  const [operator, setOperator]       = useState(null);
  const [waiting, setWaiting]         = useState(false); // esperando nuevo operando

  const fmt = (n) => {
    if (typeof n !== "number") return String(n);
    const s = String(parseFloat(n.toFixed(10)));
    return s.length > 12 ? parseFloat(n.toFixed(6)).toString() : s;
  };

  const handleBtn = (lbl) => {
    // ── Dígitos y punto decimal ──
    if (/^[0-9]$/.test(lbl)) {
      if (waiting) {
        setDisplay(lbl);
        setWaiting(false);
      } else {
        setDisplay((d) =>
          d === "0" ? lbl : d.length < 12 ? d + lbl : d
        );
      }
      return;
    }

    if (lbl === ".") {
      if (waiting) { setDisplay("0."); setWaiting(false); return; }
      if (!display.includes(".")) setDisplay((d) => d + ".");
      return;
    }

    // ── Especiales ──
    if (lbl === "C") {
      setDisplay("0"); setPrevValue(null); setOperator(null); setWaiting(false);
      return;
    }
    if (lbl === "±") {
      setDisplay((d) => fmt(parseFloat(d) * -1));
      return;
    }
    if (lbl === "%") {
      setDisplay((d) => fmt(parseFloat(d) / 100));
      return;
    }

    // ── Operadores ──
    if (OPS.includes(lbl)) {
      const cur = parseFloat(display);
      if (prevValue !== null && !waiting) {
        const result = compute(prevValue, operator, cur);
        const res = typeof result === "number" ? result : null;
        setDisplay(fmt(result));
        setPrevValue(res);
      } else {
        setPrevValue(cur);
      }
      setOperator(lbl);
      setWaiting(true);
      return;
    }

    // ── Igual ──
    if (lbl === "=") {
      if (prevValue === null || operator === null) return;
      const result = compute(prevValue, operator, parseFloat(display));
      setDisplay(fmt(result));
      setPrevValue(null);
      setOperator(null);
      setWaiting(true);
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 1500,
        width: 224,
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        bgcolor: "#1c1c1e",
      }}
    >
      {/* Header / drag handle */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onMouseDown={onMouseDown}
        sx={{
          px: 1.5,
          py: 0.7,
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          bgcolor: "rgba(255,255,255,0.05)",
          userSelect: "none",
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600 }}>
          Calculadora
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.5)", p: 0.4 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {/* Display */}
      <Box sx={{ px: 2, pt: 1, pb: 0.5, textAlign: "right" }}>
        {operator && (
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, mb: 0.2 }}>
            {prevValue} {operator}
          </Typography>
        )}
        <Typography
          sx={{
            color: "#fff",
            fontSize: display.length > 9 ? 20 : 28,
            fontWeight: 300,
            letterSpacing: -0.5,
            lineHeight: 1.2,
            minHeight: 36,
            wordBreak: "break-all",
          }}
        >
          {display}
        </Typography>
      </Box>

      {/* Botones */}
      <Box sx={{ p: 1.2 }}>
        {ROWS.map((row, ri) => (
          <Box
            key={ri}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              mb: ri < ROWS.length - 1 ? 1 : 0,
            }}
          >
            {row.map((btn) => (
              <CalcButton
                key={btn.l}
                label={btn.l}
                op={btn.op}
                special={["C", "±", "%"].includes(btn.l)}
                span={btn.span}
                onClick={() => handleBtn(btn.l)}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
