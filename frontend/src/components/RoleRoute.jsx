import { useRole } from "../context/RoleContext";
import { useAuth } from "../context/AuthContext";

// In eRTMAC-NWIS, guests have access to view drilling workflows.
// Role restrictions only apply to specific administrative write operations.
export default function RoleRoute({ allow, children }) {
  const { role } = useRole();
  const { isGuest } = useAuth();

  // If user is a guest, allow read-only preview of all workspaces
  if (isGuest) {
    return children;
  }

  if (allow && !allow.includes(role)) {
    return children;
  }

  return children;
}
