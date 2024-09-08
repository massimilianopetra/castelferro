'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbFiera } from '@/app/lib/definitions';
import { getGiornoSagra, updateGiornoSagra } from '@/app/lib/actions';
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
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) setSagra(gg);
        };

        fetchData();
    }, []);

    const handleAdd = () => {
        const gg = { ...sagra, giornata: sagra.giornata + 1 }
        setSagra(gg);
    };

    const handleRemove = () => {
        if (sagra.giornata > 1) {
            const gg = { ...sagra, giornata: sagra.giornata - 1 }
            setSagra(gg);
        }
    };

    const handleClick = () => {
        console.log(sagra);
        if (sagra.stato == 'CHIUSA') {
            const gg = { ...sagra, stato: 'APERTA' }
            setSagra(gg);
            updateGiornoSagra(gg.giornata,gg.stato);
        } else {
            const gg = { ...sagra, stato: 'CHIUSA' }
            setSagra(gg);
            updateGiornoSagra(gg.giornata,gg.stato);
        }
    };

    //const session = await auth();
    //console.log(session?.user?.name);

                //<div className="p-4 mb-4 text-xl font-extralight text-blue-800 rounded-lg bg-blue-50" role="alert">
                //<span className="text-xl font-semibold ">Info alert!</span> Change a few things up and try submitting again.
                //</div>
                //<div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                //  <span className="text-xl font-semibold">Danger alert!</span> Change a few things up and try submitting again.
                //</div>
                //<div className="p-4 mb-4 text-xl text-green-800 rounded-lg bg-green-50" role="alert">
                //  <span className="text-xl font-semibold">Success alert!</span> Change a few things up and try submitting again.
                //</div>
                //<div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                //  <span className="text-xl font-semibold">Warning alert!</span> Change a few things up and try submitting again.
                //</div>
                //<div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50" role="alert">
                // <span className="text-xl font-semibold">Dark alert!</span> Change a few things up and try submitting again.
                //</div>

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
                        <h1 className="text-2xl py-4">Giornata: &nbsp;&nbsp;&nbsp;{sagra.giornata}&nbsp;&nbsp;&nbsp;&nbsp;</h1>
                        <p className="text-5xl py-4"></p>  
                        <p className="text-5xl py-4"></p>
                        <div className='text-center '><p ><GetDay i={sagra.giornata}/>&nbsp;&nbsp;</p></div>
                        <p className="text-5xl py-4"></p>
                        <p className="text-5xl py-4"></p>
                        <Button onClick={() => handleAdd() } disabled={sagra.stato=='APERTA'} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                        &nbsp;&nbsp;&nbsp;
                        <Button onClick={() => handleRemove()} disabled={sagra.stato=='APERTA'} size="large" variant="contained" startIcon={<RemoveCircleSharpIcon />} />
                        &nbsp;&nbsp;&nbsp;
                        {sagra.stato == 'CHIUSA' ? <Button variant="contained" onClick={() => handleClick()}>APRI</Button> :
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
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )

}