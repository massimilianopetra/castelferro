'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    addTickets,
    getFirstFreeTicket,
    clearAllTickets,
    updateTicket,
    getTicketById,
    updateTicketCoperti,
    getGiornoSagra,
    getStatoContiStats,
    getStimaAttesa,
    getPuntiGraficoAttesa
} from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    Box, Typography, Button, Stack, TextField, Paper, Dialog,
    DialogActions, DialogContent, DialogTitle, DialogContentText,
    Snackbar, Alert
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTime';
import { useConfig } from '@/context/ConfigContext';

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

    const config = useConfig();
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [coperti, setCoperti] = useState<number | ''>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [mode, setMode] = useState<Mode>('AUTO');

    const [lastEntry, setLastEntry] = useState<{ type: 'TICKET' | 'ELIMINATO' | 'AZZERATO', numero?: number, coperti?: number } | null>(null);
    const [manualTicketId, setManualTicketId] = useState<number | ''>('');
    const [showNote, setShowNote] = useState(true);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'warning' | 'error' | 'success' | 'info' }>({
        open: false,
        message: '',
        severity: 'warning'
    });

    const [openErrorTicket, setOpenErrorTicket] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const [openModifica, setOpenModifica] = useState(false);
    const [modTicketId, setModTicketId] = useState('');
    const [modCoperti, setModCoperti] = useState('');

    const [openElimina, setOpenElimina] = useState(false);
    const [eliminaTicketId, setEliminaTicketId] = useState('');

    const [openUnisci, setOpenUnisci] = useState(false);
    const [unisciTicket1, setUnisciTicket1] = useState('');
    const [unisciTicket2, setUnisciTicket2] = useState('');

    const [stima, setStima] = useState<number | null>(null);
    const [openInfo, setOpenInfo] = useState(false);
    const [puntiGrafico, setPuntiGrafico] = useState<any[]>([]);

    const [sagra, setSagra] = useState<any>({ stato: 'CHIUSA', giornata: 1 });
    const [openStatoConti, setOpenStatoConti] = useState(false);
    const [statsConti, setStatsConti] = useState<{
        totale: number, antipasti: number, primi: number, birre: number, bevande: number,
        secondi: number, dolci: number, stampati: number, casse: number
    } | null>(null);

    const authorizedNames = [
        "IngressoE",
        "SuperUser"
    ];

    const isAuthorizedUser = authorizedNames.includes(session?.user?.name ?? "");

    useEffect(() => {
        const fetchSagra = async () => {
            const gg = await getGiornoSagra();
            if (gg) setSagra(gg);
        };
        fetchSagra();
    }, []);

    // Pulizia locale se la statistica viene spenta
    useEffect(() => {
        if (!isAuthorizedUser) {
            setStima(null);
            setStatsConti(null);
        }
    }, [isAuthorizedUser]);

    const handleOpenStatoConti = async () => {
        // Blocco preventivo delle interrogazioni al DB se spento
        if (!isAuthorizedUser) return;

        setOpenStatoConti(true);
        if (sagra.stato !== 'CHIUSA') {
            const dati = await getStatoContiStats(sagra.giornata);
            if (dati) setStatsConti(dati);
        }
    };

    const caricaStatistiche = async () => {
        // Blocco preventivo delle interrogazioni al DB se spento
        if (!isAuthorizedUser) return;

        try {
            const resStima = await getStimaAttesa();
            if (resStima?.success) setStima(resStima.media ?? null);

            const puntos = await getPuntiGraficoAttesa();
            if (puntos) {
                setPuntiGrafico(puntos.map((p: any) => {
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

    useEffect(() => {
        if (isAuthorizedUser) caricaStatistiche();
        const intervalStats = setInterval(() => {
            if (isAuthorizedUser) caricaStatistiche();
        }, 300000);
        return () => clearInterval(intervalStats);
    }, [isAuthorizedUser]);

    const notificaCambioTabella = async () => {
        try {
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'REFRESH_TABLE' }),
            });
        } catch (sseErr) {
            console.warn("Errore notifica REFRESH_TABLE (ignorato)", sseErr);
        }
    };

    const eseguiStampaFisica = async (numeroTicket: number, numeroCoperti: number) => {
        let activePrinterIp = '192.168.1.171';
        if (typeof window !== 'undefined') {
            const savedIp = localStorage.getItem('sagra_printer_ip');
            if (savedIp) activePrinterIp = savedIp;
            else localStorage.setItem('sagra_printer_ip', activePrinterIp);
        }

        setIsPrinting(true);
        try {
            await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroTicket: numeroTicket,
                    numeroFoglietto: numeroTicket,
                    coperti: numeroCoperti,
                    ipAddress: activePrinterIp,
                    titolo: config.titolo,
                    edizione: config.edizione,
                    inizio: config.inizio,
                    fine: config.fine,
                    mese: config.mese,
                    giornata: config.giornata || "1",
                    isPass: false
                }),
            });
        } catch (printErr) {
            console.error("Impossibile comunicare con il server di stampa:", printErr);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleStampa = async () => {
        const numeroCopertiValido = Number(coperti);

        if (numeroCopertiValido <= 0 || !coperti) {
            setSnackbar({ open: true, message: "Il numero di coperti deve essere un valore positivo", severity: 'warning' });
            return;
        }

        if (mode === 'MANUALE') {
            const ticketIdValido = Number(manualTicketId);
            if (!manualTicketId || ticketIdValido <= 0) {
                setSnackbar({ open: true, message: "Il numero del ticket inserito deve essere positivo", severity: 'warning' });
                return;
            }
        }

        setLoading(true);

        try {
            let ticketDaAssegnare = Number(manualTicketId);
            if (mode !== 'MANUALE') {
                ticketDaAssegnare = await getFirstFreeTicket();
            }

            let valoreCaricato = 0;
            if (mode === 'MANUALE') valoreCaricato = 1;
            else if (mode === 'LIBERA') valoreCaricato = 2;

            const seduto = mode === 'LIBERA' ? 1 : 0;
            const timestampAdesso = Date.now();

            const res = await addTickets(
                ticketDaAssegnare,
                numeroCopertiValido,
                seduto,
                valoreCaricato,
                timestampAdesso,
                null as any
            );

            if (res && (res as any).error) {
                setOpenErrorTicket(true);
                setLoading(false);
                return;
            }

            const nuovoTicket = {
                id: ticketDaAssegnare,
                numpersone: numeroCopertiValido,
                seduto: seduto,
                caricato: valoreCaricato,
                data_distributo: timestampAdesso,
                data_chiamato: null
            };

            try {
                await fetch('/api/next-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'NEW_TICKET', ticket: nuovoTicket }),
                });
            } catch (sseErr) {
                console.warn("Errore notifica SSE (ignorato)", sseErr);
            }

            if (mode !== 'LIBERA') {
                await eseguiStampaFisica(ticketDaAssegnare, numeroCopertiValido);
            }

            setLastEntry({ type: 'TICKET', numero: ticketDaAssegnare, coperti: numeroCopertiValido });
            setCoperti(0);
            if (mode === 'MANUALE') setManualTicketId('');

            if (isAuthorizedUser) caricaStatistiche();

        } catch (globalError) {
            console.error("Errore critico:", globalError);
            setIsPrinting(false);
        } finally {
            setLoading(false);
        }
    };

    const onAdd = () => setCoperti(prev => (Number(prev) < 999 ? Number(prev) + 1 : 999));
    const onRemove = () => setCoperti(prev => (Number(prev) > 0 ? Number(prev) - 1 : 0));
    const onAdd10 = () => setCoperti(prev => (Number(prev) <= 989 ? Number(prev) + 10 : 999));

    const handleResetTotale = async () => {
        if (confirmText === "CONFERMA") {
            setLoading(true);
            try {
                await clearAllTickets();
                setCoperti(0);
                setOpenResetDialog(false);
                setConfirmText("");
                setLastEntry({ type: 'AZZERATO' });
                await notificaCambioTabella();
                setSnackbar({ open: true, message: 'Tutti i ticket sono stati azzerati correttamente', severity: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: "Errore durante il reset dei ticket", severity: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleModifica = async () => {
        const targetId = Number(modTicketId);
        const nuoviCoperti = Number(modCoperti);

        if (!modTicketId || targetId <= 0) {
            setSnackbar({ open: true, message: "Il numero del ticket deve essere positivo", severity: 'warning' });
            return;
        }
        if (!modCoperti || nuoviCoperti <= 0) {
            setSnackbar({ open: true, message: "Il numero di coperti deve essere positivo", severity: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const ticketEsistente = await getTicketById(targetId);
            if (!ticketEsistente) {
                setSnackbar({ open: true, message: `Il TICKET ${targetId} non esiste`, severity: 'warning' });
                setLoading(false);
                return;
            }
            if (ticketEsistente.caricato === 100) {
                setSnackbar({ open: true, message: `Il TICKET ${targetId} è stato eliminato`, severity: 'warning' });
                setLoading(false);
                return;
            }

            await updateTicketCoperti(targetId, nuoviCoperti);
            setOpenModifica(false);
            setModTicketId('');
            setModCoperti('');

            setLastEntry({ type: 'TICKET', numero: targetId, coperti: nuoviCoperti });
            await notificaCambioTabella();
            await eseguiStampaFisica(targetId, nuoviCoperti);
            setSnackbar({ open: true, message: `Ticket ${targetId} modificato e inviato alla stampa`, severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: "Errore durante la modifica del ticket", severity: 'error' });
        }
        setLoading(false);
    };

    const handleElimina = async () => {
        const idDaEliminare = Number(eliminaTicketId);

        if (!eliminaTicketId || idDaEliminare <= 0) {
            setSnackbar({ open: true, message: "Il numero del ticket deve essere positivo", severity: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const ticketEsistente = await getTicketById(idDaEliminare);
            if (!ticketEsistente) {
                setSnackbar({ open: true, message: `Il TICKET ${idDaEliminare} non esiste`, severity: 'warning' });
                setLoading(false);
                return;
            }
            if (ticketEsistente.caricato === 100) {
                setSnackbar({ open: true, message: `Il TICKET ${idDaEliminare} è stato eliminato`, severity: 'warning' });
                setLoading(false);
                return;
            }

            await updateTicket(idDaEliminare, 100);
            setOpenElimina(false);
            setEliminaTicketId('');

            setLastEntry({ type: 'ELIMINATO', numero: idDaEliminare });
            await notificaCambioTabella();
            setSnackbar({ open: true, message: `Ticket ${idDaEliminare} eliminato con successo`, severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: "Errore durante l'eliminazione del ticket", severity: 'error' });
        }
        setLoading(false);
    };

    const handleUnisci = async () => {
        const id1 = Number(unisciTicket1);
        const id2 = Number(unisciTicket2);

        if (!unisciTicket1 || id1 <= 0 || !unisciTicket2 || id2 <= 0) {
            setSnackbar({ open: true, message: "Entrambi i numeri di ticket inseriti devono essere positivi", severity: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const tA = await getTicketById(id1);
            const tB = await getTicketById(id2);

            let messaggiErrore: string[] = [];

            if (!tA) {
                messaggiErrore.push(`il TICKET ${id1} non esiste`);
            } else if (tA.caricato === 100) {
                messaggiErrore.push(`il TICKET ${id1} è stato eliminato`);
            }

            if (!tB) {
                messaggiErrore.push(`il TICKET ${id2} non esiste`);
            } else if (tB.caricato === 100) {
                messaggiErrore.push(`il TICKET ${id2} è stato eliminato`);
            }

            if (messaggiErrore.length > 0) {
                const messaggioFinale = messaggiErrore.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' e ');
                setSnackbar({ open: true, message: messaggioFinale, severity: 'warning' });
                setLoading(false);
                return;
            }

            if (tA && tB) {
                const ticketBasso = tA.id < tB.id ? tA : tB;
                const ticketAlto = tA.id > tB.id ? tA : tB;

                const nuoviCoperti = ticketBasso.numpersone + ticketAlto.numpersone;

                await updateTicketCoperti(ticketBasso.id, nuoviCoperti);
                await updateTicket(ticketAlto.id, 100);

                setOpenUnisci(false);
                setUnisciTicket1('');
                setUnisciTicket2('');

                setLastEntry({ type: 'TICKET', numero: ticketBasso.id, coperti: nuoviCoperti });
                await notificaCambioTabella();
                await eseguiStampaFisica(ticketBasso.id, nuoviCoperti);
                setSnackbar({ open: true, message: `Ticket uniti sul N° ${ticketBasso.id} con ${nuoviCoperti} coperti totali`, severity: 'success' });
            }
        } catch (e) {
            setSnackbar({ open: true, message: "Errore durante l'unione dei ticket", severity: 'error' });
        }
        setLoading(false);
    };

    if (isPrinting) {
        const activePrinterIp = typeof window !== 'undefined' ? localStorage.getItem('sagra_printer_ip') : null;

        return (
            <ThemeProvider theme={defaultTheme}>
                <Box sx={{
                    display: 'flex', flexDirection: 'column', height: '100vh',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'fixed', top: 0, left: 0, width: '100vw',
                    bgcolor: 'rgba(255, 255, 255, 0.9)', zIndex: 9999
                }}>
                    <CircularProgress size="6rem" />
                    <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Invio alla stampa in corso ...</Typography>
                    <Typography variant="body1" sx={{ mt: 1, fontFamily: 'monospace', color: activePrinterIp ? 'text.secondary' : 'error.main', fontWeight: 'bold' }}>
                        {activePrinterIp ? `IP Stampante: ${activePrinterIp}` : 'Nessuna stampante configurata'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}> Se annulli comunque il ticket risulterà regolarmente distribuito</Typography>
                    <Button
                        variant="contained" color="error" size="large"
                        sx={{ mt: 4, borderRadius: '9999px', px: 4 }}
                        onClick={async () => {
                            await notificaCambioTabella();
                            if (typeof setLoading === 'function') setLoading(false);
                            setIsPrinting(false);
                            setCoperti(0);
                        }}
                    >
                        Annulla attesa e prosegui
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }
    if ((session?.user?.name === "IngressoE") || (session?.user?.name === "Ingresso") || (session?.user?.name === "SuperUser")) {

        return (
            <ThemeProvider theme={defaultTheme}>
                <Box sx={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    height: '87vh', width: '100%', bgcolor: 'background.default', p: 2,
                    boxSizing: 'border-box', overflow: 'hidden',
                    pointerEvents: loading ? 'none' : 'auto',
                    opacity: loading ? 0.7 : 1,
                    position: 'relative'
                }}>

                    {/* MODIFICA: Nasconde il pulsante Stato conti se le statistiche sono disabilitate centralmente */}
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

                    {/* MODIFICA: Il pulsante Stima attesa nascosto se le statistiche sono disabilitate centralmente */}
                    {isAuthorizedUser && (
                        <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
                            <Button
                                variant="outlined" color="secondary"
                                size="small"
                                startIcon={<InfoIcon sx={{ display: { xs: 'none', sm: 'inherit' } }} />}
                                onClick={() => setOpenInfo(true)}
                                sx={{ borderRadius: '20px', fontWeight: 'bold', bgcolor: 'white', minWidth: { xs: 'auto', sm: '64px' } }}
                            >
                                {stima !== null ? `Attesa: ~${stima} min` : "Stima attesa"}
                            </Button>
                        </Box>
                    )}

                    <Box sx={{ flexShrink: 0, mb: 1, mt: 1, textAlign: 'center', minHeight: '60px' }}>
                        {lastEntry ? (
                            lastEntry.type === 'TICKET' ? (
                                <Paper elevation={3} sx={{ px: 6, py: 0, borderRadius: '20px', border: '4px solid #1976d2', bgcolor: '#fff' }}>
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#333' }}>
                                        ULTIMO: <span style={{ color: '#1976d2', fontSize: '1.2em' }}>{lastEntry.numero}</span>
                                        <span style={{ margin: '0 6px', color: '#ccc' }}>|</span>
                                        COPERTI: <span style={{ color: '#9c27b0', fontSize: '1.2em' }}>{lastEntry.coperti}</span>
                                    </Typography>
                                </Paper>
                            ) : lastEntry.type === 'ELIMINATO' ? (
                                <Paper elevation={3} sx={{ px: 6, py: 0, borderRadius: '20px', border: '4px solid #d32f2f', bgcolor: '#fdf2f2' }}>
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#d32f2f' }}>
                                        ELIMINATO TICKET: <span style={{ fontSize: '1.2em' }}>{lastEntry.numero}</span>
                                    </Typography>
                                </Paper>
                            ) : (
                                <Paper elevation={3} sx={{ px: 6, py: 0, borderRadius: '20px', border: '4px solid #757575', bgcolor: '#f5f5f5' }}>
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#757575' }}>
                                        CONTATORE AZZERATO
                                    </Typography>
                                </Paper>
                            )
                        ) : (
                            <Typography sx={{ color: '#aaa', fontWeight: 700, fontSize: '1.5rem' }}>Nessun ticket distribuito</Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', mt: -1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', width: '100%', gap: mode === 'MANUALE' ? { xs: 4, sm: 6 } : 0, mb: 3 }}>
                            {mode === 'MANUALE' && (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TextField
                                            type="number"
                                            label="Inserisci Ticket N°"
                                            value={manualTicketId}
                                            onChange={(e) => setManualTicketId(e.target.value === '' ? '' : Number(e.target.value))}
                                            sx={{ width: { xs: '160px', sm: '200px' }, '& .MuiInputBase-input': { fontSize: '1.8rem', fontWeight: 1000, textAlign: 'center' } }}
                                        />
                                    </Box>
                                    <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Ticket
                                    </Typography>
                                </Box>
                            )}

                            <Box
                                onClick={() => !loading && setIsEditing(true)}
                                sx={{ flex: mode === 'MANUALE' ? 1 : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', width: mode === 'MANUALE' ? 'auto' : '100%', cursor: loading ? 'default' : 'pointer' }}
                            >
                                <Box sx={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                    {isEditing ? (
                                        <TextField
                                            type="number"
                                            autoFocus
                                            label="Inserisci Coperti"
                                            disabled={loading}
                                            value={coperti === 0 ? '' : coperti}
                                            onChange={(e) => setCoperti(e.target.value === '' ? 0 : Number(e.target.value))}
                                            onBlur={() => setIsEditing(false)}
                                            sx={{ width: { xs: '160px', sm: '200px' }, '& .MuiInputBase-input': { fontSize: '1.8rem', fontWeight: 1000, textAlign: 'center', color: 'primary.main' } }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontSize: '3.5rem', fontWeight: 1000, color: coperti === 0 ? '#ddd' : '#000', lineHeight: 1, display: 'inline-block' }}>
                                            {coperti}
                                        </Typography>
                                    )}
                                </Box>
                                <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Coperti
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: '100%', px: 2, my: 0.5 }}>
                            <Button variant="contained" disabled={loading || Number(coperti) <= 0} onClick={onRemove} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <RemoveCircleSharpIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" disabled={loading} onClick={onAdd} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <AddCircleIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button variant="contained" disabled={loading} onClick={onAdd10} sx={{ width: '30%', height: { xs: '70px', sm: '90px' }, borderRadius: '20px' }}>
                                <Typography sx={{ fontWeight: 1000, fontSize: '1.5rem' }}>+10</Typography>
                            </Button>
                        </Stack>

                        <Button
                            onClick={handleStampa}
                            variant="contained"
                            color={mode === 'LIBERA' ? "success" : "secondary"}
                            disabled={loading || Number(coperti) <= 0 || (mode === 'MANUALE' && !manualTicketId)}
                            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <PrintIcon sx={{ fontSize: { xs: 30, sm: 45 } }} />}
                            sx={{ width: '92%', py: 2, mt: 0.5, fontSize: { xs: '1.5rem', sm: '2.2rem' }, fontWeight: 1000, borderRadius: '40px' }}
                        >
                            {loading ? 'ELABORAZIONE...' : (mode === 'LIBERA' ? 'ENTRA' : 'STAMPA')}
                        </Button>
                    </Box>

                    <Box sx={{ width: '100%', maxWidth: '800px', mt: 1, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Paper elevation={1} sx={{ p: 1, borderRadius: '15px', bgcolor: '#fff', position: 'relative' }}>

                            <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold', color: 'text.secondary' }}>MODALITÀ</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
                                <Button fullWidth variant={mode === 'AUTO' ? "contained" : "outlined"} color="primary" onClick={() => setMode('AUTO')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>AUTO</Button>
                                <Button fullWidth variant={mode === 'MANUALE' ? "contained" : "outlined"} color="warning" onClick={() => setMode('MANUALE')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>MANUALE</Button>
                                <Button fullWidth variant={mode === 'LIBERA' ? "contained" : "outlined"} color="success" onClick={() => setMode('LIBERA')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>LIBERA</Button>
                            </Stack>
                        </Paper>

                        <Paper elevation={1} sx={{ p: 1, borderRadius: '15px', bgcolor: '#fff' }}>
                            <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold', color: 'text.secondary' }}>UTILITY</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
                                <Button fullWidth variant="outlined" color="primary" onClick={() => setOpenModifica(true)} startIcon={<EditIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>MODIFICA</Button>
                                <Button fullWidth variant="outlined" color="secondary" onClick={() => setOpenUnisci(true)} startIcon={<CallMergeIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>UNISCI</Button>
                                <Button fullWidth variant="outlined" color="error" onClick={() => setOpenElimina(true)} startIcon={<CancelIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>ELIMINA</Button>
                                <Button fullWidth variant="contained" color="error" onClick={() => setOpenResetDialog(true)} startIcon={<DeleteForeverIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>AZZERA</Button>
                            </Stack>
                        </Paper>
                    </Box>

                    {/* --- SNACKBAR NOTIFICHE --- */}
                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={6000}
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                            severity={snackbar.severity}
                            sx={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>

                    {/* --- DIALOGS --- */}
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

                    {/* MODALE STATISTICHE */}
                    {isAuthorizedUser && (
                        <Dialog open={openInfo} onClose={() => setOpenInfo(false)} fullWidth maxWidth="xs">
                            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>ANDAMENTO ATTESA</DialogTitle>
                            <DialogContent>
                                <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 150, mt: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
                                    {puntiGrafico.length > 0 ? puntiGrafico.map((p, i) => (
                                        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>{p.minuti}'</Typography>
                                            <Box sx={{ width: '100%', height: `${Math.min(p.minuti * 2, 120)}px`, bgcolor: '#1976d2', borderRadius: '2px 2px 0 0', transition: 'height 0.5s ease' }} />
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

                    {/* DIALOG AZZERA */}
                    <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                        <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, textAlign: 'center' }}>AZZERARE TICKETS?</DialogTitle>
                        <DialogContent>
                            <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>Operazione irreversibile. Digita <b>CONFERMA</b> per continuare.</DialogContentText>
                            <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setOpenResetDialog(false)}>ANNULLA</Button>
                            <Button onClick={handleResetTotale} color="error" variant="contained" disabled={confirmText !== "CONFERMA"}>AZZERA ORA</Button>
                        </DialogActions>
                    </Dialog>

                    {/* DIALOG MODIFICA */}
                    <Dialog open={openModifica} onClose={() => setOpenModifica(false)}>
                        <DialogTitle sx={{ color: 'primary.main', fontWeight: 1000, textAlign: 'center' }}>MODIFICA COPERTI</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1, minWidth: '250px' }}>
                                <TextField label="Numero Ticket" type="number" fullWidth value={modTicketId} onChange={(e) => setModTicketId(e.target.value)} />
                                <TextField label="Nuovi Coperti" type="number" fullWidth value={modCoperti} onChange={(e) => setModCoperti(e.target.value)} />
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setOpenModifica(false)}>ANNULLA</Button>
                            <Button onClick={handleModifica} color="primary" variant="contained">SALVA E STAMPA</Button>
                        </DialogActions>
                    </Dialog>

                    {/* DIALOG ELIMINA */}
                    <Dialog open={openElimina} onClose={() => setOpenElimina(false)}>
                        <DialogTitle sx={{ color: 'warning.main', fontWeight: 1000, textAlign: 'center' }}>ELIMINA TICKET</DialogTitle>
                        <DialogContent>
                            <DialogContentText sx={{ mb: 2, textAlign: 'center' }}>Il ticket verrà scartato e non verrà più chiamato. Non libera il numero.</DialogContentText>
                            <TextField label="Numero Ticket da eliminare" type="number" fullWidth value={eliminaTicketId} onChange={(e) => setEliminaTicketId(e.target.value)} />
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setOpenElimina(false)}>ANNULLA</Button>
                            <Button onClick={handleElimina} color="warning" variant="contained">ELIMINA</Button>
                        </DialogActions>
                    </Dialog>

                    {/* DIALOG UNISCI */}
                    <Dialog open={openUnisci} onClose={() => setOpenUnisci(false)}>
                        <DialogTitle sx={{ color: 'secondary.main', fontWeight: 1000, textAlign: 'center' }}>UNISCI TICKET</DialogTitle>
                        <DialogContent>
                            <DialogContentText sx={{ mb: 2, textAlign: 'center' }}>I coperti verranno sommati e sarà stampato il ticket (più basso) con i nuovi coperti. Il ticket più alto verrà eliminato (caricato a 100) e non verrà più chiamato.</DialogContentText>
                            <Stack spacing={2} sx={{ mt: 1, minWidth: '250px' }}>
                                <TextField label="Ticket 1 " type="number" fullWidth value={unisciTicket1} onChange={(e) => setUnisciTicket1(e.target.value)} />
                                <TextField label="Ticket 2 " type="number" fullWidth value={unisciTicket2} onChange={(e) => setUnisciTicket2(e.target.value)} />
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setOpenUnisci(false)}>ANNULLA</Button>
                            <Button onClick={handleUnisci} color="secondary" variant="contained">SALVA E STAMPA</Button>
                        </DialogActions>
                    </Dialog>

                    {/* DIALOG ERRORE */}
                    <Dialog open={openErrorTicket} onClose={() => setOpenErrorTicket(false)}>
                        <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, textAlign: 'center' }}>ERRORE TICKET</DialogTitle>
                        <DialogContent>
                            <DialogContentText sx={{ textAlign: 'center' }}>Ticket già esistente o errore di salvataggio. Riprova.</DialogContentText>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setOpenErrorTicket(false)} variant="contained" color="error">HO CAPITO</Button>
                        </DialogActions>
                    </Dialog>

                </Box>
            </ThemeProvider>
        )
    } else {

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Accesso Negato 4</span>
                        </div>
                    </div>
                </div>
            </main>

        );
    }
}