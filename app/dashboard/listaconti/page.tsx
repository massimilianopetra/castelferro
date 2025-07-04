'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';
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
        { field: 'col5', headerName: 'Stampato da', width: 150 },
        { field: 'col6', headerName: 'Chiuso alle ore', width: 150 },
        { field: 'col7', headerName: 'Totale', type: "number", align: 'right' },
        { field: 'col8', headerName: 'Note', width: 200 }
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
                        col5: deltanow(item.data_stampa),
                        col6: item.stato.includes('CHIUSO') ?  milltodatestring(item.data_chiusura) : '++++',
                        // col6: (item.totale.toFixed(2) + ' €')
                        col7: item.totale.toFixed(2),
                        col8: item.note
                    }
                });

                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        if (sagra.stato == 'CHIUSA')  {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                                <span className="text-xl font-semibold">Attenzione:</span>|Lista conti| la giornata non è stata ancora aperta!
                            </div>
                        </div>
                    </div>
                </main>
            )
        } else if (phase == 'caricamento') {
            return (
           <><header className="top-section">
           </header>
             <main className="middle-section">
               <div className='z-0 text-center'>
                 <br></br>
                 <p className="text-5xl py-4">
                   Lista conti aperti e chiusi
                 </p>
                 <br />
                 <CircularProgress size="9rem" />
                 <br />
                 <p className="text-4xl py-4">
                   Caricamento in corso ...
                 </p>
   
               </div>
             </main></>
            );
        } else if (phase == 'caricato') {
            return (
     /*           <main>

                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Verifica conti
                            </p>
                        </div>

                        <div className='text-center' style={{ height: 700, width: 'auto' }} >
                            <h2 className='font-extrabold'>Conti Giornata {sagra.giornata}</h2>
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                initialState={{
                                    density: 'compact',
                                  }}
                            />

                            <br /><br />


                        </div>
                    </div>
                </main>*/
                <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                    {/* Contenuti statici sopra la griglia */}
                    <div style={{ textAlign: 'center', padding: '4px 0' }}>
                        <p style={{ fontSize: '3rem', padding: '8px 0' }}>Verifica conti</p>
                        <p style={{ fontSize: '1rem', padding: '4px 0' }}>
                            In questa schermata appaiono i conti aperti e chiusi della giornata corrente.
                        </p>
                    </div>

                    {/* Contenitore della DataGrid */}
                    {/* Questo div è cruciale: diventerà un contenitore flex per la griglia */}
                    <div style={{ flexGrow: 1, minHeight: 0, width: '100%', textAlign: 'center' }}>
                        <h2 style={{ fontWeight: 'extrabold' }}></h2>
                        <div style={{ height: 'calc(100% - 60px)', width: '100%' }}> {/* Calcola altezza dinamica */}
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                // Se la griglia ha molte righe, è meglio gestire l'altezza tramite il contenitore
                                initialState={{
                                    density: 'compact',
                                    pagination: { paginationModel: { pageSize: 12 } }, // Esempio: 10 righe per pagina
                                }}
                            />
                        </div>
                        <br /><br />
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
                            <span className="text-xl font-semibold">Violazione:</span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )
    }
}