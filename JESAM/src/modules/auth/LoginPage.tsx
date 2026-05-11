import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspaceHomePath } from "@/lib/workspace-routing";

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

    const r = result.role;
    if (r) {
      navigate(getWorkspaceHomePath(r), { replace: true });
    } else {
      navigate("/author", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 lg:grid lg:grid-cols-[274px_minmax(520px,1fr)]">
        <div className="relative min-h-40 bg-[#1f352c] lg:min-h-[720px]">
          <img
            src="/JESAM Collage.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover lg:object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white lg:p-8">
            <p className="font-['Newsreader',serif] text-3xl leading-none lg:text-5xl">
              JESAM
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
              Environmental research, review, and publication management.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <img
              src="/UPLB LOGO w SESAM.png"
              alt="UPLB School of Environmental Science and Management"
              width={2281}
              height={627}
              className="mb-8 h-auto w-full max-w-sm"
            />

            <div className="mb-7">
              <h1 className="font-['Newsreader',serif] text-[34px] leading-tight text-[#1a1c1c]">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-[#5f6b67] font-['Public_Sans',sans-serif]">
                Access the JESAM Editorial System.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full px-4 py-3 bg-[#f8faf9] border border-[#d8dedb] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#8a9692] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
                />
              </div>

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
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-[#f8faf9] border border-[#d8dedb] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#8a9692] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-[#ffebee] text-[#c62828] text-sm font-['Public_Sans',sans-serif] rounded-lg border border-[#c62828]/20">
                  {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#F5C344] text-[#1a1c1c] font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#edb92f] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="size-4 border-2 border-[#1a1c1c]/20 border-t-[#1a1c1c] rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f6b67] font-['Public_Sans',sans-serif]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-[#3f4b7e] font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>

            <div className="mt-7 border-t border-[#e3e8e5] pt-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-[#7c8783] font-['Public_Sans',sans-serif]">
                Journal of Environmental Science and Management
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
