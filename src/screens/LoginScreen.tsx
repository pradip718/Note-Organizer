import { User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  error: string | null;
}

export const LoginScreen = ({ onLogin, error }: LoginScreenProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] px-[20px] pt-[64px] pb-[48px] items-center text-center">
      {/* Badge */}
      <span className="font-sans font-medium text-[11px] text-[#C9A84C] tracking-[2px] uppercase mb-[16px]">
        THE PREMIUM EXPERIENCE
      </span>
      
      {/* Title */}
      <h1 className="font-serif font-bold text-[48px] text-[#F0EBE1] leading-[1.1] mb-[32px]">
        Pradip <br />
        <span className="italic font-normal text-[#C9A84C]">Notes</span>
      </h1>

      {/* Separator */}
      <div className="w-[48px] h-[1px] bg-[#C9A84C] opacity-40 mb-[32px]" />

      {/* Subtitle */}
      <p className="font-serif italic text-[20px] text-[#6B6560] leading-[1.6] max-w-[280px] mb-[64px]">
        "A refined sanctuary for the deliberate mind."
      </p>

      {/* Login Button */}
      <button 
        onClick={onLogin}
        className="w-full max-w-[320px] h-[56px] bg-[#F0EBE1] rounded-[12px] flex items-center justify-center gap-[12px] text-[#0A0A0A] font-sans font-bold text-[16px] hover:bg-[#C9A84C] transition-colors active:scale-[0.98] mt-auto"
      >
        <UserIcon size={20} />
        ENTER THE SANCTUARY
      </button>

      {error && (
        <p className="mt-[24px] font-sans font-bold text-[11px] text-[#C0392B] uppercase tracking-[2px]">
          {error}
        </p>
      )}
    </div>
  );
};
