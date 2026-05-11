import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div className="flex flex-1 min-w-0 md:flex-row">
        <Sidebar />
        <div className="flex-1 min-w-0 md:ml-64 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
