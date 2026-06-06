'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { useSession } from 'next-auth/react';

export default function GestioneStampantePage() {
  const config = useConfig();
  const { data: session } = useSession();
  const [currentPrinter, setCurrentPrinter] = useState<string | null>(null);

  // Al caricamento, leggiamo se c'è già un IP salvato in questo browser
  useEffect(() => {
    const savedIp = localStorage.getItem('sagra_printer_ip');
    if (savedIp) {
      setCurrentPrinter(savedIp);
    }
  }, []);

  // Funzione per salvare l'IP e renderlo persistente
  const setPrinter = (ip: string | undefined) => {
    if (!ip) return;
    localStorage.setItem('sagra_printer_ip', ip);
    setCurrentPrinter(ip);
  };

  // Funzione per cancellare il "cookie" (localStorage) e resettare
  const clearPrinter = () => {
    localStorage.removeItem('sagra_printer_ip');
    setCurrentPrinter(null);
  };

  // Creiamo una lista dinamica dalle variabili del layout/config
  const printers = [
    { label: "Cassa 1: " + config.stampante_uno, ip: config.stampante_uno },
    { label: "Cassa 2: " + config.stampante_due, ip: config.stampante_due },
    { label: "Cassa 3: " + config.stampante_tre, ip: config.stampante_tre },
    { label: "Cassa 4: " + config.stampante_quattro, ip: config.stampante_quattro },
    { label: "Wi-Fi: " + config.stampante_wifi, ip: config.stampante_wifi },
  ].filter(p => p.ip); // Mostra solo quelle che hanno un IP configurato nel .env

  if ((session?.user?.name === "Casse") || (session?.user?.name === "SuperUser")) {

    return (

      <div className="px-3 py-1.5 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configurazione Postazione</h1>

        {/* Stato Attuale */}
        <div className="mb-8 px-3 py-1.5 rrounded-lg border bg-gray-50">
          <p className="text-sm text-gray-500 uppercase font-semibold">Stato attuale:</p>
          {currentPrinter ? (
            <div className="mt-2">
              <span className="text-green-600 font-mono font-bold text-lg">{currentPrinter}</span>
              <button
                onClick={clearPrinter}
                className="ml-4 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition"
              >
                Rimuovi / Cambia
              </button>
            </div>
          ) : (
            <p className="text-orange-500 font-medium">Nessuna stampante associata a questo browser</p>
          )}
        </div>

        {/* Selezione */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-2">Seleziona la stampante per questa cassa:</p>
          {printers.map((p) => (
            <button
              key={p.label}
              onClick={() => setPrinter(p.ip)}
              className={`w-full text-left px-3 py-1.5 rounded-xl border-2 transition-all ${currentPrinter === p.ip
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
            >
              <div className="font-bold text-gray-800">{p.label}</div>
              <div className="text-sm font-mono text-gray-500">{p.ip}</div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400 italic">
          Nota: Questa impostazione è specifica per questo browser e rimarrà attiva anche se chiudi la pagina.
        </p>
      </div>
    );
  } else {

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
  }
}