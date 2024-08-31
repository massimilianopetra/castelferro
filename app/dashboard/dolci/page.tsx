'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import type { DbConsumazioni } from '@/app/lib/definitions';
import { getConsumazioni, sendConsumazioni } from '@/app/lib/actions';
import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';
import CircularProgress from '@mui/material/CircularProgress';


export default function Page() {

    const [phase, setPhase] = useState('iniziale');
    const [products, setProducts] = useState<DbConsumazioni[]>([]);
    const [numero, setNumero] = useState<number | string>('');
    const { data: session } = useSession();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumero(event.target.value);
    };

    const handleButtonClickCarica = async () => {
        const num = Number(numero);

        if (isNaN(num) || num < 1) {
            alert('Inserisci un numero comanda valido');
            return;
        }

        const fetchData = async () => {
            const c = await getConsumazioni('Dolci',num);
            if (c) setProducts(c);
        };

        setPhase('caricamento');
        fetchData();
        setPhase('caricato');

        console.log(`Numero comanda: ${numero}`);
    };

    const handleButtonClickInvia = async () => {

        sendConsumazioni(products);
        setPhase('inviato');
        console.log(`Numero comanda: ${numero}`);
    };

    const handleAdd = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                console.log(item);
                return ({ ...item, quantita: item.quantita+1 });
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
                    return ({ ...item, quantita: item.quantita-1});
                else
                    return ({ ...item});
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
                                Caricare un numero comanda!!
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
                        </div>
                        <CircularProgress />
                    </>
                );
            case 'caricato':
                return (
                    <>
                        <div>
                            <TabellaCucina item={products} onAdd={handleAdd} onRemove={handleRemove}  />
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

    if ((session?.user?.name == "Dolci") || (session?.user?.name == "SuperUser"))

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl font-bold py-4">
                            Dolci
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
                        <Button variant="contained" onClick={handleButtonClickCarica}>Carica Comanda</Button>
                        &nbsp;
                        {phase == 'caricato' ?
                            <Button variant="contained" onClick={handleButtonClickInvia}>Invia Comanda</Button> :
                            <Button variant="contained" onClick={handleButtonClickInvia} disabled>Invia Comanda</Button>
                        }

                    </div>
                    {renderPhaseContent()}
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