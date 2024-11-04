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

import type { DbConsumazioni } from '@/app/lib/definitions';

export default function TabellaCucina({ item, onAdd, onRemove }: { item: DbConsumazioni[], onAdd: (id: number) => void, onRemove: (id: number) => void }) {
    return (
        <div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 150 }} size="small" aria-label="a dense table" className="z-0 xl:text-5xl xl:py-4 font-extralight text-end md:text-4xl md:py-1">
                    <TableHead>
                        <TableRow className=" text-gray-800 rounded-lg bg-gray-100 z-0 xl:text-5xl xl:py-4 font-extralight text-end md:text-4xl md:py-1">
                            <TableCell className=" text-2xl font-bold" align="left"><p>Piatto</p></TableCell>
                            <TableCell className=" text-2xl font-bold" align="left"><p>Quantità</p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {item.map((row) => ( 
                            <TableRow className="hover:bg-yellow-100" sx={{
                                backgroundColor: row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white",
                            }}>
                                <TableCell className="text-4xl font-extralight" align="left">{row.piatto}</TableCell>
                                <TableCell align="left">
                                    <span className="text-4xl font-semibold ">{row.quantita}</span> &nbsp;&nbsp;&nbsp;&nbsp;
                                    <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>

    );
}
