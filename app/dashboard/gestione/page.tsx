'use client';

import DashboardLinks from '@/app/ui/dashboard/dashboard-links';
import { Typography, useMediaQuery } from '@mui/material';
import { useSession } from 'next-auth/react';

export default function Page() {
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        return (
            <main className="p-4">
                {/* Contenitore principale con flex-col */}
                <div className="flex flex-col h-full max-w-4xl mx-auto">
                    
                    {/* Header fisso */}
                    <div className='text-center shrink-0'>
                        <Typography 
                            variant={isMobile ? "h5" : "h3"} 
                            sx={{ 
                                textAlign: 'center', 
                                mb: 3, 
                                fontWeight: 'bold', 
                                color: '#333',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                        >
                            Link Gestione 
                        </Typography>
                    </div>

                    {/* AREA SCROLLABILE: 
                        - max-h-[calc(100vh-150px)]: calcola l'altezza disponibile sottraendo lo spazio per il titolo
                        - overflow-y-auto: scroll verticale
                        - overflow-x-auto: scroll orizzontale per i link larghi
                    */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[calc(100vh-150px)]">
                        <DashboardLinks />
                    </div>

                </div>
            </main>
        );
    } else {
        return (
            <main className="p-4">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className='text-center w-full max-w-md'>
                        <div className="p-6 mb-4 text-red-800 rounded-2xl bg-red-50 border border-red-100 shadow-sm" role="alert">
                            <span className="text-xl font-bold block mb-1">Accesso Negato</span>
                            <p className="text-lg">Utente non autorizzato alla gestione.</p>
                        </div>
                    </div>
                </div>
            </main>
        )
    }
}