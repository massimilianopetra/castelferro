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
            if (mode === 'MANUALE') setProssimoTicket(null);
            else await fetchData();
        } catch (error) {
            alert("Errore stampa");
        } finally {
            setLoading(false);
        }
    };

    const onAdd = () => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999));
    const onRemove = () => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0));
    const onAdd10 = () => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999));

    if (loading && prossimoTicket === null && mode !== 'MANUALE') {
        return <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            {/* Il contenitore principale ora usa 100dvh (dynamic viewport height) */}
            <Box sx={{ 
                display: 'flex', flexDirection: 'column', 
                height: '100%', minHeight: {xs: '80vh', sm: '100%'},
                width: '100%', maxWidth: '500px', mx: 'auto',
                p: { xs: 0.5, sm: 2 }, boxSizing: 'border-box',
                justifyContent: 'space-between', // Distribuisce i blocchi sopra e sotto
                overflow: 'hidden'
            }}>
                
                {/* 1. HEADER TASTI - Molto compatti */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, pt: 0.5 }}>
                    {['AZZERA', 'AUTO', 'MANUALE', 'LIBERA'].map((m) => (
                        <Button 
                            key={m}
                            variant={mode === m ? "contained" : "outlined"} 
                            color={m === 'AZZERA' ? "error" : m === 'AUTO' ? "primary" : m === 'MANUALE' ? "warning" : "success"}
                            size="small"
                            onClick={() => m === 'AZZERA' ? setOpenResetDialog(true) : setMode(m as Mode)}
                            sx={{ fontWeight: 'bold', borderRadius: '6px', fontSize: '0.6rem', minWidth: '65px', p: '4px' }}
                        >
                            {m}
                        </Button>
                    ))}
                </Box>

                {/* 2. BLOCCO NUMERI CENTRALE */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                    
                    {/* Ticket */}
                    <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '0.75rem', letterSpacing: 1, mb: -0.5 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 1000, 
                            color: mode === 'LIBERA' ? 'success.main' : mode === 'MANUALE' ? 'warning.main' : 'primary.main', 
                            fontSize: { xs: '18vh', sm: '8rem' }, // Scalo basato sull'altezza
                            lineHeight: 0.9 
                        }}>
                            {prossimoTicket ?? '-'}
                        </Typography>
                    </Box>

                    {/* Storia (Ultimo) - Quasi invisibile ma utile */}
                    {lastEntry && (
                        <Paper variant="outlined" sx={{ px: 1, py: 0, bgcolor: '#fff', borderRadius: '6px', mb: 1 }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#666' }}>
                                ULTIMO: {lastEntry.numero} | COPERTI: {lastEntry.coperti}
                            </Typography>
                        </Paper>
                    )}

                    {/* Coperti */}
                    <Box onClick={() => setIsEditing(true)} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                        <Typography sx={{ 
                            fontSize: { xs: '18vh', sm: '8rem' }, 
                            fontWeight: 1000, 
                            color: coperti === 0 ? '#ddd' : '#000', 
                            lineHeight: 0.8 
                        }}>
                            {coperti === '' ? 0 : coperti}
                        </Typography>
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '0.9rem', mt: -0.5 }}>COPERTI</Typography>
                    </Box>
                </Box>

                {/* 3. FOOTER PULSANTI - Sempre visibili in basso */}
                <Box sx={{ width: '100%', pb: 1 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
                        <Button variant="contained" disabled={Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: '55px', borderRadius: '12px', bgcolor: '#ccc' }}>
                            <RemoveCircleSharpIcon sx={{ fontSize: 28 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd} sx={{ width: '30%', height: '55px', borderRadius: '12px' }}>
                            <AddCircleIcon sx={{ fontSize: 28 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd10} sx={{ width: '30%', height: '55px', borderRadius: '12px' }}>
                            <Typography sx={{ fontWeight: 1000, fontSize: '1.1rem' }}>+10</Typography>
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa} variant="contained" 
                        color={mode === 'LIBERA' ? "success" : "secondary"} 
                        disabled={Number(coperti) <= 0 || prossimoTicket === null}
                        startIcon={<PrintIcon sx={{ fontSize: 24 }} />}
                        sx={{ width: '100%', py: 1.2, fontSize: '1.3rem', fontWeight: 1000, borderRadius: '25px' }}
                    >
                        {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                    </Button>
                </Box>

                {/* Dialog Reset... */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 1000, mb: 1 }}>AZZERARE TUTTO?</Typography>
                        <TextField fullWidth size="small" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        <Button fullWidth onClick={async () => {
                             if (confirmText === "CONFERMA") {
                                await clearAllTickets();
                                setCoperti(0); setLastEntry(null); setOpenResetDialog(false); setConfirmText("");
                                await fetchData();
                             }
                        }} disabled={confirmText !== "CONFERMA"} color="error" variant="contained" sx={{ mt: 2 }}>AZZERA</Button>
                    </Box>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}