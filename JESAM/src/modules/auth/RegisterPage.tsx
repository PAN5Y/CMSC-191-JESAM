import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, type SignUpData } from "@/contexts/AuthContext";
import type { AppRole } from "@/modules/publication-impact/types";

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "author", label: "Author" },
  { value: "reviewer", label: "Reviewer" },
  { value: "associate_editor", label: "Associate Editor" },
  { value: "managing_editor", label: "Managing Editor" },
  { value: "production_editor", label: "Production Editor" },
  { value: "editor_in_chief", label: "Editor-in-Chief" },
  { value: "system_admin", label: "System Administrator" },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [role, setRole] = useState<AppRole>("author");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const payload: SignUpData = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || undefined,
      suffix: suffix || undefined,
      affiliation: affiliation || undefined,
      orcid_id: orcidId || undefined,
      role,
    };

    const result = await signUp(payload);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="mx-auto mb-5 flex items-center justify-center size-16 bg-[#e8f5e9] rounded-full">
              <svg className="size-8 text-[#2e7d32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-['Newsreader',serif] text-[26px] text-[#1a1c1c] mb-2">
              Check Your Email
            </h2>
            <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6 leading-relaxed">
              We sent a confirmation link to <strong className="text-[#1a1c1c]">{email}</strong>.
              <br />Please verify your email, then sign in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-[#3f4b7e] text-white font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Shared input styles ──
  const inputClasses =
    "w-full px-4 py-3 bg-[#f8f8fa] border border-[#e0e0e0] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#b0b0b0] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all";
  const labelClasses =
    "text-[11px] uppercase tracking-widest text-[#3f4b7e] font-['Public_Sans',sans-serif] font-semibold block mb-2";

  // ── Registration form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="font-['Newsreader',serif] text-[42px] text-white mb-1 tracking-tight">
            JESAM
          </h1>
          <p className="text-white/50 font-['Public_Sans',sans-serif] text-sm leading-snug">
            Journal of Environmental Science<br />and Management
          </p>
          <div className="mt-4 h-1 w-16 bg-[#F5C344] mx-auto rounded-full" />
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-['Newsreader',serif] text-[26px] text-[#1a1c1c] mb-1">
            Create Account
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6">
            Register to the JESAM Editorial System
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Name Row ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-first-name" className={labelClasses}>
                  First Name <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="register-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="register-last-name" className={labelClasses}>
                  Last Name <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="register-last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dela Cruz"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* ── Middle Name + Suffix Row ── */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label htmlFor="register-middle-name" className={labelClasses}>
                  Middle Name
                </label>
                <input
                  id="register-middle-name"
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Santos"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="register-suffix" className={labelClasses}>
                  Suffix
                </label>
                <input
                  id="register-suffix"
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="Jr., III"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label htmlFor="register-email" className={labelClasses}>
                Email Address <span className="text-[#c62828]">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@up.edu.ph"
                className={inputClasses}
              />
            </div>

            {/* ── Affiliation ── */}
            <div>
              <label htmlFor="register-affiliation" className={labelClasses}>
                Affiliation <span className="text-[#c62828]">*</span>
              </label>
              <input
                id="register-affiliation"
                type="text"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="University of the Philippines Los Baños"
                className={inputClasses}
              />
            </div>

            {/* ── ORCID iD ── */}
            <div>
              <label htmlFor="register-orcid" className={labelClasses}>
                ORCID iD
              </label>
              <input
                id="register-orcid"
                type="text"
                value={orcidId}
                onChange={(e) => setOrcidId(e.target.value)}
                placeholder="0000-0000-0000-0000"
                className={inputClasses}
              />
              <p className="text-[10px] text-[#9e9e9e] font-['Public_Sans',sans-serif] mt-1">
                Your 16-digit ORCID identifier (optional)
              </p>
            </div>

            {/* ── Role ── */}
            <div>
              <label htmlFor="register-role" className={labelClasses}>
                Role
              </label>
              <select
                id="register-role"
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
                className={inputClasses}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Password Row ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-password" className={labelClasses}>
                  Password <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="register-confirm" className={labelClasses}>
                  Confirm Password <span className="text-[#c62828]">*</span>
                </label>
                <input
                  id="register-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-[#ffebee] text-[#c62828] text-sm font-['Public_Sans',sans-serif] rounded-lg border border-[#c62828]/20">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#F5C344] text-[#1a1c1c] font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#F5C344]/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-[#1a1c1c]/20 border-t-[#1a1c1c] rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#3f4b7e] font-semibold hover:underline"
            >
              Sign In
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
