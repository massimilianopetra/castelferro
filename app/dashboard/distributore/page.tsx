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
import useMediaQuery from '@mui/material/useMediaQuery';
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
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(max-width:960px)');
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
        width: isMobile ? '30%' : '140px',
        height: isMobile ? '90px' : '130px',
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
                display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
                bgcolor: 'background.default', position: 'relative', overflow: 'hidden'
            }}>

                {/* Tasto Azzera */}
                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                    <Button 
                        variant="outlined" color="error" size="small"
                        onClick={() => setOpenResetDialog(true)}
                        startIcon={<DeleteForeverIcon />}
                        sx={{ fontWeight: 'bold', bgcolor: 'white', borderRadius: '10px' }}
                    >
                        AZZERA
                    </Button>
                </Box>

                {/* Info Ultimo Ticket */}
                {lastEntry && (
                    <Paper elevation={4} sx={{
                        position: 'absolute', top: 12, left: 12, p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2,
                        borderLeft: '5px solid #9c27b0', zIndex: 10
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <HistoryIcon sx={{ fontSize: 18, color: '#666' }} />
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#666' }}>ULTIMO</Typography>
                        </Stack>
                        <Typography sx={{ fontWeight: 900, fontSize: '1rem' }}>
                            N: <span style={{ color: '#1976d2' }}>{lastEntry.numero}</span> | C: <span style={{ color: '#9c27b0' }}>{lastEntry.coperti}</span>
                        </Typography>
                    </Paper>
                )}

                {/* CONTENITORE CENTRALE */}
                <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-evenly', // Distribuisce equamente Ticket, Coperti e Tasti
                    alignItems: 'center',
                    py: 2
                }}>
                    
                    {/* SEZIONE PROSSIMO TICKET */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: isMobile ? '1rem' : '1.4rem', letterSpacing: 2 }}>
                            PROSSIMO TICKET
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 1000, 
                            color: 'primary.main', 
                            fontSize: isMobile ? '5.5rem' : '8rem', 
                            lineHeight: 0.9,
                            mt: 1
                        }}>
                            {prossimoTicket}
                        </Typography>
                    </Box>

                    {/* SEZIONE COPERTI (CLICCABILE) */}
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
                                        fontSize: isMobile ? '8.5rem' : '13rem',
                                        textAlign: 'center', fontWeight: 1000,
                                        color: 'primary.main', fontFamily: 'monospace', padding: 0,
                                        width: '100%'
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ 
                                fontSize: isMobile ? '8.5rem' : '13rem', 
                                fontWeight: 1000, 
                                fontFamily: 'monospace', 
                                color: coperti === 0 ? '#ddd' : '#000', 
                                lineHeight: 0.9 
                            }}>
                                {coperti}
                            </Typography>
                        )}
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: isMobile ? '1.4rem' : '2rem', mt: 1 }}>
                            COPERTI
                        </Typography>
                    </Box>

                    {/* SEZIONE PULSANTIERA E STAMPA */}
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Stack direction="row" spacing={isMobile ? 2 : 4} justifyContent="center" sx={{ width: '100%', px: 2, mb: isMobile ? 3 : 5 }}>
                            <Button 
                                variant="contained" 
                                disabled={Number(coperti) <= 0 || Number(coperti) >= 999} 
                                onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                                sx={actionButtonStyle}
                            >
                                <RemoveCircleSharpIcon sx={{ fontSize: isMobile ? 45 : 60 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: isMobile ? '1rem' : '1.2rem' }}>MENO</Typography>
                            </Button>

                            <Button 
                                variant="contained" 
                                disabled={Number(coperti) >= 999}
                                onClick={(e) => { e.stopPropagation(); onAdd(); }} 
                                sx={actionButtonStyle}
                            >
                                <AddCircleIcon sx={{ fontSize: isMobile ? 45 : 60 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: isMobile ? '1rem' : '1.2rem' }}>PIÙ</Typography>
                            </Button>

                            <Button 
                                variant="contained" 
                                disabled={Number(coperti) >= 999}
                                onClick={(e) => { e.stopPropagation(); onAdd10(); }} 
                                sx={actionButtonStyle}
                            >
                                <Replay10Icon sx={{ fontSize: isMobile ? 45 : 60 }} />
                                <Typography sx={{ fontWeight: 1000, fontSize: isMobile ? '1rem' : '1.2rem' }}>+10</Typography>
                            </Button>
                        </Stack>

                        <Button
                            onClick={handleStampa}
                            variant="contained"
                            color="secondary"
                            disabled={Number(coperti) <= 0}
                            startIcon={<PrintIcon sx={{ fontSize: isMobile ? 45 : 70 }} />}
                            sx={{
                                width: isMobile ? '92%' : '650px', 
                                py: isMobile ? 2.5 : 4,
                                fontSize: isMobile ? '2.2rem' : '4rem',
                                fontWeight: 1000, 
                                borderRadius: '40px',
                                boxShadow: '0 15px 30px rgba(156, 39, 176, 0.3)',
                                transition: 'all 0.2s',
                                '&:active': { transform: 'scale(0.98)' }
                            }}
                        >
                            STAMPA
                        </Button>
                    </Box>
                </Box>

                {/* DIALOG RESET (STILIZZATO) */}
                <Dialog 
                    open={openResetDialog} 
                    onClose={() => setOpenResetDialog(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            borderLeft: '10px solid #9c27b0',
                            p: 1,
                            minWidth: isMobile ? '90%' : '450px'
                        }
                    }}
                >
                    <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, fontSize: '1.6rem', textAlign: 'center' }}>
                        AZZERARE TICKETS?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ fontWeight: 700, color: '#444', mb: 3, textAlign: 'center' }}>
                            Operazione irreversibile svuot la tabella Tickets.
                           <br /> Azzererà il contatore e la cronologia dei ticket.
                                                        <br /><br />
                            Digita <span style={{ color: '#9c27b0' }}>CONFERMA</span> per continuare.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            fullWidth
                            variant="outlined"
                            placeholder="CONFERMA"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { borderRadius: '15px', bgcolor: '#f9f9f9' },
                                input: { fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem' }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
                        <Button 
                            onClick={() => { setOpenResetDialog(false); setConfirmText(""); }}
                            sx={{ fontWeight: 900, color: '#666', fontSize: '1rem' }}
                        >
                            ANNULLA
                        </Button>
                        <Button 
                            onClick={handleResetTotale} 
                            color="error" 
                            variant="contained" 
                            disabled={confirmText !== "CONFERMA"}
                            sx={{ fontWeight: 1000, borderRadius: '12px', px: 5, py: 1.5, fontSize: '1rem' }}
                        >
                            AZZERA ORA
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}