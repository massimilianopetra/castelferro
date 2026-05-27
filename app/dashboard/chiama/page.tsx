'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton,
    TableSortLabel, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Stack,
    FormControlLabel,
    Switch
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChairIcon from '@mui/icons-material/Chair';
import InfoIcon from '@mui/icons-material/Info';
import useMediaQuery from '@mui/material/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion'; // <--- Importiamo framer-motion

import {
    getTickets,
    updateTickets,
    deleteTicket,
    getStimaAttesa,
    getPuntiGraficoAttesa
} from '@/app/lib/actions';

type Order = 'asc' | 'desc';

export default function ChiamaPage() {
    const isMobile = useMediaQuery('(max-width:600px)');

    // --- STATI PRINCIPALI ---
    const [numeroAttuale, setNumeroAttuale] = useState(0);
    const [lista, setLista] = useState<any[]>([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showActions, setShowActions] = useState(true);

    // --- STATI ORDINAMENTO E MEMORIA ---
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<'id' | 'numpersone'>('id');
    const [chiamatiMemory, setChiamatiMemory] = useState<Set<number>>(new Set());

    // --- STATI PER STIMA, GRAFICO E CONTROLLO ---
    const [stima, setStima] = useState<number | null>(null);
    const [openInfo, setOpenInfo] = useState(false);
    const [puntiGrafico, setPuntiGrafico] = useState<any[]>([]);
    const [disabilitaStatistiche, setDisabilitaStatistiche] = useState(false);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    // --- FUNZIONI DI CARICAMENTO DATI ---
    const fetchDati = async () => {
        try {
            const tickets = await getTickets('non-seduti');
            if (tickets) setLista(tickets);
        } catch (error) {
            console.error("Errore nel caricamento tickets:", error);
        }
    };

    const caricaStatistiche = async () => {
        if (disabilitaStatistiche) return;

        try {
            const resStima = await getStimaAttesa();
            if (resStima?.success) setStima(resStima.media ?? null);

            const puntos = await getPuntiGraficoAttesa();
            if (puntos) {
                setPuntiGrafico(puntos.map(p => {
                    const data = new Date(Number(p.slot));
                    const ore = data.getHours().toString().padStart(2, '0');
                    const minutiOra = data.getMinutes().toString().padStart(2, '0');
                    return {
                        ora: `${ore}:${minutiOra}`,
                        minuti: Math.round(Number(p.attesa_media))
                    };
                }));
            }
        } catch (error) {
            console.error("Errore statistiche:", error);
        }
    };

    // --- LOGICA SINCRONIZZAZIONE (SSE E INTERVAL) ---
    useEffect(() => {
        fetchDati();

        if (!disabilitaStatistiche) {
            caricaStatistiche();
        }

        let es: EventSource | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            es = new EventSource('/api/next-client');

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);

                    if (payload.type === 'NEW_TICKET') {
                        if (payload.ticket) {
                            setLista(prev => {
                                if (prev.find(t => t.id === payload.ticket.id)) return prev;
                                return [...prev, payload.ticket];
                            });
                        }
                        if (!disabilitaStatistiche) caricaStatistiche();
                    }

                    if (payload.type === 'REFRESH_TABLE') {
                        fetchDati();
                        if (!disabilitaStatistiche) caricaStatistiche();
                    }
                    if (payload.type === 'CALL_NUMBER') setNumeroAttuale(payload.numero);
                } catch (err) {
                    console.error("Errore parsing SSE:", err);
                }
            };

            es.onerror = () => {
                if (es) es.close();
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        const intervalStats = setInterval(() => {
            if (!disabilitaStatistiche) caricaStatistiche();
        }, 300000);

        return () => {
            if (es) es.close();
            clearTimeout(reconnectTimeout);
            clearInterval(intervalStats);
        };
    }, [disabilitaStatistiche]);

    // --- LOGICA DI ORDINAMENTO ---
    const handleRequestSort = (property: 'id' | 'numpersone') => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedLista = useMemo(() => {
        return [...lista].sort((a, b) => {
            let valA = a[orderBy] || 0;
            let valB = b[orderBy] || 0;
            if (order === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
    }, [lista, order, orderBy]);

    // --- GESTORI AZIONI ---
    const handleChiamaTicket = async (ticket: any) => {
        try {
            setChiamatiMemory(prev => new Set(prev).add(ticket.id));
            setNumeroAttuale(ticket.id);
            await updateTickets({ ...ticket, seduto: 0, data_chiamato: ticket.data_chiamato || Date.now() });

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'CALL_NUMBER', numero: ticket.id }),
            });
            if (!disabilitaStatistiche) caricaStatistiche();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSiediTicket = async (ticket: any) => {
        try {
            // Rimuoviamo immediatamente dalla lista locale per far scattare l'animazione di uscita
            setLista(prev => prev.filter(t => t.id !== ticket.id));
            
            await updateTickets({ ...ticket, seduto: 1, data_chiamato: ticket.data_chiamato || Date.now() });

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SET_SITTING', numero: ticket.id }),
            });
            if (!disabilitaStatistiche) caricaStatistiche();
        } catch (error) {
            console.error(error);
            fetchDati();
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTicket) return;
        try {
            const idDaRimuovere = selectedTicket.id;
            setLista(prev => prev.filter(t => t.id !== idDaRimuovere));
            setOpenDeleteDialog(false);

            await deleteTicket(idDaRimuovere);
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SET_SITTING', numero: idDaRimuovere }),
            });
            if (!disabilitaStatistiche) caricaStatistiche();
        } catch (error) {
            console.error(error);
            fetchDati();
        }
    };

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', maxHeight: '100%', width: '100%',
            bgcolor: '#f4f6f8', 
            pt: isMobile ? 1 : 2,
            px: isMobile ? 1 : 2,
            pb: '5%', // <--- Lascia esattamente il 5% di spazio vuoto sotto in modo dinamico
            boxSizing: 'border-box', overflow: 'hidden', position: 'relative'
        }}>

            {/* --- WIDGET STIMA ATTESA --- */}
            {!disabilitaStatistiche && (
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon sx={{ display: { xs: 'none', sm: 'inherit' } }} />}
                        onClick={() => setOpenInfo(true)}
                        sx={{
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            bgcolor: 'white',
                            minWidth: { xs: 'auto', sm: '64px' }
                        }}
                    >
                        {stima !== null ? `Attesa: ~${stima} min` : "Stima..."}
                    </Button>
                </Box>
            )}

            <Box sx={{ textAlign: 'center', mb: isMobile ? 0.5 : 1, flexShrink: 0 }}>
                <Typography sx={{ color: '#666', fontWeight: 900, fontSize: '0.8rem' }}>
                    ULTIMO CHIAMATO
                </Typography>
                <Typography sx={{
                    fontSize: isMobile ? '4.5rem' : '7rem',
                    fontWeight: 1000, color: '#1976d2',
                    fontFamily: 'monospace', lineHeight: 1
                }}>
                    {numeroAttuale || '—'}
                </Typography>
            </Box>

            {/* --- CONTROLLI SETTING --- */}
            <Box sx={{ width: '100%', maxWidth: '900px', mx: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 0.5, flexShrink: 0 }}>
                <FormControlLabel
                    control={<Switch checked={showActions} onChange={(e) => setShowActions(e.target.checked)} color="primary" size="small" />}
                    label={<Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Funzioni extra</Typography>}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={disabilitaStatistiche}
                            onChange={(e) => {
                                setDisabilitaStatistiche(e.target.checked);
                                if (e.target.checked) setStima(null);
                            }}
                            color="warning"
                            size="small"
                        />
                    }
                    label={<Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Off Statistiche</Typography>}
                />
            </Box>

            {/* --- TABELLA TICKET --- */}
            <TableContainer component={Paper} sx={{
                maxWidth: '900px', width: '100%', mx: 'auto',
                flexGrow: 1, minHeight: 0, borderRadius: '12px',
                overflowY: 'auto', boxShadow: 3
            }}>
                <Table
                    stickyHeader
                    size="small"
                    sx={{
                        tableLayout: isMobile ? 'fixed' : 'auto',
                        width: '100%'
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 900, px: { xs: 1, sm: 2 }, width: { xs: '80px', sm: 'auto' } }}>
                                <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                                    Ticket
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, px: { xs: 1, sm: 2 }, width: { xs: '70px', sm: 'auto' } }}>
                                <TableSortLabel
                                    active={orderBy === 'numpersone'}
                                    direction={orderBy === 'numpersone' ? order : 'asc'}
                                    onClick={() => handleRequestSort('numpersone')}
                                >
                                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Cop.</Box>
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Coperti</Box>
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, px: { xs: 1, sm: 2 } }} align="right">Azioni</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* AnimatePresence gestisce le righe che spariscono dal DOM */}
                        <AnimatePresence initial={false}>
                            {sortedLista.map((row) => {
                                let btnColor = "#2e7d32"; let textColor = "#fff";
                                if (chiamatiMemory.has(row.id)) { btnColor = "#ed6c02"; }
                                else if (numeroAttuale > 0 && row.id < numeroAttuale) { btnColor = "#ffeb3b"; textColor = "#000"; }

                                return (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        component={motion.tr} // Forza la riga ad essere un componente animabile
                                        layout // Gestisce lo scorrimento verso l'alto fluido degli altri record
                                        initial={{ opacity: 1 }}
                                        exit={{
                                            opacity: [1, 0.1, 0], // Crea l'effetto "flash" abbassando e azzerando l'opacità
                                            backgroundColor: 'rgba(46, 125, 50, 0.15)', // Tocco visivo verde durante l'uscita
                                            height: 0,
                                            transition: {
                                                opacity: { duration: 0.25 },
                                                height: { duration: 0.25, delay: 0.05 },
                                                backgroundColor: { duration: 0.15 }
                                            }
                                        }}
                                        transition={{ 
                                            layout: { type: 'tween', duration: 0.1, ease: 'easeOut' }
                                        }}
                                    >
                                        <TableCell sx={{
                                            fontSize: isMobile ? '1.4rem' : '2rem',
                                            fontWeight: 1000,
                                            color: '#1976d2',
                                            fontFamily: 'monospace',
                                            px: { xs: 1, sm: 2 }
                                        }}>
                                            {row.id}
                                        </TableCell>
                                        <TableCell sx={{
                                            fontSize: isMobile ? '1.1rem' : '1.8rem',
                                            px: { xs: 1, sm: 2 }
                                        }}>
                                            {row.numpersone}
                                        </TableCell>
                                        <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>
                                            <Stack direction="row" spacing={isMobile ? 0.5 : 1} justifyContent="flex-end">
                                                <Button
                                                    variant="contained" size="medium"
                                                    onClick={() => handleChiamaTicket(row)}
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        bgcolor: btnColor,
                                                        color: textColor,
                                                        minWidth: isMobile ? '45px' : '100px',
                                                        '&:hover': { bgcolor: btnColor, opacity: 0.9 }
                                                    }}
                                                >
                                                    <CampaignIcon fontSize="medium" />
                                                    <Typography component="span" sx={{ fontSize: isMobile ? '0.9rem' : '1rem', ml: 1 }}>Chiama</Typography>
                                                </Button>
                                                {showActions && (
                                                    <>
                                                        <Button
                                                            variant="contained" size="small" color="primary"
                                                            component={motion.button} // Effetto "tattile" al click solo su ENTRA
                                                            whileTap={{ scale: 0.92 }} 
                                                            onClick={() => handleSiediTicket(row)}
                                                            sx={{ fontWeight: 'bold', minWidth: isMobile ? '45px' : '100px' }}
                                                        >
                                                            <ChairIcon fontSize="medium" />
                                                            <Typography component="span" sx={{ fontSize: isMobile ? '0.9rem' : '1rem', ml: 1 }}>Entra</Typography>
                                                        </Button>
                                                        <IconButton 
                                                            color="error" 
                                                            size="large" 
                                                            onClick={() => { setSelectedTicket(row); setOpenDeleteDialog(true); }} 
                                                            sx={{ border: '1px solid', borderRadius: '8px', p: isMobile ? 1 : 'default' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- MODALE GRAFICO --- */}
            {!disabilitaStatistiche && (
                <Dialog open={openInfo} onClose={() => setOpenInfo(false)} fullWidth maxWidth="xs">
                    <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>ANDAMENTO ATTESA</DialogTitle>
                    <DialogContent>
                        <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 150, mt: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
                            {puntiGrafico.length > 0 ? puntiGrafico.map((p, i) => (
                                <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>{p.minuti}'</Typography>
                                    <Box sx={{
                                        width: '100%',
                                        height: `${Math.min(p.minuti * 2, 120)}px`,
                                        bgcolor: '#1976d2',
                                        borderRadius: '2px 2px 0 0',
                                        transition: 'height 0.5s ease'
                                    }} />
                                    <Typography sx={{ fontSize: '0.5rem', mt: 0.5 }}>{p.ora}</Typography>
                                </Box>
                            )) : (
                                <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', pb: 5 }}>Dati non sufficienti</Typography>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenInfo(false)}>CHIUDI</Button></DialogActions>
                </Dialog>
            )}

            {/* --- MODALE ELIMINA --- */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>ELIMINA TICKET</DialogTitle>
                <DialogContent><DialogContentText>Vuoi eliminare il ticket {selectedTicket?.id}?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>NO</Button>
                    <Button onClick={handleConfirmDelete} color="error">SI, ELIMINA</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}