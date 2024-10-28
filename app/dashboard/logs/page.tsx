'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbLog, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listLog } from '@/app/lib/actions';
import { milltodatestring} from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';

const StyledDataGrid = styled(DataGrid)({
    '& .MuiDataGrid-columnHeader': {
        backgroundColor: 'black', // Sfondo nero per l'header
        color: 'white',           // Testo bianco
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 'bold',       // Testo in grassetto
    },
    "& .MuiDataGrid-sortIcon": {
        color: "white",
    },
    "& .MuiDataGrid-menuIconButton": {
        opacity: 1,
        color: "white"
    },
});

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N. Foglietto' },
        { field: 'col2', headerName: 'Azione' },
        { field: 'col3', headerName: 'Note',  width: 400 },
        { field: 'col4', headerName: 'Cucina', },
        { field: 'col5', headerName: 'Data', width: 200 },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const logs = await listLog(gg.giornata);
            if (logs) {
                const cc = logs.map((item) => {
                    // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                    return {
                        id: item.id,
                        col1: item.foglietto,
                        col2: item.azione,
                        col3: item.note,
                        col4: item.cucina,
                        col5: milltodatestring(item.data),
                    }
                });

                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "SuperUser")) {
        if (sagra.stato == 'CHIUSA')  {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                                <span className="text-xl font-semibold">Warning alert!</span> |Logs| La giornata non è stata ancora aperta!
                            </div>
                        </div>
                    </div>
                </main>
            )
        } else if  (phase == 'caricamento') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Verifica Logs
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
                                Verifica logs
                            </p>
                        </div>

                        <div className='text-center' style={{ height: 700, width: 'auto' }} >
                            <h2 className='font-extrabold'>Logs Giornata {sagra.giornata}</h2>
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}

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