'use client'; // 1. Fondamentale per usare il Context

import { Alert } from '@mui/material';
import Image from 'next/image';
import { useConfig } from '@/context/ConfigContext'; // 2. Importa l'hook che abbiamo creato

export default function Page() {
    // 3. Recupera i dati dal Context invece che da process.env
    const { anno, titolo, edizione } = useConfig();

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className='text-center'>
                    <p className="text-5xl py-4">
                        Homeless
                    </p>
                </div>
                <div className="text-center"> {/* Aggiunto text-center per estetica */}
                    {/* 4. Ora queste variabili sono dinamiche! */}
                    <h1 className="text-2xl font-bold">{titolo}</h1>
                    <p>Edizione: {edizione}° del {anno}</p>
                </div>
 
                {/* Contenitore Immagine */}
                <div className="mt-8">
                    <Image
                        src="/homecastelferro.png"
                        alt="Logo Castelferro"
                        width={500}
                        height={500}
                        priority
                        className="rounded-lg shadow-md"
                    />
                </div>
            </div>
        </main>
    );
}