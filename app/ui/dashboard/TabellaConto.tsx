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
import ReceiptIcon from '@mui/icons-material/Receipt';
import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';

export default function TabellaConto({ 
    item, 
    onAdd10, 
    onAdd, 
    onRemove, 
    onSet,
    stato = '',
    numeroFoglietto = ''
}: { 
    item: DbConsumazioniPrezzo[], 
    onAdd10: (id: number) => void, 
    onAdd: (id: number) => void, 
    onRemove: (id: number) => void, 
    onSet: (id: number) => void,
    stato?: string,
    numeroFoglietto?: string | number
}) {

    let totale = 0;
    for (let i of item) {
        totale += i.quantita * i.prezzo_unitario;
    }

    return (
        <div className="z-0">

            {/* BARRA SUPERIORE (Sempre visibile) */}
            <div className="z-0 p-2 mb-2 rounded-xl bg-blue-50 flex justify-between items-center shadow-sm">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-black px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 text-sm md:text-xl tracking-wide uppercase border border-blue-400">
                    <ReceiptIcon className="hidden md:inline text-white text-xl" />
                    <span>
                        STATO: <span className="text-yellow-300 font-extrabold underline decoration-2 underline-offset-4">{stato}</span>
                        {/* Numero conto visibile solo da PC */}
                        <span className="hidden md:inline">{numeroFoglietto ? ` N. ${numeroFoglietto}` : ''}</span>
                    </span>
                </div>

                <div className="text-end text-blue-900 font-extrabold text-lg md:text-2xl pr-2">
                    <span className="hidden md:inline text-blue-900 font-black">TOTALE CONTO:&nbsp;</span>
                    <span className="font-black text-blue-700 text-xl md:text-3xl">{totale.toFixed(2)}</span>
                    <span className="font-black text-blue-700 text-xl md:text-3xl">&nbsp;&euro;</span>
                </div>
            </div>

            {/* TABELLA CONTO DENSA */}
            <TableContainer component={Paper} elevation={1} className="rounded-xl overflow-hidden border border-gray-200">
                <Table sx={{ minWidth: 150 }} size="small" aria-label="tabella conto">
                    <TableHead>
                        <TableRow className="bg-blue-100/70 border-b border-blue-200">
                            <TableCell align="left" className="py-2">
                                <p className="text-base font-bold md:text-2xl text-blue-950">Piatto</p>
                            </TableCell>

                            <TableCell align="left" sx={{ display: { xs: 'none', md: 'table-cell' } }} className="py-2">
                                <p className="text-base font-bold md:text-2xl text-blue-950">Quantità</p>
                            </TableCell>
                            <TableCell align="left" sx={{ display: { xs: 'table-cell', md: 'none' } }} className="py-2">
                                <p className="text-base font-bold md:text-2xl text-blue-950">Q</p>
                            </TableCell>

                            <TableCell align="left" className="py-2"></TableCell>

                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }} className="py-2 pr-4">
                                <p className="text-base font-bold md:text-2xl text-blue-950">Prezzo Totale</p>
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'table-cell', md: 'none' } }} className="py-2 pr-2">
                                <p className="text-base font-bold md:text-2xl text-blue-950">Totale</p>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {item.map((row) => {
                            const isCopertoDisabilitato = (row.id_comanda === 1 || row.id_comanda > 8000) && row.id_piatto === 1;

                            return (
                                <TableRow
                                    key={`${row.id_comanda}-${row.id_piatto}`}
                                    className="hover:bg-amber-100 border-b border-gray-200"
                                    sx={{
                                        backgroundColor: row.quantita > 0 ? "rgb(220 252 231)" : "white",
                                    }}
                                >
                                    {/* ALIAS PIATTO */}
                                    <TableCell align="left" className="py-1 md:py-1.5">
                                        <span className="text-base font-medium md:text-2xl text-gray-900">{row.alias}</span>
                                    </TableCell>

                                    {/* QUANTITA */}
                                    <TableCell align="left" className="py-1 md:py-1.5">
                                        <span className={`text-base md:text-2xl ${row.quantita > 0 ? 'font-black text-emerald-900' : 'font-bold text-gray-800'}`}>
                                            {row.quantita}
                                        </span>
                                    </TableCell>

                                    {/* TASTI AZIONE */}
                                    <TableCell align="left" className="py-1 md:py-1.5">
                                        {/* DESKTOP (sm e superiori) */}
                                        <div className="hidden sm:flex items-center">
                                            <ButtonGroup>
                                                <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled={isCopertoDisabilitato} />
                                                <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} disabled={isCopertoDisabilitato} />
                                            </ButtonGroup>
                                            &nbsp;&nbsp;&nbsp;
                                            <ButtonGroup>
                                                <Button onClick={() => onAdd10(row.id_piatto)} size="medium" variant="contained" startIcon={<Replay10Icon />} disabled={isCopertoDisabilitato} />
                                            </ButtonGroup>
                                            &nbsp;&nbsp;&nbsp;
                                            <ButtonGroup>
                                                <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled={isCopertoDisabilitato} />
                                            </ButtonGroup>
                                        </div>

                                        {/* MOBILE / TABLET PORTRAIT (xs) - TASTI ACCOPPIATI 2 A 2 */}
                                        <div className="flex sm:hidden items-center gap-1.5">
                                            <ButtonGroup size="small">
                                                <Button onClick={() => onRemove(row.id_piatto)} variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled={isCopertoDisabilitato} />
                                                <Button onClick={() => onAdd(row.id_piatto)} variant="contained" startIcon={<AddCircleIcon />} disabled={isCopertoDisabilitato} />
                                            </ButtonGroup>

                                            <ButtonGroup size="small">
                                                <Button onClick={() => onSet(row.id_piatto)} variant="outlined" color="secondary" startIcon={<EditIcon />} disabled={isCopertoDisabilitato} />
                                                <Button onClick={() => onAdd10(row.id_piatto)} variant="contained" color="primary" startIcon={<Replay10Icon />} disabled={isCopertoDisabilitato} />
                                            </ButtonGroup>
                                        </div>
                                    </TableCell>

                                    {/* PREZZO TOTALE COLONNA */}
                                    <TableCell align="right" className="py-1 md:py-1.5 pr-4">
                                        <span className="text-base font-bold md:text-2xl text-gray-900">
                                            {(row.quantita * row.prezzo_unitario).toFixed(2)} &euro;
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* BARRA INFERIORE */}
            <div className="p-2 mt-2 mb-1 rounded-xl bg-blue-50 flex justify-between items-center shadow-sm">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-black px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 text-sm md:text-xl tracking-wide uppercase border border-blue-400">
                    <ReceiptIcon className="hidden md:inline text-white text-xl" />
                    <span>
                        STATO: <span className="text-yellow-300 font-extrabold underline decoration-2 underline-offset-4">{stato}</span>
                        <span className="hidden md:inline">{numeroFoglietto ? ` N. ${numeroFoglietto}` : ''}</span>
                    </span>
                </div>

                <div className="text-end text-blue-900 font-extrabold text-lg md:text-2xl pr-2">
                    <span className="hidden md:inline text-blue-900 font-black">TOTALE CONTO:&nbsp;</span>
                    <span className="font-black text-blue-700 text-xl md:text-3xl">{totale.toFixed(2)}</span>
                    <span className="font-black text-blue-700 text-xl md:text-3xl">&nbsp;&euro;</span>
                </div>
            </div>

        </div>
    );
}