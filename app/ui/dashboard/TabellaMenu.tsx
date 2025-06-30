import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';

import type { DbMenu } from '@/app/lib/definitions';

export default function TabellaMenu({item,onToggle}:{item: DbMenu[], onToggle:(id:number, d:string) => void }) {
    return (
        <div>
            <Table sx={{ minWidth: 450 }} aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell className="font-bold">id</TableCell>
                        <TableCell className="font-bold" align="left">Piatto</TableCell>
                        <TableCell className="font-bold" align="left">Prezzo</TableCell>
                        <TableCell className="font-bold" align="left">Cucina</TableCell>
                        <TableCell className="font-bold" align="left">Disponibile</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {item.map((row) => (
                        <TableRow>

                            <TableCell>{row.id}</TableCell>
                            <TableCell align="left">{row.alias}</TableCell>
                            <TableCell align="left">{row.prezzo}</TableCell>
                            <TableCell align="left">{row.cucina}</TableCell>
                            <TableCell align="left"><Switch checked={row.disponibile === "Y"}
                                onClick={() => onToggle(row.id, row.disponibile)} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

    );
}
