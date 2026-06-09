'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import CircularProgress from '@mui/material/CircularProgress';
import { listConti, listConsumazioni } from '@/app/lib/actions';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { BarChart } from '@mui/x-charts/BarChart';
import { Alert, Box, Typography, useMediaQuery } from '@mui/material';

// 1. Spostati i tipi e le costanti statiche fuori dal componente
type RecordCruscotto = {
    giornata: string;
    incasso: number;
    incassopos: number;
    conti: number;
    coperti: number;
    spesamediaperconti: number;
    spesamediacoperto: number;
    mediacopertiperconto: number;
};

const GIORNATE = [
    'Giovedi - 1gg', 'Venerdì - 2gg', 'Sabato - 3gg', 'Domenica - 4gg',
    'Lunedì - 5gg', 'Martedì - 6gg', 'Mercoledì - 7gg', 'Giovedì - 8gg'
];

// 2. Spostati gli styled-components fuori per evitare re-rendering e unmount continui
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
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

export default function Page() {
    const [phase, setPhase] = useState('caricamento');
    const [record, setRecord] = useState<RecordCruscotto[]>([]);
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // 3. Creiamo un array di indici [1, 2, 3, 4, 5, 6, 7, 8]
        const days = Array.from({ length: 8 }, (_, i) => i + 1);

        // 4. Eseguiamo i giorni IN PARALLELO, non in sequenza
        const results = await Promise.all(
            days.map(async (day, index) => {
                // Eseguiamo le 4 query per ogni giorno IN PARALLELO
                const [conti, contiPos, contiAltriImporti, consumazioni] = await Promise.all([
                    listConti('CHIUSO', day),
                    listConti('CHIUSOPOS', day),
                    listConti('CHIUSOALTRO', day),
                    listConsumazioni(1, day)
                ]);

                // Calcoli (logica invariata)
                const sumContanti = conti?.reduce((acc, curr) => acc + curr.totale, 0) || 0;
                const sumAltriImporti = contiAltriImporti?.reduce((acc, curr) => acc + curr.totale, 0) || 0;
                const sumPos = contiPos?.reduce((acc, curr) => acc + curr.totale, 0) || 0;

                const numCoperti = consumazioni?.reduce((acc, cons) => {
                    return cons.id_piatto === 1 ? acc + cons.quantita : acc;
                }, 0) || 0;

                const numConti = (conti?.length || 0) + (contiPos?.length || 0) + (contiAltriImporti?.length || 0);
                const totalIncassoGiorno = sumContanti + sumPos + sumAltriImporti;

                const mediaperconti = numConti > 0 ? totalIncassoGiorno / numConti : 0;
                const mediacopertiperconto = numConti > 0 ? numCoperti / numConti : 0;
                const mediapercoperto = numCoperti > 0 ? totalIncassoGiorno / numCoperti : 0;

                return {
                    giornata: GIORNATE[index],
                    incasso: totalIncassoGiorno,
                    incassopos: sumPos,
                    conti: numConti,
                    coperti: numCoperti,
                    spesamediaperconti: mediaperconti,
                    spesamediacoperto: mediapercoperto,
                    mediacopertiperconto: mediacopertiperconto
                };
            })
        );

        setRecord(results);
        setPhase('caricato');
    };

    // 5. Utilizzo di useMemo per evitare calcoli inutili ad ogni re-render
    const incassiConPercentuali = useMemo(() => {
        return record.map(item => {
            const incassoContantiEffettivo = item.incasso - item.incassopos;
            const totale = item.incasso;

            return {
                giornata: item.giornata,
                incasso: incassoContantiEffettivo,
                incassopos: item.incassopos,
                percentualeIncasso: totale > 0 ? parseFloat(((incassoContantiEffettivo / totale) * 100).toFixed(2)) : 0,
                percentualeIncassoPos: totale > 0 ? parseFloat(((item.incassopos / totale) * 100).toFixed(2)) : 0,
            };
        });
    }, [record]);

    const { totaleIncassi, totalePos, totaleCoperti } = useMemo(() => {
        return record.reduce(
            (acc, curr) => ({
                totaleIncassi: acc.totaleIncassi + curr.incasso,
                totalePos: acc.totalePos + curr.incassopos,
                totaleCoperti: acc.totaleCoperti + curr.coperti,
            }),
            { totaleIncassi: 0, totalePos: 0, totaleCoperti: 0 }
        );
    }, [record]);

    if (session?.user?.name === "SuperUser") {
        if (phase === 'caricamento') {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 4 }}>Cruscotto di Sintesi</Typography>
                    <CircularProgress size="6rem" />
                    <Typography variant="h5" sx={{ mt: 4 }}>Caricamento in corso ...</Typography>
                </Box>
            );
        } else if (phase === 'caricato') {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    width: '100%', 
                    overflowY: 'auto',
                    p: { xs: 1, sm: 2 },
                    boxSizing: 'border-box'
                }}>
                    <Box sx={{ textAlign: 'center', mb: 2, flexShrink: 0 }}>
                        <Typography variant={isMobile ? "h5" : "h3"} sx={{ fontWeight: 'bold', color: '#333' }}>
                            Cruscotto di Sintesi
                        </Typography>
                        <Typography variant={isMobile ? "subtitle2" : "body1"} sx={{ color: '#666' }}>
                            In questa schermata appaiono i risultati di sintesi giornalieri della sagra.
                        </Typography>
                    </Box>

                    {/* Container Tabella */}
                    <Box sx={{ flexShrink: 0, mb: 4 }}>
                        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                            <Table sx={{ minWidth: 700 }} aria-label="customized table" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell className="font-bold">GIORNATA</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Incasso&nbsp;</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Conti&nbsp;</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Coperti&nbsp;</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Costo Medio<br/>x Conto</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Costo Medio<br/>x Coperto</StyledTableCell>
                                        <StyledTableCell align="right" className="font-bold">Media Coperti<br/>x Conto</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {record.map((row) => (
                                        <StyledTableRow key={row.giornata}>
                                            <StyledTableCell component="th" scope="row" className="font-bold">
                                                {row.giornata}
                                            </StyledTableCell>
                                            <StyledTableCell align="right"><b>{row.incasso.toFixed(2)}&nbsp;&euro;</b><br/><small>&nbsp;POS&nbsp;{row.incassopos.toFixed(2)}&nbsp;&euro;</small></StyledTableCell>
                                            <StyledTableCell align="right">{row.conti}</StyledTableCell>
                                            <StyledTableCell align="right">{row.coperti}</StyledTableCell>
                                            <StyledTableCell align="right">{row.spesamediaperconti.toFixed(2)}&nbsp;&euro;</StyledTableCell>
                                            <StyledTableCell align="right">{row.spesamediacoperto.toFixed(2)}&nbsp;&euro;</StyledTableCell>
                                            <StyledTableCell align="right">{row.mediacopertiperconto.toFixed(2)}</StyledTableCell>
                                        </StyledTableRow>
                                    ))}
                                    {/* Totali */}
                                    <TableRow>
                                        <TableCell rowSpan={3} />
                                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Incasso totale</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {totaleIncassi.toFixed(2)}&nbsp;&euro;
                                            <Typography variant="caption" display="block" sx={{ color: '#2589FE' }}>
                                                POS: {totalePos.toFixed(2)}&nbsp;&euro;
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>Coperti totali</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totaleCoperti}
                                            <Typography variant="caption" display="block" sx={{ color: '#2589FE' }}>
                                                Media: {record.length > 0 ? (totaleCoperti / record.length).toFixed(2) : '0.00'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>Spesa media a persona</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {totaleCoperti > 0 ? (totaleIncassi / totaleCoperti).toFixed(2) : '0.00'}&nbsp;&euro;
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Grafico */}
                    <Box className='hidden sm:block' sx={{ flexShrink: 0, textAlign: 'center', pb: 4 }}>
                        <Typography variant="h5" sx={{ py: 2 }}>Grafico Incasso</Typography>
                        <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                backgroundColor: '#E0F2F7',
                                borderRadius: '16px',
                                p: 2,
                                mx: 'auto',
                                maxWidth: '1050px',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                            {record.length > 0 && (
                                <BarChart
                                    xAxis={[{ dataKey: 'giornata', scaleType: 'band' }]}
                                    series={[
                                        {
                                            dataKey: 'incasso',
                                            label: 'Contanti',
                                            stack: 'total',
                                            color: '#4CAF50',
                                            valueFormatter: (value, context) => {
                                                const item = incassiConPercentuali[context.dataIndex];
                                                return `${value?.toFixed(2)} € (${item?.percentualeIncasso.toFixed(1)}%)`;
                                            },
                                        },
                                        {
                                            dataKey: 'incassopos',
                                            label: 'POS',
                                            stack: 'total',
                                            color: '#2196F3',
                                            valueFormatter: (value, context) => {
                                                const item = incassiConPercentuali[context.dataIndex];
                                                return `${value?.toFixed(2)} € (${item?.percentualeIncassoPos.toFixed(1)}%)`;
                                            },
                                        },
                                    ]}
                                    width={isMobile ? 350 : 1000}
                                    height={400}
                                    dataset={incassiConPercentuali}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            );
        }
    } else {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="error" variant="filled">
                    <Typography variant="h6">Violazione: utente non autorizzato.</Typography>
                </Alert>
            </Box>
        )
    }
}