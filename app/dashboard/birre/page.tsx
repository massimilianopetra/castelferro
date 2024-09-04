'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import type { DbConsumazioni, DbFiera } from '@/app/lib/definitions';
import { getConsumazioni, sendConsumazioni, getFiera } from '@/app/lib/actions';
import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';
import CircularProgress from '@mui/material/CircularProgress';


export default function Page() {

    const [phase, setPhase] = useState('iniziale');
    const [products, setProducts] = useState<DbConsumazioni[]>([]);
    const [numero, setNumero] = useState<number | string>('');
    const { data: session } = useSession();
    const [fiera, setFiera] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

    useEffect(() => {
        const fetchData = async () => {
            const gg = await getFiera();
            if (gg) setFiera(gg);
        };

        fetchData();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumero(event.target.value);
    };

    const handleButtonClickCarica = async () => {
        const num = Number(numero);

        if (isNaN(num) || num < 1) {
            alert('Inserisci un numero foglietto valido');
            return;
        }

            const fetchData = async () => {
            const c = await getConsumazioni('Birre', num);
            if (c) setProducts(c);
            setPhase('caricato');
        };

        setPhase('caricamento');
        fetchData();
    
        console.log(`Numero foglietto: ${numero}`);
    };

    const handleButtonClickInvia = async () => {

        sendConsumazioni(products);
        setPhase('inviato');
        console.log(`Numero foglietto: ${numero}`);
        setProducts([]);  
    };

    const handleAdd = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                console.log(item);
                return ({ ...item, quantita: item.quantita + 1 });
            }
            else
                return (item);
        });
        setProducts(newProducts);
    };

    const handleRemove = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                console.log(item);
                if (item.quantita > 0)
                    return ({ ...item, quantita: item.quantita - 1 });
                else
                    return ({ ...item });
            }
            else
                return (item);
        });
        setProducts(newProducts);
    };

    const renderPhaseContent = () => {
        switch (phase) {
            case 'iniziale':
                console.log('iniziale');
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Caricare un numero foglietto!!
                            </p>
                        </div>
                    </>
                );
            case 'caricamento':
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Caricamento in corso ...
                            </p>
                            <CircularProgress />
                        </div>
                    </>
                );
            case 'caricato':
                return (
                    <>
                        <div>
                            <TabellaCucina item={products} onAdd={handleAdd} onRemove={handleRemove} />
                        </div>
                    </>
                );
            case 'inviato':
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Inviato con successo!!
                            </p>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    if ((session?.user?.name == "Birre") || (session?.user?.name == "SuperUser"))

        if (fiera.stato == 'CHIUSA')
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <div className="text-5xl py-4 text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                                <span className="font-medium">Warning alert!</span> La giornata non è stata ancora aperta!
                            </div>
                        </div>
                    </div>
                </main>

            )
        else
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <p className="text-5xl font-bold py-4">
                                Birre
                            </p>

                        </div>
                        <div className='text-center '>
                            <TextField
                                className="p-2"
                                label="Numero Foglietto"
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
                            <Button variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                        </div>
                        {renderPhaseContent()}
                        &nbsp;
                        <div className='text-center '>
                            {phase == 'caricato' ?
                                <Button variant="contained" onClick={handleButtonClickInvia}>Invia Comanda</Button> :
                                <Button variant="contained" onClick={handleButtonClickInvia} disabled>Invia Comanda</Button>
                            }
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