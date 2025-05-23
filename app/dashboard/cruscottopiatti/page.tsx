'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import CircularProgress from '@mui/material/CircularProgress';
import { getListaSintesiPiatti, getSintesiPiatti } from '@/app/lib/actions';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { DbSintesiPiatti } from '@/app/lib/definitions';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Typography } from '@mui/material';

export default function Page() {

  const [phase, setPhase] = useState('iniziale');
  const [record, setRecord] = useState<RecordElencoPiatti[]>([]);
  const [selectPiatto, setSelectPiatto] = useState<string>('');
  const [selectPiattoId, setSelectPiattoId] = useState<number>(-1);
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
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));


  type RecordElencoPiatti = {
    piatto: string;
    costo_piatto: number;
    ordinati_paganti: number;
    dicui_stampati: number;
    dicui_pagati: number;
    dicui_dapagare: number;
    dicui_pagaticontanti: number;
    dicui_pagatipos: number;
    dicui_pagatialtro: number;
    dicui_dapagarecontanti: number;
    dicui_dapagareipos: number;
    dicui_dapagarealtro: number;
  };


  useEffect(() => {
    fetchPiatti();
  }, []);


  // Stato per il valore selezionato


  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedId = event.target.value;
    setSelectPiatto(selectedId);
    console.log(parseInt(selectedId,10),selectedId)
    fetchDati(parseInt(selectedId,10));

  };

  const fetchPiatti = async () => {

    let piatti = await getListaSintesiPiatti(1);

    if (piatti) {
      setElencoPiatti(piatti);
      setPhase('iniziale');
    }
  }

  const fetchDati = async (id: number) => {

    console.log("FetcDati");
    let rows: RecordElencoPiatti[] = [] ;
    let op = await getSintesiPiatti(id, 1)
    if (op) {
        rows = [{
        piatto: selectPiatto,
        costo_piatto: -1,
        ordinati_paganti: op,
        dicui_stampati: -1,
        dicui_pagati: -1,
        dicui_dapagare: -1,
        dicui_pagaticontanti: -1,
        dicui_pagatipos: -1,
        dicui_pagatialtro: -1,
        dicui_dapagarecontanti: -1,
        dicui_dapagareipos: -1,
        dicui_dapagarealtro: -1,
      }]
    }

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
                    value={selectPiatto} // Qui salvi l'ID selezionato
                    onChange={handleChange}
                    label="Piatto"
                    sx={{ mt: 2 }}
                  >
                    {elencoPaitti.map((piatto) => (
                      <MenuItem key={piatto.id} value={piatto.id}> {/* Value = ID */}
                        {piatto.alias} {/* Visualizzato = Alias */}
                      </MenuItem>
                    ))}
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
        <main>
          <div className="flex flex-wrap flex-col">
            <div className='text-center py-4'>
              <p className="text-5xl py-4">
                Cruscotto di Sintesi
              </p>
            </div>
            <div className='text-center '>
              <p className="text-5xl py-4">
                Caricamento in corso ...
              </p>
              <CircularProgress size="9rem" />
            </div>
          </div>
        </main>
      );
    } else if (phase == 'caricato') {

      const sintesi_portata = record.map((row) => {
        return ({
          piatto: row.piatto,
          costo: row.costo_piatto,
          ordinati: row.ordinati_paganti,
          stampati: row.dicui_stampati,
          dapagare: row.dicui_dapagare
        })
      });
      console.log(sintesi_portata);

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
                  value={selectPiatto} // Qui salvi l'ID selezionato
                  onChange={handleChange}
                  label="Piatto"
                  sx={{ mt: 2 }}
                >
                  {elencoPaitti.map((piatto) => (
                    <MenuItem key={piatto.id} value={piatto.id}> {/* Value = ID */}
                      {piatto.alias} {/* Visualizzato = Alias */}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

            </Box>



            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 700 }} aria-label="customized table">
                <TableHead >
                  <TableRow>
                    <StyledTableCell align="right" className="font-bold ">Piatto&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Costo&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Ordinati N.&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Stampati N.&nbsp;</StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">Da Pagare N.&nbsp;</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sintesi_portata.map((row) => (
                    <StyledTableRow key={row.piatto}>
                      <StyledTableCell align="right">{row.piatto}</StyledTableCell>
                      <StyledTableCell align="right">{row.costo}&euro;</StyledTableCell>
                      <StyledTableCell align="right">{row.ordinati}</StyledTableCell>
                      <StyledTableCell align="right">{row.stampati}</StyledTableCell>
                      <StyledTableCell align="right">{row.dapagare}</StyledTableCell>

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
              <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
            </div>
          </div>
        </div>
      </main>

    )
  }
}