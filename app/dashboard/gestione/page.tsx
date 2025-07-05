'use client';

import DashboardLinks from '@/app/ui/dashboard/dashboard-links';
import { useSession } from 'next-auth/react';

export default function Page() {
    const { data: session } = useSession();

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col ">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Link Gestione
                        </p>
                    </div>
                    {<DashboardLinks />}

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