'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, TextField } from '@mui/material';
import type { DbConsumazioni, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioni, sendConsumazioni, getConto, apriConto, getCamerieri } from '@/app/lib/actions';
import { writeLog, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';
import { deltanow } from '@/app/lib/utils';



export default function Cucina({ nomeCucina }: { nomeCucina: string }) {

    const [phase, setPhase] = useState('iniziale');
    const [lastLog, setLastLog] = useState<DbLog[]>([]);
    const [products, setProducts] = useState<DbConsumazioni[]>([]);
    const [iniProducts, setIniProducts] = useState<DbConsumazioni[]>([]);
    const [numero, setNumero] = useState<number | string>('');
    const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
    const { data: session } = useSession();
    const [sagra, getSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const [conto, setConto] = useState<DbConti>();


    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) {
                getSagra(gg);
                const cc = await getLastLog(gg.giornata, nomeCucina);
                if (cc) {
                    setLastLog(cc);
                }
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumero(event.target.value);
    };

    async function carica(num: number) {
        if (isNaN(num) || num < 1 || num > 9999) {
            alert('Inserisci un numero foglietto valido');
            return;
        }

        const fetchData = async () => {
            const c = await getConsumazioni(nomeCucina, num, sagra.giornata);
            if (c) {
                setProducts(c);
                setIniProducts(c);
            }

            const cc = await getConto(num, sagra.giornata);
            setNumeroFoglietto(num);
            if (cc) {
                setConto(cc);
                if (cc.stato == 'CHIUSO' || cc.stato == 'STAMPATO' || cc.stato == 'CHIUSOPOS') {
                    setPhase('bloccato')
                }
                else {
                    await writeLog(num, sagra.giornata, nomeCucina, '', 'OPEN', ''); // Logger
                    const cc = await getLastLog(sagra.giornata, nomeCucina);
                    if (cc) {
                        setLastLog(cc);
                    }
                    setPhase('caricato');
                }

            } else {
                const cameriere = await getCamerieri(num);
                if (cameriere) {
                    await apriConto(num, sagra.giornata, cameriere);
                    await writeLog(num, sagra.giornata, nomeCucina, '', 'INIT', ''); // Logger
                    const cc = await getLastLog(sagra.giornata, nomeCucina);
                    if (cc) {
                        setLastLog(cc);
                    }
                    const ccc = await getConto(num, sagra.giornata);
                    setConto(ccc);
                }
                setPhase('caricato');
            }

        };

        const cc = await getLastLog(sagra.giornata, nomeCucina);
        if (cc) {
            setLastLog(cc);
        }
        setPhase('caricamento');
        fetchData();

        console.log(`Numero foglietto: ${numeroFoglietto}`);
    }

    const handleButtonClickCarica = () => {
        const num = Number(numero);
        carica(num);
    };

    const handleButtonClickInvia = async () => {
        // numeroFoglietto
        console.log(`Aggiornamento Numero foglietto: ${numeroFoglietto} da ${nomeCucina}`);
        const logArray = products.map((item) => {
            const orig = iniProducts.find(o => o.id_piatto == item.id_piatto);
            if (orig) {
                if (item.quantita > orig.quantita) {
                    return ({id: item.id_comanda,message:`Aggiunti: ${item.quantita-orig.quantita} ${item.piatto}`});
                    
                } else if  (item.quantita < orig.quantita) {
                    return({id: item.id_comanda,message:`Eliminati: ${orig.quantita-item.quantita} ${item.piatto}`});
                } else {
                    return ({id: -1, message:``});
                }
            }

            return {id: -1, message:``};
        });

        for (var index=0; index<logArray.length; index++) {
            if (logArray[index].id != -1) {
                await writeLog(logArray[index].id, sagra.giornata, nomeCucina, '', 'UPDATE', logArray[index].message);
            }
        }
        
        sendConsumazioni(products);
        setPhase('inviato');
        setProducts([]);
        setIniProducts([]);
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
                        <div className='z-0 text-center'>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <p className="text-5xl py-4">
                                Caricare un numero foglietto!!
                            </p>
                        </div>
                    </>
                );
            case 'caricamento':
                return (
                    <>
                        <div className='z-0 text-center'>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
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
                        <div className="z-0 text-center">
                            <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                                <p >
                                    Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                                <p >
                                    Nome Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                                <p >
                                Conto x Consultazione/Modifiche: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                            </div>
                            <TabellaCucina item={products} onAdd={handleAdd} onRemove={handleRemove} />numeroFoglietto
                            <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                                <p >
                                Conto x Consultazione/Modifiche: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                            </div>
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
            case 'bloccato':
                return (
                    <>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Il conto risulta bloccato!!
                            </p>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    if ((session?.user?.name == nomeCucina) || (session?.user?.name == "SuperUser"))

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
                    <div className="z-50 lg:fixed xl:fixed md:fixed p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
                        <ul className="flex rounded-full">
                            <li className="flex-1 mr-2 text-3xl md:text-5xl font-bold py-4 rounded-full">
                                <a className="text-center block text-white font-extralight ">
                                    {nomeCucina}
                                </a>
                            </li>
                            <li className="text-right flex-1 mr-2 text-3xl md:text-5xl  text-white font-bold py-4">
                                <a>
                                    <div className='text-center text-emerald-600'>
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
                                    </div>
                                </a>
                            </li>
                            <li className="text-left flex-1 mr-2 text-3xl md:text-5xl font-bold py-4 rounded-full">
                                <Button className="rounded-full" size="medium" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                            </li>
                        </ul>
                    </div>
                    <div className="z-0 xl:text-2xl  xl:py-4 font-extralight xl:text-end md:text-base md:py-2 md:text-center">
                        <p>Ultimi ricercati: &nbsp;
                            {lastLog.map((row) => (
                                <>
                                    <Button size="small" className="rounded-full" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />}>{row.foglietto}</Button>
                                    &nbsp;&nbsp;
                                </>
                            ))}
                        </p>
                    </div>
                    {renderPhaseContent()}
                    &nbsp;
                    <div className='text-center '>
                        {phase == 'caricato' ?
                            <Button variant="contained" onClick={handleButtonClickInvia}>Invia</Button> :
                            <Button variant="contained" onClick={handleButtonClickInvia} disabled>Invia </Button>
                        }
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