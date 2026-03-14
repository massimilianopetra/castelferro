'use client';

import { useState, useEffect } from 'react';
import { getListaCamerieri } from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import useMediaQuery from '@mui/material/useMediaQuery';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        success: { main: '#2e7d32' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' }
    },
});

export default function TelecomandoPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState<number>(0);

    useEffect(() => {
        getListaCamerieri().then((data) => {
            if (data) {
                // Inizializzazione dal DB
                setTotalValue(data.length);
            }
            setLoading(false);
        });
    }, []);

    // Funzioni per il contatore
    const increment = () => setTotalValue(prev => prev + 1);
    const decrement = () => setTotalValue(prev => (prev > 0 ? prev - 1 : 0));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100vh', 
                    width: '100vw',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                    p: 2
                }}
            >
                {/* 1. Contatore in alto al centro */}
                <Box sx={{ pt: 4, textAlign: 'center' }}>
                    <Typography 
                        variant="h1" 
                        sx={{ 
                            fontSize: isMobile ? '15vh' : '20vh', 
                            fontWeight: 900, 
                            color: '#1976d2',
                            fontFamily: 'monospace',
                            lineHeight: 1
                        }}
                    >
                        {totalValue}
                    </Typography>
                </Box>

                {/* 2. Area centrale con i tasti Giganti */}
                <Box 
                    sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Stack 
                        direction={isMobile ? "column" : "row"} 
                        spacing={4} 
                        sx={{ width: '90%', height: '60%' }}
                    >
                        {/* Tasto Meno (Rosso) */}
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={decrement}
                            sx={{ 
                                flex: 1, 
                                borderRadius: 4,
                                fontSize: '5rem',
                                boxShadow: '0 10px 20px rgba(211, 47, 47, 0.3)'
                            }}
                        >
                            <RemoveIcon sx={{ fontSize: 'inherit', color: 'white' }} />
                        </Button>

                        {/* Tasto Più (Verde) */}
                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={increment}
                            sx={{ 
                                flex: 1, 
                                borderRadius: 4,
                                fontSize: '5rem',
                                boxShadow: '0 10px 20px rgba(46, 125, 50, 0.3)'
                            }}
                        >
                            <AddIcon sx={{ fontSize: 'inherit', color: 'white' }} />
                        </Button>
                    </Stack>
                </Box>

                {/* 3. Footer */}
                <Box sx={{ pb: 4, textAlign: 'center' }}>
                    <Typography 
                        variant={isMobile ? "h5" : "h3"} 
                        sx={{ fontWeight: 'bold', color: '#333', textTransform: 'uppercase' }}
                    >
                        Sagra di Castelferro 2026
                    </Typography>
                </Box>
            </Box>
        </ThemeProvider>
    );
}