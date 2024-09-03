'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbFiera } from '@/app/lib/definitions';
import { getFiera, updateFiera } from '@/app/lib/actions';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import { Button } from '@mui/material';

export default function Page() {
    const [fiera, setFiera] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            const gg = await getFiera();
            if (gg) setFiera(gg);
        };

        fetchData();
    }, []);

    const handleAdd = () => {
        const gg = { ...fiera, giornata: fiera.giornata + 1 }
        setFiera(gg);
    };

    const handleRemove = () => {
        if (fiera.giornata > 1) {
            const gg = { ...fiera, giornata: fiera.giornata - 1 }
            setFiera(gg);
        }
    };

    const handleClick = () => {
        console.log(fiera);
        if (fiera.stato == 'CHIUSA') {
            const gg = { ...fiera, stato: 'APERTA' }
            setFiera(gg);
            updateFiera(gg.giornata,gg.stato);
        } else {
            const gg = { ...fiera, stato: 'CHIUSA' }
            setFiera(gg);
            updateFiera(gg.giornata,gg.stato);
            
        }
    };

    //const session = await auth();
    //console.log(session?.user?.name);

    console.log("*********************");
    console.log(session?.user?.name);
    console.log("*********************");

    if ((session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Apertura - Chiusura Giornata Fiera
                        </p>
                    </div>
                    <div className='text-center '>

                        Giornata: &nbsp;&nbsp;&nbsp;{fiera.giornata}&nbsp;&nbsp;&nbsp;
                        <Button onClick={() => handleAdd() } disabled={fiera.stato=='APERTA'} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                        &nbsp;&nbsp;&nbsp;
                        <Button onClick={() => handleRemove()} disabled={fiera.stato=='APERTA'} size="large" variant="contained" startIcon={<RemoveCircleSharpIcon />} />
                        &nbsp;&nbsp;&nbsp;
                        {fiera.stato == 'CHIUSA' ? <Button variant="contained" onClick={() => handleClick()}>APRI</Button> :
                            <Button variant="contained" onClick={() => handleClick()} >CHIUDI</Button>}

                    </div>

                </div>
            </main>

        )
    }
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