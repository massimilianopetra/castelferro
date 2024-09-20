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
        <div className="z-0">
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 150 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow className=" text-gray-800 rounded-lg bg-gray-100">
                            <TableCell className="font-bold" align="left"><p>Piatto</p></TableCell>
                            <TableCell className="font-bold" align="left"><p>Quantita</p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {item.map((row) => (
                            <TableRow className="hover:bg-yellow-100" sx={{
                                backgroundColor: row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white",
                            }}>
                                <TableCell align="left">{row.piatto}</TableCell>
                                <TableCell align="left">
                                    <Button onClick={() => onAdd(row.id_piatto)} size="medium" variant="contained" startIcon={<AddCircleIcon />} />
                                    &nbsp;&nbsp;<span className="text-lg font-semibold ">{row.quantita}</span> &nbsp;&nbsp;
                                    <Button onClick={() => onRemove(row.id_piatto)} size="medium" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </div>

    );
}
