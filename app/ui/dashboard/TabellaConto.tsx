import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button, ButtonGroup } from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import EditIcon from '@mui/icons-material/Edit';
import Replay10Icon from '@mui/icons-material/Replay10';

import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';

export default function TabellaConto({ item, onAdd10, onAdd, onRemove, onSet  }: { item: DbConsumazioniPrezzo[],onAdd10: (id: number) => void, onAdd: (id: number) => void, onRemove: (id: number) => void, onSet: (id: number) => void }) {

    var totale = 0;

    for (let i of item) {
        totale += i.quantita * i.prezzo_unitario;
    }

    return (
        <div className="z-0">

           <div className="z-0 p-1 mb-1 text-3xl font-semibold text-blue-800 rounded-lg bg-blue-50 text-end ">
              Totale Conto: <span className="text-3xl font-extrabold ">{totale.toFixed(2)}</span> &euro;&nbsp;
            </div>
            <TableContainer component={Paper}>
                <Table  sx={{ minWidth: 150 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow className=" text-gray-800 rounded-lg bg-gray-100">
                            <TableCell align="left"><p className="text-2xl font-bold">Piatto</p></TableCell>
                            <TableCell className="text-2xl font-bold" align="center"><p className="font-bold">Quantità</p></TableCell>
                            <TableCell className=" text-2xl " align="left"><p></p></TableCell>
                            <TableCell className="text-2xl font-bold" align="right"><p className="font-bold">Prezzo Totale</p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody >
                        {item.map((row) => (
                            <TableRow className="hover:bg-yellow-100" sx={{
                                backgroundColor: row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white",
                            }}>
                                <TableCell align="left">
                                    <span className="text-2xl font-normal">{row.alias}</span>
                                </TableCell>
                                <TableCell align="left">
                                    <span className="text-3xl font-bold">{row.quantita}</span> &nbsp;&nbsp;&nbsp;&nbsp;
                                </TableCell>
                                <TableCell align="left" >
                                    <ButtonGroup >
                                        <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                        <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup >
                                        <Button onClick={() => onAdd10(row.id_piatto)} size="medium" variant="contained" startIcon={<Replay10Icon />} />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup >
                                        <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} />
                                    </ButtonGroup>
                                </TableCell>
                                <TableCell align="right" className="text-2xl font-extralight">
                                    {(row.quantita * row.prezzo_unitario).toFixed(2)}&nbsp;&euro;&nbsp;
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <div className="p-2 mb-2 text-2xl font-extralight text-blue-800 rounded-lg bg-blue-50 text-end">
               Totale Conto: <span className="text-2xl font-semibold ">{totale.toFixed(2)}</span>&euro;&nbsp;
            </div>
        </div>

    );
}
