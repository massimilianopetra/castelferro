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

            if (mode !== 'LIBERA') {
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'NEW_TICKET' }),
                });
            }

            setLastEntry({ numero: prossimoTicket, coperti: numeroCopertiValido });
            setCoperti(0); 
            
            if (mode === 'MANUALE') {
                setProssimoTicket(null);
            } else {
                await fetchData();
            }
        } catch (error) {
            alert("Errore durante la stampa");
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
                <Box sx={{ display: 'flex', height: '100dvh', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', 
                bgcolor: 'background.default', p: { xs: 1, sm: 2 }, boxSizing: 'border-box', overflow: 'hidden'
            }}>
                
                {/* 1. TASTI IN ALTO - Compatti */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', pt: 0.5, pb: 0.5 }}>
                    <Button 
                        variant="outlined" color="error" size="small" 
                        onClick={() => setOpenResetDialog(true)} 
                        startIcon={<DeleteForeverIcon />} 
                        sx={{ fontWeight: 'bold', bgcolor: 'white', borderRadius: '8px', fontSize: '0.6rem' }}
                    >
                        AZZERA
                    </Button>
                    <Button 
                        variant={mode === 'AUTO' ? "contained" : "outlined"} 
                        color="primary" size="small" onClick={() => setMode('AUTO')}
                        sx={{ fontWeight: 'bold', borderRadius: '8px', fontSize: '0.6rem' }}
                    >
                        AUTO
                    </Button>
                    <Button 
                        variant={mode === 'MANUALE' ? "contained" : "outlined"} 
                        color="warning" size="small" onClick={() => setMode('MANUALE')}
                        sx={{ fontWeight: 'bold', borderRadius: '8px', fontSize: '0.6rem' }}
                    >
                        MANUALE
                    </Button>
                    <Button 
                        variant={mode === 'LIBERA' ? "contained" : "outlined"} 
                        color="success" size="small" onClick={() => setMode('LIBERA')}
                        sx={{ fontWeight: 'bold', borderRadius: '8px', fontSize: '0.6rem' }}
                    >
                        LIBERA
                    </Button>
                </Box>

                {/* 2. BLOCCO CENTRALE UNIFICATO - Ridotto il gap per avvicinare i numeri */}
                <Box sx={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    justifyContent: 'center', flexGrow: 1, gap: { xs: 0, sm: 1 } 
                }}>
                    
                    {/* Parte Ticket */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: { xs: '0.9rem', sm: '1.3rem' }, letterSpacing: 2, mb: -1 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        {mode === 'MANUALE' ? (
                            <TextField
                                type="number" value={prossimoTicket ?? ''}
                                onChange={(e) => setProssimoTicket(e.target.value === '' ? null : Number(e.target.value))}
                                variant="standard" placeholder="-"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    '& input': {
                                        fontSize: { xs: '5.5rem', sm: '9rem' }, textAlign: 'center', fontWeight: 1000,
                                        color: 'warning.main', fontFamily: 'monospace', padding: 0, width: { xs: '180px', sm: '350px' }
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ 
                                fontWeight: 1000, color: mode === 'LIBERA' ? 'success.main' : 'primary.main', 
                                fontSize: { xs: '6rem', sm: '11rem' }, lineHeight: 1 
                            }}>
                                {prossimoTicket ?? '-'}
                            </Typography>
                        )}
                    </Box>

                    {/* Storia Ultimo (Molto sottile) */}
                    <Box sx={{ minHeight: '25px', mb: 0.5 }}>
                        {lastEntry && (
                            <Paper variant="outlined" sx={{ px: 1.5, py: 0.2, bgcolor: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon sx={{ fontSize: 14, color: '#9c27b0' }} />
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#666' }}>
                                    ULTIMO: {lastEntry.numero} | COPERTI: {lastEntry.coperti}
                                </Typography>
                            </Paper>
                        )}
                    </Box>

                    {/* Parte Coperti */}
                    <Box onClick={() => setIsEditing(true)} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                        {isEditing ? (
                            <TextField
                                type="number" autoFocus variant="standard" InputProps={{ disableUnderline: true }}
                                value={coperti === 0 ? '' : coperti}
                                onChange={(e) => setCoperti(e.target.value === '' ? 0 : Number(e.target.value))}
                                onBlur={() => setIsEditing(false)}
                                sx={{ '& input': { fontSize: { xs: '5.5rem', sm: '8rem' }, textAlign: 'center', fontWeight: 1000, color: 'primary.main', padding: 0 } }}
                            />
                        ) : (
                            <Typography sx={{ fontSize: { xs: '6rem', sm: '8rem' }, fontWeight: 1000, color: coperti === 0 ? '#ddd' : '#000', lineHeight: 0.8 }}>
                                {coperti}
                            </Typography>
                        )}
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.1rem', mt: 0.5 }}>COPERTI</Typography>
                    </Box>
                </Box>

                {/* 3. PULSANTI AZIONE - Spostati leggermente più in basso */}
                <Box sx={{ width: '100%', maxWidth: '500px', mx: 'auto', pb: 1 }}>
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 1.5 }}>
                        <Button variant="contained" disabled={Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: '65px', borderRadius: '15px', bgcolor: '#ccc', color: '#666' }}>
                            <RemoveCircleSharpIcon sx={{ fontSize: 35 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd} sx={{ width: '30%', height: '65px', borderRadius: '15px' }}>
                            <AddCircleIcon sx={{ fontSize: 35 }} />
                        </Button>
                        <Button variant="contained" onClick={onAdd10} sx={{ width: '30%', height: '65px', borderRadius: '15px' }}>
                            <Typography sx={{ fontWeight: 1000, fontSize: '1.3rem' }}>+10</Typography>
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa} variant="contained" 
                        color={mode === 'LIBERA' ? "success" : "secondary"} 
                        disabled={Number(coperti) <= 0 || prossimoTicket === null}
                        startIcon={<PrintIcon sx={{ fontSize: 30 }} />}
                        sx={{ width: '100%', py: 1.5, fontSize: '1.6rem', fontWeight: 1000, borderRadius: '30px' }}
                    >
                        {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                    </Button>
                </Box>

                {/* DIALOG RESET */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle sx={{ fontWeight: 1000 }}>AZZERARE TUTTO?</DialogTitle>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography sx={{ mb: 2, fontSize: '0.9rem' }}>Scrivi CONFERMA per procedere</Typography>
                        <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                            <Button onClick={() => setOpenResetDialog(false)} variant="outlined">ANNULLA</Button>
                            <Button onClick={handleResetTotale} disabled={confirmText !== "CONFERMA"} color="error" variant="contained">AZZERA</Button>
                        </Box>
                    </Box>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}