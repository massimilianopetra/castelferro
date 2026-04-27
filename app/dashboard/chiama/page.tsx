'use client';

import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, Typography, Button, Snackbar, Alert, 
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton,
    TableSortLabel, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChairIcon from '@mui/icons-material/Chair'; 
import useMediaQuery from '@mui/material/useMediaQuery';
import { getTickets, updateTickets, deleteTicket } from '@/app/lib/actions'; 

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        success: { main: '#2e7d32' },
        warning: { main: '#ed6c02' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' },
    },
});

type Order = 'asc' | 'desc';

export default function ChiamaPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [numeroAttuale, setNumeroAttuale] = useState(0);
    const [lista, setLista] = useState<any[]>([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    
    // STATO PER ORDINAMENTO
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<'id' | 'numpersone'>('id');
    
    // Memoria locale dei ticket chiamati in questa sessione (per colore Arancio)
    const [chiamatiMemory, setChiamatiMemory] = useState<Set<number>>(new Set());

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const fetchDati = async () => {
        try {
            const tickets = await getTickets('non-seduti');
            if (tickets) setLista(tickets);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchDati();
        const eventSource = new EventSource('/api/next-client');
        eventSource.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type === 'REFRESH_TABLE') fetchDati();
            if (payload.type === 'CALL_NUMBER') setNumeroAttuale(payload.numero);
        };
        return () => eventSource.close();
    }, []);

    // FUNZIONE DI ORDINAMENTO
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

    const handleChiamaTicket = async (ticket: any) => {
        try {
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numero: ticket.id }),
            });
            setChiamatiMemory(prev => new Set(prev).add(ticket.id));
            setNumeroAttuale(ticket.id);
            setSnackbar({ open: true, message: `Ticket ${ticket.id} chiamato!`, severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Errore chiamata', severity: 'error' });
        }
    };

    const handleSiediTicket = async (ticket: any) => {
        try {
            await updateTickets({ ...ticket, seduto: 1 });
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SET_SITTING', numero: ticket.id }),
            });
            await fetchDati();
        } catch (error) { console.error(error); }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTicket) return;
        try {
            await deleteTicket(selectedTicket.id);
            await fetch('/api/next-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SET_SITTING', numero: selectedTicket.id }),
            });
            setOpenDeleteDialog(false);
            await fetchDati();
        } catch (error) { console.error(error); }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', bgcolor: 'background.default', p: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography sx={{ color: '#666', fontWeight: 900, fontSize: '0.9rem' }}>ULTIMO CHIAMATO</Typography>
                    <Typography sx={{ fontSize: isMobile ? '5.5rem' : '8rem', fontWeight: 1000, color: 'primary.main', fontFamily: 'monospace', lineHeight: 1 }}>
                        {numeroAttuale || '—'}
                    </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ maxWidth: '1000px', margin: '0 auto', mb: 2, maxHeight: '68vh', borderRadius: '12px' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 900 }}>
                                    <TableSortLabel 
                                        active={orderBy === 'id'} 
                                        direction={orderBy === 'id' ? order : 'asc'} 
                                        onClick={() => handleRequestSort('id')}
                                    >
                                        Ticket
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>
                                    <TableSortLabel 
                                        active={orderBy === 'numpersone'} 
                                        direction={orderBy === 'numpersone' ? order : 'asc'} 
                                        onClick={() => handleRequestSort('numpersone')}
                                    >
                                        Coperti
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900 }} align="right">Azioni</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedLista.map((row) => {
                                let btnColor = "#2e7d32"; // Verde default
                                let textColor = "#fff";

                                if (chiamatiMemory.has(row.id)) {
                                    btnColor = "#ed6c02"; // Arancio se chiamato
                                } else if (row.id < numeroAttuale) {
                                    btnColor = "#ffeb3b"; // Giallo se antecedente mai chiamato
                                    textColor = "#000";
                                }

                                return (
                                    <TableRow key={row.id} hover>
                                        <TableCell sx={{ fontSize: '2rem', fontWeight: 1000, color: 'primary.main', fontFamily: 'monospace' }}>
                                            {row.id}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '1.8rem' }}>
                                            {row.numpersone}
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            <Button 
                                                variant="contained" 
                                                startIcon={<CampaignIcon />}
                                                onClick={() => handleChiamaTicket(row)}
                                                sx={{ 
                                                    mr: 1, fontWeight: 'bold', 
                                                    bgcolor: btnColor, color: textColor,
                                                    '&:hover': { bgcolor: btnColor, opacity: 0.9 }
                                                }}
                                            >
                                                Chiama
                                            </Button>
                                            <IconButton color="primary" onClick={() => handleSiediTicket(row)} sx={{ mr: 1, border: '1px solid', borderRadius: '8px' }}>
                                                <ChairIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => { setSelectedTicket(row); setOpenDeleteDialog(true); }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                    <DialogTitle>Conferma Cancellazione</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Vuoi eliminare definitivamente il ticket numero <strong>{selectedTicket?.id}</strong> e i coperti <strong>{selectedTicket?.numpersone}</strong> associati?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteDialog(false)}>NO</Button>
                        <Button onClick={handleConfirmDelete} color="error" autoFocus>SI, ELIMINA</Button>
                    </DialogActions>
                </Dialog>
                
                <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
}