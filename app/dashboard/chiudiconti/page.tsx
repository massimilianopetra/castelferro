'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConsumazioniPrezzo, DbConti, DbFiera, DbMenu } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti, getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto } from '@/app/lib/actions';
import { writeLog, getLastLog, listContiPerChiusra } from '@/app/lib/actions';
import { deltanow } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, ButtonGroup, Fab, Stack, TextField, Typography } from '@mui/material';


const StyledDataGrid = styled(DataGrid)({
    '& .MuiDataGrid-columnHeader': {
        backgroundColor: 'purple', // Sfondo viola per l'header
        color: 'white',           // Testo bianco
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 'bold',       // Testo in grassetto
    },
    "& .MuiDataGrid-sortIcon": {
        color: "white",
    },
    "& .MuiDataGrid-menuIconButton": {
        opacity: 1,
        color: "white"
    },
});

export default function Page() {

    const [importValue, setImportValue] = useState('');
    const [textValue, setTextValue] = useState('');
    const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
    const [conto, setConto] = useState<DbConti>();
    const [phase, setPhase] = useState('caricamento');
    const [rows, setRows] = useState<any[]>([]);
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    // DEFINIZIONE COLONNE: flex permette l'espansione dinamica al 100%
    const columns: GridColDef[] = [
        {
            field: 'col1', 
            headerName: 'N. Foglietto', 
            align: 'right', 
            minWidth: 100, 
            flex: 1, 
            renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref>
                    {params.value}
                </Link>
            )
        },
        { field: 'col2', headerName: 'Cameriere', minWidth: 120, flex: 1.5, align: 'right' },
        { field: 'col3', headerName: 'Stampato da', minWidth: 120, flex: 1.5, align: 'right' },
        { field: 'col4', headerName: 'Coperti', type: "number", minWidth: 80, flex: 1, align: 'right' },
        { field: 'col5', headerName: 'Totale (€)', type: "number", minWidth: 100, flex: 1, align: 'right' },
        {
            field: 'col6', 
            headerName: 'Modalità pagamento', 
            align: 'center', 
            minWidth: 320, 
            flex: 3, // Spazio maggiore per i pulsanti
            renderCell: (params) => (
                <ButtonGroup size="small" variant="contained" sx={{ borderRadius: '9999px' }} >
                    <Button onClick={() => handleAChiudiPos(params.value as number)} >POS</Button>
                    <Button onClick={() => handleAChiudi(params.value as number)} >Contanti</Button>
                    <Button onClick={() => handleChiudiGratis(params.value as number)} >Altro Importo</Button>
                </ButtonGroup>
            )
        },
    ];

    const handleAChiudi = async (idComanda: number) => {
        if (idComanda) {
            const fetchData = async () => {
                setPhase('elaborazione');
                await chiudiConto(idComanda, sagra.giornata, 1);
                await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato contanti');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti.map((item) => ({
                        id: item.id,
                        col1: item.id_comanda,
                        col2: item.cameriere,
                        col3: deltanow(item.data_stampa),
                        col4: item.coperti,
                        col5: item.totale.toFixed(2),
                        col6: item.id_comanda,
                    }));
                    setRows(cc);
                }
                setPhase('chiuso');
            };
            fetchData();
        }
    };

    const handleAChiudiPos = async (idComanda: number) => {
        if (idComanda) {
            const fetchData = async () => {
                setPhase('elaborazione');
                await chiudiConto(idComanda, sagra.giornata, 2);
                await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato POS');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti.map((item) => ({
                        id: item.id,
                        col1: item.id_comanda,
                        col2: item.cameriere,
                        col3: deltanow(item.data_stampa),
                        col4: item.coperti,
                        col5: item.totale.toFixed(2),
                        col6: item.id_comanda,
                    }));
                    setRows(cc);
                }
                setPhase('chiuso');
            };
            fetchData();
        }
    };

    const handleChiudiGratis = async (idComanda: number) => {
        const c = await getConto(idComanda, sagra.giornata);
        if (c) {
            setConto(c);
            setNumeroFoglietto(idComanda);
            setPhase("pagaaltroimporto");
        }
    };

    const handleCompletatoGratis = async () => {
        if (numeroFoglietto) {
            const fetchData = async () => {
                setPhase('elaborazione');
                await chiudiConto(Number(numeroFoglietto), sagra.giornata, 3, textValue, importValue);
                await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Altro Importo');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti.map((item) => ({
                        id: item.id,
                        col1: item.id_comanda,
                        col2: item.cameriere,
                        col3: deltanow(item.data_stampa),
                        col4: item.coperti,
                        col5: item.totale.toFixed(2),
                        col6: item.id_comanda,
                    }));
                    setRows(cc);
                }
                setPhase('chiuso');
            };
            fetchData();
        }
    };

    const handleAnnullaGratis = async () => {
        setPhase('caricato');
    }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gg = await getGiornoSagra();
        if (gg) {
            setSagra(gg);
            const conti = await listContiPerChiusra(gg.giornata);
            if (conti) {
                const cc = conti.map((item) => ({
                    id: item.id,
                    col1: item.id_comanda,
                    col2: item.cameriere,
                    col3: deltanow(item.data_stampa),
                    col4: item.coperti,
                    col5: item.totale.toFixed(2),
                    col6: item.id_comanda,
                }));
                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        if (sagra.stato == 'CHIUSA') {
            return (
                <main className="p-4">
                    <div className="text-center">
                        <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                            <span className="text-xl font-semibold">Attenzione:</span> |Incassa conti| la giornata non è stata ancora aperta!
                        </div>
                    </div>
                </main>
            )
        } else if (phase == 'caricamento') {
            return (
                <main className="flex flex-col items-center justify-center h-screen text-center">
                    <p className="text-5xl py-4">Incassa Conti</p>
                    <CircularProgress size="6rem" />
                    <p className="text-4xl py-4">Caricamento in corso ...</p>
                </main>
            );
        } else if (phase == 'elaborazione') {
            return (
                <main className="flex flex-col items-center justify-center h-screen text-center">
                    <p className="text-5xl py-4">Elaborazione in corso ...</p>
                    <CircularProgress size="6rem" />
                </main>
            )
        }
        else if (phase == 'pagaaltroimporto') {
            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-[600px] p-6 border rounded-lg shadow-sm space-y-4 bg-white">
                        <p className="text-xl">
                            Conto numero: <span className="font-extrabold text-blue-800">{conto?.id_comanda}</span><br/>
                            Incasso previsto: <span className="font-semibold text-blue-800">{conto?.totale} Euro</span>
                        </p>
                        <TextField label="Nuovo importo" variant="outlined" value={importValue} onChange={(e) => setImportValue(e.target.value)} type="number" fullWidth />
                        <TextField label="Note" variant="outlined" value={textValue} onChange={(e) => setTextValue(e.target.value)} fullWidth />
                        <div className="flex justify-center gap-4">
                            <Button variant="contained" color="primary" onClick={handleCompletatoGratis}>Salva e chiudi</Button>
                            <Button variant="outlined" onClick={handleAnnullaGratis}>Annulla</Button>
                        </div>
                    </div>
                </div>
            )
        } else if (phase == 'caricato' || phase == 'chiuso') {
            return (
                <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <p className="text-4xl md:text-5xl font-bold py-2">Incassa Conti</p>
                        <p className="text-gray-600">
                            In questa schermata appaiono solo conti chiusi da incassare della giornata corrente.
                        </p>
                    </div>

                    <div style={{ flexGrow: 1, padding: '0 10px 10px 10px', width: '100%' }}>
                        <div style={{ height: '100%', width: '100%' }}>
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                autosizeOnMount
                                disableRowSelectionOnClick
                                initialState={{
                                    density: 'compact',
                                    pagination: { paginationModel: { pageSize: 25 } },
                                }}
                            />
                        </div>
                    </div>
                </main>
            );
        }
    } else {
        return (
            <main className="p-4 text-center">
                <div className="p-4 text-red-800 rounded-lg bg-red-50">
                    <span className="font-semibold">Violazione:</span> utente non autorizzato.
                </div>
            </main>
        )
    }
}