'use client';
import { createContext, useContext } from 'react';

// Creiamo il contenitore per i dati
const ConfigContext = createContext<any>(null);

export function ConfigProvider({ children, config }: { children: React.ReactNode, config: any }) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
// Questa è la funzione che userai nei componenti Client
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig deve essere usato dentro ConfigProvider");
  return context;
}