import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import sesamLogo from "@/assets/branding/sesam-logo.png";
import uplbSesamBanner from "@/assets/branding/uplb-sesam-banner.png";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspaceHomePath } from "@/lib/workspace-routing";

interface PublicJournalsShellProps {
  children: ReactNode;
  backgroundClassName?: string;
  maxWidthClassName?: string;
  headerAction?: ReactNode;
}

export default function PublicJournalsShell({
  children,
  backgroundClassName = "bg-[linear-gradient(180deg,#eef2fb_0%,#f4efe8_20%,#f7f8fc_54%,#fbfbfd_100%)]",
  maxWidthClassName = "max-w-[92rem]",
  headerAction,
}: PublicJournalsShellProps) {
  const { user, role, signOut } = useAuth();
  const workspacePath = role ? getWorkspaceHomePath(role) : "/author";
  const currentYear = new Date().getFullYear();
  const shellWidthClassName = `mx-auto w-full ${maxWidthClassName}`;

  return (
    <div className={`min-h-screen text-slate-900 ${backgroundClassName}`}>
      <header className="border-b border-[#2c3a6a] bg-[linear-gradient(135deg,#1d2548_0%,#253465_44%,#31427a_100%)] text-slate-100">
        <div
          className={`${shellWidthClassName} flex flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/journals"
              className="shrink-0 rounded-[1.1rem] bg-white p-1.5 shadow-[0_16px_35px_rgba(10,16,34,0.18)] ring-1 ring-black/6 transition hover:shadow-[0_18px_38px_rgba(10,16,34,0.22)]"
            >
              <img
                src={sesamLogo}
                alt="School of Environmental Science and Management seal"
                className="size-12 object-contain sm:size-14"
              />
            </Link>
            <div className="min-w-0 space-y-1">
              <Link to="/journals" className="block">
                <p className="font-['Newsreader',serif] text-[1.9rem] leading-none tracking-tight text-white transition hover:text-[#f2e9d7] sm:text-[2rem]">
                  JESAM Public Journals
                </p>
              </Link>
              <p className="font-['Public_Sans',sans-serif] text-sm text-slate-100/84">
                School of Environmental Science and Management
              </p>
              <p className="font-['Public_Sans',sans-serif] text-xs uppercase tracking-[0.14em] text-[#d7c4a3]">
                University of the Philippines Los Baños
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {headerAction}
            {user ? (
              <Button
                asChild
                variant="outline"
                className="border-white/18 bg-white/8 text-slate-100 hover:bg-white/14 hover:text-white"
              >
                <Link to={workspacePath}>Back to workspace</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                className="text-slate-100 hover:bg-white/12 hover:text-white"
              >
                <Link to="/login">Login</Link>
              </Button>
            )}
            {user ? (
              <Button
                variant="outline"
                className="border-[#d7c4a3] bg-[#f3e7d0] text-[#5f4d31] hover:bg-[#ead8b7]"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="border-[#d7c4a3] bg-[#f3e7d0] text-[#5f4d31] hover:bg-[#ead8b7]"
              >
                <Link to="/register">Register</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        className={`${shellWidthClassName} flex flex-col gap-7 px-6 py-8 lg:px-8 lg:py-12`}
      >
        {children}
      </main>

      <footer className="border-t border-[#2c3a6a] bg-[linear-gradient(135deg,#1d2548_0%,#253465_44%,#31427a_100%)] text-slate-100">
        <div className={`${shellWidthClassName} px-6 py-8 lg:px-8`}>
          <div className="grid gap-8 border-b border-white/12 pb-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-10">
            <div className="space-y-4">
              <div className="inline-flex rounded-[1.6rem] bg-white px-4 py-3 shadow-[0_20px_45px_rgba(10,16,34,0.18)] ring-1 ring-black/6 sm:px-5">
                <img
                  src={uplbSesamBanner}
                  alt="School of Environmental Science and Management, University of the Philippines Los Banos"
                  className="h-16 w-auto max-w-full object-contain sm:h-20"
                />
              </div>
              <div className="space-y-2">
                <p className="font-['Newsreader',serif] text-2xl text-white">
                  JESAM Public Journals
                </p>
                <p className="max-w-xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/80">
                  Public archive of published JESAM research for journal-first
                  browsing, paper discovery, and academic scanning.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-['Public_Sans',sans-serif] text-xs font-semibold uppercase tracking-[0.16em] text-[#d7c4a3]">
                About
              </p>
              <div className="space-y-2 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/80">
                <p>School of Environmental Science and Management</p>
                <p>University of the Philippines Los Baños</p>
                <p>Journal of Environmental Science and Management</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-['Public_Sans',sans-serif] text-xs font-semibold uppercase tracking-[0.16em] text-[#d7c4a3]">
                Public Access
              </p>
              <div className="space-y-2 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/80">
                <p>Browse journals, journal details, and paper pages</p>
                <p>Published metadata and public-safe paper access only</p>
                <p>Editorial workflows remain outside this archive</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-5 text-sm text-slate-100/72 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-['Public_Sans',sans-serif]">
              © {currentYear} University of the Philippines Los Baños
            </p>
            <p className="font-['Public_Sans',sans-serif]">
              JESAM public archive interface
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
