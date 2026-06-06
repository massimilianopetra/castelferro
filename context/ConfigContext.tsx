'use client';
import { createContext, useContext, useState } from 'react';

// Usiamo il record per dire: "accetta le 3 booleane + qualsiasi altra stringa/numero già presente nel vecchio config"
type ConfigContextProps = {
  disabilitaStatisticheChiama: boolean;
  setDisabilitaStatisticheChiama: (val: boolean) => void;
  disabilitaStatisticheDistributore: boolean;
  setDisabilitaStatisticheDistributore: (val: boolean) => void;
  disabilitaStatisticheCucina: boolean;
  setDisabilitaStatisticheCucina: (val: boolean) => void;
} & Record<string, any>; // <-- Questo cattura TUTTE le tue vecchie variabili in automatico!

const ConfigContext = createContext<ConfigContextProps | null>(null);

export function ConfigProvider({ children, config }: { children: React.ReactNode, config: any }) {
  const [disabilitaStatisticheChiama, setDisabilitaStatisticheChiama] = useState(false);
  const [disabilitaStatisticheDistributore, setDisabilitaStatisticheDistributore] = useState(false);
  const [disabilitaStatisticheCucina, setDisabilitaStatisticheCucina] = useState(false);

  // Distruggiamo dentro 'value' tutto il vecchio oggetto originale (qualsiasi variabile ci sia dentro)
  // e aggiungiamo i nostri 3 stati con le rispettive funzioni
  const value = {
    ...config, 
    disabilitaStatisticheChiama,
    setDisabilitaStatisticheChiama,
    disabilitaStatisticheDistributore,
    setDisabilitaStatisticheDistributore,
    disabilitaStatisticheCucina,
    setDisabilitaStatisticheCucina,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig deve essere usato dentro ConfigProvider");
  return context;
}