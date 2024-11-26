'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { DbConsumazioniPrezzo, DbConti, DbFiera, DbMenu } from '@/app/lib/definitions';
import CircularProgress from '@mui/material/CircularProgress';
import { getGiornoSagra, listConti, getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto, aggiornaConto, stampaConto, riapriConto, apriConto, getContoPiuAlto } from '@/app/lib/actions';
import { writeLog, getLastLog } from '@/app/lib/actions';
import { deltanow } from '@/app/lib/utils';
import { DataGrid, GridToolbar, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Fab, TextField, Typography } from '@mui/material';


const StyledDataGrid = styled(DataGrid)({
    '& .MuiDataGrid-columnHeader': {
        backgroundColor: 'purple', // Sfondo nero per l'header
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
    const [coperti, setCoperti] = useState<number | string>('');
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        {
            field: 'col1', headerName: 'N. Foglietto', align: 'right', renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref>
                    {params.value}
                </Link>
            )
        },
        { field: 'col2', headerName: 'Cameriere', width: 150, align: 'right' },
        { field: 'col3', headerName: 'Stampato da', width: 100, align: 'right' },
        { field: 'col4', headerName: 'Coperti', type: "number", align: 'right' }, // type: "number",
        { field: 'col5', headerName: 'Totale', type: "number", align: 'right' },
        {
            field: 'col6', headerName: 'Contatti', width: 100, align: 'right', renderCell: (params) => (
                <Fab variant="extended" size="small" color="primary" onClick={() => handleOnClickFabContanti1(Number(params.value))}>
                    <Typography variant="caption">
                        Contanti    </Typography>
                </Fab>
            )
        },
        {
            field: 'col7', headerName: 'POS', width: 100, align: 'right', renderCell: (params) => (
                <Fab variant="extended" size="small" color="primary" onClick={() => handleOnClickFabPOS1(Number(params.value))}>
                    <Typography variant="caption">
                        POS    </Typography>
                </Fab>
            )
        },
        {
            field: 'col8', headerName: 'Altro Importo', width: 150, align: 'right', renderCell: (params) => (
                <Fab variant="extended" size="small" color="primary" onClick={() => handleOnClickFabAltroImporto1(Number(params.value))}>
                    <Typography variant="caption">
                        AltroImporto    </Typography>
                </Fab>
            )
        },
    ];

    const handleOnClickFabContanti1 = async (numeroF: number) => {
        console.log('*********************HandleOnClickFabContanti1 per il conto:' + numeroF);
        if (numeroF) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(Number(numeroF), sagra.giornata, 1); //CHIUSO contanti

                await writeLog(Number(numeroF), sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato contanti');


                const conti = await listConti('*', sagra.giornata);
                if (conti) {
                    const cc = conti
                        .filter(item => item.stato === "STAMPATO")
                        .filter(item => item.id_comanda > 9) //escludo i gratuiti
                        .map((item) => {
                            // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: 999, //BRUNO cambiare con coperti
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda, //BRUNO chiuso contanti
                                col7: item.id_comanda, //BRUNO cchiuso pos
                                col8: item.id_comanda //BRUNO chiuso altroimporto
                            }

                        });
                    setPhase('chiuso');
                    setRows(cc);
                }
            };
            fetchData();
        }
    };

    const handleOnClickFabPOS1 = async (numeroF: number) => {
        console.log('*********************handleOnClickFabPOS1 per il conto:' + numeroF);
        if (numeroF) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(Number(numeroF), sagra.giornata, 2); //PAGATO POS

                await writeLog(Number(numeroF), sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato POS');

                const conti = await listConti('*', sagra.giornata);
                if (conti) {
                    const cc = conti
                        .filter(item => item.stato === "STAMPATO")
                        .filter(item => item.id_comanda > 9) //escludo i gratuiti
                        .map((item) => {
                            // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: 8888,
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda, //BRUNO chiuso contanti
                                col7: item.id_comanda, //BRUNO cchiuso pos
                                col8: item.id_comanda //BRUNO chiuso altroimport
                            }

                        });
                    setPhase('chiuso');
                    setRows(cc);
                }
            };
            fetchData();
        }

    };
    const handleOnClickFabAltroImporto1 = async (numeroF: number) => {
        setNumeroFoglietto(numeroF);
        setPhase("pagaaltroimporto");
    };


    const handleCompletatoGratis = async () => {
        console.log('*********************handleCompletatoGratis per il conto:' + numeroFoglietto);
        if (numeroFoglietto) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, 3, textValue, importValue); //PAGATO POS
                const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
                await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Altro Importo');
                setConto(cc);
                const conti = await listConti('*', sagra.giornata);
                if (conti) {
                    const cc = conti
                        .filter(item => item.stato === "STAMPATO")
                        .filter(item => item.id_comanda > 9) //escludo i gratuiti
                        .map((item) => {
                            // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: 99999, //BRUNO cambiare con coperti
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda, //BRUNO chiuso contanti
                                col7: item.id_comanda, //BRUNO cchiuso pos
                                col8: item.id_comanda
                            }

                        });
                    setPhase('chiuso');
                    setRows(cc);
                }
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
            const conti = await listConti('*', gg.giornata);
            if (conti) {
                const cc = conti
                    .filter(item => item.stato === "STAMPATO")
                    .filter(item => item.id_comanda > 9) //escludo i gratuiti
                    .map( (item) => {
                        // id: <Link href={`/dashboard/casse/${item.id}`}>{item.id}</Link>
                     /*   const gc = await getConsumazioniCassa(Number(item.id_comanda), sagra.giornata);
                        if (gc) {
                            const xxx = gc
                                .filter(tc => tc.id_piatto == 1)
                                .map((tc) => {
                                     return {
                                       Col1: tc.quantita
                                    }
                                });
                
                            setCoperti(xxx[0]?.Col1);
               
                        }
                        console.log('<<<<<<<<<<<'+coperti+'>>>>>>>>>>');        */    
                        
                        return {
                            id: item.id,
                            col1: item.id_comanda,
                            col2: item.cameriere,
                            col3: deltanow(item.data_stampa),
                            col4: 123456, //BRUNO cambiare con coperti
                            col5: item.totale.toFixed(2),
                            col6: item.id_comanda, //BRUNO chiuso contanti
                            col7: item.id_comanda, //BRUNO cchiuso pos
                            col8: item.id_comanda
                        }

                    });
                setRows(cc);
            }
            setPhase('caricato');
        }
    }

    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        if (sagra.stato == 'CHIUSA') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                                <span className="text-xl font-semibold">Warning alert!</span> | Incassa Conti
                            </div>
                        </div>
                    </div>
                </main>
            )
        } else if (phase == 'caricamento') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                            Incassa conti
                            </p>
                            <br />
                        </div>
                        <div className='text-center '>
                            <p className="text-5xl py-4">
                                Caricamento in corso ...
                            </p>
                            <CircularProgress size="9rem" />
                        </div>
                    </div>
                </main>
            );
        } else if (phase == 'elaborazione') {
            return (
                <main>
                    <div className='z-0 text-center '>
                        <br></br>
                        <br></br>
                        <br></br>
                        <br></br>
                        <br></br>
                        <br></br>
                        <p className="text-5xl py-4">
                            Elaborazione in corso ... chiudi conti
                        </p>
                        <CircularProgress size="9rem" />
                    </div>
                </main>)
        }
        else if (phase == 'pagaaltroimporto') {
            return (
                <main>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="w-[600px] p-4 border rounded-lg space-y-4">
                            <p className="text-xl py-1">
                                Conto numero: <span className="font-extrabold text-blue-800">{conto?.id_comanda} </span>
                                con incasso previsto di: <span className="font-semibold text-blue-800">{conto?.totale} Euro </span>
                            </p>
                            <TextField
                                label="Nuovo importo"
                                variant="outlined"
                                value={importValue}
                                onChange={(e) => setImportValue(e.target.value)}
                                type="number"
                                fullWidth
                            />
                            <TextField
                                label="Note"
                                variant="outlined"
                                value={textValue}
                                onChange={(e) => setTextValue(e.target.value)}
                                fullWidth
                            />
                            <div className="flex justify-center space-x-4">
                                <Button size="small" variant="contained" color="primary" onClick={handleCompletatoGratis}>
                                    Salva e chiudi
                                </Button>
                                <Button size="small" variant="contained" color="primary" onClick={handleAnnullaGratis}>
                                    Annulla
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>)
        } else if (phase == 'caricato' || phase == 'chiuso') {
            return (
                <main>

                    <div className="flex flex-wrap flex-col">
                        <div className='text-center py-4'>
                            <p className="text-5xl py-4">
                                Chiudi Conti
                            </p>
                            <p className="text-xl py-4">
                            In questa schermata appaiono solo conti chiusi da incassare.
                            </p>
                        </div>

                        <div className='text-center' style={{ height: 700, width: 'auto' }} >
                            <h2 className='font-extrabold'>Conti Giornata {sagra.giornata}</h2>
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                initialState={{
                                    density: 'compact',
                                }}
                            />
                            <br /><br />
                        </div>
                    </div>
                </main>

            );
        }
    }
    else {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )
    }
}

