import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";

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
    } else {
      navigate("/publication/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3f4b7e] via-[#2d3a6b] to-[#1a1c1c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="font-['Newsreader',serif] text-[40px] text-white mb-2">
            JESAM
          </h1>
          <p className="text-white/60 font-['Public_Sans',sans-serif] text-sm">
            Journal of Environmental Science and Management
          </p>
          <div className="mt-3 h-1 w-16 bg-[#F5C344] mx-auto rounded-full" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] mb-1">
            Sign In
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6">
            Access the Publication & Impact Module
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@uplb.edu.ph"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#ffebee] text-[#c62828] text-sm font-['Public_Sans',sans-serif] rounded-lg">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#3f4b7e] text-white font-['Public_Sans',sans-serif] text-sm font-medium rounded-lg hover:bg-[#3f4b7e]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e0e0e0] text-center">
            <p className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              University of the Philippines Los Baños
            </p>
            <p className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              School of Environmental Science and Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
