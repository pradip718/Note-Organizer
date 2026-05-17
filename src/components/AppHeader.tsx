import { logout } from '../lib/firebase';

interface AppHeaderProps {
  userName: string | null;
}

export const AppHeader = ({ userName }: AppHeaderProps) => {
  const initial = userName ? userName.charAt(0).toUpperCase() : "P";
  
  return (
    <header className="pt-[48px] px-[20px] flex flex-col relative w-full mb-[32px]">
      {/* Line 1 */}
      <span className="font-sans font-medium text-[11px] text-[#C9A84C] tracking-[2px] uppercase mb-[6px]">
        THE PREMIUM
      </span>

      {/* Line 2 */}
      <h1 className="font-serif font-bold text-[32px] text-[#F0EBE1] flex items-baseline mb-[8px]">
        Pradip <span className="italic font-normal text-[#C9A84C] ml-[1px]">Notes</span>
      </h1>

      {/* Line 3: Thin Line */}
      <div className="w-full h-[1px] bg-[#C9A84C] opacity-40 mb-[32px]" />

      {/* Avatar */}
      <div 
        onClick={logout}
        className="absolute top-[48px] right-[20px] w-[40px] h-[40px] bg-[#1C1C1C] border border-[#C9A84C]/40 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2A2A2A] transition-colors"
      >
        <span className="font-sans font-semibold text-[16px] text-[#C9A84C]">{initial}</span>
      </div>
    </header>
  );
};
