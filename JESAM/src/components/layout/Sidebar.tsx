import { NavLink, Link } from 'react-router';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSidebarItems } from '@/lib/nav-permissions';

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const navItems = getSidebarItems(role);

  return (
    <aside className="w-full md:w-64 bg-[#3f4b7e] text-white flex flex-col md:fixed md:h-screen z-40">
      {/* Branding */}
      <div className="p-6 border-b border-white/10">
        <img
          src="logos\UPLB LOGO w SESAM White text.png"
          alt="UPLB School of Environmental Science and Management"
          width={2281}
          height={627}
          className="h-auto w-full max-w-[208px] object-contain"
        />
        <h1 className="font-['Newsreader',serif] text-[22px] text-white mt-4 mb-1">JESAM</h1>
        <p className="text-[10px] text-white/70 font-['Public_Sans',sans-serif]">
          Journal of Environmental Science and Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-x-auto md:overflow-visible">
        <div className="flex gap-2 md:block md:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-lg font-['Public_Sans',sans-serif] text-sm transition-colors ${
                    isActive
                      ? 'bg-[#F5C344] text-[#3f4b7e] font-medium'
                      : 'text-white/80 hover:bg-white/10'
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
      <div className="hidden md:block p-4 border-t border-white/10 space-y-3">
        {user ? (
          <>
            <div className="px-4 py-3 bg-white/5 rounded-lg">
              <div className="text-sm font-['Public_Sans',sans-serif] text-white truncate">
                {user.email}
              </div>
              <div className="text-[10px] text-white/50 font-['Public_Sans',sans-serif] uppercase tracking-wider mt-0.5">
                {role?.replace(/_/g, ' ') || 'User'}
              </div>
            </div>

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
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full text-center px-4 py-2.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 font-['Public_Sans',sans-serif] text-sm transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="w-full text-center px-4 py-2.5 rounded-lg bg-[#F5C344] text-[#3f4b7e] font-bold font-['Public_Sans',sans-serif] text-sm hover:bg-[#f0bd3a] transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
