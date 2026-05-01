'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConsumazioniPrezzo, DbConti, DbFiera, DbMenu } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti, getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto } from '@/app/lib/actions';
import { writeLog, getLastLog, listContiPerChiusra } from '@/app/lib/actions';
import { deltanow } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { Button, ButtonGroup, Typography, Box, Alert, TextField, Stack } from '@mui/material';

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
    const [importValue, setImportValue] = useState('');
    const [textValue, setTextValue] = useState('');
    const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
    const [conto, setConto] = useState<DbConti>();
    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

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
            renderCell: (params) => (
                <ButtonGroup size="small" variant="contained" color="primary" sx={{ borderRadius: '9999px', my: 1 }} >
                    <Button onClick={() => handleAChiudiPos(params.value as number)}>POS</Button>
                    <Button onClick={() => handleAChiudi(params.value as number)}>Contanti</Button>
                    <Button onClick={() => handleChiudiGratis(params.value as number)}>Altro</Button>
                </ButtonGroup>
            )
        },
    ];

    // --- LOGICHE (Invariate) ---
    const handleAChiudi = async (idComanda: number) => {
        if (idComanda) {
            setPhase('elaborazione');
            await chiudiConto(idComanda, sagra.giornata, 1);
            await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato contanti');
            await refreshData();
            setPhase('chiuso');
        }
    };

    const handleAChiudiPos = async (idComanda: number) => {
        if (idComanda) {
            setPhase('elaborazione');
            await chiudiConto(idComanda, sagra.giornata, 2);
            await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato POS');
            await refreshData();
            setPhase('chiuso');
        }
    };

    const handleChiudiGratis = async (idComanda: number) => {
        const c = await getConto(idComanda, sagra.giornata);
        if (c) {
            setConto(c);
            setNumeroFoglietto(idComanda);
            setPhase("pagaaltroimporto");
        }
    };

    const handleCompletatoGratis = async () => {
        if (numeroFoglietto) {
            setPhase('elaborazione');
            await chiudiConto(Number(numeroFoglietto), sagra.giornata, 3, textValue, importValue);
            await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Altro Importo');
            await refreshData();
            setPhase('chiuso');
        }
    };

    const handleAnnullaGratis = () => setPhase('caricato');

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

    // --- RENDERING ---
    if (!((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser"))) {
        return <Box sx={{ p: 4 }}><Alert severity="error">Accesso Negato</Alert></Box>;
    }

    if (sagra.stato == 'CHIUSA') {
        return <Box sx={{ p: 4 }}><Alert severity="warning">Giornata non ancora aperta!</Alert></Box>;
    }

    if (phase == 'caricamento' || phase == 'elaborazione') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Typography variant="h4" sx={{ mb: 2 }}>{phase === 'caricamento' ? 'Caricamento...' : 'Elaborazione...'}</Typography>
                <CircularProgress size="5rem" />
            </Box>
        );
    }

    if (phase == 'pagaaltroimporto') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
                <Box sx={{ width: '100%', maxWidth: 500, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Modifica Incasso</Typography>
                    <TextField label="Nuovo importo" fullWidth sx={{ mb: 2 }} value={importValue} onChange={(e) => setImportValue(e.target.value)} type="number" />
                    <TextField label="Note" fullWidth sx={{ mb: 3 }} value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="contained" onClick={handleCompletatoGratis}>Salva</Button>
                        <Button variant="outlined" onClick={handleAnnullaGratis}>Annulla</Button>
                    </Stack>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', // Usa il 100% dell'area contenitore del layout
            width: '100%', 
            overflow: 'hidden', // Impedisce la scrollbar esterna
            p: 1,
            boxSizing: 'border-box'
        }}>
            {/* Titolo Nero */}
            <Box sx={{ textAlign: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'black' }}>
                    Incassa Conti
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Solo conti chiusi da incassare (Giornata {sagra.giornata})
                </Typography>
            </Box>

            {/* Tabella con scorrimento interno */}
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
        </Box>
    );
}