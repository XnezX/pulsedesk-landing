import { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
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
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const REQUIRED_COLS = ["name", "phone"];
const OPTIONAL_COLS = ["campaign", "status"];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

const VALID_STATUSES = ["nuevo", "en proceso", "cerrado"];

// Aliases de campos en español/inglés para CSV y XML
const FIELD_ALIASES = {
  name:     ["name", "nombre"],
  phone:    ["phone", "telefono", "teléfono"],
  campaign: ["campaign", "campaña", "campana"],
  status:   ["status", "estado"],
};

function normalizeRow(row) {
  const normalized = {};
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    const found = aliases.find((a) => row[a] !== undefined);
    normalized[key] = found ? String(row[found]).trim() : "";
  }
  return normalized;
}

function parseXML(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("XML inválido: " + parseError.textContent);

  // Acepta <contacts><contact>…</contact></contacts>
  // o cualquier elemento raíz con hijos <contact> o <contacto>
  const items = [
    ...doc.querySelectorAll("contact"),
    ...doc.querySelectorAll("contacto"),
  ];

  return items.map((el) => {
    const row = {};
    for (const child of el.children) {
      row[child.tagName.toLowerCase()] = child.textContent.trim();
    }
    return normalizeRow(row);
  });
}

export default function ImportCSV() {
  const { profile } = useAuth();
  const inputRef = useRef(null);

  if (profile && profile.role !== "admin") {
    return <Navigate to="/app" replace />;
  }
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [defaultCampaign, setDefaultCampaign] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // { ok, failed }
  const [fileName, setFileName] = useState("");

  // Cargar campañas disponibles al montar
  useState(() => {
    supabase
      .from("campaigns")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCampaigns(data ?? []));
  });

  const processRows = (normalized) => {
    const errs = [];
    normalized.forEach((r, i) => {
      if (!r.name) errs.push(`Fila ${i + 1}: falta nombre`);
      if (r.status && !VALID_STATUSES.includes(r.status.toLowerCase())) {
        errs.push(
          `Fila ${i + 1}: status "${r.status}" inválido (usa: nuevo, en proceso, cerrado)`
        );
      }
    });
    setErrors(errs);
    setRows(normalized);
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setErrors([]);

    if (file.name.endsWith(".xml")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rows = parseXML(e.target.result);
          processRows(rows);
        } catch (err) {
          setErrors([err.message]);
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => processRows(data.map(normalizeRow)),
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv") || file?.name.endsWith(".xml"))
      handleFile(file);
  };

  const handleImport = async () => {
    if (!rows.length || errors.length) return;
    setImporting(true);
    setResult(null);

    // Obtener mapa campaign name → id
    const campaignMap = Object.fromEntries(
      campaigns.map((c) => [c.name.toLowerCase(), c.id])
    );
    const defaultCampaignId = defaultCampaign || null;

    const records = rows.map((r) => {
      const campaignId =
        campaignMap[r.campaign?.toLowerCase()] ?? defaultCampaignId ?? null;
      return {
        name: r.name,
        phone: r.phone || null,
        campaign_id: campaignId,
        status: VALID_STATUSES.includes(r.status?.toLowerCase())
          ? r.status.toLowerCase()
          : "nuevo",
      };
    });

    // Insertar en lotes de 100
    let ok = 0;
    let failed = 0;
    const BATCH = 100;

    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const { error } = await supabase.from("contacts").insert(batch);
      if (error) {
        failed += batch.length;
      } else {
        ok += batch.length;
      }
    }

    setResult({ ok, failed });
    setImporting(false);
    if (ok > 0) setRows([]);
  };

  const hasErrors = errors.length > 0;
  const preview = rows.slice(0, 5);

  return (
    <Box sx={{ py: { xs: 5, md: 7 } }}>
      <Container maxWidth="md">
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                Importar contactos
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>
                Sube un <b>CSV</b> o <b>XML</b> con campos: <b>name</b>,{" "}
                <b>phone</b>, <b>campaign</b>, <b>status</b>. También acepta
                headers en español.
              </Typography>
            </Stack>

            {/* Zona de drop */}
            <Paper
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              sx={{
                p: 5,
                textAlign: "center",
                cursor: "pointer",
                border: "2px dashed",
                borderColor: "divider",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xml"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <Stack spacing={1} alignItems="center">
                <UploadFileOutlinedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                <Typography sx={{ fontWeight: 700 }}>
                  {fileName || "Arrastra tu archivo aquí o haz clic para seleccionar"}
                </Typography>
                <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
                  Acepta .csv y .xml
                </Typography>
              </Stack>
            </Paper>

            {/* Campaña por defecto */}
            {rows.length > 0 && (
              <TextField
                select
                label="Campaña por defecto (para filas sin campaña)"
                value={defaultCampaign}
                onChange={(e) => setDefaultCampaign(e.target.value)}
                helperText="Opcional. Se aplica a filas que no tienen campaña definida."
              >
                <MenuItem value="">— Sin campaña —</MenuItem>
                {campaigns.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Errores de validación */}
            {hasErrors && (
              <Alert severity="warning">
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  {errors.length} problema(s) encontrado(s). Corrígelos antes de importar:
                </Typography>
                <Stack spacing={0.3}>
                  {errors.map((e, i) => (
                    <Typography key={i} sx={{ fontSize: 13 }}>
                      • {e}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <Paper sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontWeight: 900 }}>
                      Vista previa
                    </Typography>
                    <Chip
                      label={`${rows.length} filas`}
                      size="small"
                      color={hasErrors ? "warning" : "success"}
                    />
                    {rows.length > 5 && (
                      <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
                        (mostrando primeras 5)
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {ALL_COLS.map((c) => (
                          <TableCell key={c}>{c}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.map((r, i) => (
                        <TableRow key={i}>
                          {ALL_COLS.map((c) => (
                            <TableCell key={c} sx={{ opacity: r[c] ? 1 : 0.4 }}>
                              {r[c] || "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}

            {/* Resultado */}
            {result && (
              <Alert
                severity={result.failed === 0 ? "success" : "warning"}
                icon={
                  result.failed === 0 ? (
                    <CheckCircleOutlineIcon />
                  ) : undefined
                }
              >
                <Typography sx={{ fontWeight: 700 }}>
                  {result.ok} contacto(s) importados correctamente.
                  {result.failed > 0 &&
                    ` ${result.failed} fallaron (posibles duplicados).`}
                </Typography>
              </Alert>
            )}

            <Divider />

            {/* Botón importar */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                disabled={!rows.length || hasErrors || importing}
                onClick={handleImport}
                startIcon={
                  importing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : undefined
                }
              >
                {importing
                  ? "Importando..."
                  : `Importar ${rows.length || ""} contactos`}
              </Button>
              {rows.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setRows([]);
                    setErrors([]);
                    setFileName("");
                    setResult(null);
                  }}
                >
                  Limpiar
                </Button>
              )}
            </Stack>

            {/* Guía de formato */}
            <Paper sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                    Formato CSV
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{ fontFamily: "monospace", fontSize: 13, opacity: 0.85, overflowX: "auto" }}
                  >
                    {`name,phone,campaign,status\nJuan Pérez,55 1234 5678,Cobranza,nuevo\nMaría López,55 9876 5432,Ventas,en proceso`}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                    Formato XML
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{ fontFamily: "monospace", fontSize: 13, opacity: 0.85, overflowX: "auto" }}
                  >
                    {`<contacts>\n  <contact>\n    <name>Juan Pérez</name>\n    <phone>55 1234 5678</phone>\n    <campaign>Cobranza</campaign>\n    <status>nuevo</status>\n  </contact>\n</contacts>`}
                  </Typography>
                </Box>

                <Typography sx={{ opacity: 0.6, fontSize: 12 }}>
                  También acepta en español: nombre, teléfono, campaña, estado · Tags XML: contacto
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Container>
    </Box>
  );
}
