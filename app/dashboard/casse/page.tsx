'use client'

import { useState, useEffect } from 'react';
import { useSession} from 'next-auth/react'

export default async function Page() {

    const { data: session } = useSession();

    console.log("*********************");
    console.log(session?.user?.name);
    console.log("*********************");

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser"))

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Casse
                        </p>
                    </div>
                    <div className=''>
                        <p>
                            Ciao bello
                        </p>
                    </div>
                </div>
            </main>

        )
    else
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Utente non autorizzato
                        </p>
                    </div>
                </div>
            </main>

        )

}