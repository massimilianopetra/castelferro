'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, getFirstFreeTicket, clearAllTickets } from '@/app/lib/actions'; 
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Stack, TextField, Paper, Dialog, 
    DialogActions, DialogContent, DialogTitle, useMediaQuery,
    DialogContentText
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useConfig } from '@/context/ConfigContext';


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
    const config = useConfig();

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
                
    setLoading(true); // <--- Blocca tutto qui

    try {
        const seduto = mode === 'LIBERA' ? 1 : 0;
                     
        // 1. Salva i dati nel database
        await addTickets(prossimoTicket, numeroCopertiValido, seduto);
                 
        // 2. Invia il comando fisico alla stampante
        if (mode !== 'LIBERA') {
            try {
                await fetch('/api/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        numeroTicket: prossimoTicket,
                        coperti: numeroCopertiValido,
                        ipAddress: config.stampante_wifi,
                        titolo: config.titolo, 
                        edizione: config.edizione,
                        inizio: config.inizio, 
                        fine: config.fine,
                        mese: config.mese
                    }),
                });
            } catch (err) {
                console.error("Errore fisico stampante:", err);
                // Non blocchiamo se fallisce la stampa, ma il loading finirà comunque dopo il timeout della fetch
            }
        }
 
        // 3. Notifica il monitor
        if (mode !== 'LIBERA') {
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'NEW_TICKET' }),
            });
        }

        // Aggiornamento UI
        setLastEntry({ numero: prossimoTicket, coperti: numeroCopertiValido });
        setCoperti(0); 
        
        if (mode === 'MANUALE') {
            setProssimoTicket(null);
        } else {
            await fetchData();
        }
    } catch (error) {
        alert("Errore durante il salvataggio");
    } finally {
        setLoading(false); // <--- Sblocca solo alla fine di tutto il processo
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
                boxSizing: 'border-box', overflow: 'hidden',
                // SE STA CARICANDO, BLOCCA I CLICK SU TUTTO IL CONTENITORE
                pointerEvents: loading ? 'none' : 'auto',
                opacity: loading ? 0.7 : 1
            }}>

                {/* CONTROLLI LATERALI SINISTRA */}
                <Box sx={{ 
                    position: 'flex', top: 16, left: 16, zIndex: 10, 
                    display: 'flex', gap: 1 
                }}>
                    <Button 
                        variant="outlined" color="error" size="small" 
                        disabled={loading}
                        onClick={() => setOpenResetDialog(true)} 
                        startIcon={<DeleteForeverIcon />} 
                        sx={{ fontWeight: 'bold', bgcolor: 'white', borderRadius: '10px', mb: 2 }}
                    >
                        AZZERA
                    </Button>

                    <Button 
                        variant={mode === 'AUTO' ? "contained" : "outlined"} 
                        color="primary" size="small" 
                        disabled={loading}
                        onClick={() => setMode('AUTO')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'AUTO' ? 'primary.main' : 'white', borderRadius: '10px', fontSize: '0.7rem', mb: 2 }}
                    >
                        AUTO
                    </Button>

                    <Button 
                        variant={mode === 'MANUALE' ? "contained" : "outlined"} 
                        color="warning" size="small" 
                        disabled={loading}
                        onClick={() => setMode('MANUALE')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'MANUALE' ? 'warning.main' : 'white', borderRadius: '10px', fontSize: '0.7rem', mb: 2 }}
                    >
                        MANUALE
                    </Button>

                    <Button 
                        variant={mode === 'LIBERA' ? "contained" : "outlined"} 
                        color="success" size="small" 
                        disabled={loading}
                        onClick={() => setMode('LIBERA')}
                        sx={{ fontWeight: 'bold', bgcolor: mode === 'LIBERA' ? 'success.main' : 'white', borderRadius: '10px', fontSize: '0.7rem', mb: 2 }}
                    >
                        LIBERA
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', gap: { xs: 1, sm: 2 }, flexGrow: 1, justifyContent: 'center' }}>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '1.4rem', letterSpacing: 2 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        
                        {mode === 'MANUALE' ? (
                             <TextField
                                type="number"
                                disabled={loading}
                                value={prossimoTicket === null ? '' : prossimoTicket}
                                onChange={(e) => setProssimoTicket(e.target.value === '' ? null : Number(e.target.value))}
                                variant="standard"
                                placeholder="-"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    '& input': {
                                        fontSize: { xs: '5.5rem', sm: '6rem' }, textAlign: 'center', fontWeight: 1000,
                                        color: 'warning.main', fontFamily: 'monospace', padding: 0, width: '250px'
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ 
                                fontWeight: 1000, 
                                color: mode === 'LIBERA' ? 'success.main' : 'primary.main', 
                                fontSize: { xs: '5.5rem', sm: '6rem' }, lineHeight: 1, mt: 1 
                            }}>
                                {prossimoTicket ?? '-'}
                            </Typography>
                        )}
                    </Box>

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

                    <Box onClick={() => !loading && setIsEditing(true)} sx={{ textAlign: 'center', cursor: loading ? 'default' : 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isEditing ? (
                            <TextField
                                type="number" autoFocus variant="standard" InputProps={{ disableUnderline: true }}
                                disabled={loading}
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
                            <Button variant="contained" disabled={loading || Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <RemoveCircleSharpIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" disabled={loading} onClick={onAdd} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <AddCircleIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" disabled={loading} onClick={onAdd10} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <Typography sx={{ fontWeight: 1000, fontSize: '1.5rem' }}>+10</Typography>
                            </Button>
                        </Stack>

                        <Button
                            onClick={handleStampa} variant="contained" 
                            color={mode === 'LIBERA' ? "success" : "secondary"} 
                            disabled={loading || Number(coperti) <= 0 || prossimoTicket === null}
                            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <PrintIcon sx={{ fontSize: { xs: 30, sm: 45 } }} />}
                            sx={{ width: '92%', py: 2, fontSize: { xs: '1.5rem', sm: '2.2rem' }, fontWeight: 1000, borderRadius: '40px' }}
                        >
                            {loading ? 'STAMPA IN CORSO...' : (mode === 'LIBERA' ? 'ENTRA' : 'STAMPA')}
                        </Button>
                    </Box>
                </Box>

                {/* DIALOG RESET */}
                <Dialog 
                    open={openResetDialog} 
                    onClose={() => !loading && setOpenResetDialog(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            borderLeft: '10px solid #9c27b0',
                            p: 1,
                            minWidth: { xs: '90%', sm: '400px' },
                        }
                    }}
                >
                    <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, fontSize: '1.4rem', textAlign: 'center' }}>
                        AZZERARE TICKETS?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ fontWeight: 700, color: '#444', mb: 2, textAlign: 'center' }}>
                            Operazione irreversibile. Svuota la tabella e azzera il contatore.
                            <br /><br />
                            Digita <span style={{ color: '#9c27b0' }}>CONFERMA</span> per continuare.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            fullWidth
                            disabled={loading}
                            variant="outlined"
                            placeholder="CONFERMA"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { borderRadius: '15px', bgcolor: '#f9f9f9' },
                                input: { fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem' }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                        <Button disabled={loading} onClick={() => { setOpenResetDialog(false); setConfirmText(""); }}>
                            ANNULLA
                        </Button>
                        <Button 
                            onClick={handleResetTotale} 
                            color="error" 
                            variant="contained" 
                            disabled={loading || confirmText !== "CONFERMA"}
                            sx={{ fontWeight: 1000, borderRadius: '10px' }}
                        >
                            {loading ? 'AZZERAMENTO...' : 'AZZERA ORA'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}