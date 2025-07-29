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
import { ChartsText } from '@mui/x-charts'; // Assicurati che ChartsText sia importato correttamente
import { Box, Typography } from '@mui/material';

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
        // nasconde l'ultimo bordo della riga
        '&:last-child td, &:last-child th': {
            border: 0,
        },
    }));

    type RecordCruscotto = {
        giornata: string;
        incasso: number; // Incasso totale (Contanti + POS + Altro)
        incassopos: number; // Solo incasso da POS
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
            // Mantieni le proprietà per le percentuali, saranno usate nei valueFormatter
            percentualeIncasso: totaleGiornalieroPerPercentuale > 0 ? parseFloat(((incassoContantiEffettivo / totaleGiornalieroPerPercentuale) * 100).toFixed(2)) : 0,
            percentualeIncassoPos: totaleGiornalieroPerPercentuale > 0 ? parseFloat(((item.incassopos / totaleGiornalieroPerPercentuale) * 100).toFixed(2)) : 0,
        };
    });

    // Funzione helper per renderizzare le etichette degli importi con simbolo Euro
    const renderMoneyLabels = ({ x, y, width, height, value, color }: any) => {
        if (typeof value === 'number' && !isNaN(value) && value > 0) {
            return (
                <ChartsText
                x={x + width / 2}
                y={y - 10}
                textAnchor="middle"
                fill={color}
                fontSize={12}
                fontWeight="bold" text={''}                >
                    {`${value.toFixed(2)} €`}
                </ChartsText>
            );
        }
        return null;
    };


    if ((session?.user?.name == "SuperUser")) {
        if (phase == 'caricamento') {
            return (
                <>
                    <header className="top-section"></header>
                    <main className="middle-section">
                        <div className='z-0 text-center'>
                            <br></br>
                            <p className="text-5xl py-4">
                                Cruscotto di Sintesi
                            </p>
                            <br />
                            <CircularProgress size="9rem" />
                            <br />
                            <p className="text-4xl py-4">
                                Caricamento in corso ...
                            </p>
                        </div>
                    </main>
                </>
            );
        } else if (phase == 'caricato') {
            return (
                <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                    {/* Contenuti statici sopra la griglia */}
                    <div style={{ textAlign: 'center', padding: '4px 0' }}>
                        <p style={{ fontSize: '3rem', padding: '8px 0' }}>Cruscotto di Sintesi</p>
                        <p style={{ fontSize: '1rem', padding: '4px 0' }}>
                            In questa schermata appaiono i risultati di sintesi giornalieri della sagra.
                        </p>
                    </div>

                    {/* Contenitore della Tabella */}
                    <div style={{ flexGrow: 1, minHeight: 0, width: '100%', textAlign: 'center' }}>
                        <h2 style={{ fontWeight: 'extrabold' }}></h2>
                        <div style={{ height: 'calc(80% - 60px)', width: '100%' }}>

                            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                                <Table sx={{ minWidth: 700 }} aria-label="customized table" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell className="font-bold">GIORNATA</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Incasso&nbsp;</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Conti&nbsp;</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Coperti&nbsp;</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Costo Medio<br></br>x Conto</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Costo Medio<br></br>x Coperto</StyledTableCell>
                                            <StyledTableCell align="right" className="font-bold">Media Coperti<br></br>x Conto</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {record.map((row) => (
                                            <StyledTableRow key={row.giornata}>
                                                <StyledTableCell component="th" scope="row" className="font-bold">
                                                    {row.giornata}
                                                </StyledTableCell>
                                                <StyledTableCell align="right"><b>{row.incasso.toFixed(2)}&nbsp;&euro;</b><br></br><small>&nbsp;POS&nbsp;{row.incassopos.toFixed(2)}&nbsp;&euro;</small></StyledTableCell>
                                                <StyledTableCell align="right">{row.conti}</StyledTableCell>
                                                <StyledTableCell align="right">{row.coperti}</StyledTableCell>
                                                <StyledTableCell align="right">{row.spesamediaperconti.toFixed(2)}&nbsp;&euro;</StyledTableCell>
                                                <StyledTableCell align="right">{row.spesamediacoperto.toFixed(2)}&nbsp;&euro;</StyledTableCell>
                                                <StyledTableCell align="right">{row.mediacopertiperconto.toFixed(2)}</StyledTableCell>
                                            </StyledTableRow>
                                        ))}
                                        {/* Riga del totale dell'incasso */}
                                        <TableRow>
                                            <TableCell rowSpan={3} />
                                            <TableCell colSpan={2} className="text-xl font-extralight"><b>Incasso totale</b></TableCell>
                                            <TableCell align="right" className="text-xl font-extralight">
                                                <b>
                                                    {record.reduce((accumulator, currentValue) => {
                                                        return accumulator + currentValue.incasso;
                                                    }, 0).toFixed(2)}&nbsp;&euro;
                                                </b><br></br>
                                                {/* Visibile solo su schermi medi e grandi */}
                                                <Typography sx={{ display: { xs: 'none', md: 'block' } }} style={{ fontSize: '1rem', padding: '1px 0', color: '#2589FE' }}>
                                                    POS: {record.reduce((accumulator, currentValue) => {
                                                        return accumulator + currentValue.incassopos;
                                                    }, 0).toFixed(2)}&nbsp;&euro;&nbsp;
                                                </Typography>

                                                {/* Visibile solo su schermi extra-small */}
                                                <Typography sx={{ display: { xs: 'block', md: 'none' } }} style={{ fontSize: '0.75rem', padding: '1px 0', color: '#ff89FE' }}>
                                                    POS: {record.reduce((accumulator, currentValue) => {
                                                        return accumulator + currentValue.incassopos;
                                                    }, 0).toFixed(2)}&nbsp;&euro;&nbsp;
                                                </Typography>

                                            </TableCell>
                                        </TableRow>
                                        {/* Riga del totale coperti */}
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-xl font-extralight">Coperti totali</TableCell>
                                            <TableCell align="right" className="text-xl font-extralight">{record.reduce((accumulator, currentValue) => {
                                                return accumulator + currentValue.coperti;
                                            }, 0)}<br />

                                                {/* Visibile solo su schermi medi e grandi */}
                                                <Typography sx={{ display: { xs: 'none', md: 'block' } }} style={{ fontSize: '1rem', padding: '1px 0', color: '#2589FE' }}>
                                                    Media coperti giornata: {(record.reduce((accumulator, currentValue) => {
                                                        return accumulator + currentValue.coperti;
                                                    }, 0) / record.length).toFixed(2)}
                                                </Typography>

                                                {/* Visibile solo su schermi extra-small */}
                                                <Typography sx={{ display: { xs: 'block', md: 'none' } }} style={{ fontSize: '0.75rem', padding: '1px 0', color: '#ff89FE' }}>
                                                    Media coperti giornata: {(record.reduce((accumulator, currentValue) => {
                                                        return accumulator + currentValue.coperti;
                                                    }, 0) / record.length).toFixed(2)}
                                                </Typography>

                                            </TableCell>
                                        </TableRow>
                                        {/* Riga della spesa media */}
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-xl font-extralight">Spesa media a persona</TableCell>
                                            <TableCell align="right" className="text-xl font-extralight">
                                                {(record.reduce((accumulator, currentValue) => {
                                                    return accumulator + currentValue.incasso;
                                                }, 0) / record.reduce((accumulator, currentValue) => {
                                                    return accumulator + currentValue.coperti;
                                                }, 0)).toFixed(2)}&nbsp;&euro;
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>

                        {/* Grafico visibile solo su schermi grandi (hidden sm:block) */}
                        <div className='hidden sm:block'>
                            <p className="text-2xl py-4">
                                Grafico Incasso
                            </p>
                            {/* Box per centrare il grafico e applicare lo sfondo */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 'auto',
                                    backgroundColor: '#E0F2F7',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    margin: '20px auto',
                                    maxWidth: '1050px'
                                }}
                            >
                                {/* Il BarChart viene renderizzato solo se ci sono dati */}
                                {record.length > 0 && (
                                    <BarChart
                                        xAxis={[{ dataKey: 'giornata', label: 'Giornata', scaleType: 'band' }]}
                                        series={[
                                            // Serie per l'incasso contanti (parte dell'incasso totale non POS)
                                            {
                                                dataKey: 'incasso',
                                                label: 'Incasso (Contanti)',
                                                stack: 'total',
                                                color: '#4CAF50', // Verde
                                                valueFormatter: (value, context) => {
                                                    if (typeof value === 'number' && !isNaN(value)) {
                                                        // Usa context.dataIndex per accedere al dato corrispondente
                                                        const item = incassiConPercentuali[context.dataIndex];
                                                        const percentuale = item ? item.percentualeIncasso : 0;
                                                        return `${value.toFixed(2)} € (${percentuale.toFixed(1)}%)`;
                                                    }
                                                    return 'N/A';
                                                },
                                                // Ho rimosso renderCell qui come discusso in precedenza se non vuoi le etichette delle barre
                                                // renderCell: (params) => renderMoneyLabels({ ...params, color: '#4CAF50' }),
                                            },
                                            // Serie per l'incasso POS
                                            {
                                                dataKey: 'incassopos',
                                                label: 'Incasso (POS)',
                                                stack: 'total',
                                                color: '#2196F3', // Blu
                                                valueFormatter: (value, context) => {
                                                    if (typeof value === 'number' && !isNaN(value)) {
                                                        // Usa context.dataIndex per accedere al dato corrispondente
                                                        const item = incassiConPercentuali[context.dataIndex];
                                                        const percentuale = item ? item.percentualeIncassoPos : 0;
                                                        return `${value.toFixed(2)} € (${percentuale.toFixed(1)}%)`;
                                                    }
                                                    return 'N/A';
                                                },
                                                // Ho rimosso renderCell qui come discusso in precedenza se non vuoi le etichette delle barre
                                                // renderCell: (params) => renderMoneyLabels({ ...params, color: '#2196F3' }),
                                            },
                                            // Le serie per le percentuali gialle e viola sono state rimosse da qui
                                        ]}
                                        yAxis={[
                                            { id: 'money', scaleType: 'linear', label: 'Importo (€)' },
                                            { id: 'percent', scaleType: 'linear', label: 'Percentuale (%)', max: 100, min: 0 }
                                        ]}
                                        width={1000}
                                        height={600}
                                        dataset={incassiConPercentuali}
                                    />
                                )}
                            </Box>
                        </div>
                    </div>
                </main>
            );
        }
    }
    else {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Violazione:</span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>
        )
    }
}