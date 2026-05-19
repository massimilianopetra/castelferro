'use client';

import { useState, useEffect } from 'react';
import { getListaCamerieri, updateCamerieri, addCamerieri, delCamerieri } from '@/app/lib/actions';

import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveAltIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import {
    GridRowModesModel,
    GridRowModes,
    DataGrid,
    GridColDef,
    GridToolbarContainer,
    GridActionsCellItem,
    GridRowId,
    GridRowModel,
    useGridApiRef,
    GridRenderEditCellParams,
    useGridApiContext,
} from '@mui/x-data-grid';

import InputBase from '@mui/material/InputBase';

// --- TIPI ---
type RowsData = {
    id: number;
    col1: number;
    col2: string;
    col3: number | string;
    col4: number | string;
    isNew: boolean;
};

interface MyToolbarProps {
    setRows: React.Dispatch<React.SetStateAction<RowsData[]>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    rows: RowsData[];
    apiRef: any;
}

// --- EDITOR INTELLIGENTE CON SUGGERIMENTI ---
function NameEditCell(props: GridRenderEditCellParams) {
    const { id, value, field, hasFocus } = props;
    const apiRef = useGridApiContext();
    
    // Recuperiamo tutte le righe attuali direttamente dalla DataGrid
    const rows = apiRef.current.getAllRowIds().map(rowId => apiRef.current.getRow(rowId));

    // Estraiamo i nomi unici dei camerieri già esistenti per i suggerimenti
    const uniqueNames = Array.from(
        new Set(
            rows
                .map(r => r?.col2?.trim())
                .filter((nome): nome is string => !!nome)
        )
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        apiRef.current.setEditCellValue({ id, field, value: event.target.value });
    };

    const currentName = (value?.toString() || '').trim().toLowerCase();
    const count = currentName ? rows.filter(r => r && r.col2.trim().toLowerCase() === currentName).length : 0;
    
    let bgColor = 'transparent';
    if (count === 1) bgColor = '#e3f2fd';
    else if (count === 2) bgColor = '#fffde7';
    else if (count === 3) bgColor = '#fff3e0';
    else if (count >= 4) bgColor = '#ffebee';

    // ID univoco per collegare l'InputBase alla datalist di questa specifica riga
    const datalistId = `suggestions-${id}`;

    return (
        <>
            <InputBase
                value={value || ''}
                onChange={handleChange}
                autoFocus={hasFocus}
                fullWidth
                inputProps={{
                    list: datalistId,
                    autoComplete: 'off' // Evita che la cronologia vecchia del browser copra i suggerimenti
                }}
                sx={{ px: 1, bgcolor: bgColor, height: '100%', fontWeight: 'bold', borderRadius: '4px' }}
            />
            <datalist id={datalistId}>
                {uniqueNames.map((nome, index) => (
                    <option key={index} value={nome} />
                ))}
            </datalist>
        </>
    );
}

// --- LEGENDA ---
function LegendaColori({ onClose }: { onClose: () => void }) {
    const itemSx = {
        px: 1, py: 0.3, borderRadius: '4px', fontSize: '0.70rem', fontWeight: 'bold',
        border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    };
    return (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', flexShrink: 0 }}>
            <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', top: 4, right: 4 }}><CancelIcon fontSize="small" /></IconButton>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#666', textTransform: 'uppercase', pr: 4 }}>
                <InfoIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> Aiuto Duplicati (Stesso nome presente)
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <Box sx={{ ...itemSx, bgcolor: '#e3f2fd', color: '#1976d2' }}>2 Blocchetti</Box>
                <Box sx={{ ...itemSx, bgcolor: '#fffde7', color: '#fbc02d' }}>3 Blocchetti</Box>
                <Box sx={{ ...itemSx, bgcolor: '#fff3e0', color: '#ef6c00' }}>4 Blocchetti</Box>
                <Box sx={{ ...itemSx, bgcolor: '#ffebee', color: '#d32f2f' }}>+4 Blocchetti</Box>
            </Stack>
        </Box>
    );
}

