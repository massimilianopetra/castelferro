'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    addTickets,
    getFirstFreeTicket,
    clearAllTickets,
    updateTicket,
    getTicketById,
    updateTicketCoperti,
    getGiornoSagra,          // <-- NUOVO IMPORT
    getStatoContiStats,      // <-- NUOVO IMPORT
    getStimaAttesa,          // Aggiunto per le statistiche
    getPuntiGraficoAttesa    // Aggiunto per le statistiche
} from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    Box, Typography, Button, Stack, TextField, Paper, Dialog,
    DialogActions, DialogContent, DialogTitle, DialogContentText
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info'; // Aggiunto per l'icona statistiche
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

    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [coperti, setCoperti] = useState<number | ''>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [mode, setMode] = useState<Mode>('AUTO');
    const [lastEntry, setLastEntry] = useState<{ numero: number, coperti: number } | null>(null);
    const [manualTicketId, setManualTicketId] = useState<number | ''>('');

    // States per Dialogs utility
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

    // === NUOVI STATES PER STATISTICHE ===
    const [stima, setStima] = useState<number | null>(null);
    const [openInfo, setOpenInfo] = useState(false);
    const [puntiGrafico, setPuntiGrafico] = useState<any[]>([]);
    const [disabilitaStatistiche, setDisabilitaStatistiche] = useState(false);

    // === NUOVI STATES PER STATO CONTI ===
    const [sagra, setSagra] = useState<any>({ stato: 'CHIUSA', giornata: 1 });
    const [openStatoConti, setOpenStatoConti] = useState(false);
    const [statsConti, setStatsConti] = useState<{
        totale: number, antipasti: number, primi: number,
        secondi: number, dolci: number, stampati: number
    } | null>(null);

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
        setOpenStatoConti(true);
        if (sagra.stato !== 'CHIUSA') {
            const dati = await getStatoContiStats(sagra.giornata);
            if (dati) setStatsConti(dati);
        }
    };

    // === FUNZIONI STATISTICHE ===
    const caricaStatistiche = async () => {
        if (disabilitaStatistiche) return;

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
        if (!disabilitaStatistiche) caricaStatistiche();

        const intervalStats = setInterval(() => {
            if (!disabilitaStatistiche) caricaStatistiche();
        }, 300000); // 5 minuti

        return () => clearInterval(intervalStats);
    }, [disabilitaStatistiche]);

    // Funzione helper riutilizzabile per notificare la pagina Chiama
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

    const handleStampa = async () => {
        const numeroCopertiValido = Number(coperti);
        let activePrinterIp = '192.168.1.171';

        if (typeof window !== 'undefined') {
            const savedIp = localStorage.getItem('sagra_printer_ip');
            if (savedIp) activePrinterIp = savedIp;
            else localStorage.setItem('sagra_printer_ip', activePrinterIp);
        }

        if (numeroCopertiValido <= 0) return;

        if (mode === 'MANUALE' && (manualTicketId === '' || manualTicketId <= 0)) {
            alert("Inserisci un numero ticket valido per la modalità manuale");
            return;
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
                setIsPrinting(true);
                try {
                    await fetch('/api/print', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            numeroTicket: ticketDaAssegnare,
                            numeroFoglietto: ticketDaAssegnare,
                            coperti: numeroCopertiValido,
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
            }

            setLastEntry({ numero: ticketDaAssegnare, coperti: numeroCopertiValido });
            setCoperti(0);
            if (mode === 'MANUALE') setManualTicketId('');

            // Aggiorna le statistiche dopo un nuovo inserimento
            if (!disabilitaStatistiche) caricaStatistiche();

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

    // ---- FUNZIONI UTILITY CON REFRESH CHIAMA ---- //

    const handleResetTotale = async () => {
        if (confirmText === "CONFERMA") {
            setLoading(true);
            try {
                await clearAllTickets();
                setLastEntry(null);
                setCoperti(0);
                setOpenResetDialog(false);
                setConfirmText("");
                await notificaCambioTabella();
            } catch (error) {
                alert("Errore reset");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleModifica = async () => {
        if (!modTicketId || !modCoperti) return;
        setLoading(true);
        try {
            await updateTicketCoperti(Number(modTicketId), Number(modCoperti));
            setOpenModifica(false);
            setModTicketId('');
            setModCoperti('');

            if (lastEntry?.numero === Number(modTicketId)) {
                setLastEntry({ numero: Number(modTicketId), coperti: Number(modCoperti) });
            }
            // Forza il refresh sincrono su CHIAMA
            await notificaCambioTabella();
        } catch (e) {
            alert("Errore durante la modifica");
        }
        setLoading(false);
    };

    const handleElimina = async () => {
        if (!eliminaTicketId) return;
        setLoading(true);
        try {
            // Imposta lo stato a 100 per nasconderlo e invalidarlo
            await updateTicket(Number(eliminaTicketId), 100);
            setOpenElimina(false);
            setEliminaTicketId('');

            // Forza il refresh sincrono su CHIAMA
            await notificaCambioTabella();
        } catch (e) {
            alert("Errore durante l'eliminazione");
        }
        setLoading(false);
    };

    const handleUnisci = async () => {
        if (!unisciTicket1 || !unisciTicket2) return;
        setLoading(true);
        try {
            const t1 = await getTicketById(Number(unisciTicket1));
            const t2 = await getTicketById(Number(unisciTicket2));

            if (t1 && t2) {
                // Escludiamo ticket già cancellati prima di unire
                if (t1.caricato === 100 || t2.caricato === 100) {
                    alert("Uno dei ticket inseriti risulta già eliminato.");
                    setLoading(false);
                    return;
                }

                const nuoviCoperti = t1.numpersone + t2.numpersone;
                await updateTicketCoperti(t1.id, nuoviCoperti);
                await updateTicket(t2.id, 100); // Scarto il secondo ticket

                setOpenUnisci(false);
                setUnisciTicket1('');
                setUnisciTicket2('');

                if (lastEntry?.numero === t1.id) {
                    setLastEntry({ numero: t1.id, coperti: nuoviCoperti });
                }

                // Forza il refresh sincrono su CHIAMA
                await notificaCambioTabella();
            } else {
                alert("Uno o entrambi i ticket non sono stati trovati.");
            }
        } catch (e) {
            alert("Errore durante l'unione");
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

                    <Typography variant="body1" sx={{ mt: 1, fontFamily: 'monospace', color: activePrinterIp ? 'text.secondary' : 'error.main', fontWeight: activePrinterIp ? 'normal' : 'bold' }}>
                        {activePrinterIp ? `IP Stampante: ${activePrinterIp}` : 'Nessuna stampante configurata'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}> Se annulli comunque il ticket risulterà regolarmente distribuito</Typography>


                    <Button
                        variant="contained" color="error" size="large"
                        sx={{ mt: 4, borderRadius: '9999px', px: 4 }}
                        onClick={async () => {
                            await notificaCambioTabella();

                            // === AGGIUNGI IL RESET DELLO STATO DI ELABORAZIONE QUI ===
                            // Sostituisci "setIsLoading" con il nome esatto del tuo stato (es: setIsLoading, setIsSaving, ecc.)
                            if (typeof setLoading === 'function') {
                                setLoading(false);
                            }

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

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                height: '87vh', width: '100%', bgcolor: 'background.default', p: 2,
                boxSizing: 'border-box', overflow: 'hidden',
                pointerEvents: loading ? 'none' : 'auto',
                opacity: loading ? 0.7 : 1,
                position: 'relative' // IMPORTANTE: per far funzionare absolute sui nuovi elementi
            }}>

                {/* --- STATO CONTI E BENVENUTO (TOP-LEFT) --- */}
                <Box sx={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button
                        variant="outlined" color="secondary"
                        startIcon={<AccessTimeFilledIcon sx={{ display: { xs: 'none', sm: 'inherit' } }} />}
                        size="small"
                        onClick={handleOpenStatoConti} // <-- AGGIUNTO ONCLICK
                        sx={{ fontWeight: 'bold', borderRadius: '15px' }}
                    >
                        Stato conti
                    </Button>
                </Box>

                {/* --- WIDGET STIMA ATTESA (TOP-RIGHT) --- */}
                {!disabilitaStatistiche && (
                    <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
                        <Button
                            variant="outlined" color="secondary"
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
                            {stima !== null ? `Attesa: ~${stima} min` : "Stima attesa"}
                        </Button>
                    </Box>
                )}
                <Box sx={{
                    flexShrink: 0,
                    mb: 1,
                    mt: 1, // <-- PASSA DA 4 A 1 o 2 (più compatto su mobile)
                    textAlign: 'center',
                    minHeight: '60px'     // <-- RIDOTTO da 80px a 60px per recuperare spazio
                }}>
                    {lastEntry ? (
                        <Paper elevation={3} sx={{
                            px: 6, py: 0, borderRadius: '20px',
                            border: '4px solid #1976d2',
                            bgcolor: '#fff'
                        }}>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#333' }}>
                                ULTIMO: <span style={{ color: '#1976d2', fontSize: '1.2em' }}>{lastEntry.numero}</span>
                                <span style={{ margin: '0 15px', color: '#ccc' }}>|</span>
                                COPERTI: <span style={{ color: '#9c27b0', fontSize: '1.2em' }}>{lastEntry.coperti}</span>
                            </Typography>
                        </Paper>
                    ) : (
                        <Typography sx={{ color: '#aaa', fontWeight: 700, fontSize: '1.5rem' }}>Nessun ticket distribuito</Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', mt: -1 }}>

<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', mt: -1 }}>
    
    {/* Contenitore flessibile armonizzato */}
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'flex-start', // Allinea le colonne in alto
        justifyContent: 'center', 
        width: '100%', 
        gap: mode === 'MANUALE' ? { xs: 4, sm: 6 } : 0, 
        mb: 3
    }}>
        
        {/* Sezione TICKET (solo in modalità MANUALE) */}
        {mode === 'MANUALE' && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Contenitore ad altezza fissa per bloccare la geometria */}
                <Box sx={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TextField
                        type="number"
                        label="Inserisci Ticket N°"
                        value={manualTicketId}
                        onChange={(e) => setManualTicketId(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ 
                            width: { xs: '160px', sm: '200px' },
                            '& .MuiInputBase-input': { fontSize: '1.8rem', fontWeight: 1000, textAlign: 'center' }
                        }}
                    />
                </Box>
                <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Ticket
                </Typography>
            </Box>
        )}

        {/* Sezione COPERTI */}
        <Box 
            onClick={() => !loading && setIsEditing(true)} 
            sx={{ 
                flex: mode === 'MANUALE' ? 1 : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: mode === 'MANUALE' ? 'auto' : '100%',
                cursor: loading ? 'default' : 'pointer'
            }}
        >
            {/* Contenitore ad altezza fissa IDENTICO a quello del ticket */}
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
                        sx={{ 
                            width: { xs: '160px', sm: '200px' },
                            '& .MuiInputBase-input': { fontSize: '1.8rem', fontWeight: 1000, textAlign: 'center', color: 'primary.main' }
                        }}
                    />
                ) : (
                    <Typography sx={{ 
                        fontSize: '3.5rem', // Ridotto leggermente per farlo sposare con le proporzioni del box Ticket
                        fontWeight: 1000, 
                        color: coperti === 0 ? '#ddd' : '#000', 
                        lineHeight: 1,
                        display: 'inline-block'
                    }}>
                        {coperti}
                    </Typography>
                )}
            </Box>
            <Typography sx={{ color: '#555', fontWeight: 1000, fontSize: '1.4rem', mt: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Coperti
            </Typography>
        </Box>
    </Box>

    {/* Stack dei Controlli (+ / - / +10) */}
    <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        sx={{
            width: '100%',
            px: 2,
            my: 0.5
        }}
    >
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

    {/* Pulsante di Azione Principale (Stampa) */}
    <Button
        onClick={handleStampa}
        variant="contained"
        color={mode === 'LIBERA' ? "success" : "secondary"}
        disabled={loading || Number(coperti) <= 0 || (mode === 'MANUALE' && !manualTicketId)}
        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <PrintIcon sx={{ fontSize: { xs: 30, sm: 45 } }} />}
        sx={{
            width: '92%',
            py: 2,
            mt: 0.5,
            fontSize: { xs: '1.5rem', sm: '2.2rem' },
            fontWeight: 1000,
            borderRadius: '40px'
        }}
    >
        {loading ? 'ELABORAZIONE...' : (mode === 'LIBERA' ? 'ENTRA' : 'STAMPA')}
    </Button>
</Box>
                </Box>
                <Box sx={{
                    width: '100%',
                    maxWidth: '800px',
                    mt: 1, // <--- CAMBIATO da 'auto' a 1 (o 2) per avvicinarlo al blocco sopra
                    pt: 1, // <--- RIDOTTO da 2 a 1
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1 // <--- RIDOTTO da 2 a 1 (avvicina le due Paper tra loro)
                }}>

                    {/* Riga 1: Modalità */}
                    <Paper elevation={1} sx={{ p: 1, borderRadius: '15px', bgcolor: '#fff' }}>
                        <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold', color: 'text.secondary' }}>MODALITÀ</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
                            <Button fullWidth variant={mode === 'AUTO' ? "contained" : "outlined"} color="primary" onClick={() => setMode('AUTO')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>
                                AUTO
                            </Button>
                            <Button fullWidth variant={mode === 'MANUALE' ? "contained" : "outlined"} color="warning" onClick={() => setMode('MANUALE')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>
                                MANUALE
                            </Button>
                            <Button fullWidth variant={mode === 'LIBERA' ? "contained" : "outlined"} color="success" onClick={() => setMode('LIBERA')} sx={{ fontWeight: 'bold', borderRadius: '10px' }}>
                                LIBERA
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Riga 2: Utility */}
                    <Paper elevation={1} sx={{ p: 1, borderRadius: '15px', bgcolor: '#fff' }}>
                        <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold', color: 'text.secondary' }}>UTILITY</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
                            <Button fullWidth variant="outlined" color="primary" onClick={() => setOpenModifica(true)} startIcon={<EditIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>
                                MODIFICA
                            </Button>
                            <Button fullWidth variant="outlined" color="secondary" onClick={() => setOpenUnisci(true)} startIcon={<CallMergeIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>
                                UNISCI
                            </Button>
                            <Button fullWidth variant="outlined" color="error" onClick={() => setOpenElimina(true)} startIcon={<CancelIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>
                                ELIMINA
                            </Button>
                            <Button fullWidth variant="contained" color="error" onClick={() => setOpenResetDialog(true)} startIcon={<DeleteForeverIcon />} sx={{ fontWeight: 'bold', borderRadius: '10px', fontSize: '0.75rem' }}>
                                AZZERA
                            </Button>
                        </Stack>
                    </Paper>

                </Box>

                {/* --- DIALOGS --- */}
                {/* MODALE STATO CONTI */}
                <Dialog open={openStatoConti} onClose={() => setOpenStatoConti(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>STATO CONTI IN ELABORAZIONE</DialogTitle>
                    <DialogContent>
                        {sagra.stato === 'CHIUSA' || !statsConti || statsConti.totale === 0 ? (
                            <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', pb: 5, mt: 4 }}>
                                Dati non sufficienti o sagra ancora chiusa
                            </Typography>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: '#1976d2', fontWeight: 900 }}>
                                    Totale Conti in Transito: {statsConti.totale}
                                </Typography>
                                <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1} sx={{ height: 180, borderBottom: '2px solid #ddd', pb: 1, px: 2 }}>
                                    {[
                                        { label: 'Antipasti', val: statsConti.antipasti, color: '#ff9800' },
                                        { label: 'Primi', val: statsConti.primi, color: '#f44336' },
                                        { label: 'Secondi', val: statsConti.secondi, color: '#795548' },
                                        { label: 'Dolci', val: statsConti.dolci, color: '#9c27b0' },
                                        { label: 'Stampati', val: statsConti.stampati, color: '#4caf50' }
                                    ].map((col, i) => {
                                        const percentuale = Math.round((col.val / statsConti.totale) * 100) || 0;
                                        return (
                                            <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>{percentuale}%</Typography>
                                                <Box sx={{
                                                    width: '100%',
                                                    maxWidth: '45px',
                                                    height: `${Math.max(percentuale * 1.5, 2)}px`, // Moltiplicatore per alzare le barre nel limite dei 150px
                                                    bgcolor: col.color,
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease'
                                                }} />
                                                <Typography sx={{ fontSize: '0.65rem', mt: 1, fontWeight: 'bold' }}>{col.label}</Typography>
                                                <Typography sx={{ fontSize: '0.6rem', color: '#666' }}>({col.val})</Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button variant="outlined" onClick={() => setOpenStatoConti(false)} sx={{ borderRadius: '20px', px: 4 }}>
                            CHIUDI
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* MODALE STATISTICHE (Preso da CHIAMA) */}
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

                <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                    <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, textAlign: 'center' }}>AZZERARE TICKETS?</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>
                            Operazione irreversibile. Digita <b>CONFERMA</b> per continuare.
                        </DialogContentText>
                        <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CONFERMA" />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenResetDialog(false)}>ANNULLA</Button>
                        <Button onClick={handleResetTotale} color="error" variant="contained" disabled={confirmText !== "CONFERMA"}>AZZERA ORA</Button>
                    </DialogActions>
                </Dialog>

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
                        <Button onClick={handleModifica} color="primary" variant="contained" disabled={!modTicketId || !modCoperti}>SALVA</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openElimina} onClose={() => setOpenElimina(false)}>
                    <DialogTitle sx={{ color: 'warning.main', fontWeight: 1000, textAlign: 'center' }}>ELIMINA TICKET</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2, textAlign: 'center' }}>
                            Il ticket verrà scartato e non verrà più chiamato. Non libera il numero.
                        </DialogContentText>
                        <TextField label="Numero Ticket da eliminare" type="number" fullWidth value={eliminaTicketId} onChange={(e) => setEliminaTicketId(e.target.value)} />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenElimina(false)}>ANNULLA</Button>
                        <Button onClick={handleElimina} color="warning" variant="contained" disabled={!eliminaTicketId}>ELIMINA</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openUnisci} onClose={() => setOpenUnisci(false)}>
                    <DialogTitle sx={{ color: 'secondary.main', fontWeight: 1000, textAlign: 'center' }}>UNISCI TICKET</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2, textAlign: 'center' }}>
                            I coperti verranno sommati nel Ticket 1. Il Ticket 2 verrà eliminato.
                        </DialogContentText>
                        <Stack spacing={2} sx={{ mt: 1, minWidth: '250px' }}>
                            <TextField label="Ticket 1 (che rimane)" type="number" fullWidth value={unisciTicket1} onChange={(e) => setUnisciTicket1(e.target.value)} />
                            <TextField label="Ticket 2 (da eliminare)" type="number" fullWidth value={unisciTicket2} onChange={(e) => setUnisciTicket2(e.target.value)} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenUnisci(false)}>ANNULLA</Button>
                        <Button onClick={handleUnisci} color="secondary" variant="contained" disabled={!unisciTicket1 || !unisciTicket2}>UNISCI</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openErrorTicket} onClose={() => setOpenErrorTicket(false)}>
                    <DialogTitle sx={{ color: 'error.main', fontWeight: 1000, textAlign: 'center' }}>ERRORE TICKET</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ textAlign: 'center' }}>
                            Ticket già esistente o errore di salvataggio. Riprova.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenErrorTicket(false)} variant="contained" color="error">HO CAPITO</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </ThemeProvider>
    );
}