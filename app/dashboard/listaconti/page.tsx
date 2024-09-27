'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [conti, setConti] = useState<DbConti[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const ccA = await listConti('*', gg.giornata);
            if (ccA) {
                setConti(ccA);
            }
            setPhase('caricato');
        }
    }

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: theme.palette.common.black,
            color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
            fontSize: 14,
        },
    }));

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
            border: 0,
        },
    }));

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
                                Verifica conti
                            </p>
                        </div>
                        <div className='text-center'>
                            <h2 className='font-extrabold'>Conti Giornata {sagra.giornata}</h2>
                            <TableContainer component={Paper} >
                                <Table sx={{ minWidth: 500 }} aria-label="a dense table">
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell align="left"><p className='font-bold'>N. Foglietto</p></StyledTableCell>
                                            <StyledTableCell align="left"><p className='font-bold'>Stato</p></StyledTableCell>
                                            <StyledTableCell align="left"><p className='font-bold'>Aperto da</p></StyledTableCell>
                                            <StyledTableCell align="left"><p className='font-bold'>Chiuso in data</p></StyledTableCell>
                                            <StyledTableCell align="left"><p className='font-bold'>Totale</p></StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {conti.map((row, i) => (
                                            <StyledTableRow>
                                                <StyledTableCell align="left">
                                                    <Link href={`/dashboard/casse/${row.id_comanda}`}>{row.id_comanda}</Link>
                                                </StyledTableCell>
                                                <StyledTableCell align="left">
                                                    <p>{row.stato}</p>
                                                </StyledTableCell>
                                                <StyledTableCell align="left">
                                                    <p>{deltanow(row.data_apertura)}</p>
                                                </StyledTableCell>
                                                <StyledTableCell align="left">
                                                    <p>{row.stato.includes('CHIUSO') ? milltodatestring(row.data_chiusura) : '----' }</p>
                                                </StyledTableCell>
                                                <StyledTableCell align="left">
                                                    <p>{row.totale} &euro;</p>
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <br /><br />

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