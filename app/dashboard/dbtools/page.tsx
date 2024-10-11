'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { clearLog, clearConsumazioni, clearConti } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';




export default function Page() {

    const [phase, setPhase] = useState('iniziale');
    const { data: session } = useSession();
    const router = useRouter();

    const handleSvuotaLog = async () => {
        setPhase('caricamento');
        await clearLog();
        router.push(`/dashboard/`);
    };

    const handleSvuotaConsumazioni = async () => {
        setPhase('caricamento');
        await clearConsumazioni();
        await clearConti();
        router.push(`/dashboard/`);
    };

    const renderPhaseContent = () => {
        if (phase == 'iniziale') {
            return (
                <div>
                    <Button className="rounded-full" size="medium" variant="contained" onClick={handleSvuotaLog}>Svuota Log</Button>
                    <br></br>
                    <Button className="rounded-full" size="medium" variant="contained" onClick={handleSvuotaConsumazioni}>Svuota Consumazioni</Button>
                </div>
            );
        } else if (phase == 'caricamento') {
            return (
                <CircularProgress />
            );
        }
    }

    if ((session?.user?.name == "SuperUser")) {
        return (
            <main>
                {renderPhaseContent()}
            </main>

        );
    } else {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )
    }
}