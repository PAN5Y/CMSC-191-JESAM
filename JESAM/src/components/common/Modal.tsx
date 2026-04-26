import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-lg ${maxWidth} w-full p-6 my-8`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-['Newsreader',sans-serif] text-[24px] text-[#1a1c1c]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
