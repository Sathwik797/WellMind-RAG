import { createContext, useContext, useState } from "react";

const RoleContext = createContext(null);

// role: "field" | "office"
export function RoleProvider({ children }) {
  const [role, setRole] = useState("field");
  return (
    <RoleContext.Provider value={{ role, setRole, isField: role === "field", isOffice: role === "office" }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
