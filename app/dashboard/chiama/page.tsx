'use client';

import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
    const [showActions, setShowActions] = useState(true);
    
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<'id' | 'numpersone'>('id');
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
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                // CORREZIONE: height 100% per stare dentro i limiti del parent dashboard
                height: '100%', 
                maxHeight: '100%',
                width: '100%', 
                bgcolor: 'background.default', 
                p: isMobile ? 1 : 2, 
                boxSizing: 'border-box',
                overflow: 'hidden', // Blocca categoricamente lo scroll esterno
                position: 'relative'
            }}>
                
                {/* HEADER FISSO */}
                <Box sx={{ textAlign: 'center', mb: isMobile ? 0.5 : 1, flexShrink: 0 }}>
                    <Typography sx={{ color: '#666', fontWeight: 900, fontSize: '0.8rem' }}>
                        ULTIMO CHIAMATO
                    </Typography>
                 
                    <Typography sx={{ 
                        fontSize: isMobile ? '4.5rem' : '7rem', 
                        fontWeight: 1000, 
                        color: 'primary.main', 
                        fontFamily: 'monospace', 
                        lineHeight: 1 
                    }}>
                        {numeroAttuale || '—'}
                    </Typography>
                </Box>

                {/* SWITCH FISSO */}
                <Box sx={{ width: '100%', maxWidth: '900px', mx: 'auto', display: 'flex', justifyContent: 'flex-end', mb: 0.5, flexShrink: 0 }}>
                    <FormControlLabel
                        control={<Switch checked={showActions} onChange={(e) => setShowActions(e.target.checked)} color="primary" size="small" />}
                        label={<Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Funzioni aggiuntive</Typography>}
                    />
                </Box>

                {/* TABELLA ELASTICA */}
                <TableContainer component={Paper} sx={{ 
                    maxWidth: '900px', 
                    width: '100%', 
                    mx: 'auto',
                    flexGrow: 1, 
                    minHeight: 0, 
                    borderRadius: '12px', 
                    overflowY: 'auto', // Solo la tabella deve scorrere
                    boxShadow: 3
                }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 900 }}>
                                    <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                                        Ticket
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>
                                    <TableSortLabel active={orderBy === 'numpersone'} direction={orderBy === 'numpersone' ? order : 'asc'} onClick={() => handleRequestSort('numpersone')}>
                                        Coperti
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900 }} align="right">Azioni</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedLista.map((row) => {
                                let btnColor = "#2e7d32"; let textColor = "#fff";
                                if (chiamatiMemory.has(row.id)) { btnColor = "#ed6c02"; } 
                                else if (row.id < numeroAttuale) { btnColor = "#ffeb3b"; textColor = "#000"; }

                                return (
                                    <TableRow key={row.id} hover>
                                        <TableCell sx={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 1000, color: 'primary.main', fontFamily: 'monospace' }}>
                                            {row.id}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: isMobile ? '1.1rem' : '1.8rem' }}>{row.numpersone}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button 
                                                    variant="contained" size="small"
                                                    onClick={() => handleChiamaTicket(row)}
                                                    sx={{ fontWeight: 'bold', bgcolor: btnColor, color: textColor, minWidth: isMobile ? '45px' : '100px', '&:hover': { bgcolor: btnColor, opacity: 0.9 } }}
                                                >
                                                    <CampaignIcon fontSize={isMobile ? "small" : "medium"} />
                                                    <Typography component="span" sx={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>chiama</Typography>
                                                </Button>
                                                {showActions && (
                                                    <>
                                                        <IconButton color="primary" size="small" onClick={() => handleSiediTicket(row)} sx={{ border: '1px solid', borderRadius: '8px' }}>
                                                            <ChairIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton color="error" size="small" onClick={() => { setSelectedTicket(row); setOpenDeleteDialog(true); }} sx={{ border: '1px solid', borderRadius: '8px' }}> 
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Snackbar e Dialog (stessa logica) */}
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
        </ThemeProvider>
    );
}