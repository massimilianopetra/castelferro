'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { useSession } from 'next-auth/react';
import { Switch, FormControlLabel } from '@mui/material';

export default function GestioneStampantePage() {
  const config = useConfig();
  const { data: session } = useSession();
  const [currentPrinter, setCurrentPrinter] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'finestra' | 'termica'>('finestra');

  useEffect(() => {
    const savedIp = localStorage.getItem('sagra_printer_ip');
    if (savedIp) setCurrentPrinter(savedIp);

    const savedMode = localStorage.getItem('sagra_print_mode') as 'finestra' | 'termica';
    if (savedMode) setPrintMode(savedMode);
  }, []);

  const setPrinter = (ip: string | undefined) => {
    if (!ip) return;
    localStorage.setItem('sagra_printer_ip', ip);
    setCurrentPrinter(ip);
  };

  const clearPrinter = () => {
    localStorage.removeItem('sagra_printer_ip');
    setCurrentPrinter(null);
  };

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked ? 'termica' : 'finestra';
    localStorage.setItem('sagra_print_mode', newMode);
    setPrintMode(newMode);
  };

  const printers = [
    { label: "Cassa 1: " + config.stampante_uno, ip: config.stampante_uno },
    { label: "Cassa 2: " + config.stampante_due, ip: config.stampante_due },
    { label: "Cassa 3: " + config.stampante_tre, ip: config.stampante_tre },
    { label: "Cassa 4: " + config.stampante_quattro, ip: config.stampante_quattro },
    { label: "Wi-Fi: " + config.stampante_wifi, ip: config.stampante_wifi },
  ].filter(p => p.ip);

  if (["IngressoE", "Ingresso", "Casse", "SuperUser"].includes(session?.user?.name || '')) {
    return (
      <div className="px-3 py-1.5 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configurazione Postazione</h1>

        {/* Modalità di Stampa Conto */}
        <div className="mb-6 px-4 py-3 rounded-lg border bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">Modalità Stampa Conto</p>
            <p className="text-xs text-gray-500">
              {printMode === 'termica' ? 'Stampa diretta su Stampante Termica' : 'Apre la finestra di stampa del browser'}
            </p>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={printMode === 'termica'}
                onChange={handleModeChange}
                color="primary"
              />
            }
            label=""
          />
        </div>

        {/* Stato Attuale Stampante Termica */}
        <div className="mb-8 px-3 py-1.5 rounded-lg border bg-gray-50">
          <p className="text-sm text-gray-500 uppercase font-semibold">Stato attuale stampante:</p>
          {currentPrinter ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-green-600 font-mono font-bold text-lg">{currentPrinter}</span>
              <button
                onClick={clearPrinter}
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition"
              >
                Rimuovi / Cambia
              </button>
            </div>
          ) : (
            <p className="text-orange-500 font-medium">Nessuna stampante associata a questo browser</p>
          )}
        </div>

        {/* Selezione Stampante */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-2">Seleziona la stampante per questa cassa:</p>
          {printers.map((p) => (
            <button
              key={p.label}
              onClick={() => setPrinter(p.ip)}
              className={`w-full text-left px-3 py-1.5 rounded-xl border-2 transition-all ${
                currentPrinter === p.ip
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
          Nota: Queste impostazioni sono specifiche per questo browser e rimarranno salvate in memoria locale.
        </p>
      </div>
    );
  }

  return (
    <main>
      <div className="flex flex-wrap flex-col">
        <div className='text-center '>
          <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
            <span className="text-xl font-semibold">Accesso Negato (STAMPANTI TERMICHE)</span>
          </div>
        </div>
      </div>
    </main>
  );
}