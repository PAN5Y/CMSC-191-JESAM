import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth, type SignUpData } from "@/contexts/AuthContext";
import type { AppRole } from "@/modules/publication-impact/types";
import type { JournalClassification } from "@/types";

const SESAM_FOCUS_OPTIONS: JournalClassification[] = [
  "Land",
  "Air",
  "Water",
  "People",
];

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "author", label: "Author" },
  { value: "reviewer", label: "Reviewer" },
  { value: "associate_editor", label: "Associate Editor" },
  { value: "managing_editor", label: "Managing Editor" },
  { value: "technical_editor", label: "Technical Editor" },
  { value: "production_editor", label: "Production Editor" },
  { value: "editor_in_chief", label: "Editor-in-Chief" },
  { value: "system_admin", label: "System Administrator" },
];

const inputClasses =
  "w-full px-4 py-3 bg-[#f8faf9] border border-[#d8dedb] rounded-lg font-['Public_Sans',sans-serif] text-sm text-[#1a1c1c] placeholder:text-[#8a9692] focus:border-[#3f4b7e] focus:ring-2 focus:ring-[#3f4b7e]/20 outline-none transition-all";
const labelClasses =
  "text-[11px] uppercase tracking-widest text-[#3f4b7e] font-['Public_Sans',sans-serif] font-semibold block mb-2";

function AuthVisualPanel() {
  return (
    <div className="relative min-h-40 bg-[#1f352c] lg:min-h-[820px]">
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
          Join the editorial and scholarly community supporting environmental
          science.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [role, setRole] = useState<AppRole>("author");
  const [reviewExpertise, setReviewExpertise] = useState<
    JournalClassification | ""
  >("");
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
    if (role === "reviewer" && !reviewExpertise) {
      setError("Please select your SESAM review expertise.");
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
      review_expertise:
        role === "reviewer" && reviewExpertise ? reviewExpertise : undefined,
    };

    const result = await signUp(payload);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 lg:grid lg:grid-cols-[312px_minmax(520px,1fr)]">
          <AuthVisualPanel />
          <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
            <div className="w-full max-w-md text-center">
              <img
                src="logos/UPLB LOGO w SESAM.png"
                alt="UPLB School of Environmental Science and Management"
                width={2281}
                height={627}
                className="mx-auto mb-8 h-auto w-full max-w-sm"
              />
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[#e8f5e9]">
                <svg
                  className="size-8 text-[#2e7d32]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="font-['Newsreader',serif] text-[30px] leading-tight text-[#1a1c1c]">
                Check your email
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#5f6b67] font-['Public_Sans',sans-serif]">
                We sent a confirmation link to{" "}
                <strong className="text-[#1a1c1c]">{email}</strong>. Please
                verify your email, then sign in.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-7 px-6 py-3 bg-[#3f4b7e] text-white font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#34406d] transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c1c] via-[#2d3a6b] to-[#3f4b7e] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 lg:grid lg:grid-cols-[312px_minmax(640px,1fr)]">
        <AuthVisualPanel />

        <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-3xl">
            <img
              src="logos/UPLB LOGO w SESAM.png"
              alt="UPLB School of Environmental Science and Management"
              width={2281}
              height={627}
              className="mb-8 h-auto w-full max-w-sm"
            />

            <div className="mb-7">
              <h1 className="font-['Newsreader',serif] text-[34px] leading-tight text-[#1a1c1c]">
                Create account
              </h1>
              <p className="mt-2 text-sm text-[#5f6b67] font-['Public_Sans',sans-serif]">
                Register to use the JESAM Editorial System.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label
                    htmlFor="register-middle-name"
                    className={labelClasses}
                  >
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                </div>
              </div>

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
                  placeholder="University of the Philippines Los Banos"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="register-role" className={labelClasses}>
                    Role
                  </label>
                  <select
                    id="register-role"
                    value={role}
                    onChange={(e) => {
                      const v = e.target.value as AppRole;
                      setRole(v);
                      if (v !== "reviewer") setReviewExpertise("");
                    }}
                    className={inputClasses}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {role === "reviewer" && (
                  <div>
                    <label className={labelClasses}>
                      SESAM review expertise{" "}
                      <span className="text-[#c62828]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SESAM_FOCUS_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setReviewExpertise(opt)}
                          className={`px-4 py-3 border rounded-lg font-medium font-['Public_Sans',sans-serif] text-sm transition-all ${
                            reviewExpertise === opt
                              ? "border-[#3f4b7e] bg-[#3f4b7e]/10 text-[#3f4b7e]"
                              : "border-[#d8dedb] bg-[#f8faf9] text-[#1a1c1c] hover:border-[#a7b3ae]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    placeholder="Confirm password"
                    className={inputClasses}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#ffebee] text-[#c62828] text-sm font-['Public_Sans',sans-serif] rounded-lg border border-[#c62828]/20">
                  {error}
                </div>
              )}

              <button
                id="register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#F5C344] text-[#1a1c1c] font-['Public_Sans',sans-serif] text-sm font-semibold rounded-lg hover:bg-[#edb92f] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="size-4 border-2 border-[#1a1c1c]/20 border-t-[#1a1c1c] rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f6b67] font-['Public_Sans',sans-serif]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#3f4b7e] font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
