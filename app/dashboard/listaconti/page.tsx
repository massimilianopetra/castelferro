'use client';

import { useState, useEffect} from 'react';
import { useSession } from 'next-auth/react'
import { sql } from '@vercel/postgres';
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import {getGiornoSagra, listConti} from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [contoA, setContoA] = useState<DbConti[]>([]);
    const [contoC, setContoC] = useState<DbConti[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const ccA = await listConti('APERTO', gg.giornata);
            if (ccA) {
                setContoA(ccA);
            }
            const ccC = await listConti('CHIUSO', gg.giornata);
            if (ccC) {
                setContoC(ccC);
            }

            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "SuperUser")) {
        if (phase == 'caricamento') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Lista Conti Apetri e Chiusi
                            </p>
                        </div>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Caricamento in corso ...
                            </p>
                            <CircularProgress />
                        </div>
                    </div>
                </main>
            );
        } else if (phase == 'caricato') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Gestione Camerieri
                            </p>
                        </div>
                        <div className='text-center'>
                            <h2 className='font-extrabold'>Conti Aperti</h2>
                            <TableContainer component={Paper}>
                                <Table sx={{ minWidth: 500 }} aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="left"><p className='font-bold'>N. Foglietto</p></TableCell>
                                            <TableCell align="left"><p className='font-bold'>Aperto da</p></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {contoA.map((row, i) => (
                                            <TableRow>
                                                <TableCell align="left">
                                                    <p>{row.id_comanda}</p>
                                                </TableCell>
                                                <TableCell align="left">
                                                    <p>{deltanow(row.data_apertura)}</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <br/><br/>
                            <h2 className='font-extrabold'>Conti Chiusi</h2>
                            <TableContainer component={Paper}>
                                <Table sx={{ minWidth: 500 }} aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="left"><p className='font-bold'>N. Foglietto</p></TableCell>
                                            <TableCell align="left"><p className='font-bold'>Chiuso in data</p></TableCell>
                                            <TableCell align="left"><p className='font-bold'>Totale</p></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {contoC.map((row, i) => (
                                            <TableRow>
                                                <TableCell align="left">
                                                    <p>{row.id_comanda}</p>
                                                </TableCell>
                                                <TableCell align="left">
                                                    <p>{milltodatestring(row.data_chiusura)}</p>
                                                </TableCell>
                                                <TableCell align="left">
                                                    <p>{row.totale.toFixed(2)}&euro;</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <h2 className='font-extrabold'>Totale incasso giornata {sagra.giornata}: {contoC.reduce((accumulator, current) => accumulator + current.totale, 0).toFixed(2)}&euro;</h2>
                        </div>
                    </div>
                </main>

            );
        }
    }
    else {
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
}