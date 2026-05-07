'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, clearAllTickets, getFirstFreeTicket } from '@/app/lib/actions'; 
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Stack, TextField, Paper, Dialog, 
    DialogTitle
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
        success: { main: '#2e7d32' },
        warning: { main: '#ed6c02' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' }
    },
});

type Mode = 'AUTO' | 'MANUALE' | 'LIBERA';

export default function DistributorePage() {
    const [loading, setLoading] = useState(true);
    const [prossimoTicket, setProssimoTicket] = useState<number | null>(null);
    const [coperti, setCoperti] = useState<number | ''>(0); 
    const [isEditing, setIsEditing] = useState(false);
    const [mode, setMode] = useState<Mode>('AUTO'); 
    const [lastEntry, setLastEntry] = useState<{ numero: number, coperti: number } | null>(null);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const fetchData = useCallback(async () => {
        if (mode === 'MANUALE') {
            setProssimoTicket(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const nextId = await getFirstFreeTicket();
            setProssimoTicket(nextId);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [mode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStampa = async () => {
        const numeroCopertiValido = Number(coperti);
        if (numeroCopertiValido <= 0 || prossimoTicket === null) return;
        setLoading(true);
        try {
            const seduto = mode === 'LIBERA' ? 1 : 0;
            await addTickets(prossimoTicket, numeroCopertiValido, seduto);
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'NEW_TICKET' }),
            });
            setLastEntry({ numero: prossimoTicket, coperti: numeroCopertiValido });
            setCoperti(0); 
            if (mode === 'MANUALE') {
                setProssimoTicket(null);
            } else {
                await fetchData();
            }
        } catch (error) {
            alert("Errore stampa");
        } finally {
            setLoading(false);
        }
    };

    const onAdd = () => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999));
    const onRemove = () => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0));
    const onAdd10 = () => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999));

    const handleResetTotale = async () => {
        if (confirmText === "CONFERMA") {
            setLoading(true);
            try {
                await clearAllTickets();
                setLastEntry(null);
                setCoperti(0);
                setOpenResetDialog(false);
                setConfirmText("");
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'REFRESH_TABLE' }),
                });
                await fetchData();
            } catch (error) {
                alert("Errore reset");
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && prossimoTicket === null && mode !== 'MANUALE') {
        return (
            <ThemeProvider theme={defaultTheme}>
                <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', flexDirection: 'column', 
                height: '100%', width: '100%', maxWidth: '600px', mx: 'auto',
                p: { xs: 1, sm: 2 }, boxSizing: 'border-box'
            }}>
                
                {/* 1. TASTI ALTO */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {['AZZERA', 'AUTO', 'MANUALE', 'LIBERA'].map((m) => (
                        <Button 
                            key={m}
                            variant={mode === m || (m === 'AZZERA' && openResetDialog) ? "contained" : "outlined"} 
                            color={m === 'AZZERA' ? "error" : m === 'AUTO' ? "primary" : m === 'MANUALE' ? "warning" : "success"}
                            size="small"
                            onClick={() => m === 'AZZERA' ? setOpenResetDialog(true) : setMode(m as Mode)}
                            sx={{ fontWeight: 'bold', borderRadius: '8px', fontSize: '0.65rem' }}
                        >
                            {m}
                        </Button>
                    ))}
                </Box>

                {/* SPACER FLESSIBILE */}
                <Box sx={{ flexGrow: 0.5 }} />

                {/* 2. AREA TICKET */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '0.9rem', letterSpacing: 2 }}>
                        {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                    </Typography>
                    <Typography sx={{ 
                        fontWeight: 1000, 
                        color: mode === 'LIBERA' ? 'success.main' : mode === 'MANUALE' ? 'warning.main' : 'primary.main', 
                        fontSize: { xs: '6rem', sm: '10rem' }, lineHeight: 1 
                    }}>
                        {prossimoTicket ?? '-'}
                    </Typography>
                </Box>

                {/* 3. AREA STORIA (CENTRO) */}
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, minHeight: '24px' }}>
                    {lastEntry && (
                        <Paper variant="outlined" sx={{ px: 1.5, py: 0.2, bgcolor: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon sx={{ fontSize: 14, color: '#9c27b0' }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#666' }}>
                                ULTIMO: {lastEntry.numero} | COPERTI: {lastEntry.coperti}
                            </Typography>
                        </Paper>
                    )}
                </Box>

                {/* 4. AREA COPERTI */}
                <Box onClick={() => setIsEditing(true)} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                    <Typography sx={{ 
                        fontSize: { xs: '6.5rem', sm: '9rem' }, 
                        fontWeight: 1000, 
                        color: coperti === 0 ? '#ddd' : '#000', 
                        lineHeight: 1 
                    }}>
                        {coperti === '' ? 0 : coperti}
                    </Typography>
                    <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.2rem', mt: 0.5 }}>COPERTI</Typography>
                </Box>

                {/* SPACER FLESSIBILE - Spinge i pulsanti verso il basso */}
                <Box sx={{ flexGrow: 1 }} />

                {/* 5. PULSANTI AZIONE (ANCORATI AL FONDO) */}
                <Box sx={{ width: '100%', pb: { xs: 1, sm: 2 } }}>
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        <Button variant="contained" disabled={Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: '70px', borderRadius: '18px', bgcolor: '#ccc' }}>
                            <RemoveCircleSharpIcon sx={{ fontSize: 35 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd} sx={{ width: '30%', height: '70px', borderRadius: '18px' }}>
                            <AddCircleIcon sx={{ fontSize: 35 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd10} sx={{ width: '30%', height: '70px', borderRadius: '18px' }}>
                            <Typography sx={{ fontWeight: 1000, fontSize: '1.4rem' }}>+10</Typography>
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa} variant="contained" 
                        color={mode === 'LIBERA' ? "success" : "secondary"} 
                        disabled={Number(coperti) <= 0 || prossimoTicket === null}
                        startIcon={<PrintIcon sx={{ fontSize: 32 }} />}
                        sx={{ width: '100%', py: 2, fontSize: '1.7rem', fontWeight: 1000, borderRadius: '35px' }}
                    >
                        {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                    </Button>
                </Box>

                {/* DIALOG RESET */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle sx={{ fontWeight: 1000 }}>AZZERARE TUTTO?</DialogTitle>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button fullWidth onClick={() => setOpenResetDialog(false)} variant="outlined">ANNULLA</Button>
                            <Button fullWidth onClick={handleResetTotale} disabled={confirmText !== "CONFERMA"} color="error" variant="contained">AZZERA</Button>
                        </Box>
                    </Box>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}