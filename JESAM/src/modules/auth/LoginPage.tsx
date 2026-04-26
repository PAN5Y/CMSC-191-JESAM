import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, EDITOR_ROLES } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // ── Smart redirect based on resolved role ──
    if (result.role && EDITOR_ROLES.includes(result.role)) {
      navigate("/publication/dashboard", { replace: true });
    } else {
      // Default to author portal
      navigate("/author", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ── Branding ── */}
        <div className="text-center mb-8">
          <h1 className="font-['Newsreader',serif] text-[42px] text-white mb-1 tracking-tight">
            JESAM
          </h1>
          <p className="text-white/50 font-['Public_Sans',sans-serif] text-sm leading-snug">
            Journal of Environmental Science<br />and Management
          </p>
          <div className="mt-4 h-1 w-16 bg-[#F5C344] mx-auto rounded-full" />
        </div>

        {/* ── Login Card ── */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/10">
          <h2 className="font-['Newsreader',serif] text-[26px] text-[#1a1c1c] mb-1">
            Sign In
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6">
            Access the JESAM Editorial System
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="text-[11px] uppercase tracking-widest text-[#3f4b7e] font-['Public_Sans',sans-serif] font-semibold block mb-2"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@up.edu.ph"
                className="w-full px-4 py-3 bg-[#f8f8fa] border border-[#e0e0e0] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#b0b0b0] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="text-[11px] uppercase tracking-widest text-[#3f4b7e] font-['Public_Sans',sans-serif] font-semibold block mb-2"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#f8f8fa] border border-[#e0e0e0] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#b0b0b0] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-[#ffebee] text-[#c62828] text-sm font-['Public_Sans',sans-serif] rounded-lg border border-[#c62828]/20">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#F5C344] text-[#1a1c1c] font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#F5C344]/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-[#1a1c1c]/20 border-t-[#1a1c1c] rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-[#3f4b7e] font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[#e8e8e8] text-center space-y-0.5">
            <p className="text-[11px] text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              University of the Philippines Los Baños
            </p>
            <p className="text-[11px] text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              School of Environmental Science and Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
