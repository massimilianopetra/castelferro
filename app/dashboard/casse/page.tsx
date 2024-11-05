'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Snackbar, TextField } from '@mui/material';
import type { DbFiera, DbLog } from '@/app/lib/definitions';
import { getGiornoSagra, getLastLog } from '@/app/lib/actions';
import Filter1Icon from '@mui/icons-material/Filter1';


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
                    <div className="z-50 lg:fixed xl:fixed md:fixed p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
                        <ul className="flex rounded-full">
                            <li className="flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                                <a className="text-center block text-white font-extralight ">
                                    Casse
                                </a>
                                <div className="text-xs text-center text-white ">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>
                            </li>
                            <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4">
                                <a>
                                    <div className='text-center text-emerald-600'>
                                        <TextField
                                            autoFocus
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
                            <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                                <Button className="rounded-full" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
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
                    <div>
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={6000}
                            onClose={handleClose}
                            message="Inserisci un numero foglietto valido"
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