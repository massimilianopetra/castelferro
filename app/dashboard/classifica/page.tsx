'use client';

import { useState, useEffect } from 'react';
// IMPORTIAMO LA NUOVA ACTION PER I COPERTI
import { getClassificaCopertiCamerieri } from '@/app/lib/actions';

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Icona Coppa
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech'; // Icona Medaglia
import PersonIcon from '@mui/icons-material/Person';
import useMediaQuery from '@mui/material/useMediaQuery';

// --- TIPI ---
type ClassificaData = {
    posizione: number;
    nome: string;
    coperti: number;
};

export default function ClassificaCamerieriPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    
    const [loading, setLoading] = useState(true);
    const [camerieri, setCamerieri] = useState<ClassificaData[]>([]);
    
    // Stati per i due Switch richiesti
    const [soloPrimiDieci, setSoloPrimiDieci] = useState(false);
    const [nascondiCoperti, setNascondiCoperti] = useState(false);

    useEffect(() => {
        getClassificaCopertiCamerieri().then((data) => {
            if (data) {
                // 1. Filtriamo per escludere "ASPORTO", scorte o record di servizio
                const filtrati = data.filter((item: any) => {
                    const nomeUpper = (item.nome || '').toUpperCase().trim();
                    return nomeUpper !== 'ASPORTO' && nomeUpper !== '' && !nomeUpper.includes('CUCINA');
                });

                // 2. Ordiniamo dal primo a scendere (chi ha servito più COPERTI)
                const ordinati = filtrati.sort((a: any, b: any) => Number(b.coperti) - Number(a.coperti));

                // 3. Mappiamo aggiungendo la posizione effettiva in classifica
                const mappati: ClassificaData[] = ordinati.map((item: any, index: number) => ({
                    posizione: index + 1,
                    nome: item.nome,
                    coperti: Number(item.coperti)
                }));

                setCamerieri(mappati);
            }
            setLoading(false);
        });
    }, []);

    // Logica di filtraggio dinamica in base allo switch "Primi 10"
    const datiVisualizzati = soloPrimiDieci ? camerieri.slice(0, 10) : camerieri;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh', 
            width: '100%',
            p: { xs: 2, sm: 4 },
            bgcolor: '#f4f6f8',
            boxSizing: 'border-box'
        }}>
            
            {/* INTESTAZIONE */}
            <Typography variant={isMobile ? "h4" : "h2"} sx={{ textAlign: 'center', fontWeight: '800', color: '#1a237e', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                🏆 Classifica Camerieri
            </Typography>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', color: '#666', mb: 3, fontWeight: '500' }}>
                Totale generale dei COPERTI serviti ai tavoli
            </Typography>

            {/* BARRA DEI CONTROLLI (SWITCH) - Nascosta in fase di stampa fisica */}
            <Paper sx={{ 
                p: 2, 
                mb: 4, 
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'center', 
                gap: { xs: 1, sm: 4 },
                alignItems: 'center',
                '@media print': { display: 'none' } 
            }}>
                <FormControlLabel
                    control={<Switch checked={soloPrimiDieci} onChange={(e) => setSoloPrimiDieci(e.target.checked)} color="primary" />}
                    label={<Typography sx={{ fontWeight: 'bold', color: '#333' }}>Mostra solo i primi 10</Typography>}
                />
                <FormControlLabel
                    control={<Switch checked={nascondiCoperti} onChange={(e) => setNascondiCoperti(e.target.checked)} color="secondary" />}
                    label={<Typography sx={{ fontWeight: 'bold', color: '#333' }}>Nascondi numero coperti</Typography>}
                />
            </Paper>

            {/* CONTENITORE TABELLONE CLASSIFICA */}
            <Box sx={{ maxWidth: 800, width: '100%', mx: 'auto' }}>
                <Stack spacing={1.5}>
                    {datiVisualizzati.map((cameriere) => {
                        const isPrimo = cameriere.posizione === 1;
                        const isSecondo = cameriere.posizione === 2;
                        const isTerzo = cameriere.posizione === 3;
                        const isPodio = isPrimo || isSecondo || isTerzo;

                        // Configurazione stile del podio (Oro, Argento, Bronzo)
                        let bgColor = 'white';
                        let textColor = '#2c3e50';
                        let iconaPosizione = <PersonIcon sx={{ color: '#95a5a6' }} />;
                        let colonnaUnoSx = {};

                        if (isPrimo) {
                            bgColor = 'linear-gradient(90deg, #fff9c4 0%, #fffde7 100%)'; 
                            textColor = '#b78103';
                            iconaPosizione = <EmojiEventsIcon sx={{ color: '#fbc02d', fontSize: 32 }} />;
                            colonnaUnoSx = { fontWeight: '900', fontSize: '1.4rem' };
                        } else if (isSecondo) {
                            bgColor = 'linear-gradient(90deg, #cfd8dc 0%, #eceff1 100%)'; 
                            textColor = '#455a64';
                            iconaPosizione = <MilitaryTechIcon sx={{ color: '#90a4ae', fontSize: 30 }} />;
                            colonnaUnoSx = { fontWeight: '800', fontSize: '1.25rem' };
                        } else if (isTerzo) {
                            bgColor = 'linear-gradient(90deg, #ffe0b2 0%, #fff3e0 100%)'; 
                            textColor = '#e65100';
                            iconaPosizione = <MilitaryTechIcon sx={{ color: '#ffb74d', fontSize: 30 }} />;
                            colonnaUnoSx = { fontWeight: '800', fontSize: '1.2rem' };
                        }

                        return (
                            <Paper 
                                key={cameriere.posizione} 
                                sx={{ 
                                    p: isPodio ? 2.5 : 1.8, 
                                    background: bgColor, 
                                    borderRadius: isPodio ? 4 : 2, 
                                    boxShadow: isPodio ? '0 6px 15px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                                    border: isPodio ? `1px solid ${isPrimo ? '#fbc02d' : isSecondo ? '#b0bec5' : '#ffb74d'}` : '1px solid #e0e0e0',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'between',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.01)' }
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                                    
                                    {/* POSIZIONE IN CLASSIFICA */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                                        {iconaPosizione}
                                        <Typography sx={{ ml: 0.5, color: textColor, ...colonnaUnoSx }}>
                                            {cameriere.posizione}°
                                        </Typography>
                                    </Box>

                                    <Divider orientation="vertical" flexItem sx={{ opacity: 0.6 }} />

                                    {/* NOME DEL CAMERIERE */}
                                    <Typography sx={{ 
                                        fontSize: isPodio ? '1.25rem' : '1.05rem', 
                                        fontWeight: isPodio ? '700' : '500', 
                                        color: '#2c3e50',
                                        textTransform: 'capitalize'
                                    }}>
                                        {cameriere.nome.toLowerCase()}
                                    </Typography>
                                </Stack>

                                {/* NUMERO DEI COPERTI (Nascondibile con lo Switch) */}
                                {!nascondiCoperti && (
                                    <Box sx={{ 
                                        px: 2, 
                                        py: 0.8, 
                                        borderRadius: '20px', 
                                        bgcolor: isPrimo ? '#fbc02d' : isSecondo ? '#b0bec5' : isTerzo ? '#ffb74d' : '#e0e0e0',
                                        color: isPrimo || isTerzo ? '#5d4037' : isSecondo ? '#263238' : '#424242',
                                        fontWeight: '800',
                                        fontSize: isPodio ? '1.1rem' : '0.95rem',
                                        boxShadow: isPodio ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                    }}>
                                        {cameriere.coperti} {cameriere.coperti === 1 ? 'Coperto' : 'Coperti'}
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}
                </Stack>
                
                {/* FALLBACK IN CASO DI LISTA VUOTA */}
                {datiVisualizzati.length === 0 && (
                    <Typography sx={{ textAlign: 'center', color: '#999', mt: 4, fontStyle: 'italic' }}>
                        Nessun cameriere a sistema con coperti registrati.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}