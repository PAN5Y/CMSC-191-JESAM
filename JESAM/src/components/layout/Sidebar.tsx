import { NavLink } from "react-router";
import {
  Upload,
  Users,
  Edit,
  FileCheck,
  BookOpen,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const { user, role, signOut } = useAuth();

  const isAuthor = role === "author";

  const navItems = [
    { icon: Upload, label: "Submission", to: "#", disabled: true },
    { icon: Users, label: "Peer Review", to: "#", disabled: true },
    { icon: Edit, label: "Revision", to: "#", disabled: true },
    { 
      icon: FileCheck, 
      label: "Publication", 
      to: isAuthor ? "/author" : "/publication/dashboard", 
      disabled: false 
    },
    { icon: BookOpen, label: "Journals Dashboard", to: "#", disabled: true },
    { icon: BarChart3, label: "Analytics Dashboard", to: "#", disabled: true },
    { icon: HelpCircle, label: "AI Chatbot", to: "#", disabled: true },
  ];

  return (
    <aside className="w-64 bg-[#3f4b7e] text-white flex flex-col fixed h-screen z-40">
      {/* Branding */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-['Newsreader',serif] text-[22px] text-white mb-1">
          JESAM
        </h1>
        <p className="text-[10px] text-white/70 font-['Public_Sans',sans-serif]">
          Journal of Environmental Science and Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 font-['Public_Sans',sans-serif] text-sm transition-colors cursor-default opacity-60"
                  disabled
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-['Public_Sans',sans-serif] text-sm transition-colors ${
                    isActive
                      ? "bg-[#F5C344] text-[#3f4b7e] font-medium"
                      : "text-white/80 hover:bg-white/10"
                  }`
                }
              >
                <Icon className="size-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User info + Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Logged-in user */}
        {user && (
          <div className="px-4 py-3 bg-white/5 rounded-lg">
            <div className="text-sm font-['Public_Sans',sans-serif] text-white truncate">
              {user.email}
            </div>
            <div className="text-[10px] text-white/50 font-['Public_Sans',sans-serif] uppercase tracking-wider mt-0.5">
              {role?.replace(/_/g, " ") || "User"}
            </div>
          </div>
        )}

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 font-['Public_Sans',sans-serif] text-sm transition-colors">
          <Settings className="size-5" />
          Settings
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-[#c62828]/20 hover:text-[#ffcdd2] font-['Public_Sans',sans-serif] text-sm transition-colors"
        >
          <LogOut className="size-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
