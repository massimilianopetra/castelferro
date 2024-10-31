'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import { Button, Typography, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import { clearLog, clearConsumazioni, clearConti, doQuery, listTables } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import { GridColDef, DataGrid } from '@mui/x-data-grid';

/* 
select column_name, data_type, character_maximum_length
 from INFORMATION_SCHEMA.COLUMNS where table_name ='camerieri';
*/


export default function Page() {

    const [phase, setPhase] = useState('iniziale');
    const [result, setResult] = useState<any>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState('');
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Recupera i dati e aggiornali nello stato
        fetchData();
    }, []);

    async function fetchData() {
        const result = await listTables();
        console.log(result);
        if (result) {
            setOptions(result.map((item) => { return item.table_name }))
        }
    }

    const handleSvuotaLog = async () => {
        setPhase('caricamento');
        await clearLog();
        router.push(`/dashboard/dbtools`);
    };

    const handleSvuotaConsumazioni = async () => {
        setPhase('caricamento');
        await clearConsumazioni();
        await clearConti();
        router.push(`/dashboard/dbtools`);
    };

    const handleQuery = async () => {
        setPhase('caricamento');
        if (selectedTable) {
            const query = await doQuery(selectedTable);
            setResult(query);
            console.log(query);
            setPhase('caricato');
        }
    }

    // Configurazione delle colonne per il DataGrid basato sui dati ricevuti
    const columns: GridColDef[] = result?.length
        ? Object.keys(result[0]).map((key) => ({
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1),
            width: 150,
        }))
        : [];

    const renderPhaseContent = () => {
        if (phase == 'iniziale' || phase == 'caricato') {
            return (
                <div>

                    <div className='text-center py-4'>
                        <p className="text-5xl py-4">
                            DB Tools
                        </p>
                        <div className='text-center py-4'>
                            <Button size="medium" variant="contained" onClick={handleSvuotaLog}>Svuota Log</Button>
                        </div>
                        <div className='text-center py-4'>
                            <Button size="medium" variant="contained" onClick={handleSvuotaConsumazioni}>Svuota Consumazioni</Button>
                        </div>

                        <Box sx={{ maxWidth: 800, mx: "auto", my: 4, p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Visualizza Tabella
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel>Seleziona una tabella</InputLabel>
                                <Select
                                    value={selectedTable}
                                    onChange={(event) => setSelectedTable(event.target.value as string)}
                                    label="Seleziona un valore"
                                >
                                    {options.map((option, index) => (
                                        <MenuItem key={index} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={handleQuery}
                                variant="contained"
                                color="primary"
                                sx={{ mt: 2 }}
                            >
                                Esegui Query
                            </Button>

                            {result && result.length > 0 && (
                                <Box sx={{ height: 800, width: '100%', mt: 4 }}>
                                    <DataGrid
                                        rows={result.map((row: any, index: number) => ({ id: index, ...row }))}
                                        columns={columns}
                                    />
                                </Box>
                            )}
                        </Box>
                    </div>
                </div>

            );
        } else if (phase == 'caricamento') {
            return (
                <CircularProgress />
            );
        }
    }

    if ((session?.user?.name == "SuperUser")) {
        return (
            <main>
                {renderPhaseContent()}
            </main>

        );
    } else {
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