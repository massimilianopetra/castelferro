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
    // hide last border
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

  var rows = [
    createData('Giovedi - 1gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Venerdì - 2gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Sabato  - 3gg', 212000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Domenica - 4gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Lunedì - 5gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Martedì - 6gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Mercoledì - 7gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),
    createData('Giovedì - 8gg', 12000, 3000, 202, 1223, 45.5, 30.3, 3),


  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    for (var i = 0; i < 8; i++) {
      const conti = await listConti('CHIUSO', i + 1);
      const contiPos = await listConti('CHIUSOPOS', i + 1);
      const contiAltriImporti = await listConti('CHIUSOALTRO', i + 1);
      const cosumazioni = await listConsumazioni(1, i + 1);

      var sum = conti?.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.totale;
      }, 0);

      var sumAltriImporti = contiAltriImporti?.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.totale;
      }, 0);

      var sumPos = contiPos?.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.totale;
      }, 0);

      var numCoperti = 0
      if (cosumazioni) {
        numCoperti = cosumazioni.reduce((accumulator, cons) => {
          if (cons.id_piatto == 1)
            return accumulator + cons.quantita
          else
            return accumulator
        }, 0);
      }

      var numConti = 0;

      if (!sum) sum = 0;
      if (!sumPos) sumPos = 0;
      if (!sumAltriImporti) sumAltriImporti = 0;

      if (conti) numConti += conti.length;
      if (contiPos) numConti += contiPos.length;
      if (contiAltriImporti) numConti += contiAltriImporti.length;


      var mediaperconti = 0
      var mediacopertiperconto = 0
      if (numConti > 0) {
        mediaperconti = (sum + sumPos + sumAltriImporti) / numConti
        mediacopertiperconto = numCoperti / numConti
      }

      var mediapercoperto = 0
      if (numCoperti > 0)
        mediapercoperto = (sum + sumPos + sumAltriImporti) / numCoperti

      rows[i] = {
        ...rows[i], incasso: sum + sumPos + sumAltriImporti, incassopos: sumPos,
        conti: numConti, coperti: numCoperti, spesamediaperconti: mediaperconti, spesamediacoperto: mediapercoperto, mediacopertiperconto: mediacopertiperconto
      }

    }
    setRecord(rows);
    setPhase('caricato');
  }

  if ((session?.user?.name == "SuperUser")) {
    if (phase == 'caricamento') {
      return (
        <><header className="top-section">
        </header>
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
          </main></>
      );
    } else if (phase == 'caricato') {

      const incassi = record.map((row) => { return ({ giornata: row.giornata, incasso: row.incasso, incassopos: row.incassopos }) });
      console.log(incassi);

      return (
        <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
          {/* Contenuti statici sopra la griglia */}
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <p style={{ fontSize: '3rem', padding: '8px 0' }}>Cruscotto di Sintesi</p>
            <p style={{ fontSize: '1rem', padding: '4px 0' }}>
              In questa schermata appaiono i risultati di sintesi giornalieri della sagra.
            </p>
          </div>

          {/* Contenitore della DataGrid */}
          {/* Questo div è cruciale: diventerà un contenitore flex per la griglia */}
          <div style={{ flexGrow: 1, minHeight: 0, width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontWeight: 'extrabold' }}></h2>
            <div style={{ height: 'calc(100% - 60px)', width: '100%' }}> {/* Calcola altezza dinamica */}

              <TableContainer component={Paper} sx={{ maxHeight: 440 }}> {/* maxHeight per scroll verticale */}
                <Table sx={{ minWidth: 700 }} aria-label="customized table" stickyHeader> {/* stickyHeader per bloccare l'intestazione */}
                  <TableHead>
                    <TableRow>
                      {/* Mantieni la classe "font-bold" per Tailwind CSS, se stai usando Tailwind */}
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
                      {/* Assicurati che rowSpan e colSpan siano corretti in base alle tue celle */}
                      <TableCell rowSpan={3} /> {/* Ho cambiato rowSpan a 3 per le 3 righe riepilogative */}
                      <TableCell colSpan={2} className="text-xl font-extralight"><b>Incasso totale</b></TableCell>
                      <TableCell align="right" className="text-xl font-extralight">
                        <b>
                          {record.reduce((accumulator, currentValue) => {
                            return accumulator + currentValue.incasso;
                          }, 0).toFixed(2)}&nbsp;&euro;
                        </b><br></br><small>POS {record.reduce((accumulator, currentValue) => {
                          return accumulator + currentValue.incassopos;
                        }, 0).toFixed(2)}&nbsp;&euro;&nbsp;</small>
                      </TableCell>
                    </TableRow>
                    {/* Riga del totale coperti */}
                    <TableRow>
                      <TableCell colSpan={2} className="text-xl font-extralight">Coperti totali</TableCell>
                      <TableCell align="right" className="text-xl font-extralight">{record.reduce((accumulator, currentValue) => {
                        return accumulator + currentValue.coperti;
                      }, 0)}<br></br><small>Media coperti x giornata: {(record.reduce((accumulator, currentValue) => {
                        return accumulator + currentValue.coperti;
                      }, 0) / record.length).toFixed(2)}&nbsp;</small></TableCell>
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
            <br />
            <div className='hidden sm:block'>
              <p className="text-2xl py-4">
                Grafico Incasso
              </p>
              <BarChart
                xAxis={[{ dataKey: 'giornata', label: 'Giornata', scaleType: 'band' }]}
                series={[{ dataKey: 'incasso', label: 'Incasso' },
                { dataKey: 'incassopos', label: 'IncassoPos' }
                ]}
                width={1000}
                height={600}
                dataset={incassi}
              />
            </div>
          </div>


        </main>

        /*
        <main>
          <div className="flex flex-wrap flex-col">
            <div className='text-center py-4'>
              <p className="text-5xl py-4">
                Cruscotto di Sintesi
              </p>
            </div>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 700 }} aria-label="customized table">
                <TableHead >
                  <TableRow>
                    <StyledTableCell className="font-bold" >GIORNATA</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Incasso&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Conti&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Coperti&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Costo Medio<br></br>x Conto</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Costo Medio<br></br>x Coperto</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Media Coperti<br></br>x Conto</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.map((row) => (
                    <StyledTableRow key={row.giornata}>
                      <StyledTableCell component="th" scope="row" className="font-bold ">
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
                  <TableRow>
                    <TableCell rowSpan={5} />
                    <TableCell colSpan={2} className="text-xl  font-extralight "><b>Incasso totale</b></TableCell>
                    <TableCell align="right" className="text-xl  font-extralight ">
                      <b>
                        {record.reduce((accumulator, currentValue) => {
                          return accumulator + currentValue.incasso;
                        }, 0).toFixed(2)}&nbsp;&euro;
                      </b><br></br><small>POS {record.reduce((accumulator, currentValue) => {
                        return accumulator + currentValue.incassopos;
                      }, 0).toFixed(2)}&nbsp;&euro;&nbsp;</small>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="text-xl  font-extralight ">Coperti totali</TableCell>
                    <TableCell align="right" className="text-xl  font-extralight ">{record.reduce((accumulator, currentValue) => {
                      return accumulator + currentValue.coperti;
                    }, 0)}<br></br><small>Media coperti x giornata: {(record.reduce((accumulator, currentValue) => {
                      return accumulator + currentValue.coperti;
                    }, 0) / record.length).toFixed(2)}&nbsp;</small></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="text-xl  font-extralight ">Spesa media a persona</TableCell>
                    <TableCell align="right" className="text-xl  font-extralight ">
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
            <br></br>
            <br></br>
            <div className='hidden sm:block'>
              <p className="text-2xl py-4">
                Grafico Incasso
              </p>
              <BarChart 
                xAxis={[{ dataKey: 'giornata', label: 'Giornata', scaleType: 'band' }]}
                series={[{ dataKey: 'incasso', label: 'Incasso' },
                { dataKey: 'incassopos', label: 'IncassoPos' }
                ]}
                width={1000}
                height={600}
                dataset={incassi}
              />
            </div>
          </div>
        </main>
*/
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