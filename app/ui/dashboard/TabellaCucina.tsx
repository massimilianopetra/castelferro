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

export default function TabellaCucina({ item,onAdd,onRemove }: { item: DbConsumazioni[],onAdd:(id:number) => void,onRemove:(id:number) => void }) {
    return (
        <div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell className="font-bold" align="left">Piatto</TableCell>
                            <TableCell className="font-bold" align="left">Quantita</TableCell>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </div>

    );
}
