'use client';

import { useState, useEffect } from 'react';

export default function DisplayPage() {
  const [numero, setNumero] = useState(null);
  const [precedenti, setPrecedenti] = useState([]); 

  useEffect(() => {
    const es = new EventSource('/api/next-client');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'CALL_NUMBER') {
          setNumero(data.numero);
          // PUNTO 1: Gestione fino a 5 numeri precedenti
          if (data.history) {
            setPrecedenti(data.history); 
          }
        }
        
        // PUNTO 2: Aggiornamento quando un numero viene rimosso (Seduto o Cancellato)
        if (data.type === 'UPDATE_HISTORY') {
          setPrecedenti(data.history || []);
        }
      } catch (error) {
        console.error("Errore parsing SSE:", error);
      }
    };

    return () => es.close();
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
        userSelect: 'none',
        fontFamily: 'sans-serif',
      }}
    >
      <p
        style={{
          color: '#888',
          fontSize: '3rem',
          fontWeight: 900,
          letterSpacing: '0.4em',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
        }}
      >
        Numero
      </p>
      <p
        style={{
          color: numero !== null ? '#ffffff' : '#444444',
          fontSize: 'clamp(8rem, 30vw, 22rem)',
          fontWeight: 900,
          lineHeight: 1,
          margin: 0,
          fontFamily: 'monospace',
          transition: 'color 0.3s ease',
        }}
      >
        {numero !== null ? numero : '—'}
      </p>

      {/* SEZIONE ULTIMI 5 CHIAMATI */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginTop: '5vh',
        minHeight: '150px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {precedenti.map((num, idx) => (
          <div 
            key={idx} 
            style={{
              backgroundColor: '#222',
              border: '2px solid #333',
              borderRadius: '20px',
              padding: '10px 25px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            {/* PUNTO 3: Sostituzione testo */}
            <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 900, marginBottom: '5px' }}>
              GIA' CHIAMATO
            </span>
            <span style={{ color: '#1976d2', fontSize: '3.5rem', fontWeight: 1000, fontFamily: 'monospace', lineHeight: 1 }}>
              {num}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}