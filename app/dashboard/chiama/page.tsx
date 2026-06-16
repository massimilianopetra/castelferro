'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react'; // 1. Importa useSession
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
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChairIcon from '@mui/icons-material/Chair';
import InfoIcon from '@mui/icons-material/Info';
import useMediaQuery from '@mui/material/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';

import {
    getTickets,
    updateTickets,
    updateTicket,
    getStimaAttesa,
    getPuntiGraficoAttesa, getStatoContiStats, getGiornoSagra
} from '@/app/lib/actions';
import { useConfig } from '@/context/ConfigContext'; // <-- Importazione del Context globale

type Order = 'asc' | 'desc';

export default function Chiama() {
    const { data: session } = useSession(); // 2. Recupera sessione
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
    const [showNote, setShowNote] = useState(true);

    // === NUOVI STATES PER STATO CONTI ===
    const [sagra, setSagra] = useState<any>({ stato: 'CHIUSA', giornata: 1 });
    const [openStatoConti, setOpenStatoConti] = useState(false);
    const [statsConti, setStatsConti] = useState<{
        totale: number, antipasti: number, primi: number, birre: number, bevande: number,
        secondi: number, dolci: number, stampati: number, casse: number
    } | null>(null);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const authorizedNames = [
        "IngressoE",
        "SuperUser"
    ];

    const isAuthorizedUser = authorizedNames.includes(session?.user?.name ?? "");

    // Svuota i dati temporanei locali se la configurazione centrale disabilita le statistiche
    useEffect(() => {
        if (!isAuthorizedUser) {
            setStima(null);
            setStatsConti(null);
        }
    }, [isAuthorizedUser]);

    // --- FUNZIONI DI CARICAMENTO DATI ---
    const fetchDati = async () => {
        try {
            const tickets = await getTickets('non-seduti');
            if (tickets) setLista(tickets.filter((t: any) => t.caricato !== 100));
        } catch (error) {
            console.error("Errore nel caricamento tickets:", error);
        }
    };

    // Carica lo stato della sagra all'avvio
    useEffect(() => {
        const fetchSagra = async () => {
            const gg = await getGiornoSagra();
            if (gg) setSagra(gg);
        };
        fetchSagra();
    }, []);

    // Gestione apertura modale Stato Conti
    const handleOpenStatoConti = async () => {
        if (!isAuthorizedUser) return;

        setOpenStatoConti(true);
        if (sagra.stato !== 'CHIUSA') {
            const dati = await getStatoContiStats(sagra.giornata);
            if (dati) setStatsConti(dati);
        }
    };

    const caricaStatistiche = async () => {
        if (!isAuthorizedUser) return;

        try {
            const resStima = await getStimaAttesa();
            if (resStima?.success) setStima(resStima.media ?? null);

            const puntos = await getPuntiGraficoAttesa();
            if (puntos) {
                setPuntiGrafico(puntos.map(p => {
                    const data = new Date(Number(p.slot));
                    const ore = data.getHours().toString().padStart(2, '0');
                    const minutes = data.getMinutes().toString().padStart(2, '0');
                    return {
                        ora: `${ore}:${minutes}`,
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

        if (isAuthorizedUser) {
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
                        if (payload.ticket && payload.ticket.caricato !== 100) {
                            setLista(prev => {
                                if (prev.find(t => t.id === payload.ticket.id)) return prev;
                                return [...prev, payload.ticket];
                            });
                        }
                        if (isAuthorizedUser) caricaStatistiche();
                    }

                    if (payload.type === 'REFRESH_TABLE') {
                        fetchDati();
                        if (isAuthorizedUser) caricaStatistiche();
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
            if (isAuthorizedUser) caricaStatistiche();
        }, 300000);

        return () => {
            if (es) es.close();
            clearTimeout(reconnectTimeout);
            clearInterval(intervalStats);
        };
    }, [isAuthorizedUser]);

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
        // [MODIFICA/CHIAMA] Controllo se il numero c'è o se è impostato a 100
        if (!ticket || !ticket.id || ticket.caricato === 100) {
            setSnackbar({
                open: true,
                message: "Impossibile chiamare il ticket: il numero è inesistente o è stato annullato (Codice 100).",
                severity: 'error'
            });
            return;
        }

        try {
            setChiamatiMemory(prev => new Set(prev).add(ticket.id));
            setNumeroAttuale(ticket.id);
            await updateTickets({ ...ticket, seduto: 0, data_chiamato: ticket.data_chiamato || Date.now() });

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'CALL_NUMBER', numero: ticket.id }),
            });
            if (isAuthorizedUser) caricaStatistiche();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSiediTicket = async (ticket: any) => {
        // [UNISCI/ENTRA] Controllo se il numero c'è o se è impostato a 100
        if (!ticket || !ticket.id || ticket.caricato === 100) {
            setSnackbar({
                open: true,
                message: "Impossibile far entrare il ticket: numero mancante o record annullato (Codice 100).",
                severity: 'error'
            });
            return;
        }

        try {
            setLista(prev => prev.filter(t => t.id !== ticket.id));
            await updateTickets({ ...ticket, seduto: 1, data_chiamato: ticket.data_chiamato || Date.now() });

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SET_SITTING', numero: ticket.id }),
            });
            if (isAuthorizedUser) caricaStatistiche();
        } catch (error) {
            console.error(error);
            fetchDati();
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTicket) return;

        // [ELIMINA] Controllo se il numero c'è o se è già stato impostato a 100
        if (!selectedTicket.id || selectedTicket.caricato === 100) {
            setSnackbar({
                open: true,
                message: "Impossibile eliminare: il ticket non esiste o risulta già annullato con Codice 100.",
                severity: 'error'
            });
            setOpenDeleteDialog(false);
            return;
        }

        try {
            const idDaRimuovere = selectedTicket.id;
            setLista(prev => prev.filter(t => t.id !== idDaRimuovere));
            setOpenDeleteDialog(false);

            await updateTicket(idDaRimuovere, 100);

            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'REFRESH_TABLE' }),
            });
            if (isAuthorizedUser) caricaStatistiche();

            setSnackbar({
                open: true,
                message: `Ticket ${idDaRimuovere} eliminato correttamente (Annullato con codice 100).`,
                severity: 'success'
            });
        } catch (error) {
            console.error(error);
            fetchDati();
        }
    };

    if ((session?.user?.name === "IngressoE") || (session?.user?.name === "Ingresso") || (session?.user?.name === "SuperUser")) {

        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                maxHeight: '100dvh',
                width: '100%',
                bgcolor: '#f4f6f8',
                pt: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 12px)' : 3,
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* --- STATO CONTI E BENVENUTO (TOP-LEFT) --- */}
                {isAuthorizedUser && (
                    <Box sx={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button
                            variant="outlined" color="secondary"
                            startIcon={<AccessTimeFilledIcon sx={{ display: { xs: 'none', sm: 'inherit' } }} />}
                            size="small"
                            onClick={handleOpenStatoConti}
                            sx={{ fontWeight: 'bold', borderRadius: '15px' }}
                        >
                            Stato conti
                        </Button>
                    </Box>
                )}

                {/* --- WIDGET STIMA ATTESA --- */}
                {isAuthorizedUser && (
                    <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<InfoIcon sx={{ display: { xs: 'none', sm: 'inherit' } }} />}
                            onClick={() => setOpenInfo(true)}
                            sx={{ fontWeight: 'bold', borderRadius: '15px' }}
                        >
                            {stima !== null ? `Attesa: ~${stima} min` : "Stima attesa"}
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

                {/* --- CONTROLLI SETTING (Mantiene solo le azioni extra) --- */}
                <Box sx={{ width: '100%', maxWidth: '900px', mx: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 0.5, flexShrink: 0 }}>
                    <FormControlLabel
                        control={<Switch checked={showActions} onChange={(e) => setShowActions(e.target.checked)} color="primary" size="small" />}
                        label={<Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Funzioni extra</Typography>}
                    />
                </Box>

                {/* --- TABELLA TICKET --- */}
                <TableContainer component={Paper} sx={{
                    maxWidth: '900px',
                    width: '100%',
                    mx: 'auto',
                    flexGrow: 1,
                    minHeight: 0,
                    maxHeight: isMobile ? 'calc(100dvh - 230px)' : 'calc(100vh - 310px)',
                    borderRadius: '12px',
                    overflowY: 'auto',
                    boxShadow: 3
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
                            <AnimatePresence initial={false}>
                                {sortedLista.map((row) => {
                                    let btnColor = "#2e7d32"; let textColor = "#fff";
                                    if (chiamatiMemory.has(row.id)) { btnColor = "#ed6c02"; }
                                    else if (numeroAttuale > 0 && row.id < numeroAttuale) { btnColor = "#ffeb3b"; textColor = "#000"; }

                                    return (
                                        <TableRow
                                            key={row.id}
                                            hover
                                            component={motion.tr}
                                            layout
                                            initial={{ opacity: 1 }}
                                            exit={{
                                                opacity: [1, 0.1, 0],
                                                backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                                height: 0,
                                                transition: {
                                                    opacity: { duration: 0.08 },
                                                    height: { duration: 0.08 },
                                                    backgroundColor: { duration: 0.05 }
                                                }
                                            }}
                                            transition={{
                                                layout: { type: 'tween', duration: 0.08, ease: 'easeOut' }
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
                                                                component={motion.button}
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

                {/* MODALE STATO CONTI */}
                <Dialog open={openStatoConti} onClose={() => setOpenStatoConti(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>STATO CONTI IN ELABORAZIONE</DialogTitle>
                    <DialogContent>
                        {sagra.stato === 'CHIUSA' || !statsConti || statsConti.totale === 0 ? (
                            <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', pb: 5, mt: 4 }}>Dati non sufficienti o sagra ancora chiusa</Typography>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                {showNote && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            bgcolor: '#e3f2fd',
                                            color: '#0d47a1',
                                            p: 1.5,
                                            mb: 3,
                                            borderRadius: '6px',
                                            border: '1px solid #bbdefb',
                                            fontSize: '0.72rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        <Box>
                                            Un conto è considerato "birre" o "bevande": solo se il conto non ha nient'altro di attivo nei reparti principali (antipasti, primi, secondi, dolci).
                                            <br />
                                            Un conto è considerato "casse": sia se è stato fatto in cassa  oppure se è stato modificato in cassa. In entrambi i casi sta per essere stampato.
                                        </Box>
                                        <Box
                                            onClick={() => setShowNote(false)}
                                            sx={{
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                pl: 2,
                                                fontSize: '0.85rem',
                                                color: '#1565c0',
                                                '&:hover': { color: '#0d47a1' },
                                                userSelect: 'none'
                                            }}
                                        >
                                            ✕
                                        </Box>
                                    </Box>
                                )}

                                <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: '#1976d2', fontWeight: 900 }}>
                                    Totale Conti in Transito: {statsConti.totale}
                                </Typography>

                                <Stack direction="row" spacing={2} alignItems="stretch" sx={{ height: 230, px: 0.5 }}>
                                    <Box sx={{ flex: 5, bgcolor: 'rgba(25, 118, 210, 0.04)', borderRadius: '8px', p: 1.5, border: '1px dashed #1976d2', display: 'flex', flexDirection: 'column' }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1976d2', textAlign: 'center', mb: 1, letterSpacing: 1 }}>
                                            CONTI APERTI: {(statsConti.casse || 0) + (statsConti.bevande || 0) + (statsConti.birre || 0) + (statsConti.antipasti || 0) + (statsConti.primi || 0) + (statsConti.secondi || 0) + (statsConti.dolci || 0)}
                                        </Typography>
                                        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1} sx={{ flex: 1, borderBottom: '2px solid #ddd', pb: 1 }}>
                                            {[
                                                { label: 'Bevande', val: (statsConti.bevande || 0), color: '#9e9e9e' },
                                                { label: 'Birre', val: (statsConti.birre || 0), color: '#9e9e9e' },
                                                { label: 'Antipasti', val: statsConti.antipasti || 0, color: '#ff9800' },
                                                { label: 'Primi', val: statsConti.primi || 0, color: '#f44336' },
                                                { label: 'Secondi', val: statsConti.secondi || 0, color: '#795548' },
                                                { label: 'Dolci', val: statsConti.dolci || 0, color: '#9c27b0' },
                                                { label: 'Casse', val: statsConti.casse || 0, color: '#003153' },
                                            ].map((col, i) => {
                                                const percentuale = Math.round((col.val / statsConti.totale) * 100) || 0;
                                                return (
                                                    <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.62rem' }}>{percentuale}%</Typography>
                                                        <Box sx={{ width: '100%', maxWidth: '38px', height: `${Math.max(percentuale * 1.2, 2)}px`, bgcolor: col.color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                                                        <Typography noWrap sx={{ fontSize: '0.62rem', mt: 1, fontWeight: 'bold', color: col.label === 'Bevande' ? '#757575' : 'inherit' }}>{col.label}</Typography>
                                                        <Typography sx={{ fontSize: '0.6rem', color: '#666' }}>({col.val})</Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>

                                    <Box sx={{ flex: 1.3, bgcolor: 'rgba(76, 175, 80, 0.04)', borderRadius: '8px', p: 1.5, border: '1px dashed #4caf50', display: 'flex', flexDirection: 'column' }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4caf50', textAlign: 'center', mb: 1, letterSpacing: 1 }}>STAMPATI</Typography>
                                        <Stack direction="row" alignItems="flex-end" justifyContent="center" sx={{ flex: 1, borderBottom: '2px solid #ddd', pb: 1 }}>
                                            {(() => {
                                                const percentuale = Math.round(((statsConti.stampati || 0) / statsConti.totale) * 100) || 0;
                                                return (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.65rem' }}>{percentuale}%</Typography>
                                                        <Box sx={{ width: '100%', maxWidth: '45px', height: `${Math.max(percentuale * 1.2, 2)}px`, bgcolor: '#4caf50', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                                                        <Typography sx={{ fontSize: '0.62rem', mt: 1, fontWeight: 'bold' }}>Stampati</Typography>
                                                        <Typography sx={{ fontSize: '0.6rem', color: '#666' }}>({statsConti.stampati || 0})</Typography>
                                                    </Box>
                                                );
                                            })()}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button variant="outlined" onClick={() => setOpenStatoConti(false)} sx={{ borderRadius: '20px', px: 4 }}>CHIUDI</Button>
                    </DialogActions>
                </Dialog>


                {/* --- MODALE GRAFICO --- */}
                {isAuthorizedUser && (
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
        )
    } else {

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Accesso Negato (CHIAMA))</span>
                        </div>
                    </div>
                </div>
            </main>

        );
    }
}