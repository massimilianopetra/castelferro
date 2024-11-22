'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { getListaCamerieri, updateCamerieri, addCamerieri, delCamerieri } from '@/app/lib/actions';
import type { DbCamerieri } from '@/app/lib/definitions';


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
    GridToolbar,
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

    const processRowUpdate = (newRow: GridRowModel) => {
        console.log('*********************');
        console.log(newRow);
        console.log('*********************');
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
                            <CircularProgress size="9rem" />
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