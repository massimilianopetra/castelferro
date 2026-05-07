'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, getFirstFreeTicket, clearAllTickets } from '@/app/lib/actions'; 
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
            if (mode !== 'LIBERA') {
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'NEW_TICKET' }),
                });
            }
            setLastEntry({ numero: prossimoTicket, coperti: numeroCopertiValido });
            setCoperti(0); 
            if (mode === 'MANUALE') setProssimoTicket(null);
            else await fetchData();
        } catch (error) {
            alert("Errore durante la stampa");
        } finally {
            setLoading(false);
        }
    };

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
        return <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', flexDirection: 'column', 
                height: '100%', width: '100%', maxWidth: '500px', mx: 'auto',
                p: { xs: 1, sm: 2 }, boxSizing: 'border-box', overflow: 'hidden'
            }}>
                
                {/* 1. TASTI MODALITA (Spostati in fila per risparmiare spazio) */}
                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mb: 1, flexShrink: 0 }}>
                    <Button variant="outlined" color="error" size="small" onClick={() => setOpenResetDialog(true)} sx={{ minWidth: 'auto', fontWeight: 'bold' }}><DeleteForeverIcon fontSize="small"/></Button>
                    <Button variant={mode === 'AUTO' ? "contained" : "outlined"} size="small" onClick={() => setMode('AUTO')} sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>AUTO</Button>
                    <Button variant={mode === 'MANUALE' ? "contained" : "outlined"} color="warning" size="small" onClick={() => setMode('MANUALE')} sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>MANUALE</Button>
                    <Button variant={mode === 'LIBERA' ? "contained" : "outlined"} color="success" size="small" onClick={() => setMode('LIBERA')} sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>LIBERA</Button>
                </Stack>

                {/* 2. AREA CENTRALE DINAMICA */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    
                    {/* TICKET AREA */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '0.8rem', letterSpacing: 1 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        {mode === 'MANUALE' ? (
                             <TextField
                                type="number" value={prossimoTicket === null ? '' : prossimoTicket}
                                onChange={(e) => setProssimoTicket(e.target.value === '' ? null : Number(e.target.value))}
                                variant="standard" placeholder="-" InputProps={{ disableUnderline: true }}
                                sx={{ '& input': { fontSize: '4.5rem', textAlign: 'center', fontWeight: 1000, color: 'warning.main', padding: 0, width: '200px' } }}
                            />
                        ) : (
                            <Typography sx={{ fontWeight: 1000, color: mode === 'LIBERA' ? 'success.main' : 'primary.main', fontSize: '5rem', lineHeight: 1 }}>
                                {prossimoTicket ?? '-'}
                            </Typography>
                        )}
                    </Box>

                    {/* LAST ENTRY */}
                    {lastEntry && (
                        <Paper variant="outlined" sx={{ px: 1.5, py: 0.3, bgcolor: '#fff', borderRadius: '10px' }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#666' }}>
                                ULTIMO: {lastEntry.numero} | COPERTI: {lastEntry.coperti}
                            </Typography>
                        </Paper>
                    )}

                    {/* COPERTI AREA */}
                    <Box onClick={() => setIsEditing(true)} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                        {isEditing ? (
                            <TextField
                                type="number" autoFocus variant="standard" InputProps={{ disableUnderline: true }}
                                value={coperti === 0 ? '' : coperti}
                                onChange={(e) => setCoperti(e.target.value === '' ? 0 : Number(e.target.value))}
                                onBlur={() => setIsEditing(false)}
                                sx={{ '& input': { fontSize: '6rem', textAlign: 'center', fontWeight: 1000, color: 'primary.main', padding: 0 } }}
                            />
                        ) : (
                            <Typography sx={{ fontSize: '7rem', fontWeight: 1000, color: coperti === 0 ? '#ddd' : '#000', lineHeight: 0.9 }}>
                                {coperti}
                            </Typography>
                        )}
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.2rem' }}>COPERTI</Typography>
                    </Box>
                </Box>

                {/* 3. TASTIERA E STAMPA (Bloccati al fondo) */}
                <Box sx={{ flexShrink: 0, pb: 1 }}>
                    <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 1.5 }}>
                        <Button variant="contained" disabled={Number(coperti) <= 0} onClick={() => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0))} sx={{ width: '30%', height: '60px', borderRadius: '15px', bgcolor: '#ccc' }}>
                            <RemoveCircleSharpIcon sx={{ fontSize: 32 }} />
                        </Button>
                        <Button variant="contained" onClick={() => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999))} sx={{ width: '30%', height: '60px', borderRadius: '15px' }}>
                            <AddCircleIcon sx={{ fontSize: 32 }} />
                        </Button>
                        <Button variant="contained" onClick={() => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999))} sx={{ width: '30%', height: '60px', borderRadius: '15px' }}>
                            <Typography sx={{ fontWeight: 1000, fontSize: '1.3rem' }}>+10</Typography>
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa} variant="contained" 
                        color={mode === 'LIBERA' ? "success" : "secondary"} 
                        disabled={Number(coperti) <= 0 || prossimoTicket === null}
                        startIcon={<PrintIcon sx={{ fontSize: 30 }} />}
                        sx={{ width: '100%', py: 1.5, fontSize: '1.5rem', fontWeight: 1000, borderRadius: '30px' }}
                    >
                        {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                    </Button>
                </Box>

                {/* DIALOG RESET */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle sx={{ fontWeight: 1000 }}>AZZERARE TUTTO?</DialogTitle>
                    <Box sx={{ p: 3 }}>
                        <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button onClick={handleResetTotale} disabled={confirmText !== "CONFERMA"} color="error" variant="contained">AZZERA</Button>
                        </Box>
                    </Box>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}