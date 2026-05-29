'use client';

import { useState, useEffect } from 'react';
import { getClassificaCopertiCamerieri, getGiornoSagra } from '@/app/lib/actions';

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech'; 
import PersonIcon from '@mui/icons-material/Person';
import useMediaQuery from '@mui/material/useMediaQuery';

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import Button from '@mui/material/Button';
import PrintIcon from '@mui/icons-material/Print';
import { GlobalStyles } from '@mui/material';

type ClassificaData = {
    posizione: number;
    nome: string;
    coperti: number;
};

export default function ClassificaCamerieriPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [loading, setLoading] = useState(true);
    const [camerieri, setCamerieri] = useState<ClassificaData[]>([]);
    const [soloPrimiDieci, setSoloPrimiDieci] = useState(false);
    const [nascondiCoperti, setNascondiCoperti] = useState(false);
    const [mostraGrafico, setMostraGrafico] = useState(false);
    const [giornoSelezionato, setGiornoSelezionato] = useState<number>(0);
    const [inizializzato, setInizializzato] = useState(false);

    useEffect(() => {
        getGiornoSagra().then((gg) => {
            if (gg && (gg.stato?.toUpperCase() === 'APERTA' || gg.stato?.toUpperCase() === 'APERTO')) {
                setGiornoSelezionato(gg.giornata);
            } else {
                setGiornoSelezionato(0);
            }
            setInizializzato(true);
        }).catch((err) => {
            console.error("Errore recupero giornata:", err);
            setGiornoSelezionato(0);
            setInizializzato(true);
        });
    }, []);

    useEffect(() => {
        if (!inizializzato) return;
        setLoading(true);
        getClassificaCopertiCamerieri(giornoSelezionato).then((data) => {
            if (data) {
                const filtrati = data.filter((item: any) => {
                    const nomeUpper = (item.nome || '').toUpperCase().trim();
                    return nomeUpper !== 'ASPORTO' && nomeUpper !== '' && !nomeUpper.includes('CUCINA');
                });
                const ordinati = filtrati.sort((a: any, b: any) => Number(b.coperti) - Number(a.coperti));
                const mappati: ClassificaData[] = ordinati.map((item: any, index: number) => ({
                    posizione: index + 1,
                    nome: item.nome,
                    coperti: Number(item.coperti)
                }));
                setCamerieri(mappati);
            }
            setLoading(false);
        });
    }, [giornoSelezionato, inizializzato]);

    const datiVisualizzati = soloPrimiDieci ? camerieri.slice(0, 10) : camerieri;
    const maxCoperti = datiVisualizzati.length > 0 ? Math.max(...datiVisualizzati.map(c => c.coperti)) : 1;

    return (
        <Box className="pagina-classifica-root" sx={{ 
            display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%',
            p: { xs: 2, sm: 4 }, bgcolor: '#f4f6f8', boxSizing: 'border-box'
        }}>
            {/* CSS ANNULLA-BUG PER LA STAMPA DEL LAYOUT PADRE */}
            <GlobalStyles styles={{
                '@media print': {
                    '@page': { 
                        size: 'A4', 
                        margin: '15mm' 
                    },
                    'body': { 
                        backgroundColor: 'white !important',
                        WebkitPrintColorAdjust: 'exact', 
                        printColorAdjust: 'exact'
                    },
                    // 1. Rimuove filtri, bottoni di stampa e l'intera SideNav ereditata dal layout padre
                    '.no-print, nav, aside, [role="navigation"], .MuiDrawer-root, .w-full.flex-none': { 
                        display: 'none !important',
                        width: '0 !important',
                        height: '0 !important'
                    },
                    // 2. Distrugge l'h-screen e l'overflow hidden della dashboard che schiacciava tutto (Risolve bug immagine)
                    'div.flex.h-screen, .flex.h-screen, [class*="h-screen"], [class*="overflow-hidden"]': {
                        display: 'block !important',
                        height: 'auto !important',
                        minHeight: '0 !important',
                        overflow: 'visible !important'
                    },
                    // 3. Libera l'area scroll dei contenuti principali per espandersi su tutto il foglio
                    'div.flex-grow, .flex-grow, [class*="flex-grow"], [class*="overflow-y-auto"]': {
                        display: 'block !important',
                        height: 'auto !important',
                        overflow: 'visible !important',
                        padding: '0 !important',
                        margin: '0 !important',
                        width: '100% !important',
                        maxWidth: '100% !important'
                    },
                    // 4. Forza la pagina corrente a scorrere nativamente sul foglio A4 senza flex bloccanti
                    '.pagina-classifica-root': {
                        display: 'block !important',
                        height: 'auto !important',
                        minHeight: '0 !important',
                        padding: '0 !important',
                        margin: '0 !important',
                        backgroundColor: 'white !important'
                    },
                    // Evita interruzioni brutte a metà scheda se la stampa va su più pagine
                    '.MuiPaper-root': {
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid'
                    }
                }
            }} />
            
            <Typography variant={isMobile ? "h4" : "h2"} sx={{ textAlign: 'center', fontWeight: '800', color: '#1a237e', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                {giornoSelezionato === 0 ? "🏆 Classifica Generale" : `🏆 Classifica ${giornoSelezionato}ª Giornata`}
            </Typography>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', color: '#666', mb: 3, fontWeight: '500' }}>
                {giornoSelezionato === 0 ? "Totale cumulativo dei COPERTI (solo conti chiusi e pagati)" : `Dettaglio dei COPERTI serviti nella ${giornoSelezionato}ª giornata (solo conti chiusi e pagati)`}
            </Typography>

            {/* SELETTORE PERIODO */}
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <FormControl sx={{ minWidth: 280 }}>
                    <InputLabel id="select-giornata-label" sx={{ color: '#1a237e', fontWeight: '600' }}>Filtra per Periodo</InputLabel>
                    <Select
                        labelId="select-giornata-label"
                        value={giornoSelezionato}
                        label="Filtra per Periodo"
                        onChange={(e) => setGiornoSelezionato(Number(e.target.value))}
                        sx={{
                            bgcolor: 'white', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: '700', color: '#1a237e',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
                        }}
                    >
                        <MenuItem value={0} sx={{ fontWeight: 'bold', color: '#1a237e' }}>🌍 Classifica Generale</MenuItem>
                        <Divider sx={{ my: 0.5 }} />
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                            <MenuItem key={g} value={g}>{`📅 ${g}ª Giornata`}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* BARRA CONTROLLI E PULSANTE STAMPA */}
            <Paper className="no-print" sx={{ 
                p: 2, mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, 
                justifyContent: 'center', gap: { xs: 2, lg: 4 }, alignItems: 'center',
                maxWidth: 1000, width: '100%', mx: 'auto'
            }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    <FormControlLabel
                        control={<Switch checked={mostraGrafico} onChange={(e) => setMostraGrafico(e.target.checked)} color="info" />}
                        label={<Typography sx={{ fontWeight: 'bold', color: '#1a237e' }}>Grafico ad istogrammi</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch checked={soloPrimiDieci} onChange={(e) => setSoloPrimiDieci(e.target.checked)} color="primary" />}
                        label={<Typography sx={{ fontWeight: 'bold', color: '#333' }}>Primi 10</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch checked={nascondiCoperti} onChange={(e) => setNascondiCoperti(e.target.checked)} color="secondary" />}
                        label={<Typography sx={{ fontWeight: 'bold', color: '#333' }}>Nascondi numeri</Typography>}
                    />
                </Stack>
                
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />

                <Button 
                    variant="contained" 
                    startIcon={<PrintIcon />} 
                    onClick={() => window.print()}
                    sx={{ 
                        borderRadius: 3, px: 4, py: 1, bgcolor: '#1a237e', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5,
                        '&:hover': { bgcolor: '#0d1440' }
                    }}
                >
                    Stampa A4
                </Button>
            </Paper>

            {/* AREA DATI */}
            <Box sx={{ maxWidth: 800, width: '100%', mx: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={50} /></Box>
                ) : mostraGrafico ? (
                    
                    /* CLASSIFICA AD ISTOGRAMMI GRAPHICS */
                    <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
                        <Stack spacing={3}>
                            {datiVisualizzati.map((cameriere) => {
                                const isPrimo = cameriere.posizione === 1;
                                const isSecondo = cameriere.posizione === 2;
                                const isTerzo = cameriere.posizione === 3;
                                const isPodio = isPrimo || isSecondo || isTerzo;
                                const percentualeBarra = maxCoperti > 0 ? (cameriere.coperti / maxCoperti) * 100 : 0;

                                let barGradient = 'linear-gradient(90deg, #2196f3 0%, #00bcd4 100%)';
                                let icona = <PersonIcon sx={{ color: '#90a4ae', fontSize: 24 }} />;
                                let textColor = '#2c3e50';
                                let stileTestoPosizione = {};

                                if (isPrimo) {
                                    barGradient = 'linear-gradient(90deg, #ffb300 0%, #fbc02d 100%)';
                                    icona = <EmojiEventsIcon sx={{ color: '#fbc02d', fontSize: 32 }} />;
                                    textColor = '#b78103';
                                    stileTestoPosizione = { fontWeight: '900', fontSize: '1.3rem' };
                                } else if (isSecondo) {
                                    barGradient = 'linear-gradient(90deg, #78909c 0%, #b0bec5 100%)';
                                    icona = <MilitaryTechIcon sx={{ color: '#90a4ae', fontSize: 30 }} />;
                                    textColor = '#455a64';
                                    stileTestoPosizione = { fontWeight: '800', fontSize: '1.2rem' };
                                } else if (isTerzo) {
                                    barGradient = 'linear-gradient(90deg, #f4511e 0%, #ffb74d 100%)';
                                    icona = <MilitaryTechIcon sx={{ color: '#ffb74d', fontSize: 30 }} />;
                                    textColor = '#e65100';
                                    stileTestoPosizione = { fontWeight: '800', fontSize: '1.15rem' };
                                }

                                return (
                                    <Box key={`graph-${cameriere.nome}`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                                                    {icona}
                                                </Box>
                                                <Typography sx={{ color: textColor, textTransform: 'capitalize', ...stileTestoPosizione }}>
                                                    {cameriere.posizione}° {cameriere.nome.toLowerCase()}
                                                </Typography>
                                            </Stack>
                                            {!nascondiCoperti && (
                                                <Typography sx={{ fontWeight: '800', fontSize: isPodio ? '1.1rem' : '0.95rem', color: '#2c3e50' }}>
                                                    {cameriere.coperti} {cameriere.coperti === 1 ? 'coperto' : 'coperti'}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ width: '100%', bgcolor: '#edf0f2', borderRadius: '12px', height: isPodio ? 26 : 20, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                                            <Box sx={{ 
                                                width: `${percentualeBarra}%`, background: barGradient, height: '100%', borderRadius: '12px',
                                                printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
                                            }} />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Paper>
                ) : (
                    
                    /* CLASSIFICA A SCHEDE PREMIUM GRAPHICS */
                    <Stack spacing={1.5}>
                        {datiVisualizzati.map((cameriere) => {
                            const isPrimo = cameriere.posizione === 1;
                            const isSecondo = cameriere.posizione === 2;
                            const isTerzo = cameriere.posizione === 3;
                            const isPodio = isPrimo || isSecondo || isTerzo;

                            let bgColor = 'white';
                            let textColor = '#2c3e50';
                            let iconaPosizione = <PersonIcon sx={{ color: '#95a5a6' }} />;
                            let stileTestoPosizione = {};

                            if (isPrimo) {
                                bgColor = 'linear-gradient(90deg, #fff9c4 0%, #fffde7 100%)'; 
                                textColor = '#b78103';
                                iconaPosizione = <EmojiEventsIcon sx={{ color: '#fbc02d', fontSize: 32 }} />;
                                stileTestoPosizione = { fontWeight: '900', fontSize: '1.4rem' };
                            } else if (isSecondo) {
                                bgColor = 'linear-gradient(90deg, #cfd8dc 0%, #eceff1 100%)'; 
                                textColor = '#455a64';
                                iconaPosizione = <MilitaryTechIcon sx={{ color: '#90a4ae', fontSize: 30 }} />;
                                stileTestoPosizione = { fontWeight: '800', fontSize: '1.25rem' };
                            } else if (isTerzo) {
                                bgColor = 'linear-gradient(90deg, #ffe0b2 0%, #fff3e0 100%)'; 
                                textColor = '#e65100';
                                iconaPosizione = <MilitaryTechIcon sx={{ color: '#ffb74d', fontSize: 30 }} />;
                                stileTestoPosizione = { fontWeight: '800', fontSize: '1.2rem' };
                            }

                            return (
                                <Paper 
                                    key={`card-${cameriere.nome}`} 
                                    sx={{ 
                                        p: isPodio ? 2.5 : 1.8, background: bgColor, borderRadius: isPodio ? 4 : 2,
                                        boxShadow: isPodio ? '0 6px 15px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                                        border: isPodio ? `1px solid ${isPrimo ? '#fbc02d' : isSecondo ? '#b0bec5' : '#ffb74d'}` : '1px solid #e0e0e0',
                                        display: 'flex', alignItems: 'center',
                                        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
                                            {iconaPosizione}
                                            <Typography sx={{ ml: 0.5, color: textColor, ...stileTestoPosizione }}>
                                                {cameriere.posizione}°
                                            </Typography>
                                        </Box>
                                        <Divider orientation="vertical" flexItem sx={{ opacity: 0.6 }} />
                                        <Typography sx={{ fontSize: isPodio ? '1.25rem' : '1.05rem', fontWeight: isPodio ? 700 : 500, textTransform: 'capitalize' }}>
                                            {cameriere.nome.toLowerCase()}
                                        </Typography>
                                    </Stack>

                                    {!nascondiCoperti && (
                                        <Box sx={{ 
                                            px: 2, py: 0.8, borderRadius: '20px', 
                                            bgcolor: isPrimo ? '#fbc02d' : isSecondo ? '#b0bec5' : isTerzo ? '#ffb74d' : '#e0e0e0',
                                            color: isPrimo || isTerzo ? '#5d4037' : isSecondo ? '#263238' : '#424242',
                                            fontWeight: '800', fontSize: isPodio ? '1.1rem' : '0.95rem',
                                            printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
                                        }}>
                                            {cameriere.coperti} {cameriere.coperti === 1 ? 'Coperto' : 'Coperti'}
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
                
                {/* FALLBACK VUOTO */}
                {!loading && datiVisualizzati.length === 0 && (
                    <Typography sx={{ textAlign: 'center', color: '#999', mt: 4, fontStyle: 'italic' }}>
                        Nessun cameriere associato a conti chiusi per questo periodo.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}