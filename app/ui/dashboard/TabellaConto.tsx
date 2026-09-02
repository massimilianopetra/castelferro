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

            <Table sx={{ minWidth: 150 }} size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow className=" text-gray-800 rounded-lg bg-gray ">
                        <TableCell align="left"><p className="text-base font-bold md:text-2xl">Piatto</p></TableCell>

                        <TableCell align="left" sx={{ display: { xs: 'none', md: 'block' } }}>
                            <p className="text-base font-bold md:text-2xl">Quantità</p>
                        </TableCell>
                        <TableCell align="left" sx={{ display: { xs: 'block', md: 'none' }, }} >
                            <p className="text-base font-bold md:text-2xl">Q</p>
                        </TableCell>

                        <TableCell className=" text-base md:text-2xl " align="left"><p></p></TableCell>
                        <TableCell align="left" sx={{ display: { xs: 'none', md: 'block' } }}>
                            <p className="text-base font-bold md:text-2xl"> Prezzo Totale</p>
                        </TableCell>
                        <TableCell align="left" sx={{ display: { xs: 'block', md: 'none' }, }} >
                            <p className="text-base font-bold md:text-2xl">Totale</p>
                        </TableCell>

                    </TableRow>
                </TableHead>
                <TableBody >
 
                    {item.map((row) => (
                        <TableRow
                            key={`${row.id_comanda}-${row.id_piatto}`} // 👈 chiave unica
                            className=" md:text-2xl"
                            
                            //className="hover:bg-yellow-100 md:text-2xl" /TOLTO GIALLINO 
                            sx={{
                                backgroundColor: row.quantita > 0 ? "rgb(174, 258, 174)" : "white",
                            }}
                        >
                            <TableCell align="left">
                                <span className="text-base font-normal md:text-2xl">{row.alias}</span>
                            </TableCell>
                            <TableCell align="left">
                                <span className="text-base font-bold md:text-2xl">{row.quantita}</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            </TableCell>

                            {(row.id_comanda === 1 || row.id_comanda > 8000) && row.id_piatto === 1 ?
                                //se è la comanda camerieri o se è asporto >8000 non posso mettere coperti (disabilito tasti)
                                <><TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <ButtonGroup>
                                        <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled />
                                        <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} disabled />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup>
                                        <Button onClick={() => onAdd10(row.id_piatto)} size="medium" variant="contained" startIcon={<Replay10Icon />} disabled />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup>
                                        <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled />
                                    </ButtonGroup>
                                </TableCell><TableCell align="center" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                        <ButtonGroup>
                                            <Button onClick={() => onRemove(row.id_piatto)} size="small" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled />
                                            <Button onClick={() => onAdd(row.id_piatto)} size="small" variant="contained" startIcon={<AddCircleIcon />} disabled />
                                        </ButtonGroup>
                                        &nbsp;
                                        <ButtonGroup>
                                            <Button onClick={() => onAdd10(row.id_piatto)} size="small" variant="contained" startIcon={<Replay10Icon />} disabled />
                                            <Button onClick={() => onSet(row.id_piatto)} size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled />
                                        </ButtonGroup>
                                    </TableCell></>

                                :
                                <><TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <ButtonGroup>
                                        <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                        <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup>
                                        <Button onClick={() => onAdd10(row.id_piatto)} size="medium" variant="contained" startIcon={<Replay10Icon />} />
                                    </ButtonGroup>
                                    &nbsp;&nbsp;&nbsp;
                                    <ButtonGroup>
                                        <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} />
                                    </ButtonGroup>
                                </TableCell><TableCell align="center" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                        <ButtonGroup>
                                            <Button onClick={() => onRemove(row.id_piatto)} size="small" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                            <Button onClick={() => onAdd(row.id_piatto)} size="small" variant="contained" startIcon={<AddCircleIcon />} />
                                        </ButtonGroup>
                                        &nbsp;
                                        <ButtonGroup>
                                            <Button onClick={() => onAdd10(row.id_piatto)} size="small" variant="contained" startIcon={<Replay10Icon />} />
                                            <Button onClick={() => onSet(row.id_piatto)} size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} />
                                        </ButtonGroup>
                                    </TableCell></>

                            }

                            <TableCell align="right" className="text-base font-extralight md:text-2xl"> 
                                <span className="text-base font-bold md:text-2xl"> {(row.quantita * row.prezzo_unitario).toFixed(2)}</span>
                               
                            </TableCell>
                        </TableRow>
                    ))}
  
                </TableBody>
            </Table>


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