
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {


  return (
    <div>
      <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
        <GlobeAltIcon className="h-5 w-5 rotate-[15deg]" />
        <p className="text-xs">Sagra Castelferro</p>
      </div>
    </div>
  );
}
