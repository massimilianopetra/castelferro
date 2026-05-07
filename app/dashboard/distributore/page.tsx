'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, getFirstFreeTicket, clearAllTickets } from '@/app/lib/actions'; 
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Stack, TextField, Paper, Dialog, 
    DialogActions, DialogContent, DialogTitle
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
                <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                height: '100%', width: '100%', bgcolor: 'background.default', p: 2, position: 'relative',
                boxSizing: 'border-box', overflow: 'hidden' 
            }}>

                {/* CONTROLLI LATERALI SINISTRA */}
                <Box sx={{ 
                    position: 'absolute', top: 16, left: 16, zIndex: 10, 
                    display: 'flex', flexDirection: 'column', gap: 1 
                }}>
                    <Button 
                        variant="outlined" color="error" size="small" 
                        onClick={() => setOpenResetDialog(true)} 
                        startIcon={<DeleteForeverIcon />} 
                        sx={{ fontWeight: 'bold', bgcolor: 'white', borderRadius: '10px', mb: 2 }}
                    >
                        AZZERA
                    </Button>

                    <Button 
                        variant={mode === 'AUTO' ? "contained" : "outlined"} 
                        color="primary" size="small" 
                        onClick={() => setMode('AUTO')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'AUTO' ? 'primary.main' : 'white', borderRadius: '10px', fontSize: '0.7rem' }}
                    >
                        AUTO
                    </Button>

                    <Button 
                        variant={mode === 'MANUALE' ? "contained" : "outlined"} 
                        color="warning" size="small" 
                        onClick={() => setMode('MANUALE')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'MANUALE' ? 'warning.main' : 'white', borderRadius: '10px', fontSize: '0.7rem' }}
                    >
                        MANUALE
                    </Button>

                    <Button 
                        variant={mode === 'LIBERA' ? "contained" : "outlined"} 
                        color="success" size="small" 
                        onClick={() => setMode('LIBERA')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'LIBERA' ? 'success.main' : 'white', borderRadius: '10px', fontSize: '0.7rem' }}
                    >
                        LIBERA
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', gap: { xs: 1, sm: 2 }, flexGrow: 1, justifyContent: 'center' }}>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '0.9rem', letterSpacing: 2 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        
                        {mode === 'MANUALE' ? (
                             <TextField
                                type="number"
                                value={prossimoTicket === null ? '' : prossimoTicket}
                                onChange={(e) => setProssimoTicket(e.target.value === '' ? null : Number(e.target.value))}
                                variant="standard"
                                placeholder="-"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    '& input': {
                                        fontSize: { xs: '4rem', sm: '5.5rem' }, textAlign: 'center', fontWeight: 1000,
                                        color: 'warning.main', fontFamily: 'monospace', padding: 0, width: '250px'
                                    }
                                }}
                            />
                        ) : (
                            /* QUI RISOLTO: Se non è MANUALE, controlla solo se è LIBERA, altrimenti è AUTO (primary) */
                            <Typography sx={{ 
                                fontWeight: 1000, 
                                color: mode === 'LIBERA' ? 'success.main' : 'primary.main', 
                                fontSize: { xs: '4rem', sm: '5.5rem' }, lineHeight: 1, mt: 1 
                            }}>
                                {prossimoTicket ?? '-'}
                            </Typography>
                        )}
                    </Box>

                    {/* RESTO DEL CODICE INVARIATO... */}
                    <Box sx={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                        {lastEntry && (
                            <Paper variant="outlined" sx={{ px: 2, py: 0.5, bgcolor: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <HistoryIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#666' }}>
                                    ULTIMO: <span style={{ color: '#1976d2' }}>{lastEntry.numero}</span> | COPERTI: <span style={{ color: '#9c27b0' }}>{lastEntry.coperti}</span>
                                </Typography>
                            </Paper>
                        )}
                    </Box>

                    <Box onClick={() => setIsEditing(true)} sx={{ textAlign: 'center', cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isEditing ? (
                            <TextField
                                type="number" autoFocus variant="standard" InputProps={{ disableUnderline: true }}
                                value={coperti === 0 ? '' : coperti}
                                onChange={(e) => setCoperti(e.target.value === '' ? 0 : Number(e.target.value))}
                                onBlur={() => setIsEditing(false)}
                                sx={{ '& input': { fontSize: { xs: '6rem', sm: '8.5rem' }, textAlign: 'center', fontWeight: 1000, color: 'primary.main', padding: 0 } }}
                            />
                        ) : (
                            <Typography sx={{ fontSize: { xs: '6rem', sm: '8.5rem' }, fontWeight: 1000, color: coperti === 0 ? '#ddd' : '#000', lineHeight: 0.9 }}>
                                {coperti}
                            </Typography>
                        )}
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1 }}>COPERTI</Typography>
                    </Box>

                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '100%', px: 2, mb: { xs: 2, sm: 3 } }}>
                            <Button variant="contained" disabled={Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <RemoveCircleSharpIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" onClick={onAdd} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <AddCircleIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" onClick={onAdd10} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <Typography sx={{ fontWeight: 1000, fontSize: '1.5rem' }}>+10</Typography>
                            </Button>
                        </Stack>

                        <Button
                            onClick={handleStampa} variant="contained" 
                            color={mode === 'LIBERA' ? "success" : "secondary"} 
                            disabled={Number(coperti) <= 0 || prossimoTicket === null}
                            startIcon={<PrintIcon sx={{ fontSize: { xs: 30, sm: 45 } }} />}
                            sx={{ width: '92%', py: 2, fontSize: { xs: '1.5rem', sm: '2.2rem' }, fontWeight: 1000, borderRadius: '40px' }}
                        >
                            {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                        </Button>
                    </Box>
                </Box>

                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle>AZZERARE?</DialogTitle>
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
} //Bruno