import { createContext, useContext, useState, useEffect } from "react";

const WellContext = createContext();

export function WellProvider({ children }) {
  const [activeWell, setActiveWellState] = useState(() => {
    try {
      const saved = localStorage.getItem("activeWell");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function setActiveWell(well) {
    setActiveWellState(well);
    if (well) {
      localStorage.setItem("activeWell", JSON.stringify(well));
    } else {
      localStorage.removeItem("activeWell");
    }
  }

  return (
    <WellContext.Provider value={{ activeWell, setActiveWell }}>
      {children}
    </WellContext.Provider>
  );
}

export function useWell() {
  return useContext(WellContext);
}
