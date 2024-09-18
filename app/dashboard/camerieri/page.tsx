'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { getListaCamerieri } from '@/app/lib/actions';
import type { DbCamerieri } from '@/app/lib/definitions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button, TextField } from '@mui/material';

export default function Cucina() {

    const [camerieri, setCamerieri] = useState<DbCamerieri[]>([]);
    const { data: session } = useSession();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const c = await getListaCamerieri();
        if (c)
            setCamerieri(c);
    }

    if ((session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center py-4'>
                        <p className="text-5xl py-4">
                            Gestione Camerieri
                        </p>
                    </div>
                    <div className='text-center'>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 500 }} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="left"><p className='font-bold'>Nome</p></TableCell>
                                        <TableCell align="left"><p className='font-bold'>Primo Foglietto</p></TableCell>
                                        <TableCell align="left"><p className='font-bold'>Ultimo Foglietto</p></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {camerieri.map((row) => (
                                        <TableRow>
                                            <TableCell align="left">
                                                <TextField
                                                    className="p-2"
                                                    variant="outlined"
                                                    value={row.nome}
                                                    sx={{
                                                        input: {
                                                            textAlign: 'right', // Allinea il testo a destra
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="left">
                                                <TextField
                                                    className="p-2"
                                                    variant="outlined"
                                                    value={row.foglietto_start}
                                                    sx={{
                                                        input: {
                                                            textAlign: 'right', // Allinea il testo a destra
                                                        },
                                                    }}
                                                    type="number"
                                                />
                                            </TableCell>
                                            <TableCell align="left">
                                                <TextField
                                                    className="p-2"
                                                    variant="outlined"
                                                    value={row.foglietto_end}
                                                    sx={{
                                                        input: {
                                                            textAlign: 'right', // Allinea il testo a destra
                                                        },
                                                    }}
                                                    type="number"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <div className='p-6'>
                            <Button className="rounded-full" variant="contained">Aggiorna Lista Camerieri</Button>
                        </div>
                    </div>
                </div>
            </main>

        )
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