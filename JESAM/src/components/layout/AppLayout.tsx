import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Outlet />
      </div>
    </div>
  );
}
