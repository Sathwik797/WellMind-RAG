import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, loginWithGoogle } from "../api/authApi";
import { useRole } from "./RoleContext";
import { hasValidSession } from "../utils/session";

export const GUEST_USER = {
  name: "Guest Engineer",
  role: "field",
  isGuest: true,
  employeeId: "GUEST-001",
  email: "guest@oilindia.in"
};

const AuthContext = createContext(null);

function loadSavedUser() {
  try {
    if (!hasValidSession()) {
      localStorage.removeItem("nwis-user");
      return GUEST_USER;
    }
    const saved = localStorage.getItem("nwis-user");
    if (!saved) return GUEST_USER;
    const parsed = JSON.parse(saved);
    return { ...parsed, isGuest: false };
  } catch {
    return GUEST_USER;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSavedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setRole } = useRole();

  useEffect(() => {
    if (user?.role && user.role !== "guest") {
      setRole(user.role);
    } else {
      setRole("field");
    }
  }, [user, setRole]);

  async function login({ employeeId, password }) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({ employeeId, password });
      localStorage.setItem("nwis-token", res.token);
      localStorage.setItem("nwis-user", JSON.stringify(res.user));
      const authUser = { ...res.user, isGuest: false };
      setUser(authUser);
      if (res.user.role) setRole(res.user.role);
      return authUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser(payload);
      localStorage.setItem("nwis-token", res.token);
      localStorage.setItem("nwis-user", JSON.stringify(res.user));
      const authUser = { ...res.user, isGuest: false };
      setUser(authUser);
      if (res.user.role) setRole(res.user.role);
      return authUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin({ idToken, role }) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle({ idToken, role });
      localStorage.setItem("nwis-token", res.token);
      localStorage.setItem("nwis-user", JSON.stringify(res.user));
      const authUser = { ...res.user, isGuest: false };
      setUser(authUser);
      if (res.user.role) setRole(res.user.role);
      return authUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("nwis-token");
    localStorage.removeItem("nwis-user");
    setUser(GUEST_USER);
    setRole("field");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: !!user?.isGuest,
        loading,
        error,
        login,
        register,
        googleLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);