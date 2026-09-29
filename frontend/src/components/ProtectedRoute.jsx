export default function ProtectedRoute({ children }) {
  // eRTMAC-NWIS allows guest access to the primary operational workstation.
  // Real authentication is optional and enriches identity/audit governance.
  return children;
}