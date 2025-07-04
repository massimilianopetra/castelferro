'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import CircularProgress from '@mui/material/CircularProgress';
import { getListaSintesiPiatti, getSintesiPiatti, getGiornoSagra } from '@/app/lib/actions';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { DbSintesiPiatti, DbFiera } from '@/app/lib/definitions';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Typography } from '@mui/material';

export default function Page() {

  const [phase, setPhase] = useState('iniziale');
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
  const [record, setRecord] = useState<RecordElencoPiatti[]>([]);
  const [selectPiatto, setSelectPiatto] = useState<DbSintesiPiatti>();
  const [elencoPaitti, setElencoPiatti] = useState<DbSintesiPiatti[]>([]);

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
      backgroundColor: theme.palette.action.hoverOpacity,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));


  type RecordElencoPiatti = {
    piatto: string;
    prezzo: number;
    ordinati: number;
    aperti: number;
    stampati: number;
    pagatitotali: number;
    pagaticontanti: number;
    pagatipos: number;
    pagatialtro: number;
  };


  useEffect(() => {
    fetchPiatti();
  }, []);


  // Stato per il valore selezionato


  const handleChange = (event: SelectChangeEvent<string>) => {
    console.log(event.target.value);
    const selectedId = event.target.value;
    const piattoTrovato = elencoPaitti.find(piatto => piatto.id === parseInt(selectedId, 10));
    setSelectPiatto(piattoTrovato);
    fetchDati(parseInt(selectedId, 10));

  };

  const fetchPiatti = async () => {

    const gg = await getGiornoSagra();
    if (gg) {
      setSagra(gg);
      let piatti = await getListaSintesiPiatti(gg.giornata);
      if (piatti) {
        setElencoPiatti(piatti);
        setPhase('iniziale');
      }
    }
  }

  const fetchDati = async (id: number) => {

    console.log(`FetcDati id=${id} giorno=${sagra.giornata}`);
    let rows: RecordElencoPiatti[] = [];
    let op = await getSintesiPiatti(id, sagra.giornata)
    const piattoTrovato = elencoPaitti.find(piatto => piatto.id === id);
    console.log(piattoTrovato)

    if (op) {
      rows = [{
        piatto: piattoTrovato ? piattoTrovato.alias : "",
        prezzo: piattoTrovato ? piattoTrovato.prezzo : -1,
        ordinati: op.ordinati,
        aperti: op.aperto,
        stampati: op.stampati,
        pagatitotali: op.pagatocontanti + op.pagatopos + op.pagatoaltro,
        pagaticontanti: op.pagatocontanti,
        pagatipos: op.pagatopos,
        pagatialtro: op.pagatoaltro,
      }]
    }
    console.log(rows)
    setRecord(rows);
    setPhase('caricato');
  }


  if ((session?.user?.name == "SuperUser") || (session?.user?.name == "Casse")) {
    if (phase == 'iniziale') {
      return (
        <main>
          <div className="flex flex-wrap flex-col">
            <div className='text-center py-4'>
              <p className="text-5xl py-4">
                Cruscotto Piatti
              </p>
            </div>

            <div className='text-center '>

              <Box sx={{ p: 4, maxWidth: 400 }}>
                <Typography variant="h5" gutterBottom>
                  Seleziona un piatto
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>Piatto</InputLabel>
                  <Select
                    value={selectPiatto ? selectPiatto.id + "" : ""} // Qui salvi l'ID selezionato
                    onChange={handleChange}
                    label="Piatto"
                    sx={{ mt: 2 }}
                  >
                    {
                      elencoPaitti
                        .slice() // Crea una copia dell'array per evitare di modificare l'originale
                        .sort((a, b) => a.alias.localeCompare(b.alias)) // Ordina per la proprietà 'alias'
                        .map((piatto) => (
                          <MenuItem key={piatto.id} value={piatto.id}>
                            {piatto.alias}
                          </MenuItem>
                        ))
                    }
                  </Select>
                </FormControl>

              </Box>




            </div>
          </div>
        </main>
      )
    }
    if (phase == 'caricamento') {
      return (
        <><header className="top-section">
        </header>
          <main className="middle-section">
            <div className='z-0 text-center'>
              <br></br>
              <p className="text-5xl py-4">
                Cruscotto Piatti
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


      return (
        <main>
          <div className="flex flex-wrap flex-col">
            <div className='text-center py-4'>
              <p className="text-5xl py-4">
                Cruscotto Piatti
              </p>
            </div>


            <Box sx={{ p: 4, maxWidth: 400 }}>
              <Typography variant="h5" gutterBottom>
                Seleziona un piatto
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Piatto</InputLabel>
                <Select
                  value={selectPiatto ? selectPiatto.id + "" : ""} // Qui salvi l'ID selezionato
                  onChange={handleChange}
                  label="Piatto"
                  sx={{ mt: 2 }}
                >
                  {
                    elencoPaitti
                      .slice() // Crea una copia dell'array per evitare di modificare l'originale
                      .sort((a, b) => a.alias.localeCompare(b.alias)) // Ordina per la proprietà 'alias'
                      .map((piatto) => (
                        <MenuItem key={piatto.id} value={piatto.id}>
                          {piatto.alias}
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>

            </Box>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 700 }} aria-label="customized table">
                <TableHead >
                  <TableRow>
                    <StyledTableCell align="right" className="font-bold ">Piatto&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Costo&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Ordinati &nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Aperti &nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Stampati &nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Pagati Totali&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-extralight " ><p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                      Contanti N.&nbsp;
                    </p>  </StyledTableCell>
                    <StyledTableCell align="right" className="font-extralight " ><p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                      POS N.&nbsp;
                    </p>  </StyledTableCell>
                    <StyledTableCell align="right" className="font-extralight " ><p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                      Altro N.&nbsp;
                    </p>  </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.map((row) => (
                    <StyledTableRow key={row.piatto}>
                      <StyledTableCell align="right" className="font-semibold">{row.piatto}</StyledTableCell>
                      <StyledTableCell align="right" className="font-semibold">{row.prezzo.toFixed(2)}&euro;</StyledTableCell>
                      <StyledTableCell align="right" className="font-semibold">{row.ordinati}</StyledTableCell>
                      <StyledTableCell align="right" className="font-semibold">{row.aperti}</StyledTableCell>
                      <StyledTableCell align="right" className="font-semibold">{row.stampati}</StyledTableCell>
                      <StyledTableCell align="right" className="font-semibold ">{row.pagatitotali}</StyledTableCell>
                      <StyledTableCell align="right" className="font-extralight " >
                        <p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                             {row.pagaticontanti}
                        </p></StyledTableCell>
                      <StyledTableCell align="right" className="font-extralight " ><p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                            {row.pagatipos}
                        </p></StyledTableCell>
                      <StyledTableCell align="right" className="font-extralight " ><p style={{ fontSize: '0.75rem', padding: '1px 0', color: '#2589FE' }}>
                             {row.pagatialtro}
                        </p></StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

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