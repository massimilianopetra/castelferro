'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'
import { getListaCamerieri, updateCamerieri, addCamerieri, delCamerieri } from '@/app/lib/actions';
import type { DbCamerieri } from '@/app/lib/definitions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { Button, TextField, Checkbox } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

export default function Cucina() {

    const textFieldRefs = useRef<{
        id: number;
        name: HTMLInputElement | null;
        foglietto_start: HTMLInputElement | null;
        foglietto_end: HTMLInputElement | null;
    }[]>([]);

    const [selected, setSelected] = useState<number[]>([]);
    const [camerieri, setCamerieri] = useState<DbCamerieri[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [phase, setPhase] = useState('caricato');
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N.' },
        { field: 'col2', headerName: 'Nome', width: 400, editable: true, },
        { field: 'col3', headerName: 'Primo', editable: true, },
        { field: 'col4', headerName: 'Ultimo', editable: true, },
    ];

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const c = await getListaCamerieri();
        if (c) {
            const cc = c.map((item, i) => {
                // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                return {
                    id: item.id,
                    col1: i + 1,
                    col2: item.nome,
                    col3: item.foglietto_start,
                    col4: item.foglietto_end
                }
            });

            setRows(cc);
            setCamerieri(c);
        }
    }

    // Aggiunge i riferimenti a ogni TextField di ogni riga
    const addToRefs = (field: 'name' | 'foglietto_start' | 'foglietto_end', el: HTMLInputElement | null, index: number) => {
        if (!textFieldRefs.current[index]) {
            //textFieldRefs.current[index] = { id: camerieri[index].id, name: null, foglietto_start: null, foglietto_end: null };
            textFieldRefs.current[index] = { id: index, name: null, foglietto_start: null, foglietto_end: null };
        }
        textFieldRefs.current[index][field] = el;
    };

    // Funzione per gestire la selezione dei checkbox
    const handleSelect = (id: number) => {
        setSelected(prevSelected =>
            prevSelected.includes(id)
                ? prevSelected.filter(recordId => recordId !== id)
                : [...prevSelected, id]
        );
    };

    // Funzione per raccogliere e inviare i dati aggiornati al DB
    const handleButtonClick = async () => {
        setPhase('caricamento');
        const updatedData = camerieri.map((row, index) => {
            return ({
                ...row,
                nome: textFieldRefs.current[index]?.name?.value || '',
                foglietto_start: textFieldRefs.current[index]?.foglietto_start?.value ? parseInt(textFieldRefs.current[index]?.foglietto_start?.value) : 0,
                foglietto_end: textFieldRefs.current[index]?.foglietto_end?.value ? parseInt(textFieldRefs.current[index]?.foglietto_end?.value) : 0
            });
        });

        await updateCamerieri(updatedData);
        setCamerieri(updatedData);
        setPhase('caricato');
        console.log('Dati aggiornati:', updatedData);

    };

    // Funzione per eliminare i crecord camerieri
    const handleButtonElimina = async () => {
        setPhase('caricamento');
        selected.forEach(async (id) => {
            console.log(id);
            await delCamerieri(id);
        });
        const c = await getListaCamerieri();
        if (c) {
            setCamerieri(c);
        }
        setPhase('caricato');
    };

    // Funzione per eliminare i crecord camerieri
    const handleButtonAggiungi = async () => {
        setPhase('caricamento');
        var maxfoglietto = Math.max(...camerieri.map((row) => { return (row.foglietto_end) }), 99);
        await addCamerieri('NuovoCameriere', maxfoglietto + 1, maxfoglietto + 25);
        const c = await getListaCamerieri();
        if (c) {
            setCamerieri(c);
        }
        setPhase('caricato');

    };

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        if (phase == 'caricamento') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Gestione Camerieri
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

                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                initialState={{
                                    pagination: {
                                      paginationModel: {
                                        pageSize: 5,
                                      },
                                    },
                                  }}
                                  pageSizeOptions={[5]}
                                  checkboxSelection
                                  disableRowSelectionOnClick
                            />

                            <div className='p-6'>
                                <Button className="rounded-full" variant="contained" onClick={handleButtonAggiungi}>Aggiungi Nuovo Cameriere</Button>
                                &nbsp;&nbsp;&nbsp;
                                <Button className="rounded-full" variant="contained" onClick={handleButtonClick}>Aggiorna Lista Camerieri</Button>
                                &nbsp;&nbsp;&nbsp;
                                <Button className="rounded-full" variant="contained" onClick={handleButtonElimina}>Elimina Camerieri Selezionati</Button>
                            </div>
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