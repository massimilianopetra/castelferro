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
import { Box, Typography, useMediaQuery, Alert } from '@mui/material';

export default function Page() {
    const [phase, setPhase] = useState('caricamento');
    const [record, setRecord] = useState<RecordCruscotto[]>([]);
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: "#2f6feb",
            color: "white",
            fontWeight: "bold",
            fontSize: isMobile ? 14 : 16,
        },
        [`&.${tableCellClasses.body}`]: {
            color: "#2f6feb",
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

    useEffect(() => {
        const fetchData = async () => {
            const initialRows = [
                "Giovedi - 1giorno", "Venerdì - 2giorno", "Sabato - 3giorno", "Domenica - 4giorno",
                "Lunedì - 5giorno", "Martedì - 6giorno", "Mercoledì - 7giorno", "Giovedì - 8giorno"
            ].map(day => createData(day, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));

            const conti = await listContiGratis();
            const cosumazioni = await listConsumazioniGratis();
            
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
            <Box sx={{ p: 4 }}><Alert severity="error">Violazione: utente non autorizzato.</Alert></Box>
        );
    }

    if (phase === "caricamento") {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size="6rem" />
                <Typography variant="h5" sx={{ mt: 2 }}>Caricamento in corso ...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            width: '100%', 
            overflow: 'hidden', // Evita il doppio scroll della pagina
            p: { xs: 1, sm: 2 } 
        }}>
            {/* Header statico */}
            <Box sx={{ textAlign: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant={isMobile ? "h5" : "h3"} sx={{ fontWeight: 'bold', color: '#333' }}>
                    Cruscotto di Sintesi Conti Gratis
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                    Foglietti dal 1 al 9 esclusi dalla contabilizzazione ordinaria
                </Typography>
            </Box>

            {/* Container Tabella con Scroll Interno */}
            <TableContainer component={Paper} sx={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: 2
            }}>
                <Table stickyHeader size="small" sx={{ minWidth: 1500 }}>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>GIORNATA</StyledTableCell>
                            <StyledTableCell align="right">Valore Tot</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 1<br/><small>Camerieri</small></StyledTableCell>
                            <StyledTableCell align="right">Foglietto 2</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 3</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 4</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 5</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 6</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 7</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 8</StyledTableCell>
                            <StyledTableCell align="right">Foglietto 9</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {record.map((row) => (
                            <StyledTableRow key={row.giornata}>
                                <StyledTableCell sx={{ fontWeight: 'bold' }}>{row.giornata}</StyledTableCell>
                                <StyledTableCell align="right"><b>{row.incasso.toFixed(2)} €</b></StyledTableCell>
                                <StyledTableCell align="right">
                                    {row.incassoconto1.toFixed(2)} €<br/>
                                    <small><b>N.Cons: {row.consumazioni1}</b></small><br/>
                                    <small>B: {row.consumazionibirre} | P: {row.consumazionipatatine} | A: {row.consumazioniagnolotti}</small>
                                </StyledTableCell>
                                {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                    <StyledTableCell key={n} align="right">
                                        {(row as any)[`incassoconto${n}`].toFixed(2)} €<br/>
                                        <small><b>N.Cons: {(row as any)[`consumazioni${n}`]}</b></small>
                                    </StyledTableCell>
                                ))}
                            </StyledTableRow>
                        ))}
                        {/* Riga Totali */}
                        <TableRow sx={{ backgroundColor: '#f0f4ff' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                TOTALE COMPLESSIVO:
                            </TableCell>
                            <TableCell align="right" colSpan={9} sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2f6feb' }}>
                                {record.reduce((a, b) => a + b.incasso, 0).toFixed(2)} € 
                                <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                                    (Consumazioni totali: {record.reduce((a, b) => a + b.consumazionitot, 0)})
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}