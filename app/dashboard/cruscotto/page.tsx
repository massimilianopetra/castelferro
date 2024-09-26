'use client';

import { useState, useEffect} from 'react';
import { useSession } from 'next-auth/react'
import type { DbConti, DbFiera } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import {getGiornoSagra, listConti} from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Page() {

    const [phase, setPhase] = useState('caricamento');
    const [contoA, setContoA] = useState<DbConti[]>([]);
    const [contoC, setContoC] = useState<DbConti[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
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

      function createData(
        giornata: string,
        incasso: number,
        conti: number,
        coperti: number,
        spesamediaperconti: number,
        spesamediacoperto: number,
        mediacopertiperconto: number,
      ) {
        return { giornata, incasso, conti, coperti, spesamediaperconti, spesamediacoperto, mediacopertiperconto};
      }

      const rows = [
        createData('Giovedi - 1gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Venerdì - 2gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Sabato  - 3gg', 22000, 202, 1223, 45.5, 30.3, 3),
        createData('Domenica - 4gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Lunedì - 5gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Martedì - 6gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Mercoledì - 7gg', 12000, 202, 1223, 45.5, 30.3, 3),
        createData('Giovedì - 8gg', 12000, 202, 1223, 45.5, 30.3, 3),

        
      ];
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const ccA = await listConti('APERTO', gg.giornata);
            if (ccA) {
                setContoA(ccA);
            }
            const ccC = await listConti('CHIUSO', gg.giornata);
            if (ccC) {
                setContoC(ccC);
            }

            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "SuperUser")) {
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
                            <CircularProgress />
                        </div>
                    </div>
                </main>
            );
        } else if (phase == 'caricato') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Cruscotto di Sintesi  
                            </p>
                        </div>
                        <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell className="font-bold" >GIORNATA</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Incasso&nbsp;</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Conti&nbsp;</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Coperti&nbsp;</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Media<br></br>Conto</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Media<br></br>Coperto</StyledTableCell>
            <StyledTableCell align="right" className="font-bold ">Media Coperto<br></br>Conto</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <StyledTableRow key={row.giornata}>
              <StyledTableCell component="th" scope="row" className="font-bold ">
                {row.giornata}
              </StyledTableCell>
              <StyledTableCell align="right">{row.incasso}&nbsp;&euro;</StyledTableCell>
              <StyledTableCell align="right">{row.conti}</StyledTableCell>
              <StyledTableCell align="right">{row.coperti}</StyledTableCell>
              <StyledTableCell align="right">{row.spesamediaperconti}&nbsp;&euro;</StyledTableCell>
              <StyledTableCell align="right">{row.spesamediacoperto}&nbsp;&euro;</StyledTableCell>
              <StyledTableCell align="right">{row.mediacopertiperconto}</StyledTableCell>
            </StyledTableRow>
          ))}
          <TableRow>
            <TableCell rowSpan={5} />
            <TableCell colSpan={2} className="text-xl  font-extralight ">Incasso totale</TableCell>
            <TableCell align="right" className="text-xl  font-extralight ">130000&nbsp;&euro;</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="text-xl  font-extralight ">Coperti totali</TableCell>
            <TableCell align="right" className="text-xl  font-extralight ">12550</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="text-xl  font-extralight ">Spesa media a persona</TableCell>
            <TableCell align="right" className="text-xl  font-extralight ">20.2&nbsp;&euro;</TableCell>
          </TableRow>
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