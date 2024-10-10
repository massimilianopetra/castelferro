'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConti, DbFiera } from '@/app/lib/definitions';
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

            ), headerClassName: 'my--theme--header'
        },
        { field: 'col2', headerName: 'Stato', headerClassName: 'my--theme--header' },
        { field: 'col3', headerName: 'Cameriere', headerClassName: 'my--theme--header', width: 200 },
        { field: 'col4', headerName: 'Aperto da', headerClassName: 'my--theme--header', width: 150 },
        { field: 'col5', headerName: 'Chiuso in data', headerClassName: 'my--theme--header', width: 200 },
        { field: 'col6', headerName: 'Totale', headerClassName: 'my--theme--header', align: 'right' }

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
                        // col6: (item.totale.toFixed(2) + ' €')
                        col6: (item.totale.toFixed(2) + ' €')
                    }
                });

                setRows(cc);
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
                                Verifica conti
                            </p>
                        </div>

                        <div className='text-center' style={{ height: 700, width: 'auto' }} >
                            <h2 className='font-extrabold'>Conti Giornata {sagra.giornata}</h2>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                sx={{
                                    '& .my--theme--header': {
                                        backgroundColor: 'gray',
                                        color: 'white',            // Testo blue
                                        fontWeight: 'bold'         // Testo in grassetto
                                    },
                                }}

                            />

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