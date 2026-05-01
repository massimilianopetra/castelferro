import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';

import type { DbMenu } from '@/app/lib/definitions';

export default function TabellaMenu({item, onToggle}:{item: DbMenu[], onToggle:(id:number, d:string) => void }) {
    return (
        <div className="w-full">
            <Table 
                size="small" 
                sx={{ 
                    minWidth: 450,
                    // Riduciamo il padding globale delle celle per compattare le righe
                    "& .MuiTableCell-root": {
                        padding: "4px 8px", 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' } // Testo più piccolo
                    }
                }} 
                aria-label="a dense table"
            >
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell className="font-bold">id</TableCell>
                        <TableCell className="font-bold" align="left">Piatto</TableCell>
                        <TableCell className="font-bold" align="left">&euro;</TableCell>
                        <TableCell className="font-bold" align="left">Cucina</TableCell>
                        <TableCell className="font-bold" align="left">Perc.</TableCell> 
                        <TableCell className="font-bold" align="center">Disponibile</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {item.map((row) => (
                        <TableRow 
                            key={row.id} 
                            hover // Effetto al passaggio del mouse per leggibilità
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell>{row.id}</TableCell>
                            <TableCell align="left" className="font-medium">{row.alias}</TableCell>
                            <TableCell align="left">{row.prezzo}</TableCell>
                            <TableCell align="left">{row.cucina}</TableCell>
                            <TableCell align="left">{row.percentuale}%</TableCell>
                            <TableCell align="center">
                                <Switch 
                                    size="small" // Switch più piccolo per non alzare la riga
                                    checked={row.disponibile === "Y"}
                                    onChange={() => onToggle(row.id, row.disponibile)} 
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}