// --- TOOLBAR ---
function EditToolbar(props: MyToolbarProps) {
    const { setRows, setRowModesModel, rows, apiRef } = props;
    const isMobile = useMediaQuery('(max-width:600px)'); 

    const handleClick = () => {
        const maxN = rows.length > 0 ? Math.max(...rows.map((r: RowsData) => Number(r.col1))) : 0;
        const maxID = rows.length > 0 ? Math.max(...rows.map((r: RowsData) => Number(r.id))) : 0;
        const newId = maxID + 1;
        setRows((old: RowsData[]) => [{ id: newId, col1: maxN + 1, col2: '', col3: '', col4: '', isNew: true }, ...old]);
        setRowModesModel((old: GridRowModesModel) => ({ ...old, [newId]: { mode: GridRowModes.Edit, fieldToFocus: 'col2' } }));
        setTimeout(() => apiRef.current?.scrollToIndexes({ rowIndex: 0 }), 50);
    };

    return (
        <GridToolbarContainer sx={{ p: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleClick} size={isMobile ? "small" : "medium"}>Aggiungi Cameriere</Button>
        </GridToolbarContainer>
    );
}

export default function CamerieriPage() {
    const NUMFOGLI = 15;
    const isMobile = useMediaQuery('(max-width:600px)');
    const apiRef = useGridApiRef();

    const [rows, setRows] = useState<RowsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [showLegenda, setShowLegenda] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: GridRowId | null}>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({ 
        open: false, message: '', severity: 'success' 
    });

    useEffect(() => {
        getListaCamerieri().then((data) => {
            if (data) setRows(data.map((item, i) => ({ id: item.id, col1: i + 1, col2: item.nome, col3: item.foglietto_start, col4: item.foglietto_end, isNew: false })));
            setLoading(false);
        });
    }, []);

    const processRowUpdate = async (newRow: GridRowModel) => {
        if (!newRow.col3) {
            setSnackbar({ open: true, message: 'Inserisci il valore iniziale in "Primo"!', severity: 'warning' });
            throw new Error('Campo Primo obbligatorio');
        }

        const start = Number(newRow.col3);
        const end = (newRow.col4 === '' || newRow.col4 === null) ? start + NUMFOGLI - 1 : Number(newRow.col4);

        if (end < start) {
            setSnackbar({ open: true, message: 'ERRORE: "Ultimo" < "Primo"!', severity: 'error' });
            throw new Error('Validazione Fallita');
        }

        const hasOverlap = rows.some(r => r.id !== newRow.id && (start <= Number(r.col4) && end >= Number(r.col3)));
        if (hasOverlap) { 
            setSnackbar({ open: true, message: 'ERRORE: Sovrapposizione foglietti!', severity: 'error' }); 
            throw new Error('Sovrapposizione');
        }

        try {
            if (newRow.isNew) await addCamerieri(newRow.col2, start, end);
            else await updateCamerieri([{ id: Number(newRow.id), nome: newRow.col2, foglietto_start: start, foglietto_end: end }]);
            
            const updatedRow = { ...newRow, col3: start, col4: end, isNew: false } as RowsData;
            setRows(rows.map(r => r.id === newRow.id ? updatedRow : r));
            setSnackbar({ open: true, message: 'Salvato!', severity: 'success' });
            return updatedRow;
        } catch (e) { 
            setSnackbar({ open: true, message: 'Errore nel salvataggio!', severity: 'error' });
            throw e;
        }
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } });
        const row = rows.find((r) => r.id === id);
        if (row?.isNew) setRows(rows.filter((r) => r.id !== id));
    };

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N.', width: 50, align: 'center' },
        { field: 'col2', headerName: 'Nome Cameriere', flex: 1, minWidth: 150, editable: true, renderEditCell: (p) => <NameEditCell {...p} /> },
        { field: 'col3', headerName: 'Primo', type: 'number', width: 85, editable: true },
        { field: 'col4', headerName: 'Ultimo', type: 'number', width: 85, editable: true },
        {
            field: 'actions', type: 'actions', width: 100,
            getActions: ({ id }) => {
                const isEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
                return isEdit ? [
                    <GridActionsCellItem key="s" icon={<SaveAltIcon />} label="Salva" onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })} color="primary" />,
                    <GridActionsCellItem key="c" icon={<CancelIcon />} label="Annulla" onClick={handleCancelClick(id)} color="inherit" />,
                ] : [
                    <GridActionsCellItem key="e" icon={<EditIcon />} label="Edit" onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })} color="inherit" />,
                    <GridActionsCellItem key="d" icon={<DeleteIcon />} label="Del" onClick={() => setDeleteDialog({ open: true, id })} color="inherit" />,
                ];
            }
        }
    ];

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            width: '100%',
            p: { xs: 1, sm: 2 },
            bgcolor: '#f4f6f8',
            overflow: 'hidden', 
            boxSizing: 'border-box'
        }}>
            <Typography variant={isMobile ? "h5" : "h3"} sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#333', flexShrink: 0 }}>
                Gestione Camerieri
            </Typography>
            
            {showLegenda && <LegendaColori onClose={() => setShowLegenda(false)} />}

            {/* CONTAINER TABELLA DINAMICO */}
            <Box sx={{ 
                flexGrow: 1, 
                minHeight: 0, 
                width: '100%',
                bgcolor: 'white', 
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <DataGrid
                    apiRef={apiRef}
                    rows={rows}
                    columns={columns}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={setRowModesModel}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={() => {}}
                    slots={{ toolbar: EditToolbar as any }}
                    slotProps={{ toolbar: { setRows, setRowModesModel, rows, apiRef } as any }}
                    initialState={{ sorting: { sortModel: [{ field: 'col1', sort: 'desc' }] } }}
                    sx={{ 
                        border: 'none', 
                        height: '100%',
                        '& .dup-azzurro': { bgcolor: '#e3f2fd' }, '& .dup-giallo': { bgcolor: '#fffde7' }, 
                        '& .dup-arancio': { bgcolor: '#fff3e0' }, '& .dup-rosso': { bgcolor: '#ffebee' } 
                    }}
                    getCellClassName={(p) => {
                        if (p.field === 'col2' && p.value) {
                            const val = p.value.toString().trim().toLowerCase();
                            const count = rows.filter(r => r.col2.trim().toLowerCase() === val).length;
                            if (count === 2) return 'dup-azzurro';
                            if (count === 3) return 'dup-giallo';
                            if (count === 4) return 'dup-arancio';
                            if (count > 4) return 'dup-rosso';
                        }
                        return '';
                    }}
                />
            </Box>

            {/* DIALOG E SNACKBAR */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
                <DialogTitle>Elimina Cameriere?</DialogTitle>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })} color="inherit">Annulla</Button>
                    <Button onClick={async () => {
                        if (deleteDialog.id) {
                            await delCamerieri(Number(deleteDialog.id));
                            setRows(rows.filter(r => r.id !== deleteDialog.id));
                            setDeleteDialog({ open: false, id: null });
                            setSnackbar({ open: true, message: 'Eliminato!', severity: 'success' });
                        }
                    }} color="error" variant="contained">Elimina</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}