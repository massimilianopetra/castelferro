import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button} from '@mui/base/Button';

import type { Consumazioni } from '@/app/lib/definitions';

export default function TabellaCucina({item}:{item: Consumazioni[]}) {
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
                                <TableCell align="left"><Button>+</Button> {row.quantita} <Button>-</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </div>

    );
}
