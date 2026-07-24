import { memo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Button, ButtonGroup } from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import EditIcon from '@mui/icons-material/Edit';
import Replay10Icon from '@mui/icons-material/Replay10';

import type { DbConsumazioni } from '@/app/lib/definitions';

interface TabellaCucinaProps {
    item: DbConsumazioni[];
    onAdd10: (id: number) => void;
    onAdd: (id: number) => void;
    onRemove: (id: number) => void;
    onSet: (id: number) => void;
    showDetailedControls: boolean;
}

// ABBIAMO TOLTO "export default" DA QUI PER EVITARE IL DOPPIO EXPORT DEL FILE
function TabellaCucina({
    item,
    onAdd10,
    onAdd,
    onRemove,
    onSet,
    showDetailedControls
}: TabellaCucinaProps) {

    return (
        <div>
            <Table sx={{ minWidth: 130 }} size="small" aria-label="a dense table" className="z-0 text-3xl py-4 font-extralight text-end">
                <TableHead>
                    <TableRow className="text-blue-800 rounded-lg bg-gray-100 font-extralight text-end">
                        <TableCell align="left"><p className="text-base font-bold md:text-2xl">Piatto</p></TableCell>
                        <TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}><p className="text-base font-bold md:text-2xl">Qtà</p></TableCell>
                        <TableCell align="left" sx={{ display: { xs: 'block', sm: 'none' } }}><p className="text-base font-bold md:text-2xl">Q</p></TableCell>
                        <TableCell className="text-2xl" align="left"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {item.map((row, index) => {
                        const isFirstRow = index === 0;
                        const isRowDisabled = (row.id_comanda === 1 || row.id_comanda > 8000) && row.id_piatto === 1;
                        const rowBgColor = row.quantita > 0 ? "rgba(144, 238, 144, 0.3)" : "white";
                        const cellColor = isFirstRow ? 'blue' : 'inherit';

                        return (
                            <TableRow key={row.id_piatto} className={`hover:bg-yellow-200 ${!showDetailedControls && isFirstRow ? 'font-bold' : ''}`} sx={{ backgroundColor: rowBgColor }}>
                                <TableCell align="left" sx={{ color: cellColor }}>
                                    <span className={row.alias.length > 8 ? "text-sm sm:text-2xl" : "text-base sm:text-2xl"}>{row.alias}</span>
                                </TableCell>
                                <TableCell align="left" sx={{ color: cellColor }}>
                                    <span className={row.quantita > 99 ? "text-sm sm:text-2xl" : "text-base sm:text-2xl"}>{row.quantita}</span>
                                </TableCell>
                                <TableCell align="left" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    <ButtonGroup>
                                        <Button onClick={() => onRemove(row.id_piatto)} size="large" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled={isRowDisabled} />
                                        {showDetailedControls && <></>} 
                                        <Button onClick={() => onAdd(row.id_piatto)} size="large" variant="contained" startIcon={<AddCircleIcon />} disabled={isRowDisabled} />
                                    </ButtonGroup>
                                    &nbsp;
                                    {!showDetailedControls && (
                                        <>
                                            <ButtonGroup>
                                                <Button onClick={() => onAdd10(row.id_piatto)} size="medium" variant="contained" startIcon={<Replay10Icon />} disabled={isRowDisabled} />
                                            </ButtonGroup>
                                        </>
                                    )}
                                    <ButtonGroup>
                                        <Button onClick={() => onSet(row.id_piatto)} size="medium" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled={isRowDisabled} />
                                    </ButtonGroup>
                                </TableCell>
                                <TableCell align="center" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    <ButtonGroup>
                                        <Button onClick={() => onRemove(row.id_piatto)} size="small" variant="outlined" startIcon={<RemoveCircleSharpIcon />} disabled={isRowDisabled} />
                                        <Button onClick={() => onAdd(row.id_piatto)} size="small" variant="contained" startIcon={<AddCircleIcon />} disabled={isRowDisabled} />
                                    </ButtonGroup>
                                    &nbsp;
                                    <ButtonGroup>
                                        {!showDetailedControls && (
                                            <Button onClick={() => onAdd10(row.id_piatto)} size="small" variant="contained" startIcon={<Replay10Icon />} disabled={isRowDisabled} />
                                        )}
                                        <Button onClick={() => onSet(row.id_piatto)} size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} disabled={isRowDisabled} />
                                    </ButtonGroup>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

// UNICO EXPORT DI DEFAULT DEL FILE, PROTETTO DA MEMO
export default memo(TabellaCucina, (prevProps, nextProps) => {
    return (
        prevProps.showDetailedControls === nextProps.showDetailedControls &&
        prevProps.item.length === nextProps.item.length &&
        prevProps.item.every((item, idx) => item.quantita === nextProps.item[idx].quantita)
    );
});