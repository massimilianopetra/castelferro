'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbFiera } from '@/app/lib/definitions';
import { getFiera, updateFiera } from '@/app/lib/actions';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import { Button } from '@mui/material';


function GetDay({i}:{i:number}) {
    if (i==1)
        return <h1 className=" mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-300 from-sky-200">GIOVEDI'</span></h1>//<p>GIOVEDI'</p>
    else if (i==2)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-400 from-sky-200">VENERDI'</span></h1>
    else if (i==3)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-400 from-sky-300">SABATO</span></h1>
     else if (i==4)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-500 from-sky-300">DOMENICA</span></h1>
     else if (i==5)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-500 from-sky-400">LUNEDI'</span></h1>
     else if (i==6)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-500">MARTEDI'</span></h1>
     else if (i==7)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-500">MERCOLEDI'</span></h1>
     else if (i==8)
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r  to-emerald-700 from-sky-600">GIOVEDI' the last dance</span></h1>
     else
        return <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-red-500 from-purple-600">La sagra è già finita!</span></h1>
  }

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
                            Apertura - Chiusura Giornata Sagra
                        </p>
                    </div>
                    <div className='text-center'>
                        <p className="text-5xl py-4"></p>
                        <p className="text-5xl py-4"></p>
                        <h1 className="text-2xl py-4">Giornata: &nbsp;&nbsp;&nbsp;{fiera.giornata}&nbsp;&nbsp;&nbsp;&nbsp;</h1>
                        <p className="text-5xl py-4"></p>  
                        <p className="text-5xl py-4"></p>
                        <div className='text-center '><p ><GetDay i={fiera.giornata}/>&nbsp;&nbsp;</p></div>
                        <p className="text-5xl py-4"></p>
                        <p className="text-5xl py-4"></p>
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