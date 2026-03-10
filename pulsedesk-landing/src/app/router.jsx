import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Demo from "../pages/Demo";
import Login from "../pages/Login";
import ImportCSV from "../pages/ImportCSV";
import Admin from "../pages/Admin";
import RequireAuth from "../components/layout/RequireAuth";
import AppLayout from "../components/layout/AppLayout";

export default function AppRouter({ mode, onToggleMode }) {
  const router = React.useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <Home mode={mode} onToggleMode={onToggleMode} />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/app",
          element: (
            <RequireAuth>
              <AppLayout mode={mode} onToggleMode={onToggleMode}>
                <Demo />
              </AppLayout>
            </RequireAuth>
          ),
        },
        {
          path: "/app/import",
          element: (
            <RequireAuth>
              <AppLayout mode={mode} onToggleMode={onToggleMode}>
                <ImportCSV />
              </AppLayout>
            </RequireAuth>
          ),
        },
        {
          path: "/app/admin",
          element: (
            <RequireAuth>
              <AppLayout mode={mode} onToggleMode={onToggleMode}>
                <Admin />
              </AppLayout>
            </RequireAuth>
          ),
        },
        {
          path: "/demo",
          element: <Navigate to="/app" replace />,
        },
      ]),
    [mode, onToggleMode],
  );

  return <RouterProvider router={router} />;
}
