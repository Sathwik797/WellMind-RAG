import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <TopNav onBurgerClick={() => setCollapsed((c) => !c)} />
      <div className="body-wrap">
        <Sidebar collapsed={collapsed} />
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
