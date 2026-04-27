'use client';

import { useState, useEffect } from 'react';
import { addTickets, getNextTickets } from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';

// Icone
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import Replay10Icon from '@mui/icons-material/Replay10';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
        success: { main: '#2e7d32' },
        background: { default: '#f4f6f8' }
    },
});

export default function DistributorePage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [loading, setLoading] = useState(true);
    const [prossimoTicket, setProssimoTicket] = useState<number>(0);
    const [coperti, setCoperti] = useState<number | ''>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [lastEntry, setLastEntry] = useState<{ numero: number, coperti: number } | null>(null);

    useEffect(() => {
        getNextTickets().then((nextId) => {
            setProssimoTicket(nextId);
            setLoading(false);
        });
    }, []);

    const onAdd = () => setCoperti(prev => (Number(prev) + 1));
    const onRemove = () => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0));
    const onAdd10 = () => setCoperti(prev => (Number(prev) + 10));

    const handleStampa = async () => {
        if (isEditing || Number(coperti) <= 0) return;
        
        setLoading(true);
        try {
            // 1. Esegue l'azione sul DB [cite: 15]
            const nuovoTicketId = await createTicketAction({ coperti: Number(coperti) });

            if (nuovoTicketId) {
                // 2. NOTIFICA REAL-TIME: Avvisa la pagina Chiama di aggiornarsi
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'NEW_TICKET' }),
                });

                // 3. Aggiorna interfaccia locale [cite: 16, 17]
                setLastEntry({ numero: nuovoTicketId, coperti: Number(coperti) });
                setProssimoTicket(nuovoTicketId + 1);
                setCoperti(0);
            }
        } catch (error) {
            alert("Errore durante la stampa del ticket");
            console.error("Errore:", error);
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    async function createTicketAction(data: { coperti: number }) {
        try {
            const nextId = await getNextTickets();
            await addTickets(nextId, data.coperti);
            return nextId;
        } catch (error) {
            console.error("Errore server action:", error);
            throw error;
        }
    }

    const actionButtonStyle = {
        width: isMobile ? '23%' : '110px',
        height: isMobile ? '80px' : '110px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    };

    const labelStyle = {
        fontWeight: 900,
        fontSize: isMobile ? '0.85rem' : '1.1rem',
        lineHeight: 1,
        mt: 0.5
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

                {lastEntry && (
                    <Paper elevation={4} sx={{
                        position: 'absolute', top: 8, left: 8, p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2,
                        borderLeft: '5px solid #9c27b0', zIndex: 10
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <HistoryIcon sx={{ fontSize: 18, color: '#666' }} />
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#666', fontSize: '0.6rem' }}>ULTIMO</Typography>
                        </Stack>
                        <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>
                            N: <span style={{ color: '#1976d2' }}>{lastEntry.numero}</span> | C: <span style={{ color: '#9c27b0' }}>{lastEntry.coperti}</span>
                        </Typography>
                    </Paper>
                )}

                <Box sx={{ pt: isMobile ? 0.5 : 1, textAlign: 'center' }}>
                    <Typography sx={{ color: '#666', fontWeight: 900, letterSpacing: 1, fontSize: '0.8rem' }}>NUMERO</Typography>
                    <Typography sx={{ fontWeight: 1000, color: 'primary.main', fontSize: isMobile ? '3.5rem' : '5rem', lineHeight: 1 }}>
                        {prossimoTicket}
                    </Typography>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', pt: isMobile ? 1 : 2 }}>
                    <br />
                    <Box sx={{ textAlign: 'center', height: isMobile ? '20vh' : '25vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        {isEditing ? (
                            <TextField
                                type="number"
                                value={coperti === 0 ? '' : coperti}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 3) setCoperti(val === '' ? 0 : Number(val));
                                }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    width: isMobile ? '150px' : '220px',
                                    bgcolor: 'rgba(46, 125, 50, 0.05)',
                                    borderRadius: '12px',
                                    '& input': {
                                        fontSize: isMobile ? '6.5rem' : '9.5rem',
                                        textAlign: 'center',
                                        fontWeight: 1000,
                                        color: '#2e7d32',
                                        fontFamily: 'monospace',
                                        padding: 0,
                                        height: 'auto'
                                    }
                                }}
                            />
                        ) : (
                            <Typography sx={{ fontSize: isMobile ? '6.5rem' : '9.5rem', fontWeight: 1000, fontFamily: 'monospace', lineHeight: 1, color: '#000' }}>
                                {coperti}
                            </Typography>
                        )}
                    </Box>

                    <Typography sx={{ color: '#555', fontWeight: 900, fontSize: '1.2rem', mt: -1 }}>COPERTI</Typography>

                    <Box sx={{ flexGrow: isMobile ? 0.6 : 1, minHeight: '10px' }} />

                    <Stack direction="row" spacing={isMobile ? 1 : 2} justifyContent="center" sx={{ width: '100%', px: 1, mb: isMobile ? 2 : 4 }}>
                        <Button variant="contained" onClick={onAdd} sx={actionButtonStyle}><AddCircleIcon sx={{ fontSize: 35 }} /><Typography sx={labelStyle}>PIÙ</Typography></Button>
                        <Button variant="contained" onClick={onRemove} sx={actionButtonStyle}><RemoveCircleSharpIcon sx={{ fontSize: 35 }} /><Typography sx={labelStyle}>MENO</Typography></Button>
                        <Button variant="contained" onClick={onAdd10} sx={actionButtonStyle}><Replay10Icon sx={{ fontSize: 35 }} /><Typography sx={labelStyle}>+10</Typography></Button>
                        <Button variant="contained" color={isEditing ? "success" : "primary"} onClick={() => setIsEditing(!isEditing)} sx={actionButtonStyle}>
                            {isEditing ? <><CheckCircleIcon sx={{ fontSize: 35 }} /><Typography sx={labelStyle}>OK</Typography></> : <><EditIcon sx={{ fontSize: 35 }} /><Typography sx={labelStyle}>EDIT</Typography></>}
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa}
                        variant="contained"
                        color="secondary"
                        disabled={isEditing}
                        startIcon={<PrintIcon sx={{ fontSize: isMobile ? 35 : 55 }} />}
                        sx={{
                            width: isMobile ? '94%' : '520px',
                            py: isMobile ? 2 : 3,
                            fontSize: isMobile ? '2rem' : '3rem',
                            fontWeight: 1000,
                            borderRadius: '30px',
                            boxShadow: isEditing ? 'none' : '0 10px 20px rgba(156, 39, 176, 0.4)',
                            mb: isMobile ? 2 : 4,
                            "&.Mui-disabled": { bgcolor: "#ccc", color: "#888" }
                        }}
                    >
                        STAMPA
                    </Button>
                </Box>
            </Box>
        </ThemeProvider>
    );
}