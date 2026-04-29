'use client';

import DashboardLinksCoda from '@/app/ui/dashboard/dashboard-links-coda';
import { Typography, useMediaQuery } from '@mui/material';
import { useSession } from 'next-auth/react';

export default function Page() {
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');
    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col ">
                    <div className='text-center '>
                        <Typography variant={isMobile ? "h5" : "h3"} sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#333' }}>
                            Link Coda
                        </Typography>

                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[calc(100vh-150px)]">
                        <DashboardLinksCoda />
                    </div>


                </div>
            </main>

        );
    } else {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Violazione:</span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>
        )
    }
}