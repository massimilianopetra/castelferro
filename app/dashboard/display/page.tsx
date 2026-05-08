'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';

export default function DisplayPage() {
  const { anno, titolo, edizione, inizio, fine, mese } = useConfig();
  const [numero, setNumero] = useState<number | null>(null);
  const [precedenti, setPrecedenti] = useState<number[]>([]);

  useEffect(() => {
    // Specifichiamo il tipo per evitare l'errore che vedi nell'immagine
    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("Tentativo di connessione SSE...");
      es = new EventSource('/api/next-client');

      es.onopen = () => {
        console.log("Connessione stabilita con successo.");
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CALL_NUMBER') {
            setNumero(data.numero);
            if (data.history) {
              setPrecedenti(data.history.slice(0, 5));
            }
          }
          if (data.type === 'UPDATE_HISTORY') {
            setPrecedenti((data.history || []).slice(0, 5));
          }
        } catch (error) {
          console.error('Errore parsing SSE:', error);
        }
      };

      es.onerror = (error) => {
        console.error('Errore SSE rilevato. Riconnessione in 3s...', error);
        if (es) {
            es.close();
        }
        // Tenta di riconnettersi dopo 3 secondi
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    // Cleanup alla chiusura del componente
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
        userSelect: 'none',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
        padding: '1vh 0'
      }}
    >
      <style>{`
        @keyframes neonGlow {
          0%, 100% {
            text-shadow: 0 0 20px #ffff00, 0 0 40px #ffcc00;
            color: #ffff00;
          }
          50% {
            text-shadow: 0 0 20px #fff, 0 0 40px #fff;
            color: #ffffff;
          }
        }
      `}</style>

      {numero === null ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
            animation: 'neonGlow 5s ease-in-out infinite'
          }}
        >
          <div style={{ fontSize: '8vw', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
            {edizione}° {titolo}
          </div>
          <div style={{ fontSize: '4vw', fontWeight: '900', textTransform: 'uppercase', marginTop: '10px' }}>
            {inizio}-{fine} {mese} {anno}
          </div>
        </div>
      ) : (
        <>
          {/* HEADER NUMERO */}
          <div style={{ textAlign: 'center', marginTop: '1vh' }}>
            <p style={{ color: '#888', fontSize: '3rem', fontWeight: 900, letterSpacing: '0.4em', margin: 0 }}>
              NUMERO
            </p>
          </div>

          {/* NUMERO CENTRALE */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <p
              style={{
                color: '#ff0000',
                fontSize: '37vw',
                fontWeight: 900,
                lineHeight: 1,
                margin: 0,
                fontFamily: 'monospace',
                textShadow: '0 0 50px rgba(255,0,0,0.5)'
              }}
            >
              {numero}
            </p>
          </div>

          {/* SEZIONE 5 CUBETTI ORIZZONTALI */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '20px',
              width: '100%',
              padding: '0 3vw',
              boxSizing: 'border-box',
              marginBottom: '3vh'
            }}
          >
            {precedenti.map((num, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '3px solid #333',
                  borderRadius: '20px',
                  padding: '1.5vh 1vw',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <span style={{ 
                  color: '#666', 
                  fontSize: '1.5vw', 
                  fontWeight: 800, 
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase'
                }}>
                  Precedente
                </span>
                <span style={{ 
                  color: '#fff', 
                  fontSize: '5vw', 
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
      )}
    </div>
  );
}