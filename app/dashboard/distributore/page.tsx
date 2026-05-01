'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, getNextTickets, clearAllTickets, getFirstFreeTicket } from '@/app/lib/actions'; 
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Stack, TextField, Paper, Dialog, 
    DialogActions, DialogContent, DialogContentText, DialogTitle,
    Switch, FormControlLabel 
} from '@mui/material';

// Icone... (omesse per brevità, mantieni le tue)
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import Replay10Icon from '@mui/icons-material/Replay10';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
        success: { main: '#2e7d32' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' }
    },
});

export default function DistributorePage() {
    const [loading, setLoading] = useState(true);
    // Cambiamo il tipo per accettare null (per il trattino)
    const [prossimoTicket, setProssimoTicket] = useState<number | null>(null);
    const [coperti, setCoperti] = useState<number | ''>(0); 
    const [isEditing, setIsEditing] = useState(false);
    const [isAutoMode, setIsAutoMode] = useState(true); 
    const [lastEntry, setLastEntry] = useState<{ numero: number, coperti: number } | null>(null);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const fetchData = useCallback(async () => {
        if (!isAutoMode) {
            setProssimoTicket(null); // In manuale parte vuoto
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const nextId = await getFirstFreeTicket(); // In auto cerca il primo buco[cite: 3]
            setProssimoTicket(nextId);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [isAutoMode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStampa = async () => {
        const numeroCopertiValido = Number(coperti);
        // Validazione: serve sia il numero ticket (se manuale) che i coperti
        if (numeroCopertiValido <= 0 || prossimoTicket === null) return;
        
        setLoading(true);
        try {
            await addTickets(prossimoTicket, numeroCopertiValido);

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'NEW_TICKET' }),
            });

            setLastEntry({ numero: prossimoTicket, coperti: numeroCopertiValido });
            setCoperti(0); 
            
            // Se siamo in manuale, resetta a null (trattino), altrimenti ricalcola automatico[cite: 2, 3]
            if (isAutoMode) {
                await fetchData();
            } else {
                setProssimoTicket(null);
            }
            
        } catch (error) {
            alert("Errore durante la stampa");
        } finally {
            setLoading(false);
        }
    };

    // ... funzioni onAdd, onRemove, handleResetTotale invariate ...
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

    if (loading) return 
    <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // MODIFICA CHIAVE: height 100% per stare nel layout senza scrollbar
                height: '100%', 
                width: '100%',
                bgcolor: 'background.default', 
                p: 2, 
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden' // Impedisce scroll orizzontali/verticali indesiderati
            }}>
            <CircularProgress />
        </Box>
    </ThemeProvider>
 

    return (
 
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // MODIFICA CHIAVE: height 100% per stare nel layout senza scrollbar
                height: '100%', 
                width: '100%',
                bgcolor: 'background.default', 
                p: 2, 
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden' // Impedisce scroll orizzontali/verticali indesiderati
            }}>

                {/* CONTROLLI - Modificato top per non appiccicarsi troppo al bordo su mobile */}
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        size="small" 
                        onClick={() => setOpenResetDialog(true)} 
                        startIcon={<DeleteForeverIcon />} 
                        sx={{ fontWeight: 'bold', bgcolor: 'white', borderRadius: '10px' }}
                    >
                        AZZERA
                    </Button>
                    <FormControlLabel
                        control={<Switch size="small" checked={!isAutoMode} onChange={(e) => setIsAutoMode(!e.target.checked)} />}
                        label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: isAutoMode ? 'success.main' : 'warning.main' }}>
                            {isAutoMode ? "AUTO (RECUPERO)" : "MANUALE"}
                        </Typography>}
                    />
                </Box>

                {/* CONTAINER CENTRALE */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    width: '100%', 
                    maxWidth: '600px', 
                    gap: { xs: 1, sm: 2 }, // Spaziatura dinamica per schermi piccoli
                    flexGrow: 1,
                    justifyContent: 'center'
                }}>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '1rem', letterSpacing: 2 }}>PROSSIMO TICKET</Typography>
                        
                        {!isAutoMode ? (
                             <TextField
                                type="number"
                                value={prossimoTicket === null ? '' : prossimoTicket}
                                onChange={(e) => setProssimoTicket(e.target.value === '' ? null : Number(e.target.value))}
                                variant="standard"
                                placeholder="-"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    '& input': {
                                        fontSize: { xs: '4rem', sm: '5.5rem' }, 
                                        textAlign: 'center', fontWeight: 1000,
                                        color: 'warning.main', fontFamily: 'monospace', padding: 0, width: '250px'
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ fontWeight: 1000, color: 'primary.main', fontSize: { xs: '4rem', sm: '5.5rem' }, lineHeight: 1, mt: 1 }}>
                                {prossimoTicket ?? '-'}
                            </Typography>
                        )}
                    </Box>

                    {/* STORIA */}
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

                    {/* COPERTI */}
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

                    {/* PULSANTI */}
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
                            onClick={handleStampa} variant="contained" color="secondary" 
                            disabled={Number(coperti) <= 0 || prossimoTicket === null}
                            startIcon={<PrintIcon sx={{ fontSize: { xs: 30, sm: 45 } }} />}
                            sx={{ width: '92%', py: 2, fontSize: { xs: '1.5rem', sm: '2.2rem' }, fontWeight: 1000, borderRadius: '40px' }}
                        >
                            STAMPA
                        </Button>
                    </Box>
                </Box>

                {/* DIALOG RESET... */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle>AZZERARE?</DialogTitle>
                    <DialogContent>
                        <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleResetTotale} disabled={confirmText !== "CONFERMA"}>AZZERA</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}