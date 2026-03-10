import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { session } = useAuth();

  // session === undefined significa que todavía está cargando
  if (session === undefined) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
