'use client';

import { useState, useEffect } from 'react';
import { getListaCamerieri } from '@/app/lib/actions';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, 
    Typography, 
    Button, 
    Stack, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        success: { main: '#2e7d32' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' }
    },
});

export default function TelecomandoPage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [openGroups, setOpenGroups] = useState(false);
    
    // Stato per la Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        getListaCamerieri().then((data) => {
            if (data) {
                setTotalValue(data.length);
            }
            setLoading(false);
        });
    }, []);

    const increment = () => setTotalValue(prev => prev + 1);
    const decrement = () => setTotalValue(prev => (prev > 0 ? prev - 1 : 0));

    const handleOpen = () => setOpenGroups(true);
    const handleClosePopUpGruppi = () => setOpenGroups(false);

    // Funzione quando si clicca su una riga
    const handleRowClick = (rowNumber: number) => {
        setOpenGroups(false);
        setSnackbar({ open: true, message: `Eliminato con successo: Gruppo ${rowNumber}`, severity: 'success' });
    };

    const rows = Array.from({ length: 20 }, (_, i) => i + 1);

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
                    height: '100vh', 
                    width: '100vw',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                    p: 2
                }}
            >
                {/* 1. Contatore in alto al centro */}
                <Box sx={{ pt: 1, textAlign: 'center' }}>
                    <Typography 
                        variant="h1" 
                        sx={{ 
                            fontSize: isMobile ? '12vh' : '15vh', 
                            fontWeight: 900, 
                            color: '#1976d2',
                            fontFamily: 'monospace',
                            lineHeight: 1
                        }}
                    >
                        {totalValue}
                    </Typography>

                    <Button 
                        variant="outlined" 
                        startIcon={<GroupsIcon sx={{ fontSize: '1.5rem !important' }} />}
                        onClick={handleOpen}
                        sx={{ 
                            mt: 2, 
                            px: 4, 
                            py: 1.5, 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold', 
                            borderRadius: 2,
                            borderWidth: 2,
                            textTransform: 'uppercase',
                            '&:hover': {
                                borderWidth: 2,
                                backgroundColor: 'rgba(25, 118, 210, 0.05)'
                            }
                        }}
                    >
                        Gruppi in coda
                    </Button>
                </Box>

                {/* 2. Area centrale con i tasti Giganti */}
                <Box 
                    sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Stack 
                        direction={isMobile ? "column" : "row"} 
                        spacing={4} 
                        sx={{ width: '90%', height: '50%' }}
                    >
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={decrement}
                            sx={{ 
                                flex: 1, 
                                borderRadius: 4,
                                fontSize: '5rem',
                                boxShadow: '0 10px 20px rgba(211, 47, 47, 0.3)'
                            }}
                        >
                            <RemoveIcon sx={{ fontSize: 'inherit', color: 'white' }} />
                        </Button>

                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={increment}
                            sx={{ 
                                flex: 1, 
                                borderRadius: 4,
                                fontSize: '5rem',
                                boxShadow: '0 10px 20px rgba(46, 125, 50, 0.3)'
                            }}
                        >
                            <AddIcon sx={{ fontSize: 'inherit', color: 'white' }} />
                        </Button>
                    </Stack>
                </Box>

                {/* 3. Footer */}
                <Box sx={{ pb: 1, textAlign: 'center' }}>
                    <Typography 
                        variant={isMobile ? "h6" : "h4"} 
                        sx={{ fontWeight: 'bold', color: '#333', textTransform: 'uppercase' }}
                    >
                        Sagra di Castelferro 2026
                    </Typography>
                </Box>

                {/* POPUP GRUPPI */}
                <Dialog 
                    open={openGroups} 
                    onClose={handleClosePopUpGruppi}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Gestione Gruppi
                        <IconButton onClick={handleClosePopUpGruppi}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell 
                                            align="center" 
                                            sx={{ fontWeight: 'bold', bgcolor: '#eee', borderRight: '1px solid #ccc' }}
                                        >
                                            Persone Gruppo
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#eee' }}>Numero</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow 
                                            key={row} 
                                            hover 
                                            onClick={() => handleRowClick(row)} 
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell 
                                                align="center" 
                                                sx={{ height: '40px', borderRight: '1px solid #e0e0e0' }}
                                            >{row}</TableCell>
                                            <TableCell align="center">Gruppo {row}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                </Dialog>

                {/* SNACKBAR */}
                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={3000} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    // Sposta il popup in basso (bottom) a sinistra (left)
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert 
                        onClose={() => setSnackbar({ ...snackbar, open: false })} 
                        severity={snackbar.severity} 
                        variant="filled" // Rende il colore pieno e intenso
                        sx={{ 
                            width: '100%',
                            bgcolor: '#1b5e20', // Verde molto intenso (Material Design Deep Green)
                            color: '#ffffff',    // Testo bianco
                            fontWeight: 'bold',
                            '& .MuiAlert-icon': {
                                color: '#ffffff' // Anche l'icona bianca per coerenza
                            }
                        }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
}