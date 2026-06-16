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
import RefreshIcon from '@mui/icons-material/Refresh';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
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
    col5: number; 
    isNew: boolean;
};

interface MyToolbarProps {
    setRows: React.Dispatch<React.SetStateAction<RowsData[]>>;
    setRowModesModel: React.Dispatch<React.SetStateAction<GridRowModesModel>>;
    rows: RowsData[];
    rowModesModel: GridRowModesModel;
    apiRef: any;
    setSnackbar: React.Dispatch<React.SetStateAction<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>>;
    rinfrescaDatiDalServer: () => Promise<void>;
}

// --- EDITOR INTELLIGENTE CON SUGGERIMENTI ---
function NameEditCell(props: GridRenderEditCellParams) {
    const { id, value, field, hasFocus } = props;
    const apiRef = useGridApiContext();
    const rows = apiRef.current.getAllRowIds().map(rowId => apiRef.current.getRow(rowId));

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
                    autoComplete: 'off'
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
    const { setRows, setRowModesModel, rows, rowModesModel, apiRef, setSnackbar, rinfrescaDatiDalServer } = props;
    const isMobile = useMediaQuery('(max-width:600px)'); 
    const [refreshing, setRefreshing] = useState(false);

    const handleClick = () => {
        const rigaInEditing = Object.values(rowModesModel).some(row => row.mode === GridRowModes.Edit);
        const ciSonoNuoveRighe = rows.some(r => r.isNew);

        if (rigaInEditing || ciSonoNuoveRighe) {
            setSnackbar({ 
                open: true, 
                message: 'Completa o annulla la riga aperta prima di aggiungerne un\'altra!', 
                severity: 'warning' 
            });
            return;
        }

        const maxID = rows.length > 0 ? Math.max(...rows.map((r: RowsData) => Number(r.id))) : 0;
        const newId = maxID + 1;

        setRows((old: RowsData[]) => [
            { id: newId, col1: 1, col2: '', col3: '', col4: '', col5: 0, isNew: true }, 
            ...old
        ]);
        
        setRowModesModel((old: GridRowModesModel) => ({ 
            ...old, 
            [newId]: { mode: GridRowModes.Edit, fieldToFocus: 'col2' } 
        }));

        setTimeout(() => apiRef.current?.scrollToIndexes({ rowIndex: 0 }), 50);
    };

    const handleRefreshClick = async () => {
        setRefreshing(true);
        try {
            const activeEdits = Object.keys(rowModesModel);
            activeEdits.forEach(id => {
                apiRef.current?.stopRowEditMode({ id: Number(id), ignoreModifications: true });
            });
            setRowModesModel({});
            
            await rinfrescaDatiDalServer();
            setSnackbar({ open: true, message: 'Dati aggiornati dal server!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Errore durante l\'aggiornamento.', severity: 'error' });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <GridToolbarContainer sx={{ p: 1, display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleClick} size={isMobile ? "small" : "medium"}>
                Aggiungi Cameriere
            </Button>
            <Button 
                variant="outlined" 
                color="secondary"
                startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />} 
                onClick={handleRefreshClick} 
                disabled={refreshing}
                size={isMobile ? "small" : "medium"}
            >
                Aggiorna Lista
            </Button>
        </GridToolbarContainer>
    );
}

// --- COMPONENTE PRINCIPALE ---
export default function CamerieriPage() {
    const NUMFOGLI = 15;
    const isMobile = useMediaQuery('(max-width:600px)');
    const apiRef = useGridApiRef();

    const [rows, setRows] = useState<RowsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [showLegenda, setShowLegenda] = useState(true);
    
    // MODIFICATO: Salva tutto l'oggetto della riga selezionata per la cancellazione
    const [deleteDialog, setDeleteDialog] = useState<{open: boolean, row: RowsData | null}>({ open: false, row: null });
    
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({ 
        open: false, message: '', severity: 'success' 
    });

    const ordinaEAssegnaProgressivi = (lista: RowsData[]): RowsData[] => {
        const nuove = lista.filter(r => r.isNew);
        const salvate = lista.filter(r => !r.isNew).sort((a, b) => Number(b.col3) - Number(a.col3));
        
        const unita = [...nuove, ...salvate];
        return unita.map((row, index) => ({
            ...row,
            col1: index + 1
        }));
    };

    const rinfrescaDatiDalServer = async () => {
        const data = await getListaCamerieri();
        if (data) {
            const mappati = data.map((item: any) => ({
                id: item.id,
                col1: 0,
                col2: item.nome,
                col3: item.foglietto_start,
                col4: item.foglietto_end,
                col5: item.n_conti || 0,
                isNew: false
            }));
            setRows(ordinaEAssegnaProgressivi(mappati));
        }
    };

    useEffect(() => {
        rinfrescaDatiDalServer().then(() => setLoading(false));
    }, []);

    const interrompiAnnullaEInvalida = async (rowId: GridRowId) => {
        apiRef.current.stopRowEditMode({ id: rowId, ignoreModifications: true });
        
        setRowModesModel((old) => {
            const copy = { ...old };
            delete copy[rowId];
            return copy;
        });

        setRows(prev => ordinaEAssegnaProgressivi(prev.filter(r => r.id !== rowId)));
        await rinfrescaDatiDalServer();
    };

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
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

        try {
            let finalId = Number(newRow.id);
            
            if (newRow.isNew) {
                const res = await addCamerieri(newRow.col2, start, end);
                
                if (res && !Array.isArray(res) && (res as any).error) {
                    setSnackbar({ open: true, message: `ERRORE: ${(res as any).message}`, severity: 'error' });
                    await interrompiAnnullaEInvalida(newRow.id);
                    return oldRow;
                }

                if (Array.isArray(res) && res[0]?.id) {
                    finalId = res[0].id;
                }
            } else {
                const res = await updateCamerieri([{ id: finalId, nome: newRow.col2, foglietto_start: start, foglietto_end: end }]);
                
                if (res && (res as any).error) {
                    setSnackbar({ open: true, message: `ERRORE: ${(res as any).message}`, severity: 'error' });
                    await interrompiAnnullaEInvalida(newRow.id);
                    return oldRow;
                }
            }
            
            setSnackbar({ open: true, message: 'Salvato con successo!', severity: 'success' });
            await rinfrescaDatiDalServer();

            return { 
                ...newRow, 
                id: finalId, 
                col3: start, 
                col4: end, 
                col5: newRow.isNew ? 0 : (newRow.col5 || 0), 
                isNew: false 
            } as RowsData;

        } catch (e) { 
            await interrompiAnnullaEInvalida(newRow.id);
            return oldRow;
        }
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } });
        const row = rows.find((r) => r.id === id);
        if (row?.isNew) {
            setRows(prev => ordinaEAssegnaProgressivi(prev.filter((r) => r.id !== id)));
        }
    };

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N.', width: 50, align: 'center', sortable: false },
        { field: 'col2', headerName: 'Nome Cameriere', flex: 1, minWidth: 150, editable: true, sortable: false, renderEditCell: (p) => <NameEditCell {...p} /> },
        { field: 'col3', headerName: 'Primo', type: 'number', width: 85, editable: true, sortable: false },
        { field: 'col4', headerName: 'Ultimo', type: 'number', width: 85, editable: true, sortable: false },
        { 
            field: 'col5', 
            headerName: 'N. Conti', 
            type: 'number', 
            width: 95, 
            editable: false, 
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: 'actions', type: 'actions', width: 100,
            getActions: (params) => {
                const id = params.id;
                const isEdit = rowModesModel[id]?.mode === GridRowModes.Edit;
                return isEdit ? [
                    <GridActionsCellItem key="s" icon={<SaveAltIcon />} label="Salva" onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })} color="primary" />,
                    <GridActionsCellItem key="c" icon={<CancelIcon />} label="Annulla" onClick={handleCancelClick(id)} color="inherit" />,
                ] : [
                    <GridActionsCellItem key="e" icon={<EditIcon />} label="Edit" onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })} color="inherit" />,
                    
                    // MODIFICATO: Passa l'intero oggetto row quando clicchi elimina
                    <GridActionsCellItem key="d" icon={<DeleteIcon />} label="Del" onClick={() => setDeleteDialog({ open: true, row: params.row as RowsData })} color="inherit" />,
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
                    slotProps={{ toolbar: { setRows, setRowModesModel, rows, rowModesModel, apiRef, setSnackbar, rinfrescaDatiDalServer } as any }}
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

            {/* MODIFICATO: Dialog di cancellazione descrittivo con Nome e Intervallo Foglietti */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Elimina Cameriere?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.primary', fontSize: '1.05rem' }}>
                        Sei sicuro di voler eliminare il cameriere{' '}
                        <strong>{deleteDialog.row?.col2 || 'Selezionato'}</strong>?<br />
                        Intervallo foglietti: <strong>{deleteDialog.row?.col3} - {deleteDialog.row?.col4}</strong>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, row: null })} color="inherit">Annulla</Button>
                    <Button onClick={async () => {
                        if (deleteDialog.row) {
                            await delCamerieri(Number(deleteDialog.row.id));
                            setDeleteDialog({ open: false, row: null });
                            setSnackbar({ open: true, message: 'Cameriere eliminato con successo!', severity: 'success' });
                            await rinfrescaDatiDalServer(); 
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