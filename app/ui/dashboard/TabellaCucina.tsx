import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';


import type { Consumazioni } from '@/app/lib/definitions';

export default function TabellaCucina({ item }: { item: Consumazioni[] }) {
    return (
        <div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 450 }} aria-label="simple table">
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
                                    <Button size="medium" variant="contained" startIcon={<AddIcon />} />
                                    &nbsp;&nbsp;&nbsp;{row.quantita}&nbsp;&nbsp;&nbsp;
                                    <Button  size="medium" variant="outlined" startIcon={<RemoveIcon />} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </div>

    );
}
