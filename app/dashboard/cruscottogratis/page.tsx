'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CircularProgress from '@mui/material/CircularProgress';
import { listConsumazioniGratis, listContiGratis } from '@/app/lib/actions';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Typography, useMediaQuery, Alert, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, Divider, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';

// Icone intuitive per migliorare la UX
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

// Spostati FUORI dal componente Page per evitare ricalcoli inutili ad ogni render
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: "#2f6feb",
        color: "white",
        fontWeight: "bold",
        fontSize: 15,
    },
    [`&.${tableCellClasses.body}`]: {
        color: "#333",
        fontSize: 13,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

type RecordCruscotto = {
    giornata: string;
    incasso: number;
    incassopos: number;
    incassoconto1: number;
    incassoconto2: number;
    incassoconto3: number;
    incassoconto4: number;
    incassoconto5: number;
    incassoconto6: number;
    incassoconto7: number;
    incassoconto8: number;
    incassoconto9: number;
    consumazioni1: number;
    consumazioni2: number;
    consumazioni3: number;
    consumazioni4: number;
    consumazioni5: number;
    consumazioni6: number;
    consumazioni7: number;
    consumazioni8: number;
    consumazioni9: number;
    consumazionitot: number;
    consumazionipatatine: number;
    consumazionibirre: number;
    consumazioniagnolotti: number
};

function createData(
    giornata: string, incasso: number, incassopos: number, incassoconto1: number, incassoconto2: number,
    incassoconto3: number, incassoconto4: number, incassoconto5: number, incassoconto6: number,
    incassoconto7: number, incassoconto8: number, incassoconto9: number, consumazioni1: number,
    consumazioni2: number, consumazioni3: number, consumazioni4: number, consumazioni5: number,
    consumazioni6: number, consumazioni7: number, consumazioni8: number, consumazioni9: number,
    consumazionitot: number, consumazionipatatine: number, consumazionibirre: number, consumazioniagnolotti: number
) {
    return {
        giornata, incasso, incassopos, incassoconto1, incassoconto2, incassoconto3, incassoconto4,
        incassoconto5, incassoconto6, incassoconto7, incassoconto8, incassoconto9, consumazioni1,
        consumazioni2, consumazioni3, consumazioni4, consumazioni5, consumazioni6, consumazioni7,
        consumazioni8, consumazioni9, consumazionitot, consumazionipatatine, consumazionibirre, consumazioniagnolotti
    };
}

export default function Page() {
    const [phase, setPhase] = useState('caricamento');
    const [record, setRecord] = useState<RecordCruscotto[]>([]);
    const [allConsumazioni, setAllConsumazioni] = useState<any[]>([]); 
    const [selectedFoglietto, setSelectedFoglietto] = useState<number>(1); 
    const { data: session } = useSession();
    
    // Identifichiamo se lo schermo è un Mobile o Tablet per cambiare layout
    const isMobile = useMediaQuery('(max-width:1024px)'); 

    useEffect(() => {
        const fetchData = async () => {
            const initialRows = [
                "Giovedi - 1giorno", "Venerdì - 2giorno", "Sabato - 3giorno", "Domenica - 4giorno",
                "Lunedì - 5giorno", "Martedì - 6giorno", "Mercoledì - 7giorno", "Giovedì - 8giorno"
            ].map(day => createData(day, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));

            const [conti, cosumazioni] = await Promise.all([
                listContiGratis(),
                listConsumazioniGratis()
            ]);
            
            if (cosumazioni) {
                setAllConsumazioni(cosumazioni);
            }

            const updatedRows = initialRows.map((row, i) => {
                const giorno = i + 1;
                const getSum = (id?: number) => conti?.filter(c => c.giorno === giorno && (!id || c.id_comanda === id)).reduce((a, b) => a + b.totale, 0) || 0;
                const getCons = (id: number) => cosumazioni?.filter(c => c.giorno === giorno && c.id_comanda === id).reduce((a, b) => a + b.quantita, 0) || 0;

                return {
                    ...row,
                    incasso: getSum(),
                    incassoconto1: getSum(1), incassoconto2: getSum(2), incassoconto3: getSum(3),
                    incassoconto4: getSum(4), incassoconto5: getSum(5), incassoconto6: getSum(6),
                    incassoconto7: getSum(7), incassoconto8: getSum(8), incassoconto9: getSum(9),
                    consumazioni1: getCons(1), consumazioni2: getCons(2), consumazioni3: getCons(3),
                    consumazioni4: getCons(4), consumazioni5: getCons(5), consumazioni6: getCons(6),
                    consumazioni7: getCons(7), consumazioni8: getCons(8), consumazioni9: getCons(9),
                    consumazionitot: cosumazioni?.filter(c => c.giorno === giorno).reduce((a, b) => a + b.quantita, 0) || 0,
                    consumazionipatatine: cosumazioni?.filter(c => c.giorno === giorno && c.id_comanda === 1 && c.piatto === "Patatine fritte").reduce((a, b) => a + b.quantita, 0) || 0,
                    consumazionibirre: cosumazioni?.filter(c => c.giorno === giorno && c.id_comanda === 1 && c.piatto === 'Birra artigianale 0.4lt').reduce((a, b) => a + b.quantita, 0) || 0,
                    consumazioniagnolotti: cosumazioni?.filter(c => c.giorno === giorno && c.id_comanda === 1 && ['Agnolotti al burro e/o formaggio', "Agnolotti al vino", "Agnolotti al sugo"].includes(c.piatto)).reduce((a, b) => a + b.quantita, 0) || 0,
                };
            });
            setRecord(updatedRows);
            setPhase("caricato");
        };
        fetchData();
    }, []);

    if (session?.user?.name !== "SuperUser") {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2, maxWidth: 500, width: '100%' }}>
                    Violazione: utente non autorizzato ad accedere al cruscotto di sintesi.
                </Alert>
            </Box>
        );
    }

    if (phase === "caricamento") {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '80vh', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size="5rem" thickness={4} />
                <Typography variant="h6" sx={{ color: '#555', fontWeight: 500 }}>Sincronizzazione Conti gratis...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh', 
            width: '100%', 
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1600,
            margin: 'auto'
        }}>
            {/* Header statico ed elegante */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "h4" : "h2"} sx={{ fontWeight: 'bold', color: '#111', mb: 0.5 }}>
                    Sintesi Conti Gratis
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#666' }}>
                    Registrazioni speciali (Foglietti 1-9) esclusi dalla contabilità ordinaria
                </Typography>
            </Box>

            {/* BOX DEL TOTALE COMPLESSIVO SEMPRE IN EVIDENZA IN ALTO */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #2f6feb 0%, #1e4cb0 100%)', color: 'white', borderRadius: 3, boxShadow: 3 }}>
                <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CardMembershipIcon sx={{ fontSize: '2.5rem', opacity: 0.9 }} />
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 'bold', opacity: 0.8, letterSpacing: 1 }}>VALORE GENERALE RILASCIATO</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {record.reduce((a, b) => a + b.incasso, 0).toFixed(2)} €
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                            Consumazioni Erogate Totali: <b>{record.reduce((a, b) => a + b.consumazionitot, 0)}</b> pezzi
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* CAMBIO LAYOUT DINAMICO IN BASE ALLO SCHERMO */}
            {isMobile ? (
                /* --- INTERFACCIA SMARTPHONE / TABLET: ACCORDION LIST --- */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    
                    {/* BOX SELETTORE SU DUE RIGHE COMPATTE */}
                    <Box sx={{ backgroundColor: '#f4f7fe', p: 1.2, borderRadius: 3, border: '1px solid #e2ecf9', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1e4cb0', display: 'block', mb: 1, fontSize: '11.5px' }}>
                            🔎 Tocca il Foglietto per vederne i dettagli e i piatti erogati:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                <Button
                                    key={n}
                                    variant={selectedFoglietto === n ? "contained" : "outlined"}
                                    onClick={() => setSelectedFoglietto(n)}
                                    size="small"
                                    sx={{
                                        borderRadius: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        p: '4px 8px',
                                        minWidth: '65px',
                                        flexGrow: 1,
                                        boxShadow: selectedFoglietto === n ? 1 : 0,
                                        backgroundColor: selectedFoglietto === n ? '#2f6feb' : '#fff',
                                        color: selectedFoglietto === n ? '#fff' : '#2f6feb',
                                        borderColor: '#2f6feb',
                                        '&:hover': {
                                            backgroundColor: selectedFoglietto === n ? '#1e4cb0' : '#f0f4ff',
                                        }
                                    }}
                                >
                                    {n === 1 ? 'Fogl. 1 (Cam.)' : `Fogl. ${n}`}
                                </Button>
                            ))}
                        </Box>
                    </Box>

                    {record.map((row, index) => {
                        const giorno = index + 1;
                        
                        const currentIncasso = (row as any)[`incassoconto${selectedFoglietto}`];
                        const currentConsumazioniTot = (row as any)[`consumazioni${selectedFoglietto}`];
                        
                        const currentBirre = allConsumazioni?.filter(c => c.giorno === giorno && c.id_comanda === selectedFoglietto && c.piatto === 'Birra artigianale 0.4lt').reduce((a, b) => a + b.quantita, 0) || 0;
                        const currentPatatine = allConsumazioni?.filter(c => c.giorno === giorno && c.id_comanda === selectedFoglietto && c.piatto === "Patatine fritte").reduce((a, b) => a + b.quantita, 0) || 0;
                        const currentAgnolotti = allConsumazioni?.filter(c => c.giorno === giorno && c.id_comanda === selectedFoglietto && ['Agnolotti al burro e/o formaggio', "Agnolotti al vino", "Agnolotti al sugo"].includes(c.piatto)).reduce((a, b) => a + b.quantita, 0) || 0;

                        return (
                            <Accordion key={row.giornata} sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 1, overflow: 'hidden' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#2f6feb' }} />} sx={{ backgroundColor: '#fcfdfe' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2, alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarMonthIcon sx={{ color: '#555', fontSize: '1.2rem' }} />
                                            <Typography sx={{ fontWeight: 'bold', color: '#222' }}>{row.giornata.split(' - ')[0]}</Typography>
                                        </Box>
                                        <Typography sx={{ fontWeight: 'bold', color: '#2f6feb', fontSize: '1.1rem' }}>
                                            {row.incasso.toFixed(2)} €
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ backgroundColor: '#fff', p: 2, borderTop: '1px solid #eee' }}>
                                    <Grid container spacing={1.5}>
                                        
                                        <Grid size={12}>
                                            <Box sx={{ p: 1.5, backgroundColor: '#f0f4ff', borderRadius: 2, borderLeft: '4px solid #2f6feb' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e4cb0' }}>
                                                    Foglietto {selectedFoglietto} {selectedFoglietto === 1 ? '(Camerieri)' : ''}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{currentIncasso.toFixed(2)} €</Typography>
                                                    <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '13px' }}>
                                                        ({currentConsumazioniTot} consumazioni)
                                                    </Typography>
                                                </Box>
                                                
                                                <Divider sx={{ my: 0.5 }} />
                                                <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                                    Birre: {currentBirre} | Patatine: {currentPatatine} | Agnolotti: {currentAgnolotti}
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* GLI ALTRI FOGLIETTI RESTANTI */}
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                                            if (n === selectedFoglietto) return null; 
                                            const valoreFoglietto = (row as any)[`incassoconto${n}`];
                                            if (valoreFoglietto === 0) return null; 
                                            return (
                                                <Grid size={{ xs: 6, sm: 4 }} key={n}>
                                                    <Box sx={{ p: 1, backgroundColor: '#f9f9f9', borderRadius: 2, border: '1px solid #eef2f6' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold', display: 'block' }}>Fogl. {n}</Typography>
                                                        
                                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{valoreFoglietto.toFixed(2)} €</Typography>
                                                            <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                                                ({(row as any)[`consumazioni${n}`]})
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            ) : (
                /* --- INTERFACCIA PC DESKTOP: MAXI TABELLA DETTAGLIATA STICKY --- */
                <TableContainer component={Paper} sx={{ 
                    flexGrow: 1, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    borderRadius: 3,
                    border: '1px solid #eef2f6',
                    overflowY: 'auto'
                }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
                        <TableHead>
                            <TableRow>
                     <StyledTableCell sx={{ 
                                    position: 'sticky', 
                                    left: 0, 
                                    zIndex: 3, 
                                    backgroundColor: '#2f6feb',
                                    boxShadow: '4px 0 8px -3px rgba(0,0,0,0.2)',
                                    width: 120,
                                    minWidth: 120,
                                    maxWidth: 120,
                                    px: 1,
                                    textAlign: 'center'
                                }}>
                                    GIORNATA
                                </StyledTableCell>
                                    <StyledTableCell align="right" sx={{ backgroundColor: '#1e4cb0' }}>TOTALE</StyledTableCell>
                                    <StyledTableCell align="center" sx={{ backgroundColor: '#eef4ff', color: '#1e4cb0', borderLeft: '2px solid #b2cdff', borderRight: '2px solid #b2cdff' }}>
                                        Foglietto 1 <br /> <small>(Camerieri)</small>
                                    </StyledTableCell>
                                    {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                        <StyledTableCell key={n} align="right">Foglietto {n}</StyledTableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                        <TableBody>
                            {record.map((row) => (
                                <StyledTableRow key={row.giornata}>
                                    {/* MODIFICATO: Colonna del Giorno bloccata a sinistra con colore solido e ombra */}
                                    <StyledTableCell sx={{ 
                                        fontWeight: 'bold', 
                                        color: '#444',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 1,
                                        backgroundColor: '#fff', // Sfondo bianco pieno per non far intravedere i dati sotto
                                        boxShadow: '4px 0 8px -4px rgba(0,0,0,0.15)', // Sottile linea d'ombra verticale
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {row.giornata}
                                    </StyledTableCell>
                                    
                                    <StyledTableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e4cb0' }}>
                                        {row.incasso.toFixed(2)} €
                                    </StyledTableCell>
                                    
                                    {/* CELLA PC - FOGLIETTO 1: COSTO E N.CONS IN RIGA */}
                                    <StyledTableCell align="center" sx={{ backgroundColor: '#f7f9ff', borderLeft: '2px solid #d0e0ff', borderRight: '2px solid #d0e0ff', minWidth: 100 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#111' }}>
                                                {row.incassoconto1.toFixed(2)} €
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                                ({row.consumazioni1} cons.)
                                            </Typography>
                                        </Box>
                                        
                                        {/* Box elenco prodotti per esteso */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, alignItems: 'flex-start', backgroundColor: '#fff', p: 0.8, borderRadius: 1.5, border: '1px solid #e5edff', width: 'fit-content', mx: 'auto' }}>
                                            <Typography variant="caption" sx={{ fontSize: '11px', color: '#444' }}>🍺 <b>Birre:</b> {row.consumazionibirre}</Typography>
                                            <Typography variant="caption" sx={{ fontSize: '11px', color: '#444' }}>🍟 <b>Patatine:</b> {row.consumazionipatatine}</Typography>
                                            <Typography variant="caption" sx={{ fontSize: '11px', color: '#444' }}>🍝 <b>Agnolotti:</b> {row.consumazioniagnolotti}</Typography>
                                        </Box>
                                    </StyledTableCell>
                                    
                                    {/* RESTANTI FOGLIETTI PC (2-9): COSTO E N.CONS IN RIGA */}
                                    {[2, 3, 4, 5, 6, 7, 8, 9].map(n => {
                                        const val = (row as any)[`incassoconto${n}`];
                                        return (
                                            <StyledTableCell key={n} align="right" sx={{ opacity: val === 0 ? 0.4 : 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: val > 0 ? 'bold' : 'normal' }}>
                                                        {val.toFixed(2)} €
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: val > 0 ? 'bold' : 'normal', fontSize: '11px' }}>
                                                        ({(row as any)[`consumazioni${n}`]})
                                                    </Typography>
                                                </Box>
                                            </StyledTableCell>
                                        );
                                    })}
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}