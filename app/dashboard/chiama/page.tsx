'use client';

import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useMediaQuery from '@mui/material/useMediaQuery';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        success: { main: '#2e7d32' },
        error:   { main: '#d32f2f' },
        background: { default: '#f4f6f8' },
    },
});

export default function ChiamaPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [numero, setNumero] = useState(0);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const broadcast = async (n: number) => {
        await fetch('/api/next-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: n }),
        });
    };

    const handleProssimo = async () => {
        const next = numero + 1;
        try {
            await broadcast(next);
            setNumero(next);
            setSnackbar({ open: true, message: `Numero ${next} inviato al display`, severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' });
        }
    };

    const handleAzzera = async () => {
        try {
            await broadcast(0);
            setNumero(0);
            setSnackbar({ open: true, message: 'Display azzerato', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' });
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                width: '100vw',
                bgcolor: 'background.default',
                overflow: 'hidden',
                p: 2,
            }}>

                {/* Numero corrente */}
                <Box sx={{ pt: 1, textAlign: 'center' }}>
                    <Typography sx={{ color: '#666', fontWeight: 900, letterSpacing: 1, fontSize: '0.9rem' }}>
                        NUMERO IN CORSO
                    </Typography>
                    <Typography sx={{
                        fontSize: isMobile ? '12vh' : '15vh',
                        fontWeight: 900,
                        color: '#1976d2',
                        fontFamily: 'monospace',
                        lineHeight: 1,
                    }}>
                        {numero}
                    </Typography>
                </Box>

                {/* Tasto PROSSIMO */}
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleProssimo}
                        startIcon={<NavigateNextIcon sx={{ fontSize: isMobile ? '3rem !important' : '4rem !important' }} />}
                        sx={{
                            width: isMobile ? '90%' : '520px',
                            py: isMobile ? 3 : 5,
                            fontSize: isMobile ? '2rem' : '3rem',
                            fontWeight: 1000,
                            borderRadius: '30px',
                            boxShadow: '0 10px 20px rgba(46, 125, 50, 0.4)',
                        }}
                    >
                        PROSSIMO
                    </Button>
                </Box>

                {/* Tasto AZZERA */}
                <Box sx={{ pb: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleAzzera}
                        startIcon={<RestartAltIcon />}
                        sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2, borderWidth: 2,
                            '&:hover': { borderWidth: 2 } }}
                    >
                        AZZERA
                    </Button>
                </Box>

                {/* Footer */}
                <Box sx={{ pb: 1, textAlign: 'center' }}>
                    <Typography
                        variant={isMobile ? 'h6' : 'h4'}
                        sx={{ fontWeight: 'bold', color: '#333', textTransform: 'uppercase' }}
                    >
                        Sagra di Castelferro 2026
                    </Typography>
                </Box>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={2000}
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert
                        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                        severity={snackbar.severity}
                        variant="filled"
                        sx={{ width: '100%', fontWeight: 'bold' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

            </Box>
        </ThemeProvider>
    );
}
