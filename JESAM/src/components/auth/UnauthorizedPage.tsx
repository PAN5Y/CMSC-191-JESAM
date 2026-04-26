import { useNavigate } from "react-router";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex items-center justify-center size-20 bg-[#ffebee] rounded-full">
          <ShieldX className="size-10 text-[#c62828]" />
        </div>
        <h1 className="font-['Newsreader',serif] text-[32px] text-[#1a1c1c] mb-3">
          Access Denied
        </h1>
        <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6 leading-relaxed">
          You do not have the required permissions to access the Publication &
          Impact Module. This area is restricted to Production Editors, Managing
          Editors, and Administrators.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-[#3f4b7e] text-white font-['Public_Sans',sans-serif] text-sm rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
          >
            Sign in with a different account
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-[#e0e0e0] text-[#1a1c1c] font-['Public_Sans',sans-serif] text-sm rounded-lg hover:bg-[#f5f5f5] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
