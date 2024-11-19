'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, Snackbar, TextField } from '@mui/material';
import type { DbConsumazioni, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioni, sendConsumazioni, getConto, apriConto, getCamerieri, updateTotaleConto } from '@/app/lib/actions';
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
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [numero, setNumero] = useState<number | string>('');
    const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
    const { data: session } = useSession();
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const [conto, setConto] = useState<DbConti>();


    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) {
                setSagra(gg);
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

    const handleClose = () => {
        setOpenSnackbar(false);
    };

    async function carica(num: number) {
        if (isNaN(num) || num < 1 || num > 5999) {
            setOpenSnackbar(true);
            return;
        }

        const fetchData = async () => {
            const c = await getConsumazioni(nomeCucina, num, sagra.giornata, 'MUST_BE_AVAILABLE');
            if (c) {
                setProducts(c);
                setIniProducts(c);
            }

            const cc = await getConto(num, sagra.giornata);
            setNumeroFoglietto(num);
            if (cc) {
                setConto(cc);
                if (cc.stato == 'CHIUSO' || cc.stato == 'STAMPATO' || cc.stato == 'CHIUSOPOS' || cc.stato == 'CHIUSOALTRO') {
                    setPhase('bloccato')
                } else if (cc.cameriere == 'Sconosciuto') {
                    setPhase('sconosciuto');
                } else {
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
                    if (cameriere == 'Sconosciuto') {
                        setPhase('sconosciuto');
                    } else {
                        await apriConto(num, sagra.giornata, cameriere);
                        await writeLog(num, sagra.giornata, nomeCucina, '', 'START', ''); // Logger
                        const cc = await getLastLog(sagra.giornata, nomeCucina);
                        if (cc) {
                            setLastLog(cc);
                        }
                        const ccc = await getConto(num, sagra.giornata);
                        setConto(ccc);
                        setPhase('caricato');
                    }
                }
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
        
        const gc = await getConto(Number(numeroFoglietto), sagra.giornata);
        console.log('<<<<<<<>>>>>>>: ${gc?.stato}');
        if (gc?.stato === "APERTO"){
            console.log(`Aggiornamento Numero foglietto: ${numeroFoglietto} da ${nomeCucina}`);
            const logArray = products.map((item) => {
                const orig = iniProducts.find(o => o.id_piatto == item.id_piatto);
                if (orig) {
                    if (item.quantita > orig.quantita) {
                        return ({ id: item.id_comanda, message: `Aggiunti: ${item.quantita - orig.quantita} ${item.piatto}` });

                    } else if (item.quantita < orig.quantita) {
                        return ({ id: item.id_comanda, message: `Eliminati: ${orig.quantita - item.quantita} ${item.piatto}` });
                    } else {
                        return ({ id: -1, message: `` });
                    }
                }
                return { id: -1, message: `` };
            });

            for (var index = 0; index < logArray.length; index++) {
                if (logArray[index].id != -1) {
                    await writeLog(logArray[index].id, sagra.giornata, nomeCucina, '', 'UPDATE', logArray[index].message);
                }
            }

            sendConsumazioni(products);
            updateTotaleConto(Number(numeroFoglietto), sagra.giornata);
            setPhase('inviato');
            setProducts([]);
            setIniProducts([]);
            }
        else 
        {
            console.log('Aggiornamento Numero foglietto non aperto: ${numeroFoglietto} da ${nomeCucina}');  
            setPhase('bloccato');
            return;
        } 
    } 
;

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
                        <div>
                            <div className="z-0 text-3xl font-extralight text-end">
                                <p >
                                    Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                                <p >
                                    Conto: <span className= "font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                            </div>
                            <TabellaCucina item={products} onAdd={handleAdd} onRemove={handleRemove} />
                            <div className="z-0 text-3xl font-extralight text-end">
                                <p >
                                    Conto: <span className= "font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                </p>
                            </div>
                        </div>
                    </>
                );
            case 'inviato':
                return (
                    <>
                        <div className='text-center '>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <p className="text-5xl py-4">
                                Inviato con successo!!
                            </p>
                        </div>
                    </>
                );
            case 'sconosciuto':
                return (
                    <>
                        <div className='text-center '>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <p className="text-5xl py-4">
                                Conto non valido: cameriere sconosciuto!
                            </p>
                        </div>
                    </>
                );
            case 'bloccato':
                return (
                    <>
                        <div className='text-center '>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <p className="text-5xl py-4">
                                Conto non valido: bloccato dalle casse!
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
                    <div className="z-50 lg:fixed xl:fixed p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
                        <ul className="flex rounded-full">
                            <li className="flex-1 mr-2 text-3xl lg:text-5xl font-bold py-4 rounded-full">
                                <a className="text-center block text-white font-extralight ">
                                    {nomeCucina}
                                </a>
                                <div className="text-xs text-center text-white">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>
                            </li>
                            <li className="text-right flex-1 mr-2 text-3xl lg:text-4xl  text-white font-bold py-4">
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
                            <li className="text-left flex-1 mr-2 text-3xl lg:text-4xl  font-bold py-4 rounded-full">
                                 {phase == 'caricato' ?
                                    <Button className="rounded-full" size="large" variant="contained" onClick={handleButtonClickCarica} disabled>Carica Foglietto</Button>:
                                    <Button className="rounded-full" size="large" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                               }
                            </li>
                        </ul>
                    </div>
                    <div className="z-0 xl:text-3xl font-extralight xl:text-end lg:text-3xl lg:py-2 lg:text-center">
                        <p>Ultimi : &nbsp;
                            {lastLog.map((row) => (
                                <>
                                    {phase == 'caricato' ?
                                        <Button size="medium" className="rounded-full text-xl" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} disabled>{row.foglietto}</Button>:
                                        <Button size="medium" className="rounded-full text-xl" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} >{row.foglietto}</Button>       }
                                    &nbsp;&nbsp;
                                </>
                            ))}
                        </p>
                    </div>
                    {renderPhaseContent()}
                    &nbsp;         
                    <div className='text-center '>
                      {phase == 'caricato' ?
                            <Button size="large" variant="contained" onClick={handleButtonClickInvia}>Invia</Button> :
                            <Button size="large" variant="contained" onClick={handleButtonClickInvia} disabled>Invia </Button>
                        }
                    </div>
                    <div>
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={6000}
                            onClose={handleClose}
                            message={(+numero) > 9999 ?
                                "Inserisci un numero foglietto valido (minore di 5999)":
                                "Hai inserito un numero riservato asporto (compreso tra 6000 e 9999)"
                            }
                        />
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