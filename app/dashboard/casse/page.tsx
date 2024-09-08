'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import type { DbConsumazioniPrezzo, DbFiera } from '@/app/lib/definitions';
import { getConsumazioniCassa, sendConsumazioni, getGiornoSagra, apriConto, getConto, chiudiConto } from '@/app/lib/actions';
import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import CircularProgress from '@mui/material/CircularProgress';


export default function Page() {

    const [phase, setPhase] = useState('iniziale');
    const [products, setProducts] = useState<DbConsumazioniPrezzo[]>([]);
    const [numero, setNumero] = useState<number | string>('');
    const { data: session } = useSession();
    const [sagra, getSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) getSagra(gg);
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
            const c = await getConsumazioniCassa(num, sagra.giornata);
            if (c) setProducts(c);
            const conto = await getConto(num, sagra.giornata);
            if (conto?.stato == 'APERTO') {
                setPhase('aperto');
            }
            else if (conto?.stato == 'CHIUSO') {
                setPhase('chiuso');
            }
            else {
                setPhase('caricato');
            }

        };

        setPhase('caricamento');
        fetchData();

        console.log(`Numero foglietto: ${numero}`);
    };

    const handleAggiorna = async () => {

        console.log(`Aggiornamento n. foglietto: ${numero}`);
        const fetchData = async () => {
            setPhase('caricamento');
            const c = await sendConsumazioni(products);
            setPhase('caricato');
        };
        fetchData();
    };

    const handleApri = async () => {

        const fetchData = async () => {
            setPhase('elaborazione');
            var totale = 0;

            for (let i of products) {
                totale += i.quantita * i.prezzo_unitario;
            }
            const c = await apriConto(Number(numero), sagra.giornata, totale);
            setPhase('aperto');
        };
        fetchData();
    };

    const handleAChiudi = async () => {

        const fetchData = async () => {
            setPhase('elaborazione');
            const c = await chiudiConto(Number(numero), sagra.giornata);
            setPhase('chiuso');
        };
        fetchData();
    };

    const handleAdd = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                console.log(item);
                return ({ ...item, quantita: item.quantita + 1, cucina: "Casse" });
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
                    return ({ ...item, quantita: item.quantita - 1, cucina: "Casse" });
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
                        <div className='text-center'>
                            <p className="text-5xl py-4">
                                Caricare un numero foglietto!!
                            </p>
                        </div>
                        &nbsp;
                        <div className='text-center '>
                            <Button variant="contained" onClick={handleApri} disabled>Apri Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAChiudi} disabled>Chiudi Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAggiorna} disabled>Aggiorna Conto</Button>
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
            case 'elaborazione':
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Elaborazione in corso ...
                            </p>
                            <CircularProgress />
                        </div>

                    </>
                );
            case 'caricato':
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-3xl py-4 font-extralight">
                                Conto numero <span className="font-extrabold  text-blue-800">{numero}</span> caricato per Consultazione/Modifiche
                            </p>
                        </div>
                        <div>
                            <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
                        </div>
                        <p className="text-3xl py-4 font-extralight text-center">
                                Conto numero <span className="font-extrabold  text-blue-800">{numero}</span> caricato per Consultazione/Modifiche
                            </p>
                        &nbsp;
                        <div className='text-center '>
                            <Button variant="contained" onClick={handleApri}>Apri Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAChiudi} disabled>Chiudi Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAggiorna}>Aggiorna Conto</Button>
                        </div>
                    </>
                );
            case 'aperto':
                return (
                    <>
                        <div className='text-center '>
                        <p className="text-3xl py-4 font-extralight">
                                Conto Aperto numero <span className="font-extrabold">{numero}</span>  
                            </p>
                        </div>
                        <div>
                            <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
                        </div>
                        <div className='text-center '>
                            <p className="text-3xl py-4 font-extralight">
                                Conto Aperto numero <span className="font-extrabold">{numero}</span>  
                            </p>
                        </div>
                        <div className='text-center '>
                            <Button variant="contained" onClick={handleApri} disabled>Apri Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAChiudi}>Chiudi Conto</Button>
                            &nbsp;&nbsp;
                            <Button variant="contained" onClick={handleAggiorna} disabled>Aggiorna Conto</Button>
                        </div>
 
                    </>
                );
            case 'chiuso':
                return (
                    <>
                    <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50  text-center" role="alert">
                        <span className="text-xl font-semibold">Dark alert!</span> Conto chiuso.
                    </div>
                    </>
                );
            default:
                return null;
        }
    };

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser"))

        if (sagra.stato == 'CHIUSA')
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                             <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                                <span className="text-xl font-semibold">Warning alert!</span> La giornata non è stata ancora aperta!
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
                                Casse  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
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
                          
                            <Button variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                            </p>
                            
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
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )

}