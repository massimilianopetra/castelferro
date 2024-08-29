'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import type { Consumazioni } from '@/app/lib/definitions';
import { getConsumazioni } from '@/app/lib/actions';
import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';

import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

export default function Page() {

    const [products, setProducts] = useState<Consumazioni[]>([]);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            const c = await getConsumazioni('Secondi');
            if (c) setProducts(c);
        };

        const fetchAuth = async () => {
            //const session = await auth();
        };

        fetchData();
        fetchAuth();
    }, []);
    const [numero, setNumero] = useState<number | string>('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumero(event.target.value);
    };

    const handleButtonClick = async () => {
        const num = Number(numero);
        if (isNaN(num)) {
            alert('Inserisci un numero comanda valido');
            return;
        }

        console.log(`Numero comanda: ${numero}`);
    };

    if ((session?.user?.name == "Secondi") || (session?.user?.name == "SuperUser"))

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl font-bold py-4">
                        Secondi
                        </p>

                    </div>
                    <div className='text-center '>
                        <TextField
                            className="p-2"
                            label="Numero Comanda"
                            variant="outlined"
                            value={numero}
                            onChange={handleInputChange}
                            sx={{
                                input: {
                                    textAlign: 'right', // Allinea il testo a destra
                                },
                            }}
                            type="number"
                        />
                        <p>&nbsp;</p>
                        <Button variant="contained" onClick={handleButtonClick}>Conferma</Button>

                    </div>
                    <div>
                        <TabellaCucina item={products}/>
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