'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { getListaCamerieri, updateCamerieri, addCamerieri, delCamerieri } from '@/app/lib/actions';


import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
    GridRowsProp,
    GridRowModesModel,
    GridRowModes,
    DataGrid,
    GridColDef,
    GridToolbarContainer,
    GridActionsCellItem,
    GridEventListener,
    GridRowId,
    GridRowModel,
    GridRowEditStopReasons,
    GridSlots,
} from '@mui/x-data-grid';

export default function Camerieri() {

    const NUMFOGLI = 15;

    type RowsData = {
        id: number;
        col1: number
        col2: string;
        col3: number;
        col4: number;
        isNew: boolean;
    };

    const [rows, setRows] = useState<RowsData[]>([]);
    const [phase, setPhase] = useState('caricamento');
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N.' },
        { field: 'col2', headerName: 'Nome', width: 400, editable: true, },
        { field: 'col3', headerName: 'Primo', editable: true, },
        { field: 'col4', headerName: 'Ultimo', editable: true, },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon />}
                            label="Save"
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            className="textPrimary"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
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
                    col4: item.foglietto_end,
                    isNew: false,
                }
            });

            setRows(cc);
            setPhase('caricato');
        }
    }

    interface EditToolbarProps {
        setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
        setRowModesModel: (
            newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
        ) => void;
    }

    function EditToolbar(props: EditToolbarProps) {
        console.log("Edit tool bar");
        const { setRows, setRowModesModel } = props;

        var maxID = 0;
        var maxN = 0;
        var maxFoglietto = 0;

        for (var i = 0; i < rows.length; i++) {
            if (rows[i].id > maxID)
                maxID = rows[i].id;
            if (rows[i].col1 > maxN)
                maxN = rows[i].col1;
            if (rows[i].col3 > maxFoglietto)
                maxFoglietto = rows[i].col3;
            if (rows[i].col4 > maxFoglietto)
                maxFoglietto = rows[i].col4;
        }

        maxFoglietto = Math.ceil((maxFoglietto + 1) / NUMFOGLI) * NUMFOGLI;
        const handleClick = () => {

            console.log(maxID, maxN)
            setRows((oldRows) => [
                ...oldRows,
                { id: maxID + 1, col1: maxN + 1, col2: '', col3: maxFoglietto, col4: maxFoglietto + NUMFOGLI - 1, isNew: true },
            ]);
            setRowModesModel((oldModel) => ({
                ...oldModel,
                [maxID + 1]: { mode: GridRowModes.Edit, fieldToFocus: 'col2' },
            }));
        };

        return (
            <GridToolbarContainer>
                <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
                    Aggiungi Cameriere
                </Button>
            </GridToolbarContainer>
        );
    }

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleDeleteClick = (id: GridRowId) => () => {
        setRows(rows.filter((row) => row.id !== id));
        delCamerieri(Number(id));
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const editedRow = rows.find((row) => row.id === id);
        if (editedRow!.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const validateRange = (newRow: GridRowModel) => {
        const newStart = Number(newRow.col3);
        const newEnd = Number(newRow.col4);
        
        // Verifica che start <= end
        if (newStart > newEnd) {
            return { valid: false, message: "Il primo foglietto deve essere minore o uguale all'ultimo" };
        }
        
        // Verifica che il range non intersechi altri range esistenti
        for (const row of rows) {
            if (row.id !== newRow.id) { // Ignora la riga corrente se è una modifica
                const existingStart = Number(row.col3);
                const existingEnd = Number(row.col4);
                
                if ((newStart >= existingStart && newStart <= existingEnd) ||
                    (newEnd >= existingStart && newEnd <= existingEnd) ||
                    (newStart <= existingStart && newEnd >= existingEnd)) {
                    return { 
                        valid: false, 
                        message: `Il range si interseca con ${row.col2} (${existingStart}-${existingEnd})` 
                    };
                }
            }
        }
        
        return { valid: true };
    };

    const processRowUpdate = (newRow: GridRowModel) => {
        console.log('*********************');
        console.log(newRow);
        console.log('*********************');
        const validation = validateRange(newRow);
        if (!validation.valid) {
            alert(validation.message); // Puoi usare un modal più elegante se preferisci
            throw new Error(validation.message); // Questo previene il salvataggio
        }
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? { ...row, col2: newRow.col2 } : row)));
        if (newRow.isNew == false) {
            updateCamerieri([{ id: newRow.id, nome: newRow.col2, foglietto_start: newRow.col3, foglietto_end: newRow.col4 }])
        } else {
            addCamerieri(newRow.col2, newRow.col3, newRow.col4);
        }

        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };


    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        if (phase == 'caricamento') {
            return (
                <><header className="top-section">
                </header>
                    <main className="middle-section">
                        <div className='z-0 text-center'>
                            <br></br>
                            <p className="text-5xl py-4">
                                Gestione Camerieri
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
    /*            <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Gestione Camerieri
                            </p>
                        </div>
                        <div className='text-center'>

                            <DataGrid
                                rows={rows}
                                columns={columns}
                                editMode="row"
                                rowModesModel={rowModesModel}
                                onRowModesModelChange={handleRowModesModelChange}
                                onRowEditStop={handleRowEditStop}
                                processRowUpdate={processRowUpdate}
                                slots={{
                                    toolbar: EditToolbar as GridSlots['toolbar'],
                                }}
                                slotProps={{
                                    toolbar: { setRows, setRowModesModel },
                                }}
                                initialState={{
                                    sorting: {
                                        sortModel: [{ field: 'col1', sort: 'desc' }],
                                    },
                                  }}

                            />

                        </div>
                    </div>
                </main>*/
                        <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
            {/* Contenuti statici sopra la griglia */}
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <p style={{ fontSize: '3rem', padding: '8px 0' }}>Gestione Camerieri</p>
                <p style={{ fontSize: '1rem', padding: '4px 0' }}>
                    Elenco dei camerieri registrati nel sistema. Puoi aggiungere, modificare o eliminare camerieri.
                </p>
            </div>

            {/* Contenitore della DataGrid */}
            {/* Questo div è cruciale: diventerà un contenitore flex per la griglia */}
            <div style={{ flexGrow: 1, minHeight: 0, width: '100%', textAlign: 'center' }}>
                <h2 style={{ fontWeight: 'extrabold' }}></h2>
                <div style={{ height: 'calc(100% - 60px)', width: '100%' }}> {/* Calcola altezza dinamica */}
                    <DataGrid
                        rows={rows}
                        columns={columns} // Le tue colonne configurate con flex e minWidth
                        editMode="row"
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={handleRowEditStop}
                        processRowUpdate={processRowUpdate}
                        slots={{
                            toolbar: EditToolbar as GridSlots['toolbar'],
                        }}
                        slotProps={{
                            toolbar: { setRows, setRowModesModel },
                        }}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'col1', sort: 'desc' }],
                            },
                            pagination: { paginationModel: { pageSize: 10 } }, // Default 10 righe per pagina
                        }}
                        pageSizeOptions={[5, 10, 25]} // Opzioni per cambiare il numero di righe per pagina
                        // Se stai usando `StyledDataGrid`, passala qui invece di `DataGrid`
                        // style={{ height: '100%', width: '100%' }} // La griglia occupa il 100% del suo div padre
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
                            <span className="text-xl font-semibold">Violazione: </span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )
    }
}