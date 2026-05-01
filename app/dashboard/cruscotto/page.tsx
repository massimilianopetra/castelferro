'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
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
import { ChartsText } from '@mui/x-charts'; 
import { Alert, Box, Typography, useMediaQuery } from '@mui/material';

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [record, setRecord] = useState<RecordCruscotto[]>([]);
    const { data: session } = useSession();

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

    function createData(
        giornata: string,
        incasso: number,
        incassopos: number,
        conti: number,
        coperti: number,
        spesamediaperconti: number,
        spesamediacoperto: number,
        mediacopertiperconto: number,
    ) {
        return { giornata, incasso, incassopos, conti, coperti, spesamediaperconti, spesamediacoperto, mediacopertiperconto };
    }

    var initialRows = [
        createData('Giovedi - 1gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Venerdì - 2gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Sabato - 3gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Domenica - 4gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Lunedì - 5gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Martedì - 6gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Mercoledì - 7gg', 0, 0, 0, 0, 0, 0, 0),
        createData('Giovedì - 8gg', 0, 0, 0, 0, 0, 0, 0),
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const tempRows = [...initialRows];

        for (let i = 0; i < 8; i++) {
            const conti = await listConti('CHIUSO', i + 1);
            const contiPos = await listConti('CHIUSOPOS', i + 1);
            const contiAltriImporti = await listConti('CHIUSOALTRO', i + 1);

            let sumContanti = conti?.reduce((accumulator, currentValue) => accumulator + currentValue.totale, 0) || 0;
            let sumAltriImporti = contiAltriImporti?.reduce((accumulator, currentValue) => accumulator + currentValue.totale, 0) || 0;
            let sumPos = contiPos?.reduce((accumulator, currentValue) => accumulator + currentValue.totale, 0) || 0;

            let numCoperti = 0;
            const consumazioni = await listConsumazioni(1, i + 1);
            if (consumazioni) {
                numCoperti = consumazioni.reduce((accumulator, cons) => {
                    if (cons.id_piatto == 1)
                        return accumulator + cons.quantita
                    else
                        return accumulator
                }, 0);
            }

            let numConti = 0;
            if (conti) numConti += conti.length;
            if (contiPos) numConti += contiPos.length;
            if (contiAltriImporti) numConti += contiAltriImporti.length;

            const totalIncassoGiorno = sumContanti + sumPos + sumAltriImporti;

            let mediaperconti = 0;
            let mediacopertiperconto = 0;
            if (numConti > 0) {
                mediaperconti = totalIncassoGiorno / numConti;
                mediacopertiperconto = numCoperti / numConti;
            }

            let mediapercoperto = 0;
            if (numCoperti > 0)
                mediapercoperto = totalIncassoGiorno / numCoperti;

            tempRows[i] = {
                ...tempRows[i],
                incasso: totalIncassoGiorno,
                incassopos: sumPos,
                conti: numConti,
                coperti: numCoperti,
                spesamediaperconti: mediaperconti,
                spesamediacoperto: mediapercoperto,
                mediacopertiperconto: mediacopertiperconto
            };
        }
        setRecord(tempRows);
        setPhase('caricato');
    };

    const incassiConPercentuali = record.map(item => {
        const incassoContantiEffettivo = item.incasso - item.incassopos;
        const totaleGiornalieroPerPercentuale = item.incasso;

        return {
            giornata: item.giornata,
            incasso: incassoContantiEffettivo,
            incassopos: item.incassopos,
            percentualeIncasso: totaleGiornalieroPerPercentuale > 0 ? parseFloat(((incassoContantiEffettivo / totaleGiornalieroPerPercentuale) * 100).toFixed(2)) : 0,
            percentualeIncassoPos: totaleGiornalieroPerPercentuale > 0 ? parseFloat(((item.incassopos / totaleGiornalieroPerPercentuale) * 100).toFixed(2)) : 0,
        };
    });

    const isMobile = useMediaQuery('(max-width:600px)');
    
    if ((session?.user?.name == "SuperUser")) {
        if (phase == 'caricamento') {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 4 }}>Cruscotto di Sintesi</Typography>
                    <CircularProgress size="6rem" />
                    <Typography variant="h5" sx={{ mt: 4 }}>Caricamento in corso ...</Typography>
                </Box>
            );
        } else if (phase == 'caricato') {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    width: '100%', 
                    overflowY: 'auto', // Permette lo scroll se il contenuto (tabella + grafico) eccede
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
                                            {record.reduce((a, c) => a + c.incasso, 0).toFixed(2)}&nbsp;&euro;
                                            <Typography variant="caption" display="block" sx={{ color: '#2589FE' }}>
                                                POS: {record.reduce((a, c) => a + c.incassopos, 0).toFixed(2)}&nbsp;&euro;
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>Coperti totali</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {record.reduce((a, c) => a + c.coperti, 0)}
                                            <Typography variant="caption" display="block" sx={{ color: '#2589FE' }}>
                                                Media: {(record.reduce((a, c) => a + c.coperti, 0) / record.length).toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>Spesa media a persona</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {(record.reduce((a, c) => a + c.incasso, 0) / record.reduce((a, c) => a + c.coperti, 0)).toFixed(2)}&nbsp;&euro;
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