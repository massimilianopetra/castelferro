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
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        {
            field: 'col1', headerName: 'N. Foglietto', renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref>
                    {params.value}
                </Link>

            )
        },
        { field: 'col2', headerName: 'Stato' },
        { field: 'col3', headerName: 'Cameriere', width: 200 },
        { field: 'col4', headerName: 'Aperto da', width: 150 },
        { field: 'col5', headerName: 'Chiuso in data', width: 200 },
        { field: 'col6', headerName: 'Totale', align: 'right' }

    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const conti = await listConti('*', gg.giornata);
            if (conti) {
                const cc = conti.map((item) => {
                    // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                    return {
                        id: item.id,
                        col1: item.id_comanda,
                        col2: item.stato,
                        col3: item.cameriere,
                        col4: deltanow(item.data_apertura),
                        col5: item.stato.includes('CHIUSO') ? milltodatestring(item.data_chiusura) : '----',
                        col6: (item.totale.toFixed(2) + ' €')
                    }
                });

                setRows(cc);
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
                            <DataGrid rows={rows} columns={columns} slots={{ toolbar: GridToolbar }} />

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