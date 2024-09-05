import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button } from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';

import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';

export default function TabellaCucina({ item, onAdd, onRemove }: { item: DbConsumazioniPrezzo[], onAdd: (id: number) => void, onRemove: (id: number) => void }) {

    var totale = 0;

    for (let i of item) {
        totale += i.quantita * i.prezzo_unitario;
    }

    return (
        <div>

            <div className='text-center '>
                <p className="text-3xl py-2">
                    Totale conto: {totale.toFixed(2)}
                </p>
            </div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left"><p className="font-bold">Piatto</p></TableCell>
                            <TableCell className="font-bold" align="left"><p className="font-bold">Quantità</p></TableCell>
                            <TableCell className="font-bold" align="left"><p className="font-bold">Prezzo Totlae</p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {item.map((row) => (
                            <TableRow>
                                <TableCell align="left">{row.piatto}</TableCell>
                                <TableCell align="left">
                                    <Button onClick={() => onAdd(row.id_piatto)} size="medium" variant="contained" startIcon={<AddCircleIcon />} />
                                    &nbsp;{row.quantita}&nbsp;
                                    <Button onClick={() => onRemove(row.id_piatto)} size="medium" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                </TableCell>
                                <TableCell align="left">
                                    {(row.quantita * row.prezzo_unitario).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </div>

    );
}
