import { Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspaceHomePath } from "@/lib/workspace-routing";

export default function PublicHeader() {
  const { user, role, signOut } = useAuth();

  if (user) {
    const workspace = role ? getWorkspaceHomePath(role) : "/author";
    return (
      <header className="bg-[#3f4b7e] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link to="/browse" className="font-['Newsreader',serif] text-xl tracking-tight hover:text-white/90 shrink-0">
            JESAM
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 font-['Public_Sans',sans-serif] text-sm">
            <Link
              to={workspace}
              className="text-white/95 hover:text-white font-medium whitespace-nowrap shrink-0"
            >
              Back to workspace
            </Link>
            <span className="text-white/70 truncate hidden sm:inline max-w-[200px]" title={user.email ?? undefined}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-white/90 hover:text-white whitespace-nowrap shrink-0"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#3f4b7e] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/browse" className="font-['Newsreader',serif] text-xl tracking-tight hover:text-white/90">
          JESAM
        </Link>
        <nav className="flex items-center gap-4 font-['Public_Sans',sans-serif] text-sm">
          <Link to="/login" className="text-white/90 hover:text-white">
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-[#F5C344] px-3 py-1.5 text-[#3f4b7e] font-medium hover:bg-[#f0bd3a]"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
