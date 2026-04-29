import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div className={`${lusitana.className} flex flex-row items-center leading-none !text-black`}>
      {/* SVG: Nascosto su mobile (hidden), visibile solo su desktop (lg:block) */}
      <svg
        viewBox="0 0 200 200"
        className="hidden lg:block lg:h-20 lg:w-20 lg:mr-3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M60 80 C40 20 65 5 85 45 L95 75 Z" fill="#000000" />
        <path d="M110 75 L120 45 C140 5 165 20 145 80 Z" fill="#000000" />
        <path d="M70 80 Q50 90 55 130 C60 170 145 170 150 130 Q155 90 135 80 L70 80 Z" fill="#000000" />
        <path d="M75 135 C75 125 130 125 130 135 C130 165 75 165 75 135 Z" fill="#1a1a1a" />
        <circle cx="85" cy="110" r="4" fill="#ffffff" />
        <circle cx="120" cy="110" r="4" fill="#ffffff" />
        <circle cx="87" cy="110" r="2" fill="#000000" />
        <circle cx="122" cy="110" r="2" fill="#000000" />
      </svg>

      {/* Contenitore Testo: Riga unica e carattere uniforme su mobile, colonna su desktop */}
      <div className="flex flex-row items-center gap-1 lg:flex-col lg:items-start lg:border-l-2 lg:border-black/30 lg:pl-3 lg:gap-0">
        <p className="text-[7px] font-bold !text-black lg:text-[34px]">
          Sagra
        </p>
        <p className="text-[7px] font-bold !text-black lg:mt-1 lg:text-[11px] lg:font-normal lg:tracking-[0.15em]">
          CASTELFERRO
        </p>
        <p className="text-[7px] font-bold !text-black lg:mt-1 lg:text-[11px] lg:uppercase">
          2026
        </p>
      </div>
    </div>
  );
}