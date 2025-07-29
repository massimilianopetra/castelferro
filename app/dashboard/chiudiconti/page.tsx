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
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const { data: session } = useSession();

    const columns: GridColDef[] = [
        {
            field: 'col1', headerName: 'N. Foglietto', align: 'right', minWidth: 50, renderCell: (params) => (
                <Link href={`/dashboard/casse/${params.value}`} passHref>
                    {params.value}
                </Link>
            )
        },
        { field: 'col2', headerName: 'Cameriere', width: 70, align: 'right', minWidth: 70 },
        { field: 'col3', headerName: 'Stampato da', width: 70, align: 'right', minWidth: 70 },
        { field: 'col4', headerName: 'Coperti', width: 40, type: "number", align: 'right', minWidth: 40 },
        { field: 'col5', headerName: 'Totale', width: 70, type: "number", align: 'right', minWidth: 80 },
        {
            field: 'col6', headerName: 'Modalità pagamento', align: 'right', width: 250, minWidth: 280, renderCell: (params) => (
                <ButtonGroup size="small" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} >
                    {/* Passa params.value alle funzioni onClick */}
                    <Button size="small" className="rounded-full" variant="contained" onClick={() => handleAChiudiPos(params.value as number)} >  POS  </Button>
                    <Button size="small" className="rounded-full" variant="contained" onClick={() => handleAChiudi(params.value as number)} >Contanti</Button>
                    <Button size="small" className="rounded-full" variant="contained" onClick={() => handleChiudiGratis(params.value as number)} >Altro Importo</Button>
                </ButtonGroup>
            )
        },

    ];
    const handleAChiudi = async (idComanda: number) => {
        console.log('*********************HandleOnClickFabContanti1 per il conto:' + idComanda);
        if (idComanda) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(idComanda, sagra.giornata, 1); //PAGATO CONTANTI
                // Non è necessario ricaricare l'intero conto specifico dopo la chiusura se non serve a nulla
                // const cc = await getConto(idComanda, sagra.giornata);
                await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato contanti');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti
                        .map((item) => {
                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: item.coperti,
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda,
                            }
                        });
                    setRows(cc);
                }
                setPhase('chiuso');
            };
            fetchData();
        }
    };

    const handleAChiudiPos = async (idComanda: number) => {
        console.log('*********************handleOnClickFabPOS1 per il conto:' + idComanda);
        if (idComanda) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(idComanda, sagra.giornata, 2); //PAGATO POS
                await writeLog(idComanda, sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato POS');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti
                        .map((item) => {
                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: item.coperti,
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda,
                            }
                        });
                    setRows(cc);
                }
                setPhase('chiuso');
            };
            fetchData();
        }
    };

    const handleChiudiGratis = async (idComanda: number) => {
        const c = await getConto(idComanda, sagra.giornata); // Recupera il conto per visualizzare i dettagli nell'altra schermata
        if (c) {
            setConto(c);
            setNumeroFoglietto(idComanda); // Imposta il numero del foglietto che verrà usato in handleCompletatoGratis
            setPhase("pagaaltroimporto");
        }
    };

    const handleCompletatoGratis = async () => {
        console.log('*********************handleCompletatoGratis per il conto:' + numeroFoglietto);
        if (numeroFoglietto) {
            const fetchData = async () => {
                setPhase('elaborazione');
                const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, 3, textValue, importValue); //PAGATO Gratis
                await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Altro Importo');
                const conti = await listContiPerChiusra(sagra.giornata);
                if (conti) {
                    const cc = conti
                        .map((item) => {

                            // var consumazione = await listConsumazioniFogliettoN(0,gg.giornata,item.id_comanda);

                            return {
                                id: item.id,
                                col1: item.id_comanda,
                                col2: item.cameriere,
                                col3: deltanow(item.data_stampa),
                                col4: item.coperti, //BRUNO cambiare con coperti
                                col5: item.totale.toFixed(2),
                                col6: item.id_comanda, //BRUNO chiuso contanti

                            }

                        });
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
                const cc = conti
                    .map((item) => {

                        // var consumazione = await listConsumazioniFogliettoN(0,gg.giornata,item.id_comanda);

                        return {
                            id: item.id,
                            col1: item.id_comanda,
                            col2: item.cameriere,
                            col3: deltanow(item.data_stampa),
                            col4: item.coperti, //BRUNO cambiare con coperti
                            col5: item.totale.toFixed(2),
                            col6: item.id_comanda, //BRUNO chiuso contanti

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
                                <span className="text-xl font-semibold">Attenzione:</span> |Incassa conti| la giornata non è stata ancora aperta!
                             </div>
                        </div>
                    </div>
                </main>
            )
        } else if (phase == 'caricamento') {
            return (
                <><header className="top-section">
                </header>
                    <main className="middle-section">
                        <div className='z-0 text-center'>
                            <br></br>
                            <p className="text-5xl py-4">
                                Incassa Conti
                            </p>
                            <br />
                            <CircularProgress size="9rem" />
                            <br />
                            <p className="text-4xl py-4">
                                Caricamento in corso ...
                            </p>

                        </div>
                    </main></>

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
                            Elaborazione in corso ... Incassa Conti
                        </p>
                        <CircularProgress size="9rem" />
                    </div>
                </main>)
        }
        else if (phase == 'pagaaltroimporto') {
            return (

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
            )
        } else if (phase == 'caricato' || phase == 'chiuso') {
            return (
                <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
                    {/* Contenuti statici sopra la griglia */}
                    <div style={{ textAlign: 'center', padding: '4px 0' }}>
                        <p style={{ fontSize: '3rem', padding: '8px 0' }}>Incassa Conti</p>
                        <p style={{ fontSize: '1rem', padding: '4px 0' }}>
                            In questa schermata appaiono solo conti chiusi da incassare della giornata corrente.
                        </p>
                    </div>

                    {/* Contenitore della DataGrid */}
                    {/* Questo div è cruciale: diventerà un contenitore flex per la griglia */}
                    <div style={{ flexGrow: 1, minHeight: 0, width: '100%', textAlign: 'center' }}>
                        <h2 style={{ fontWeight: 'extrabold' }}></h2>
                        <div style={{ height: 'calc(100% - 60px)', width: '100%' }}> {/* Calcola altezza dinamica */}
                            <StyledDataGrid
                                rows={rows}
                                columns={columns}
                                slots={{ toolbar: GridToolbar }}
                                // Se la griglia ha molte righe, è meglio gestire l'altezza tramite il contenitore
                                initialState={{
                                    density: 'compact',
                                    pagination: { paginationModel: { pageSize: 10 } }, // Esempio: 10 righe per pagina
                                }}
                            />
                        </div>
                        <br /><br />
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
                            <span className="text-xl font-semibold">Violazione:</span> utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )
    }
}

