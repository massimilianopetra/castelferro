'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { 
    getGiornoSagra, 
    getConto, 
    chiudiConto, 
    writeLog, 
    listContiPerChiusra 
} from '@/app/lib/actions';
import { deltanow } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { 
    Button, 
    ButtonGroup, 
    Typography, 
    Box, 
    Alert, 
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { useConfig } from '@/context/ConfigContext';

const StyledDataGrid = styled(DataGrid)({
    '& .MuiDataGrid-columnHeader': {
        backgroundColor: 'purple',
        color: 'white',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 'bold',
    },
    "& .MuiDataGrid-sortIcon": {
        color: "white",
    },
    "& .MuiDataGrid-menuIconButton": {
        opacity: 1,
        color: "white"
    },
    border: 'none',
});

export default function Page() {
    const config = useConfig();
    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    // Stati per la gestione caricamento stampa
    const [isPrinting, setIsPrinting] = useState(false);

    // Stati per la Dialog "Altro Importo"
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [customImporto, setCustomImporto] = useState('');
    const [customNota, setCustomNota] = useState('');

    const columns: GridColDef[] = [
        {
            field: 'col1',
            headerName: 'N. Foglietto',
            width: 100,
            renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref className="text-blue-600 underline font-bold">
                    {params.value}
                </Link>
            )
        },
        { field: 'col2', headerName: 'Cameriere', width: 150 },
        { field: 'col3', headerName: 'Stampato da', width: 130 },
        { field: 'col4', headerName: 'Coperti', type: "number", width: 80 },
        { field: 'col5', headerName: 'Totale (€)', type: "number", width: 100, valueFormatter: (params) => `${params} €` },
        {
            field: 'col6',
            headerName: 'Modalità pagamento',
            minWidth: 320,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <ButtonGroup
                        size="small"
                        variant="contained"
                        color="primary"
                        sx={{
                            borderRadius: '9999px',
                            overflow: 'hidden',
                            '& .MuiButton-root': { borderRadius: 0 }
                        }}
                    >
                        <Button onClick={() => handleFinalizzaChiusura(2, params.row)}>POS</Button>
                        <Button onClick={() => handleFinalizzaChiusura(1, params.row)}>Contanti</Button>
                        <Button onClick={() => handleIniziaAltroImporto(params.row)}>Altro Importo</Button>
                    </ButtonGroup>
                </div>
            )
        },
    ];

    const handleIniziaAltroImporto = (row: any) => {
        setSelectedRow(row);
        setCustomImporto('');
        setCustomNota('');
        setOpenDialog(true);
    };

    const handleFinalizzaChiusura = async (tipo: number, row: any, nota = '', importoStr = '') => {
        const nFoglietto = row.col1;
        const coperti = row.col4;
        const importoFinale = importoStr.replace(',', '.');

        let logMsg = '';
        if (tipo === 1) logMsg = 'Pagato contanti';
        else if (tipo === 2) logMsg = 'Pagato POS';
        else logMsg = `Altro Importo: ${importoStr}€ - Note: ${nota}`;

        try {
            // 1. Operazioni DB (Eseguite subito)
            await chiudiConto(Number(nFoglietto), sagra.giornata, tipo, nota, importoFinale);
            await writeLog(Number(nFoglietto), sagra.giornata, 'Casse', session?.user?.name || '', 'CLOSE', logMsg);

            // 2. Attivazione overlay caricamento
            setIsPrinting(true);

            // 3. Invocazione stampa (attendiamo la risposta della fetch)
            await inviaStampaPassDiretto(nFoglietto, coperti);

            // 4. Fine caricamento e refresh
            setIsPrinting(false);
            await refreshData();
        } catch (error) {
            console.error("Errore durante la chiusura:", error);
            setIsPrinting(false);
            await refreshData();
        }
    };

    const handleConfirmCustomChiusura = async () => {
        if (selectedRow && customImporto) {
            setOpenDialog(false);
            await handleFinalizzaChiusura(3, selectedRow, customNota, customImporto);
        }
    };

    const inviaStampaPassDiretto = async (numeroFoglietto: number, coperti: number) => {
        try {
            // Restituiamo la promessa della fetch per poterla "attendere" in handleFinalizzaChiusura
            return await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroFoglietto,
                    coperti,
                    giornata: sagra.giornata,
                    ipAddress: config.stampante_uno,
                    isPass: true
                }),
            });
        } catch (err) {
            console.error("Errore invio stampa:", err);
        }
    };

    const refreshData = async () => {
        const conti = await listContiPerChiusra(sagra.giornata);
        if (conti) {
            const cc = conti.map((item) => ({
                id: item.id,
                col1: item.id_comanda,
                col2: item.cameriere,
                col3: deltanow(item.data_stampa),
                col4: item.coperti,
                col5: item.totale.toFixed(2),
                col6: item.id_comanda,
            }));
            setRows(cc);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const conti = await listContiPerChiusra(gg.giornata);
            if (conti) {
                const cc = conti.map((item) => ({
                    id: item.id,
                    col1: item.id_comanda,
                    col2: item.cameriere,
                    col3: deltanow(item.data_stampa),
                    col4: item.coperti,
                    col5: item.totale.toFixed(2),
                    col6: item.id_comanda,
                }));
                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    // --- LOGICA OVERLAY STAMPA ---
    if (isPrinting) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100vh', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 9999
            }}>
                <CircularProgress size="6rem" />
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Invio alla stampa in corso ...</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}> Annulla invio a stampante e vai avanti (il conto sarà regolarmente chiuso)</Typography>
                <Button 
                    variant="contained" 
                    color="error" 
                    sx={{ mt: 4, borderRadius: '9999px', px: 4 }}
                    onClick={() => {
                        // Forza la chiusura del loader. 
                        // Il DB è già stato aggiornato, quindi facciamo solo refresh della lista.
                        setIsPrinting(false);
                        refreshData();
                    }}
                >
                    Annulla attesa e prosegui
                </Button>
            </Box>
        );
    }

    if (!((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser"))) {
        return <Box sx={{ p: 4 }}><Alert severity="error">Accesso Negato</Alert></Box>;
    }

    if (sagra.stato == 'CHIUSA') {
        return <Box sx={{ p: 4 }}><Alert severity="warning">Giornata non ancora aperta!</Alert></Box>;
    }

    if (phase == 'caricamento') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Typography variant="h4" sx={{ mb: 2 }}>Caricamento...</Typography>
                <CircularProgress size="5rem" />
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            p: 1,
            boxSizing: 'border-box'
        }}>
            <Box sx={{ textAlign: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'black' }}>
                    Incassa Conti
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Solo conti chiusi da incassare (Giornata {sagra.giornata})
                </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                <StyledDataGrid
                    rows={rows}
                    columns={columns}
                    slots={{ toolbar: GridToolbar }}
                    density="compact"
                    disableRowSelectionOnClick
                    initialState={{
                        pagination: { paginationModel: { pageSize: 50 } },
                    }}
                />
            </Box>

            {/* Dialog per Altro Importo */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Chiusura con Altro Importo</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: '300px' }}>
                        <TextField
                            label="Importo (€)"
                            fullWidth
                            variant="outlined"
                            placeholder="es: 15,50"
                            value={customImporto}
                            onChange={(e) => setCustomImporto(e.target.value)}
                        />
                        <TextField
                            label="Note / Motivazione"
                            fullWidth
                            variant="outlined"
                            placeholder="Sconto, omaggio, etc."
                            value={customNota}
                            onChange={(e) => setCustomNota(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
                    <Button 
                        onClick={handleConfirmCustomChiusura} 
                        variant="contained" 
                        disabled={!customImporto}
                    >
                        Conferma e Stampa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}