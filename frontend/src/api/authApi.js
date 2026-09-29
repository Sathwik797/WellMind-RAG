import api from "./client";
function mapAuthResponse(data) {
  return {
    token: data.token,
    user: {
      id: data._id,
      name: data.employeeName,
      employeeId: data.employeeId,
      role: data.role, // authoritative — always comes from the server, never from the UI toggle
    },
  };
}

// POST /api/auth/login — no role in the body; your backend derives it from the DB.
export async function loginUser({ employeeId, password }) {
  const { data } = await api.post("/auth/login", { employeeId, password });
  return mapAuthResponse(data);
}

// POST /api/auth/register — role IS required here.
export async function registerUser({ employeeId, fullName, password, role }) {
  const { data } = await api.post("/auth/register", {
    employeeId,
    employeeName: fullName,
    password,
    role,
  });
  return mapAuthResponse(data); // auto-logged-in, same as login
}

// POST /api/auth/google — role only matters on first-time signup, harmless to always send.
export async function loginWithGoogle({ idToken, role }) {
  const { data } = await api.post("/auth/google", { token: idToken, role });
  return mapAuthResponse(data);
}