'use client';

import { useState, useEffect, useCallback } from 'react';
import { addTickets, clearAllTickets, getFirstFreeTicket } from '@/app/lib/actions'; 
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Stack, TextField, Dialog, 
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import PrintIcon from '@mui/icons-material/Print';

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
    const [mode, setMode] = useState<Mode>('AUTO'); 
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
            setCoperti(0); 
            if (mode === 'MANUALE') setProssimoTicket(null);
            else await fetchData();
        } catch (error) {
            alert("Errore stampa");
        } finally {
            setLoading(false);
        }
    };

    if (loading && prossimoTicket === null && mode !== 'MANUALE') {
        return <Box sx={{ display: 'flex', height: '50vh', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            {/* CONTENITORE PRINCIPALE: Usa h: 100% per stare dentro il tuo layout flex-grow */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', // Fondamentale per non uscire dal layout
                width: '100%', 
                maxWidth: '500px', 
                mx: 'auto',
                boxSizing: 'border-box',
                p: 1, // Padding leggero per non toccare i bordi
            }}>
                
                {/* 1. TOP: TASTI MODALITÀ (SOTTILI) */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexShrink: 0 }}>
                    {['AZZERA', 'AUTO', 'MANUALE', 'LIBERA'].map((m) => (
                        <Button 
                            key={m}
                            variant={mode === m ? "contained" : "outlined"} 
                            color={m === 'AZZERA' ? "error" : m === 'AUTO' ? "primary" : m === 'MANUALE' ? "warning" : "success"}
                            size="small"
                            onClick={() => m === 'AZZERA' ? setOpenResetDialog(true) : setMode(m as Mode)}
                            sx={{ fontWeight: 'bold', fontSize: '0.6rem', minWidth: '60px', py: 0.5 }}
                        >
                            {m}
                        </Button>
                    ))}
                </Box>

                {/* 2. CENTER: I NUMERI (ZONA CHE SI ESPANDE) */}
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', // Centra verticalmente Ticket e Coperti
                    alignItems: 'center',
                    gap: 1 // Spazio minimo tra i due blocchi
                }}>
                    
                    {/* Blocco Ticket */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#666', fontWeight: 1000, fontSize: '0.8rem', letterSpacing: 1, mb: -1 }}>
                            {mode === 'LIBERA' ? 'ENTRATA LIBERA' : 'PROSSIMO TICKET'}
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 1000, 
                            color: mode === 'LIBERA' ? 'success.main' : mode === 'MANUALE' ? 'warning.main' : 'primary.main', 
                            fontSize: { xs: '5.5rem', sm: '7rem' }, 
                            lineHeight: 1
                        }}>
                            {prossimoTicket ?? '-'}
                        </Typography>
                    </Box>

                    {/* Blocco Coperti */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ 
                            fontSize: { xs: '6rem', sm: '8rem' }, 
                            fontWeight: 1000, 
                            color: coperti === 0 ? '#ddd' : '#000', 
                            lineHeight: 1 
                        }}>
                            {coperti === '' ? 0 : coperti}
                        </Typography>
                        <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.1rem', mt: -1 }}>COPERTI</Typography>
                    </Box>
                </Box>

                {/* 3. BOTTOM: TASTIERA E STAMPA (ANCORATI IN BASSO) */}
                <Box sx={{ flexShrink: 0, pb: 1, pt: 1 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
                        <Button 
                            variant="contained" 
                            disabled={Number(coperti) <= 0} 
                            onClick={() => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0))} 
                            sx={{ width: '30%', height: '55px', borderRadius: '15px', bgcolor: '#ccc' }}
                        >
                            <RemoveCircleSharpIcon sx={{ fontSize: 30 }} />
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999))} 
                            sx={{ width: '30%', height: '55px', borderRadius: '15px' }}
                        >
                            <AddCircleIcon sx={{ fontSize: 30 }} />
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999))} 
                            sx={{ width: '30%', height: '55px', borderRadius: '15px' }}
                        >
                            <Typography sx={{ fontWeight: 1000, fontSize: '1.2rem' }}>+10</Typography>
                        </Button>
                    </Stack>

                    <Button
                        onClick={handleStampa} 
                        variant="contained" 
                        color={mode === 'LIBERA' ? "success" : "secondary"} 
                        disabled={Number(coperti) <= 0 || prossimoTicket === null}
                        startIcon={<PrintIcon sx={{ fontSize: 28 }} />}
                        sx={{ 
                            width: '100%', 
                            height: '65px', // Altezza fissa per sicurezza
                            fontSize: '1.5rem', 
                            fontWeight: 1000, 
                            borderRadius: '30px' 
                        }}
                    >
                        {mode === 'LIBERA' ? 'ENTRA' : 'STAMPA'}
                    </Button>
                </Box>

                {/* Dialog Reset */}
                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 1000, mb: 1 }}>AZZERARE TUTTO?</Typography>
                        <TextField fullWidth size="small" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        <Button fullWidth onClick={async () => {
                             if (confirmText === "CONFERMA") {
                                await clearAllTickets();
                                setCoperti(0); setOpenResetDialog(false); setConfirmText("");
                                await fetchData();
                             }
                        }} disabled={confirmText !== "CONFERMA"} color="error" variant="contained" sx={{ mt: 2 }}>AZZERA</Button>
                    </Box>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
}