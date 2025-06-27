'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, ButtonGroup, Snackbar, TextField } from '@mui/material';
import type { DbFiera, DbLog } from '@/app/lib/definitions';
import { getContoPiuAlto, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import Filter1Icon from '@mui/icons-material/Filter1';
import '@/app/ui/global.css';

export default function Page() {

    const router = useRouter();
    const [numero, setNumero] = useState<number | string>('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [lastLog, setLastLog] = useState<DbLog[]>([]);
    const { data: session } = useSession();
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) {
                setSagra(gg);
                const cc = await getLastLog(gg.giornata, 'Casse');
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
        router.push(`/dashboard/casse/${num}`);
    }

    const handleButtonClickCarica = () => {
        const num = Number(numero);
        if (isNaN(num) || num < 1 || num > 9999) {
            setOpenSnackbar(true);
            return;
        }

        router.push(`/dashboard/casse/${numero}`);
    };

    const handleButtonClickCaricaAsporto = async () => {
        const ultconto = await getContoPiuAlto();
        if (ultconto) {
            var uc = Number(ultconto);
            if (uc < 8999)
                uc = 9000
            carica(uc + 1);
        }
    };
    const handleButtonClickCaricaConto1 = async () => {
        carica(1);
    };


    const handleClose = () => {
        setOpenSnackbar(false);
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
                <div className="container">
                    <header className="top-section">
                        <div className="sez-sx">
                            <div className="p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                                <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
                                    <li className="flex-1 mr-2font-bold py-2 ">
                                        <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                                            Casse
                                        </a>
                                        <div className="text-xs text-center text-blue-700 ">SAGRA:
                                            <span className="text-xs text-center text-blue-800 ">{sagra.stato}&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</span>
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
                                    <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 ">
                                        <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                                            <Button  variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                                        </ButtonGroup>
                                        <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                                            <Button size="small" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                                        </ButtonGroup>

                                    </li>
                                </ul>
                            </div>
                            <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                                <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <p><span className="text-blue-800 ">Ultimi ricercati &nbsp;</span>
                                        {lastLog.map((row) => (
                                            <>
                                                <Button size="medium" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                                                &nbsp;
                                            </>
                                        ))}</p>
                                </ButtonGroup>
                                <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                                    <p><span className="text-blue-800 ">Ultimi  &nbsp;</span>
                                        {lastLog.map((row) => (
                                            <>
                                                <Button size="small"  variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                                                &nbsp;
                                            </>
                                        ))}</p>
                                </ButtonGroup>
                            </div>

                        </div>
                        <div className="sez-dx" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                            <div className="xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                                <Button size="medium" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaAsporto} style={{ borderRadius: '9999px' }}>Asporto</Button>
                                &nbsp;&nbsp;
                                <Button size="medium" color="secondary" className="font-semibold " variant="outlined" onClick={handleButtonClickCaricaConto1} style={{ borderRadius: '9999px' }}>Camerieri</Button>
                            </div>
     
                        </div>

                    </header>

                    <main className="middle-section">  
                                    <p className="text-2xl md:text-5xl py-4 text-center  text-blue-800">
 
                                      <br></br>
                                      <br></br>
                                      Caricare un nuovo foglietto!
                                    </p></main>

 
                </div>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6001}
                    onClose={handleClose}
                    message={(+numero) > 9999 ?
                        "1 Inserisci un numero foglietto valido (minore di 8999)" :
                        "2 Hai inserito un numero riservato asporto (compreso tra 9000 e 9999)"
                    }
                />
            </main>)

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