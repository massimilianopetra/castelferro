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

import type { DbConsumazioni } from '@/app/lib/definitions';


export default function TabellaCucina({
    item,
    onAdd10,
    onAdd,
    onRemove,
    onSet,
    showDetailedControls // Nuova prop booleana
}: {
    item: DbConsumazioni[],
    onAdd10: (id: number) => void,
    onAdd: (id: number) => void,
    onRemove: (id: number) => void,
    onSet: (id: number) => void,
    showDetailedControls: boolean // Definizione della nuova prop
}) {

    return (
        // Condizione per mostrare la parte di codice non commentata o quella precedentemente commentata
        showDetailedControls ? (
            <div>
                <Table sx={{ minWidth: 130 }} size="small" aria-label="a dense table" className="z-0 text-3xl py-4 font-extralight text-end">
                    <TableHead>
                        {/* Header row: "Piatto" not bold, "Quantità" and "Q" are bold */}
                        <TableRow className=" text-blue-800 rounded-lg bg-gray-100 font-extralight text-end">
                            <TableCell align="left"><p className="text-base font-bold md:text-2xl">Piatto</p></TableCell>
                            <TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <p className="text-base font-bold md:text-2xl">Quantità</p>
                            </TableCell>
                            <TableCell align="left" sx={{ display: { xs: 'block', sm: 'none' } }} >
                                <p className="text-base font-bold md:text-2xl">Q</p>
                            </TableCell>
                            <TableCell className=" text-2xl " align="left"><p></p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {item.map((row, index) => ( // Added index here
                            <TableRow
                                className={`hover:bg-yellow-200`} // Conditionally apply font-bold
                                key={row.id_piatto}
                                sx={{
                                    backgroundColor: row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white",
                                }}
                            >
                                <TableCell align="left" sx={{ color: index === 0 ? 'blue' : 'inherit' }}>
                                    {row.alias.length > 8 ?
                                        <span className="text-sm sm:text-2xl">{row.alias}</span> :
                                        <span className="text-base sm:text-2xl">{row.alias}</span>
                                    }
                                </TableCell>
                                <TableCell align="left" sx={{ color: index === 0 ? 'blue' : 'inherit' }}>
                                    {row.quantita > 99 ?
                                        <span className="text-sm sm:text-2xl">{row.quantita}</span> :
                                        <span className="text-base sm:text-2xl">{row.quantita}</span>
                                    }
                                </TableCell>
                                {(row.id_comanda === 1 || row.id_comanda > 8000) && row.id_piatto === 1 ?
                                    //se è la comanda camerieri o se è asporto >8000 non posso mettere coperti.
                                    <><TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        <ButtonGroup>
                                            <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled />
                                        </ButtonGroup>&nbsp;&nbsp;&nbsp; <ButtonGroup>
                                            <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} disabled />
                                        </ButtonGroup>
                                        &nbsp;&nbsp;&nbsp;
                                        &nbsp;&nbsp;&nbsp;
                                        <ButtonGroup>
                                            <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled />
                                        </ButtonGroup>
                                    </TableCell><TableCell align="center" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                            <ButtonGroup>
                                                <Button onClick={() => onRemove(row.id_piatto)} size="small" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled />
                                            </ButtonGroup>&nbsp;&nbsp;&nbsp; <ButtonGroup>
                                                <Button onClick={() => onAdd(row.id_piatto)} size="small" variant="contained" startIcon={<AddCircleIcon />} disabled />
                                            </ButtonGroup>
                                            &nbsp;&nbsp;&nbsp;
                                            &nbsp;&nbsp;&nbsp;
                                            <ButtonGroup>
                                                <Button onClick={() => onSet(row.id_piatto)} size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled />
                                            </ButtonGroup>
                                        </TableCell></>

                                    :
                                    <><TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        <ButtonGroup>
                                            <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                        </ButtonGroup>&nbsp;&nbsp;&nbsp; <ButtonGroup>
                                            <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} />
                                        </ButtonGroup>
                                        &nbsp;&nbsp;&nbsp;
                                        &nbsp;&nbsp;&nbsp;
                                        <ButtonGroup>
                                            <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} />
                                        </ButtonGroup>
                                    </TableCell><TableCell align="center" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                            <ButtonGroup>
                                                <Button onClick={() => onRemove(row.id_piatto)} size="small" variant="outlined" startIcon={<RemoveCircleSharpIcon />} />
                                              </ButtonGroup>&nbsp;&nbsp;&nbsp; <ButtonGroup>
                                                <Button onClick={() => onAdd(row.id_piatto)} size="small" variant="contained" startIcon={<AddCircleIcon />} />
                                            </ButtonGroup>
                                        &nbsp;&nbsp;&nbsp;
                                        &nbsp;&nbsp;&nbsp;
                                            <ButtonGroup>
                                                <Button onClick={() => onSet(row.id_piatto)} size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} />
                                            </ButtonGroup>
                                        </TableCell></>
                                }
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <div>
                {/* Parte di codice precedentemente commentata, ora attivata dalla prop showDetailedControls = false */}
                <Table sx={{ minWidth: 130 }} size="small" aria-label="a dense table" className="z-0 text-3xl py-4 font-extralight text-end">
                    <TableHead>
                        {/* Header row: "Piatto" not bold, "Quantità" and "Q" are bold */}
                        <TableRow className=" text-blue-800 rounded-lg bg-gray-100 font-extralight text-end">
                            <TableCell align="left"><p className="text-base font-bold md:text-2xl">Piatto</p></TableCell>
                            <TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <p className="text-base font-bold md:text-2xl">Quantità</p>
                            </TableCell>
                            <TableCell align="left" sx={{ display: { xs: 'block', sm: 'none' } }} >
                                <p className="text-base font-bold md:text-2xl">Q</p>
                            </TableCell>
                            <TableCell className=" text-2xl " align="left"><p></p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {item.map((row, index) => ( // Added index here
                            <TableRow
                                className={`hover:bg-yellow-200 ${index === 0 ? 'font-bold' : ''}`} // Conditionally apply font-bold
                                key={row.id_piatto}
                                sx={{
                                    backgroundColor: row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white",
                                }}
                            >
                                <TableCell align="left" sx={{ color: index === 0 ? 'blue' : 'inherit' }}>
                                    {row.alias.length > 8 ?
                                        <span className="text-sm sm:text-2xl">{row.alias}</span> :
                                        <span className="text-base sm:text-2xl">{row.alias}</span>
                                    }
                                </TableCell>
                                <TableCell align="left" sx={{ color: index === 0 ? 'blue' : 'inherit' }}>
                                    {row.quantita > 99 ?
                                        <span className="text-sm sm:text-2xl">{row.quantita}</span> :
                                        <span className="text-base sm:text-2xl">{row.quantita}</span>
                                    }
                                </TableCell>

                                {(row.id_comanda === 1 || row.id_comanda > 8000) && row.id_piatto === 1 ?
                                    //se è la comanda camerieri o se è asporto >8000 non posso mettere coperti.
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    );
}
