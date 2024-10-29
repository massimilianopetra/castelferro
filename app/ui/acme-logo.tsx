'use client';

import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import type { DbFiera } from '@/app/lib/definitions';
import { useState, useEffect } from 'react';
import { getGiornoSagra } from '@/app/lib/actions';

export default function AcmeLogo() {
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const gg = await getGiornoSagra();
    if (gg) {
      setSagra(gg);
    }
  }


  return (
    <div>
      <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
        <GlobeAltIcon className="h-12 w-12 rotate-[15deg]" />
        <p className="text-xs">Sagra Castelferro</p>
      </div>

      <div className="text-xs text-center ">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>

    </div>
  );
}
