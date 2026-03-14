'use client';

import { useState, useEffect } from 'react';
import { getListaCamerieri } from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        background: { default: '#f4f6f8' }
    },
});

export default function ContatorePage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState<number>(0);

    useEffect(() => {
        // Recupero i dati dal DB come nel tuo script originale
        getListaCamerieri().then((data) => {
            if (data) {
                // Esempio: calcoliamo il numero totale di camerieri
                // Modifica questa logica per estrarre la variabile specifica che ti serve
                const total = data.length; 
                setTotalValue(total);
            }
            setLoading(false);
        });
    }, []);

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
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh', 
                    width: '100vw',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                    p: 2
                }}
            >
                {/* Il Numero Gigante: Occupa circa l'80% dell'altezza/spazio visivo */}
                <Box 
                    sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Typography 
                        variant="h1" 
                        sx={{ 
                            // Font-size dinamico basato sulla viewport (vw/vh) per coprire l'80%
                            fontSize: isMobile ? '40vh' : '65vh', 
                            fontWeight: 900, 
                            color: '#1976d2',
                            lineHeight: 1,
                            fontFamily: 'monospace', // Per uno stile più "contatore"
                            textShadow: '4px 4px 12px rgba(0,0,0,0.1)',
                            userSelect: 'none'
                        }}
                    >
                        {totalValue}
                    </Typography>
                </Box>

                {/* Footer con la scritta richiesta */}
                <Box 
                    sx={{ 
                        pb: isMobile ? 4 : 6, 
                        textAlign: 'center',
                        width: '100%'
                    }}
                >
                    <Typography 
                        variant={isMobile ? "h4" : "h2"} 
                        sx={{ 
                            fontWeight: 'bold', 
                            color: '#333',
                            letterSpacing: isMobile ? 1 : 4,
                            textTransform: 'uppercase'
                        }}
                    >
                        Sagra di Castelferro 2026
                    </Typography>
                </Box>
            </Box>
        </ThemeProvider>
    );
}