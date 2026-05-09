import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-64">
        <Outlet />
      </div>
    </div>
  );
}
