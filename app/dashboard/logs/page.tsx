'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbLog, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listLog } from '@/app/lib/actions';
import { milltodatestring } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { Typography, useMediaQuery, Box } from '@mui/material';

const StyledDataGrid = styled(DataGrid)({
    '& .MuiDataGrid-columnHeader': {
        backgroundColor: 'black',
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
});

export default function Page() {
    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');

    const columns: GridColDef[] = [
        { field: 'col1', headerName: 'N. Foglietto', width: 120 },
        { field: 'col2', headerName: 'Azione', width: 150 },
        { field: 'col3', headerName: 'Note', flex: 1, minWidth: 250 },
        { field: 'col4', headerName: 'Cucina', width: 150 },
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
                const cc = logs.map((item) => ({
                    id: item.id,
                    col1: item.foglietto,
                    col2: item.azione,
                    col3: item.note,
                    col4: item.cucina,
                    col5: milltodatestring(item.data),
                }));
                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    // GESTIONE ACCESSO NON AUTORIZZATO
    if (session?.user?.name !== "SuperUser") {
        return (
            <Box sx={{ p: 4 }}>
                <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Utente non autorizzato.</Typography>
                </Box>
            </Box>
        );
    }

    // GESTIONE GIORNATA CHIUSA
    if (sagra.stato === 'CHIUSA') {
        return (
            <Box sx={{ p: 4 }}>
                <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.dark', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6"><b>Attenzione</b> | Logs | La giornata non è stata ancora aperta!</Typography>
                </Box>
            </Box>
        );
    }

    // LOADING STATE
    if (phase === 'caricamento') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h4" sx={{ mb: 4 }}>Logs</Typography>
                <CircularProgress size="6rem" />
                <Typography variant="h6" sx={{ mt: 2 }}>Caricamento in corso ...</Typography>
            </Box>
        );
    }

    // VIEW LOGS (FASE CARICATO)
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', // Prende l'altezza del layout genitore
            width: '100%',
            overflow: 'hidden', // Impedisce la scrollbar esterna
            p: { xs: 1, sm: 2 },
            boxSizing: 'border-box'
        }}>
            
            {/* Header fisso */}
            <Box sx={{ textAlign: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant={isMobile ? "h5" : "h3"} sx={{ fontWeight: 'bold', color: '#333' }}>
                    Verifica logs
                </Typography>
                <Typography variant={isMobile ? "subtitle2" : "body1"} sx={{ color: '#666' }}>
                    Logs Giornata {sagra.giornata} - Corrente
                </Typography>
            </Box>

            {/* Contenitore DataGrid che occupa tutto lo spazio restante */}
            <Box sx={{ 
                flexGrow: 1, 
                minHeight: 0, // CRUCIALE per permettere alla tabella di scrollare internamente
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: '8px',
                boxShadow: 1
            }}>
                <StyledDataGrid
                    rows={rows}
                    columns={columns}
                    slots={{ toolbar: GridToolbar }}
                    initialState={{
                        density: 'compact',
                        pagination: {
                            paginationModel: { pageSize: 100 },
                        },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    disableRowSelectionOnClick
                />
            </Box>
        </Box>
    );
}