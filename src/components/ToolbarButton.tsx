import { ElementType } from 'react';
import { cn } from '../lib/utils';

interface ToolbarButtonProps {
  icon: ElementType;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label?: string;
}

export const ToolbarButton = ({ icon: Icon, onClick, active, disabled, label }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      "p-2.5 rounded-xl transition-all flex items-center justify-center min-w-[44px] h-[44px]",
      active 
        ? "bg-[#c9a84c] text-[#0a0a0a] shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
        : "hover:bg-white/10 text-[#6b6560] hover:text-[#f0ebe1]",
      "disabled:opacity-10 disabled:cursor-not-allowed active:scale-90"
    )}
  >
    <Icon size={20} />
  </button>
);
