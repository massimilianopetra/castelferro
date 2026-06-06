'use client';

import React from 'react';
import { useConfig } from '@/context/ConfigContext'; // Adegua il percorso se necessario
import { useSession } from 'next-auth/react';
export default function Impostazioni() {
  const {
    titolo,
    edizione,
    disabilitaStatisticheChiama,
    setDisabilitaStatisticheChiama,
    disabilitaStatisticheDistributore,
    setDisabilitaStatisticheDistributore,
    disabilitaStatisticheCucina,
    setDisabilitaStatisticheCucina,
  } = useConfig();
  const { data: session } = useSession();

  if ((session?.user?.name !== "SuperUser")) {

    return (
      <main>
        <div className="flex flex-wrap flex-col">
          <div className='text-center '>
            <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
              <span className="text-xl font-semibold">Accesso Negato</span>
            </div>
          </div>
        </div>
      </main>
    );
  } else {

    return (

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{titolo || 'Gestione Sagra'}</h1>
        <p className="text-gray-500 mb-6">Edizione: {edizione || 'N/D'}</p>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ottimizzazione Carico di Rete / Database
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Disattiva le statistiche in tempo reale nelle varie postazioni per alleggerire il carico sul server nei momenti di picco affluenza.
          </p>

          <div className="space-y-6">
            {/* Switch per CHIAMA */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <label htmlFor="switch-chiama" className="font-medium text-gray-900 block">
                  Postazione CHIAMA
                </label>
                <span className="text-sm text-gray-500">
                  Disattiva i grafici e i calcoli sui tempi di chiamata dei numeri
                </span>
              </div>
              <input
                id="switch-chiama"
                type="checkbox"
                className="w-11 h-6 bg-gray-200 rounded-full appearance-none checked:bg-red-600 cursor-pointer relative before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all duration-200"
                checked={disabilitaStatisticheChiama}
                onChange={(e) => setDisabilitaStatisticheChiama(e.target.checked)}
              />
            </div>

            {/* Switch per DISTRIBUTORE */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <label htmlFor="switch-distributore" className="font-medium text-gray-900 block">
                  Postazione DISTRIBUTORE
                </label>
                <span className="text-sm text-gray-500">
                  Disattiva il riepilogo vendite e le stime sui tempi di attesa cassa
                </span>
              </div>
              <input
                id="switch-distributore"
                type="checkbox"
                className="w-11 h-6 bg-gray-200 rounded-full appearance-none checked:bg-red-600 cursor-pointer relative before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all duration-200"
                checked={disabilitaStatisticheDistributore}
                onChange={(e) => setDisabilitaStatisticheDistributore(e.target.checked)}
              />
            </div>

            {/* Switch per CUCINA */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="switch-cucina" className="font-medium text-gray-900 block">
                  Postazione CUCINA
                </label>
                <span className="text-sm text-gray-500">
                  Disattiva i contatori totali dei piatti pronti/da fare per velocizzare lo schermo comande
                </span>
              </div>
              <input
                id="switch-cucina"
                type="checkbox"
                className="w-11 h-6 bg-gray-200 rounded-full appearance-none checked:bg-red-600 cursor-pointer relative before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all duration-200"
                checked={disabilitaStatisticheCucina}
                onChange={(e) => setDisabilitaStatisticheCucina(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}