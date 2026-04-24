
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { GlobeEuropeAfricaIcon, SparklesIcon } from '@heroicons/react/20/solid';

export default function AcmeLogo() {


  return (
    <div>
      <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
        <SparklesIcon className="h-5 w-5 rotate-[15deg] text-blue-300 animate-bounce" />
        <p className="text-xs text-green-500">SagraCastelferro</p>
        <p className="text-xs text-green-500">2026</p>
        <SparklesIcon className="h-5 w-5 rotate-[15deg] text-blue-300 animate-bounce" />
      </div>
    </div>
  );
}