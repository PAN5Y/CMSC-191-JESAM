import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  value: string | number;
  label: string;
  highlight?: boolean;
  large?: boolean;
  icon?: LucideIcon;
  color?: string;
}

export default function MetricCard({
  value,
  label,
  highlight = false,
  large = false,
  icon: Icon,
  color,
}: MetricCardProps) {
  return (
    <div
      className={`p-${large ? "4" : "3"} rounded-lg text-center border transition-shadow ${
        highlight
          ? "bg-[#fff8e1] border-[#F5C344]"
          : "bg-[#f5f5f5] border-[#e0e0e0]"
      } ${large ? "hover:shadow-md cursor-pointer" : ""}`}
    >
      {Icon && (
        <div className="flex justify-center mb-2">
          <Icon className="size-5" style={{ color: color || "#3f4b7e" }} />
        </div>
      )}
      <div
        className={`font-['Newsreader',serif] ${
          large ? "text-[32px]" : "text-lg"
        } mb-1`}
        style={{ color: color || (highlight ? "#F5C344" : "#3f4b7e") }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#9e9e9e] font-['Public_Sans',sans-serif]">
        {label}
      </div>
    </div>
  );
}
