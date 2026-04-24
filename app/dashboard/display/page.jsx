'use client';

import { useState, useEffect } from 'react';

export default function DisplayPage() {
  const [numero, setNumero] = useState(null);

  useEffect(() => {
    const es = new EventSource('/api/queue');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.numero !== undefined) setNumero(data.numero);
      } catch {}
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
          fontFamily: 'sans-serif',
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
    </div>
  );
}
