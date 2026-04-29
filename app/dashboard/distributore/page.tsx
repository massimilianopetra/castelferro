'use client';

import { useState, useEffect } from 'react';
import { addTickets, getNextTickets, clearAllTickets } from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// Icone
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
    const [prossimoTicket, setProssimoTicket] = useState<number>(0);
    const [coperti, setCoperti] = useState<number | ''>(0); 
    const [isEditing, setIsEditing] = useState(false);
    const [lastEntry, setLastEntry] = useState<{ numero: number, coperti: number } | null>(null);

    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const fetchData = async () => {
        const nextId = await getNextTickets();
        setProssimoTicket(nextId);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onAdd = () => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999));
    const onRemove = () => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0));
    const onAdd10 = () => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999));

    const handleStampa = async () => {
        const numeroCopertiValido = Number(coperti);
        if (numeroCopertiValido <= 0) return;
        
        setLoading(true);
        try {
            const nextId = await getNextTickets();
            await addTickets(nextId, numeroCopertiValido);

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'NEW_TICKET' }),
            });

            setLastEntry({ numero: nextId, coperti: numeroCopertiValido });
            setProssimoTicket(nextId + 1);
            setCoperti(0); 
            setIsEditing(false);
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
                setProssimoTicket(1);
                setLastEntry(null);
                setCoperti(0);
                setOpenResetDialog(false);
                setConfirmText("");
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'REFRESH_TABLE' }),
                });
            } catch (error) {
                alert("Errore reset");
            } finally {
                setLoading(false);
            }
        }
    };

    const actionButtonStyle = {
        width: '30%',
        height: '90px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={defaultTheme}>
<Box sx={{
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center',     // Centra orizzontalmente
    minHeight: '100dvh', 
    flexGrow: 1,              // Importante: dice al box di occupare tutto lo spazio disponibile dopo la sidebar
    bgcolor: 'background.default', 
    p: 2,
    position: 'relative'      // Serve per il tasto AZZERA assoluto
}}>

{/* Tasto Azzera - Spostato in alto a sinistra */}
<Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
    <Button 
        variant="outlined" 
        color="error" 
        size="small"
        onClick={() => setOpenResetDialog(true)}
        startIcon={<DeleteForeverIcon />}
        sx={{ 
            fontWeight: 'bold', 
            bgcolor: 'rgba(255, 255, 255, 0.8)', // Leggermente trasparente per non "pesare"
            backdropFilter: 'blur(4px)',         // Effetto moderno
            borderRadius: '10px',
            borderWidth: '1px',
            '&:hover': {
                borderWidth: '1px',
                bgcolor: 'white'
            }
        }}
    >
        AZZERA
    </Button>
</Box>

                {/* CONTENITORE CENTRALE */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '600px',
                    gap: 2 // Ridotto il gap per far stare tutto bene
                }}>
                    
                    {/* SEZIONE PROSSIMO TICKET */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '1rem', letterSpacing: 2 }}>
                            PROSSIMO TICKET
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 1000, 
                            color: 'primary.main', 
                            fontSize: '5.5rem', 
                            lineHeight: 1,
                            mt: 1
                        }}>
                            {prossimoTicket}
                        </Typography>
                    </Box>

                    {/* SEZIONE INFO ULTIMO TICKET (Piccola e centrata) */}
                    <Box sx={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                        {lastEntry && (
                            <Paper variant="outlined" sx={{
                                px: 2, py: 0.5,
                                bgcolor: '#fff', borderRadius: '12px',
                                border: '1px solid #ddd',
                                display: 'flex', alignItems: 'center', gap: 1.5
                            }}>
                                <HistoryIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#666' }}>
                                    ULTIMO TICKET: <span style={{ color: '#1976d2' }}>{lastEntry.numero}</span> 
                                    <span style={{ margin: '0 8px', color: '#ccc' }}>|</span> 
                                    COPERTI: <span style={{ color: '#9c27b0' }}>{lastEntry.coperti}</span>
                                </Typography>
                            </Paper>
                        )}
                    </Box>

                    {/* SEZIONE COPERTI */}
                    <Box 
                        onClick={() => setIsEditing(true)}
                        sx={{ 
                            textAlign: 'center', cursor: 'pointer', width: '100%',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                        }}
                    >
                        {isEditing ? (
                            <TextField
                                type="number"
                                inputMode="numeric"
                                value={coperti === 0 ? '' : coperti}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 3) setCoperti(val === '' ? 0 : Number(val));
                                }}
                                onBlur={() => setIsEditing(false)}
                                autoFocus
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    '& input': {
                                        fontSize: '8.5rem',
                                        textAlign: 'center', fontWeight: 1000,
                                        color: 'primary.main', fontFamily: 'monospace', padding: 0,
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ 
                                fontSize: '8.5rem', 
                                fontWeight: 1000, 
                                fontFamily: 'monospace', 
                                color: coperti === 0 ? '#ddd' : '#000', 
                                lineHeight: 0.9 
                            }}>
                                {coperti}
                            </Typography>
                        )}
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1 }}>
                            COPERTI
                        </Typography>
                    </Box>

                    {/* SEZIONE PULSANTIERA E STAMPA */}
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: '100%', px: 2, mb: 3 }}>
                            <Button variant="contained" disabled={Number(coperti) <= 0} onClick={(e) => { e.stopPropagation(); onRemove(); }} sx={actionButtonStyle}>
                                <RemoveCircleSharpIcon sx={{ fontSize: 45 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: '1rem' }}>MENO</Typography>
                            </Button>
                            <Button variant="contained" onClick={(e) => { e.stopPropagation(); onAdd(); }} sx={actionButtonStyle}>
                                <AddCircleIcon sx={{ fontSize: 45 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: '1rem' }}>PIÙ</Typography>
                            </Button>
                            <Button variant="contained" onClick={(e) => { e.stopPropagation(); onAdd10(); }} sx={actionButtonStyle}>
                                <Replay10Icon sx={{ fontSize: 45 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: '1rem' }}>+10</Typography>
                            </Button>
                        </Stack>

                        <Button
                            onClick={handleStampa}
                            variant="contained"
                            color="secondary"
                            disabled={Number(coperti) <= 0}
                            startIcon={<PrintIcon sx={{ fontSize: 45 }} />}
                            sx={{
                                width: '92%', py: 2.5,
                                fontSize: '2.2rem', fontWeight: 1000, borderRadius: '40px',
                                boxShadow: '0 15px 30px rgba(156, 39, 176, 0.3)',
                                '&:active': { transform: 'scale(0.98)' }
                            }}
                        >
                            STAMPA
                        </Button>
                    </Box>
                </Box>

                {/* DIALOG RESET */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} PaperProps={{ sx: { borderRadius: 4, borderLeft: '10px solid #9c27b0', p: 1, minWidth: '90%' } }}>
                    <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, fontSize: '1.6rem', textAlign: 'center' }}>AZZERARE TICKETS?</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ fontWeight: 700, color: '#444', mb: 3, textAlign: 'center' }}>
                            Operazione irreversibile. Digita <span style={{ color: '#9c27b0' }}>CONFERMA</span> per continuare.
                        </DialogContentText>
                        <TextField
                            autoFocus fullWidth variant="outlined" placeholder="CONFERMA" value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px', bgcolor: '#f9f9f9' }, input: { fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem' } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
                        <Button onClick={() => { setOpenResetDialog(false); setConfirmText(""); }} sx={{ fontWeight: 900, color: '#666' }}>ANNULLA</Button>
                        <Button onClick={handleResetTotale} color="error" variant="contained" disabled={confirmText !== "CONFERMA"} sx={{ fontWeight: 1000, borderRadius: '12px', px: 5 }}>AZZERA ORA</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}