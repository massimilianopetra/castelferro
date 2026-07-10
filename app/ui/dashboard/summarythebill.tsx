import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CssBaseline
} from '@mui/material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';
import { useConfig } from '@/context/ConfigContext';

// *** Tema specifico per la stampa densa ***
const denseTheme = createTheme({
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '2px 4px',
                    borderBottom: '1px solid #e0e0e0',
                    lineHeight: '1.2',
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                body1: { fontSize: '0.85rem' },
                body2: { fontSize: '0.8rem' },
            },
        },
    },
});

// *** Styled Components ***
const ElegantContainer = styled(Paper)(({ theme }) => ({
    maxWidth: 550,
    margin: '10px auto !important', // Ridotto margine per la stampa
    padding: '8px',
    borderRadius: 12,
    backgroundColor: '#fff',
    boxShadow: 'none', // Rimosso ombra per la stampa
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: '#f5f5f5',
    '& .MuiTableCell-root': {
        fontWeight: 600,
        color: '#333',
        fontSize: '0.9rem',
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: '#fafafa',
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontSize: '0.95rem',
    color: '#303030',
    borderBottom: '1px dashed #e0e0e0',
}));

const FinalTotalBox = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    borderTop: '2px solid #000',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
}));

const FooterBox = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    borderTop: '1px dashed #e0e0e0',
    color: '#707070',
    fontSize: '0.85rem',
}));

export default function Summarythebill({ item }: { item: DbConsumazioniPrezzo[] }) {
    const config = useConfig();
    
    // Calcoli unificati in un unico ciclo
    let totale = 0;
    let coperti = 1;
    let comanda = -1;
    let giorno = -1;

    item.forEach((i) => {
        totale += i.quantita * i.prezzo_unitario;
        if (i.id_piatto === 1) coperti = i.quantita;
        if (comanda === -1) comanda = i.id_comanda;
        if (giorno === -1) giorno = i.giorno;
    });

    const subtotal = totale;
    const media = coperti !== 0 ? totale / coperti : 0;
    const currentDate = new Date().toLocaleDateString('it-IT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        <ThemeProvider theme={denseTheme}>
            <CssBaseline />
            <ElegantContainer elevation={0}>
                
                {/* Intestazione */}
                <Box sx={{ mb: 1, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 'bold' }}>
                        {config.edizione}° Edizione dal {config.inizio} al {config.fine} {config.mese} {config.anno}
                    </Typography>
                </Box>

                <TableContainer component={Box}>
                    <Table size="small">
                        <StyledTableHead>
                            <TableRow>
                                <TableCell align="left">Piatto</TableCell>
                                <TableCell align="center">Qtà</TableCell>
                                <TableCell align="right">Cad.</TableCell>
                                <TableCell align="right">Tot</TableCell>
                            </TableRow>
                        </StyledTableHead>
                        <TableBody>
                            {item.map((row, index) => (
                                row.quantita > 0 && (
                                    <StyledTableRow key={index}>
                                        <StyledTableCell align="left">
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {row.piatto}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="center">
                                            <Typography variant="body2">{row.quantita}</Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                            <Typography variant="body2">
                                                {row.prezzo_unitario.toFixed(2)}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {(row.quantita * row.prezzo_unitario).toFixed(2)}
                                            </Typography>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                )
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Box Totale con allineamento richiesto */}
                <FinalTotalBox>
                    {/* Gruppo Sinistra: A coperto */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 400 }}>
                            A coperto:
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, ml: 1 }}>
                            {media.toFixed(2)}&nbsp;€
                        </Typography>
                    </Box>

                    {/* Gruppo Destra: TOTALE */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mr: 1 }}>
                            TOTALE:
                        </Typography>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 900 }}>
                            {subtotal.toFixed(2)}&nbsp;€
                        </Typography>
                    </Box>
                </FinalTotalBox>

                {/* Footer */}
                <FooterBox sx={{ fontSize: '9px' }}>
                    Id: {comanda}_{giorno} — {currentDate}
                </FooterBox>
                
            </ElegantContainer>
        </ThemeProvider>
    );
}