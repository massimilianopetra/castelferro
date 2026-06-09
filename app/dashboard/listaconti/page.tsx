'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { Typography, useMediaQuery, Box, Alert } from '@mui/material';

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
    border: 'none',
});

export default function Page() {
    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');
    
    // PERFOMANCE & LAYOUT OPTIMIZATION: 
    // Spostato dentro useMemo per evitare che l'array venga ricreato ad ogni render.
    // Sostituiti i 'width' fissi con un sistema proporzionale 'flex' + 'minWidth' per massima fluidità.
    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'col1', 
            headerName: 'N. Foglietto', 
            minWidth: 95, 
            flex: 0.8, 
            renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref className="text-blue-600 underline">
                    {params.value}
                </Link>
            )
        },
        { field: 'col2', headerName: 'Stato', minWidth: 100, flex: 0.9 },
        { field: 'col3', headerName: 'Cameriere', minWidth: 130, flex: 1.2 },
        { field: 'col4', headerName: 'Aperto da', minWidth: 110, flex: 1 },
        { field: 'col5', headerName: 'Stampato da', minWidth: 110, flex: 1 },
        { field: 'col6', headerName: 'Chiuso alle ore', minWidth: 120, flex: 1.1 },
        { 
            field: 'col7', 
            headerName: 'Totale', 
            type: "number", 
            align: 'right', 
            minWidth: 90, 
            flex: 0.8, 
            valueFormatter: (params) => `${params} €` 
        },
        { field: 'col8', headerName: 'Note', minWidth: 160, flex: 2 }
    ], []);

    useEffect(() => {
        // PERFORMANCE OPTIMIZATION: Funzione definita internamente per pulizia dei render
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) {
                setSagra(gg);
                const conti = await listConti('*', gg.giornata);
                if (conti) {
                    const cc = conti.map((item) => ({
                        id: item.id,
                        col1: item.id_comanda,
                        col2: item.stato,
                        col3: item.cameriere,
                        col4: deltanow(item.data_apertura),
                        col5: deltanow(item.data_stampa),
                        col6: item.stato.includes('CHIUSO') ? milltodatestring(item.data_chiusura) : '++++',
                        col7: item.totale.toFixed(2),
                        col8: item.note
                    }));
                    setRows(cc);
                }
                setPhase('caricato');
            }
        };

        fetchData();
    }, []);

    if (!((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser"))) {
        return <Box sx={{ p: 4 }}><Alert severity="error">Accesso Negato (LISTACONTI)</Alert></Box>;
    }

    if (sagra.stato == 'CHIUSA') {
        return <Box sx={{ p: 4 }}><Alert severity="warning">Giornata chiusa</Alert></Box>;
    }

    if (phase == 'caricamento') {
        return (
            <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size="6rem" />
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 32px)', 
            width: '100%',
            overflow: 'hidden', 
            p: 1,
            boxSizing: 'border-box'
        }}>
            {/* Header fisso */}
            <Box sx={{ textAlign: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
                    Verifica Conti
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Giornata {sagra.giornata}
                </Typography>
            </Box>

            {/* Contenitore Griglia */}
            <Box sx={{ 
                flexGrow: 1, 
                minHeight: 0, 
                width: '100%',
                '& .MuiDataGrid-root': {
                    maxWidth: '100%',
                }
            }}>
                <StyledDataGrid
                    rows={rows}
                    columns={columns}
                    slots={{ toolbar: GridToolbar }}
                    density="compact"
                    disableRowSelectionOnClick
                    initialState={{
                        pagination: { paginationModel: { pageSize: 100 } },
                    }}
                />
            </Box>
        </Box>
    );
}