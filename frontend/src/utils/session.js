// True only if a token exists AND it hasn't expired.
export function hasValidSession() {
  try {
    const token = localStorage.getItem("nwis-token");
    if (!token) return false;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("nwis-token");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}