'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, ButtonGroup, Snackbar, TextField } from '@mui/material';
import type { DbConsumazioni, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioni, sendConsumazioni, getConto, apriConto, getCamerieri, updateTotaleConto } from '@/app/lib/actions';
import { writeLog, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';
import { deltanow } from '@/app/lib/utils';
import { number } from 'zod';
import { useItemHighlighted } from '@mui/x-charts';
import '@/app/ui/global.css';


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
    const [nuovaquantitaValue, setQuantitaValue] = useState('');
    const [idmodificaquantitaValue, setIdModQuantita] = useState(1);
    const [piattomodificaquantitaValue, setPiattoModQuantita] = useState("non definito");


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

    const handleButtonClickCaricaConto1 = async () => {
        carica(1);
    };

    async function carica(num: number) {
        if (isNaN(num) || num < 1 || num > 8999) {
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
        setNumero(''); //arreza numero fogleitto input box

    };

    const handleButtonClickAnnulla = () => {
        setPhase('iniziale');
    };

    const handleButtonClickInvia = async () => {
        // numeroFoglietto

        const gc = await getConto(Number(numeroFoglietto), sagra.giornata);
        if (gc?.stato === "APERTO") {
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
        else {
            console.log('Aggiornamento Numero foglietto non aperto:' + { numeroFoglietto } + ' da' + { nomeCucina } + 'in bloccato');
            setPhase('bloccato');
            return;
        }
    }
        ;

    const handleModificaQuantita = async () => {

        const newProducts = products.map((item) => {
            if (item.id_piatto == idmodificaquantitaValue) {
                console.log(item);
                return ({ ...item, quantita: Number(nuovaquantitaValue) });
            }
            else
                return (item);
        });
        setProducts(newProducts);

        setPhase('caricato');
    };

    const handleAnnulla = async () => {
        setPhase('caricato');
    }

    const handleSet = (id: number) => {
        setIdModQuantita(Number(id));

        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                setPiattoModQuantita(item.piatto);
                setQuantitaValue(item.quantita + "");
            }
        });
        setPhase('modificaquantita');
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

    const handleAdd10 = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id_piatto == id) {
                console.log(item);
                return ({ ...item, quantita: item.quantita + 10 });
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
                            <p className="text-5xl py-4">
                                Cucina
                            </p><br></br>
                            <br></br>
                            <CircularProgress size="9rem" />
                            <br></br>
                            <p className="text-5xl py-4">
                                Caricamento in corso ...
                            </p>
                        </div>
                    </>
                );
            case 'caricato':
                return (
                    <>
                        <div>
                            <TabellaCucina item={products} onAdd10={handleAdd10} onAdd={handleAdd} onRemove={handleRemove} onSet={handleSet} />
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
            case 'modificaquantita':
                return (
                    <div className="flex items-center justify-center min-h-screen rounded">
                        <div className="w-[600px] p-4  space-y-4 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded -translate-y-16">
                            <p className="text-xl py-1 rounded">
                                Per il conto numero: <span className="font-extrabold text-blue-800">{conto?.id_comanda} </span>
                                inserisci la quantità di porzioni per il piatto: <span className="font-extrabold text-blue-800">{piattomodificaquantitaValue}
                                </span>
                            </p>
                            <TextField
                                label="Modifica quantità"
                                variant="outlined"
                                value={nuovaquantitaValue}
                                onChange={(e) => setQuantitaValue(e.target.value)}
                                type="number"
                                size="medium"
                                fullWidth
                            />
                            <div className="flex justify-center space-x-4">
                                <Button size="small" variant="contained" color="primary" onClick={handleModificaQuantita}>
                                    Salva e chiudi
                                </Button>
                                <Button size="small" variant="contained" color="primary" onClick={handleAnnulla}>
                                    Annulla
                                </Button>
                            </div>
                        </div>
                    </div>
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
                                <span className="text-xl font-semibold">Attenzione</span> |Cucina| La giornata non è stata ancora aperta!
                            </div>
                        </div>
                    </div>
                </main>

            )
        else
            return (


                <main>
                    <div className="container_cucine">
                        {/* Sezione 1: Intestazione (25%) */}
                        {phase !== 'caricato' && phase !== 'modificaquantita' ?
                            <header className="header_cucine_sup">

                                <div className="p-30 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                                    <ul className="flex" style={{ borderRadius: '9999px' }}>
                                        <li className="flex-1 mr-2font-bold py-2 ">
                                            <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                                                {nomeCucina}
                                            </a>
                                            <div className="text-xs text-center text-blue-700 ">SAGRA:
                                                <span className="text-xs text-center text-blue-800 font-semibold">{sagra.stato}&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</span>
                                            </div>
                                        </li>
                                        <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4 rounded-full " style={{ borderRadius: '9999px' }}>
                                            <div className='text-center text-emerald-600'>
                                                <TextField
                                                    autoFocus
                                                    className="p-2"
                                                    label="Numero Foglietto"
                                                    variant="outlined"
                                                    value={numero}
                                                    onChange={handleInputChange}
                                                    style={{ borderRadius: '9999px' }}
                                                    sx={{
                                                        input: {
                                                            textAlign: 'right', // Allinea il testo a destra
                                                        },
                                                    }}
                                                    type="number"
                                                />
                                            </div>

                                        </li>
                                        <li className="text-left flex-1 mr-2 text-3xl lg:text-4xl  font-bold py-4 rounded-full">
                                            {phase == 'caricato' ?
                                                <Button className="rounded-full" size="large" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }} disabled>Carica Foglietto</Button> :
                                                <Button className="rounded-full" size="large" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                                            }
                                        </li>
                                    </ul>
                                </div>
                            </header> : <div></div>}
                        {phase !== 'caricato' && phase !== 'modificaquantita' ?



                            <header className="header_cucine_inf">
                                <div className="z-0 xl:text-3xl font-extralight xl:text-end lg:text-3xl lg:py-2 lg:text-center">
                                    <p>
                                        <ButtonGroup sx={{ display: { xs: 'none', sm: 'block' } }}>
                                            {lastLog.map((row) => (
                                                <>
                                                    {phase == 'caricato' ?
                                                        <Button size="large" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} disabled>{row.foglietto}</Button> :
                                                        <Button size="large" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} >{row.foglietto}</Button>
                                                    }

                                                    &nbsp;&nbsp;

                                                </>
                                            ))}
                                            {phase == 'caricato' ?
                                                <Button size="large" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1} disabled>Camerieri</Button> :
                                                <Button size="large" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                                            }
                                        </ButtonGroup>


                                        <ButtonGroup sx={{ display: { xs: 'block', sm: 'none' } }}>
                                            {lastLog.map((row) => (
                                                <>

                                                    {phase == 'caricato' ?
                                                        <Button size="small" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} disabled>{row.foglietto}</Button> :
                                                        <Button size="small" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} >{row.foglietto}</Button>
                                                    }
                                                    &nbsp;&nbsp;

                                                </>
                                            ))}
                                            {phase == 'caricato' ?
                                                <Button size="small" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1} disabled>Camerieri</Button> :
                                                <Button size="small" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                                            }
                                        </ButtonGroup>



                                    </p>
                                </div>
                            </header> :
                            <div className="flex justify-between items-center w-full">
                                <ButtonGroup sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <p className="z-0 text-3xl font-extralight text-left">
                                        Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                                    </p>
                                </ButtonGroup>
                                <ButtonGroup sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <p className="z-0 text-3xl font-extralight text-right">
                                        Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                    </p>
                                </ButtonGroup>

                                <ButtonGroup sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    <p className="z-0 text-xl font-extralight text-left">
                                        Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                                    </p>
                                </ButtonGroup>
                                <ButtonGroup sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    <p className="z-0 text-xl font-extralight text-right">
                                        Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                                    </p>
                                </ButtonGroup>



                            </div>}

                        { }
                        {/*   <main className=".mainContent_cucine">*/}
                        <p className=".mainContent_cucine_p">          {renderPhaseContent()}</p>
                        {/*   </main>*/}
                        {/* Sezione 2: Footer (15%)*/}

                        <footer className="footer_cucine">
                            <div className="buttonContainer_cucine">

                                {phase == 'caricato' ?
                                    <div className="flex justify-between items-center w-full"> {/* AGGIUNGI QUESTE CLASSI */}
                                        &nbsp;<Button size="large" variant="contained" onClick={handleButtonClickInvia}
                                            className="font-extralight text-left"
                                            sx={{
                                                padding: '15px 30px', // Aumenta il padding per renderlo più grande
                                                fontSize: '1.5rem', // Aumenta la dimensione del font
                                                // Puoi aggiungere altre proprietà CSS qui, ad esempio minWidth
                                                minWidth: '200px',
                                            }} style={{ borderRadius: '9999px' }}>Invia1</Button> &nbsp;
                                        <Button size="large" variant="contained" onClick={handleButtonClickAnnulla}
                                            className=" font-extralight text-right" sx={{
                                                padding: '15px 30px', // Aumenta il padding per renderlo più grande
                                                fontSize: '1.5rem', // Aumenta la dimensione del font
                                                // Puoi aggiungere altre proprietà CSS qui, ad esempio minWidth
                                                minWidth: '200px',
                                            }} style={{ borderRadius: '9999px' }}>Annulla1</Button>&nbsp;
                                    </div> :
                                    <div className="flex justify-between items-center w-full"> {/* AGGIUNGI QUESTE CLASSI */}
                                        <Button size="large" variant="contained" onClick={handleButtonClickInvia}
                                            className="font-extralight" // Rimuovi text-left
                                            disabled sx={{
                                                padding: '15px 30px',
                                                fontSize: '1.5rem',
                                                minWidth: '200px',
                                            }} style={{ borderRadius: '9999px' }}>Invia2</Button>
                                        {/* Rimuovi lo spazio non-breaking &nbsp; qui, justify-between gestirà lo spazio */}
                                        <Button size="large" variant="contained" onClick={handleButtonClickAnnulla}
                                            className="font-extralight" // Rimuovi text-right
                                            disabled sx={{
                                                padding: '15px 30px',
                                                fontSize: '1.5rem',
                                                minWidth: '200px',
                                            }} style={{ borderRadius: '9999px' }}>Annulla2</Button>
                                    </div>
                                }
                                <div className='text-center '>

                                </div>
                            </div>
                        </footer>
                    </div>
                    <div>
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={6001}
                            onClose={handleClose}
                            message={(+numero) > 9999 ?
                                "Inserisci un numero foglietto valido (minore di 8999)" :
                                "Hai inserito un numero riservato asporto (compreso tra 9000 e 9999)"
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
                            <span className="text-xl font-semibold">Violazione:</span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )

}