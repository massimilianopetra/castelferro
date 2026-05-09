'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';

export default function DisplayPage() {
  const { anno, titolo, edizione, inizio, fine, mese } = useConfig();
  const [numero, setNumero] = useState<number | null>(null);
  const [precedenti, setPrecedenti] = useState<number[]>([]);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("Tentativo di connessione SSE...");
      es = new EventSource('/api/next-client');

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'CALL_NUMBER') {
            setNumero(data.numero);
            if (data.history) {
              setPrecedenti(data.history.slice(1, 6));
            }
          }
          
          if (data.type === 'UPDATE_HISTORY') {
            setPrecedenti((data.history || []).slice(0, 5));
          }

          if (data.type === 'REFRESH_TABLE') {
            setNumero(null);
            setPrecedenti([]);
          }
        } catch (error) {
          console.error('Errore parsing SSE:', error);
        }
      };

      es.onerror = (error) => {
        if (es) es.close();
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (es) es.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        userSelect: 'none',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
        display: 'flex'
      }}
    >
      <style>{`
        @keyframes neonGlow {
          0%, 100% { text-shadow: 0 0 30px #ffff00; color: #ffff00; }
          50% { text-shadow: 0 0 50px #fff; color: #ffffff; }
        }
      `}</style>

     
        <>
          {/* AREA SINISTRA: NUMERO GIGANTE */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            borderRight: '2px solid #222',
            position: 'relative'
          }}>
            <p style={{ 
              color: '#888', 
              fontSize: '4vw', 
              fontWeight: 900, 
              letterSpacing: '0.5em', 
              position: 'absolute', 
              top: '5vh' 
            }}>
              NUMERO
            </p>
            
            <p style={{
              color: '#ff0000',
              fontSize: '40vw', // Ancora più grande grazie allo spazio orizzontale
              fontWeight: 900,
              lineHeight: 1,
              margin: 0,
              fontFamily: 'monospace',
              textShadow: '0 0 80px rgba(255,0,0,0.6)'
            }}>
              {numero}
            </p>
          </div>

          {/* AREA DESTRA: SPALLA PRECEDENTI */}
          <div style={{ 
            width: '22vw', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5vh', 
            padding: '2vh 1.5vw',
            backgroundColor: '#050505',
            justifyContent: 'center'
          }}>
            <p style={{ 
                color: '#444', 
                fontSize: '1.5vw', 
                fontWeight: 900, 
                textAlign: 'center', 
                marginBottom: '1vh',
                letterSpacing: '0.1em'
            }}>
                PRECEDENTI
            </p>
            
            {precedenti.map((num, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#111',
                  border: '2px solid #333',
                  borderRadius: '15px',
                  padding: '1.5vh 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 1 - (idx * 0.15) // Effetto sfumato per i più vecchi
                }}
              >
                <span style={{ 
                  color: '#fff', 
                  fontSize: '6vw', // Numeri chiari e grandi nella spalla
                  fontWeight: 900, 
                  fontFamily: 'monospace', 
                  lineHeight: 1 
                }}>
                  {num}
                </span>
              </div>
            ))}
          </div>
        </>
      
    </div>
  );
}