import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Cargar perfil cuando hay sesión
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null));
  }, [session]);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, profile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
