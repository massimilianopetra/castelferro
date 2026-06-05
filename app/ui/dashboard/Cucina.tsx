'use client';
import { memo } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button, ButtonGroup, Snackbar, TextField, Modal, Box, Typography, IconButton } from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';
import type { DbConsumazioni, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import {
    getConsumazioni,
    sendConsumazioni,
    getConto,
    apriConto,
    getCamerieri,
    updateTotaleConto,
    writeLog,
    getGiornoSagra,
    getLastLog,
    getCountTicketsNonSeduti,
    getMenu,
    getTickets,
    listConsumazioni
} from '@/app/lib/actions';

import TabellaCucina from '@/app/ui/dashboard/TabellaCucina';

const styleModal = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    height: '90vh',
    maxWidth: '1200px',
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    border: '4px solid #1976d2',
    boxShadow: 24,
    p: 4,
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
};

export default function Cucina({ nomeCucina }: { nomeCucina: string }) {

    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const [phase, setPhase] = useState('iniziale');
    const [isNewConto, setIsNewConto] = useState(false); // <-- Stato per tracciare se il conto è nuovo o pre-esistente
    const [lastLog, setLastLog] = useState<DbLog[]>([]);
    const [products, setProducts] = useState<DbConsumazioni[]>([]);
    const [iniProducts, setIniProducts] = useState<DbConsumazioni[]>([]);
    const [numero, setNumero] = useState<number | string>('');
    const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const [conto, setConto] = useState<DbConti>();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openPopup, setOpenPopup] = useState(false);
    const [showAlternateView, setShowAlternateView] = useState(false);
    const [nuovaquantitaValue, setQuantitaValue] = useState('');
    const [idmodificaquantitaValue, setIdModQuantita] = useState(1);
    const [piattomodificaquantitaValue, setPiattoModQuantita] = useState("non definito");
    const [copertiInAttesa, setCopertiInAttesa] = useState(0);
    const [menuPrevisionale, setMenuPrevisionale] = useState<any[]>([]);
    const [dettaglioCoperti, setDettaglioCoperti] = useState({ seduti: 0, inCoda: 0, serviti: 0 });
    const [snackbarMessage, setSnackbarMessage] = useState('');
    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) {
                setSagra(gg);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
        setNumero(event.target.value);
    const handleClose = () => setOpenSnackbar(false);
    const handleClosePopup = () => setOpenPopup(false);
    const handleToggleView = () =>
        setShowAlternateView(prev => !prev);
    const handleButtonClickCaricaConto1 = () => carica(1);

    /* ------------------------------CARICAMENTO CONTO------------------------------ */
    async function carica(num: number) {
        if (isNaN(num) || num < 1 || num > 8999) {
            // Decidiamo qui il messaggio usando direttamente il parametro 'num' passato alla funzione
            if (num > 9999) {
                setSnackbarMessage("3. Inserisci un numero foglietto valido (minore di 8999)");
            } else {
                setSnackbarMessage("4 .Hai inserito un numero riservato asporto (compreso tra 9000 e 9999)");
            }
            setOpenSnackbar(true);
            return;
        }
        setPhase('caricamento');

        const [c, cc] = await Promise.all([
            getConsumazioni(nomeCucina, num, sagra.giornata, 'MUST_BE_AVAILABLE'),
            getConto(num, sagra.giornata)
        ]);

        if (c) {
            setProducts(c);
            setIniProducts(c);
        }
        setNumeroFoglietto(num);

        if (cc) {
            setConto(cc);
            setIsNewConto(false); // Il conto esiste già sul database
            if (['CHIUSO', 'STAMPATO', 'CHIUSOPOS', 'CHIUSOALTRO'].includes(cc.stato)) {
                setPhase('bloccato');
                return;
            }
            if (cc.cameriere === 'Sconosciuto') {
                setPhase('sconosciuto');
                return;
            }

            await writeLog(num, sagra.giornata, nomeCucina, '', 'OPEN', '');
            const logs = await getLastLog(sagra.giornata, nomeCucina);
            if (logs) setLastLog(logs);

            setPhase('caricato');
        } else {
            const cameriere = await getCamerieri(num);
            if (!cameriere || cameriere === 'Sconosciuto') {
                setPhase('sconosciuto');
                return;
            }

            setIsNewConto(true); // È un conto nuovo, non ancora registrato sul DB
            setConto({
                foglietto: num,
                giornata: sagra.giornata,
                cameriere: cameriere,
                stato: 'APERTO'
            } as any);

            setPhase('caricato');
        }
    }

    const handleButtonClickCarica = () => {
        carica(Number(numero));
        setNumero('');
    };

    const handleButtonClickAnnulla = () => {
        setPhase('iniziale');
        setProducts([]);
        setIniProducts([]);
    };

    const caricaStatistiche = async () => {
        try {
            const [
                inCoda,
                ticketSedutiRows,
                consumazioniCoperti,
                fullMenu
            ] = await Promise.all([
                getCountTicketsNonSeduti(),
                getTickets('seduti'),
                listConsumazioni(1, sagra.giornata),
                getMenu()
            ]);

            const seduti = ticketSedutiRows?.reduce((acc, curr) => acc + curr.numpersone, 0) || 0;
            const serviti = consumazioniCoperti?.reduce((acc, curr) => acc + curr.quantita, 0) || 0;
            const totale = (seduti + inCoda) - serviti;

            setDettaglioCoperti({ seduti, inCoda, serviti });
            setCopertiInAttesa(Math.max(0, totale));

            if (fullMenu) {
                const filtrato = fullMenu.filter(m => m.cucina === nomeCucina);
                setMenuPrevisionale(filtrato);
            }

            setOpenPopup(true);
        } catch (error) {
            console.error("Errore durante il caricamento delle statistiche della cucina:", error);
        }
    };

    /* ------------------------------INVIO CONSUMAZIONI------------------------------ */
    const handleButtonClickInvia = async () => {
        const haPortateValide = products.some(item => item.quantita > 0);

        // NUOVO CONTROLLO: Se il conto è NUOVO (isNewConto === true) e non ha piatti (> 0),
        // allora usciamo subito senza toccare il DB, pulendo solo la schermata.
        if (!haPortateValide && isNewConto) {
            setPhase('iniziale');
            setProducts([]);
            setIniProducts([]);
            return;
        }

        // Se invece il conto è NUOVO ma ha portate valide, lo apriamo sul DB adesso.
        if (isNewConto) {
            await apriConto(Number(numeroFoglietto), sagra.giornata, conto?.cameriere || 'Sconosciuto');
            await writeLog(Number(numeroFoglietto), sagra.giornata, nomeCucina, '', 'START', '');
            setIsNewConto(false);
        }

        // Se siamo arrivati qui, significa che:
        // - O il conto era nuovo e aveva piatti validi (quindi l'abbiamo aperto sopra)
        // - O il conto esisteva già (e quindi anche se lo azzeri del tutto, procediamo a salvare gli zeri sul DB)
        let gc = await getConto(Number(numeroFoglietto), sagra.giornata);

        if (gc?.stato !== "APERTO") {
            setPhase('bloccato');
            return;
        }

        // Prepariamo i log delle variazioni di quantità
        const logPromises = products
            .map(item => {
                const orig = iniProducts.find(o => o.id_piatto === item.id_piatto);
                const origQuantita = orig ? orig.quantita : 0;
                if (item.quantita === origQuantita) return null;

                const message = item.quantita > origQuantita
                    ? `Aggiunti: ${item.quantita - origQuantita} ${item.piatto}`
                    : `Eliminati: ${origQuantita - item.quantita} ${item.piatto}`;

                return writeLog(item.id_comanda, sagra.giornata, nomeCucina, '', 'UPDATE', message);
            })
            .filter((p): p is Promise<any> => p !== null);

        // Inviamo l'aggiornamento (comprese le quantità azzerate) al database
        await Promise.all([
            ...logPromises,
            sendConsumazioni(products)
        ]);

        await updateTotaleConto(Number(numeroFoglietto), sagra.giornata);

        const logs = await getLastLog(sagra.giornata, nomeCucina);
        if (logs) setLastLog(logs);

        setPhase('inviato');
        setProducts([]);
        setIniProducts([]);
    };


    /* ------------------------------       MODIFICA QUANTITA'    ------------------------------ */
    const updateQuantity = useCallback((id: number, delta: number) => {
        setProducts(prevProducts => prevProducts.map(item =>
            item.id_piatto === id
                ? { ...item, quantita: Math.max(0, item.quantita + delta) }
                : item
        ));
    }, []);

    const handleAdd = useCallback((id: number) => updateQuantity(id, 1), [updateQuantity]);
    const handleAdd10 = useCallback((id: number) => updateQuantity(id, 10), [updateQuantity]);
    const handleRemove = useCallback((id: number) => updateQuantity(id, -1), [updateQuantity]);

    const handleSet = useCallback((id: number) => {
        setProducts(prevProducts => {
            const item = prevProducts.find(p => p.id_piatto === id);
            if (!item) return prevProducts;
            setIdModQuantita(id);
            setPiattoModQuantita(item.piatto);
            setQuantitaValue(String(item.quantita));
            setPhase('modificaquantita');
            return prevProducts;
        });
    }, []);

    const handleModificaQuantita = () => {
        setProducts(products.map(item =>
            item.id_piatto === idmodificaquantitaValue
                ? { ...item, quantita: Number(nuovaquantitaValue) }
                : item
        ));
        setPhase('caricato');
    };

    const handleAnnulla = () => setPhase('caricato');

    const renderPhaseContent = () => {
        if (phase === 'iniziale')
            return (
                <div className='text-center'>
                    <p className="text-5xl py-4">Caricare un numero foglietto!!</p>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleToggleView}
                        sx={{ mt: 3, borderRadius: '9999px' }}
                    >
                        {showAlternateView
                            ? 'Disattiva Visualizzazione Elementare'
                            : 'Attiva Visualizzazione Elementare'}
                    </Button>
                </div>
            );

        if (phase === 'caricamento')
            return (
                <div className='text-center'>
                    <p className="text-5xl py-4">Cucina</p>
                    <CircularProgress size="9rem" />
                    <p className="text-5xl py-4">Caricamento in corso ...</p>
                </div>
            );

        if (phase === 'caricato')
            return (
                <TabellaCucina
                    item={products}
                    onAdd10={handleAdd10}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onSet={handleSet}
                    showDetailedControls={showAlternateView}
                />
            );

        if (phase === 'inviato')
            return (
                <div className='text-center'>
                    <p className="text-5xl py-4">Inviato con successo!!</p>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleToggleView}
                        sx={{ mt: 3, borderRadius: '9999px' }}
                    >
                        {showAlternateView
                            ? 'Disattiva Visualizzazione Elementare'
                            : 'Attiva Visualizzazione Elementare'}
                    </Button>
                </div>
            );

        if (phase === 'sconosciuto')
            return (
                <div className='text-center'>
                    <p className="text-5xl py-4">
                        Conto non valido: cameriere sconosciuto!
                    </p>
                </div>
            );

        if (phase === 'bloccato')
            return (
                <div className='text-center'>
                    <p className="text-5xl py-4">
                        Conto non valido: bloccato dalle casse!
                    </p>
                </div>
            );

        if (phase === 'modificaquantita')
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-[600px] p-4 space-y-4 border-4 border-blue-600 shadow-2xl bg-blue-200 rounded">
                        <p className="text-xl">
                            Per il conto numero:
                            <span className="font-extrabold text-blue-800">
                                {numeroFoglietto}
                            </span>
                            inserisci la quantità per:
                            <span className="font-extrabold text-blue-800">
                                {piattomodificaquantitaValue}
                            </span>
                        </p>
                        <TextField
                            label="Modifica quantità"
                            variant="outlined"
                            value={nuovaquantitaValue}
                            onChange={(e) => setQuantitaValue(e.target.value)}
                            type="number"
                            fullWidth
                        />
                        <div className="flex justify-center space-x-4">
                            <Button variant="contained" onClick={handleModificaQuantita}>
                                Salva
                            </Button>
                            <Button variant="contained" onClick={handleAnnulla}>
                                Annulla
                            </Button>
                        </div>
                    </div>
                </div>
            );
        return null;
    };

    if ((session?.user?.name == nomeCucina) || (session?.user?.name == "SuperUser")) {
        if (sagra.stato == 'CHIUSA') {
            return (
                <main>
                    <div className="flex flex-wrap flex-col">
                        <div className='text-center '>
                            <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                                <span className="text-xl font-semibold">Attenzione</span> |Cucina| La giornata non è stata ancora aperta!
                            </div>
                        </div>
                    </div>
                </main>
            );
        } else {
            return (
                <main>
                    <div className="container_cucine">
                        {phase !== 'caricato' && phase !== 'modificaquantita' ? (
                            <header className="header_cucine_sup">
                                <div className="p-30 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                                    <ul className="flex" style={{ borderRadius: '9999px' }}>
                                        <li className="flex-1 mr-2font-bold py-2 ">
                                            <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                                                {nomeCucina}
                                            </a>
                                            <div className="text-xs text-center text-blue-700 ">SAGRA:
                                                <span className="text-xs text-center text-blue-800 font-semibold">{sagra.stato}&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</span>
                                            </div>
                                        </li>
                                        <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4 rounded-full " style={{ borderRadius: '9999px' }}>
                                            <div className='text-center text-emerald-600'>
                                                <TextField
                                                    autoFocus
                                                    className="p-2"
                                                    label="Numero Foglietto"
                                                    variant="outlined"
                                                    value={numero}
                                                    onChange={handleInputChange}
                                                    style={{ borderRadius: '9999px' }}
                                                    sx={{
                                                        input: {
                                                            textAlign: 'right',
                                                        },
                                                    }}
                                                    type="number"
                                                />
                                            </div>
                                        </li>
                                        <li className="text-left flex-1 mr-2 text-3xl lg:text-4xl  font-bold py-4 rounded-full">
                                            <Button className="rounded-full" size="large" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                                        </li>
                                    </ul>
                                </div>
                            </header>
                        ) : null}

                        {phase !== 'caricato' && phase !== 'modificaquantita' ? (
                            <header className="header_cucine_inf">
                                <div className="z-0 xl:text-3xl font-extralight xl:text-end lg:text-3xl lg:py-2 lg:text-center">
                                    {showAlternateView ? (
                                        <p className="flex items-center justify-center">
                                            <Button size="large" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                                            <IconButton onClick={caricaStatistiche} color="primary" sx={{ ml: 1, border: '1px solid', padding: '10px' }}>
                                                <StarsIcon fontSize="large" />
                                            </IconButton>
                                        </p>
                                    ) : (
                                        <div className="flex items-center justify-end">
                                            <ButtonGroup sx={{ display: { xs: 'none', sm: 'block' } }}>
                                                {lastLog.map((row) => (
                                                    <span key={row.foglietto}>
                                                        <Button size="large" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} >{row.foglietto}</Button>
                                                        &nbsp;&nbsp;
                                                    </span>
                                                ))}
                                                <Button size="large" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                                            </ButtonGroup>
                                            <IconButton onClick={caricaStatistiche} color="primary" sx={{ ml: 2, border: '2px solid', bgcolor: 'white' }}>
                                                <StarsIcon fontSize="large" />
                                            </IconButton>
                                            <ButtonGroup sx={{ display: { xs: 'block', sm: 'none' } }}>
                                                {lastLog.map((row) => (
                                                    <span key={row.foglietto}>
                                                        <Button size="small" className="rounded-full text-xl" variant="contained" style={{ borderRadius: '9999px' }} onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} >{row.foglietto}</Button>
                                                        &nbsp;&nbsp;
                                                    </span>
                                                ))}
                                                <Button size="small" color="secondary" className="font-semibold rounded-full" variant="outlined" style={{ borderRadius: '9999px' }} onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                                            </ButtonGroup>
                                        </div>
                                    )}
                                </div>
                            </header>
                        ) : (
                            <div className="flex justify-between items-center w-full">
                                <div className="flex space-x-8">
                                    <p className="z-0 text-xl lg:text-3xl font-extralight">
                                        Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}</span>
                                    </p>
                                    <p className="z-0 text-xl lg:text-3xl font-extralight">
                                        Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mainContent_cucine_p">{renderPhaseContent()}</div>

                        <footer className="footer_cucine">
                            <div className="flex justify-between items-center w-full">
                                <Button
                                    size="large"
                                    variant="contained"
                                    onClick={handleButtonClickInvia}
                                    disabled={phase !== 'caricato'}
                                    sx={{ padding: '15px 30px', fontSize: '1.5rem', minWidth: '200px' }}
                                    style={{ borderRadius: '9999px' }}
                                >
                                    Invia
                                </Button>
                                <Button
                                    size="large"
                                    variant="contained"
                                    onClick={handleButtonClickAnnulla}
                                    disabled={phase !== 'caricato'}
                                    sx={{ padding: '15px 30px', fontSize: '1.5rem', minWidth: '200px' }}
                                    style={{ borderRadius: '9999px' }}
                                >
                                    Annulla
                                </Button>
                            </div>
                        </footer>
                    </div>

                    <Modal open={openPopup} onClose={handleClosePopup} aria-labelledby="modal-stats-title">
                        <Box sx={{ ...styleModal, p: 2, width: '90%', maxWidth: '450px', height: 'auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }}>
                            <Typography id="modal-stats-title" variant="h6" color="primary" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                                Statistiche: {nomeCucina}
                            </Typography>
                            <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f0f7ff', borderRadius: '8px', border: '1px solid #d0e3ff', flexShrink: 0 }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.2, fontWeight: 'medium' }}>
                                    Coperti da servire: <b className="text-blue-700" style={{ fontSize: '1.3rem', marginLeft: '4px' }}>{copertiInAttesa}</b>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                                    Formula: ({dettaglioCoperti.seduti} + {dettaglioCoperti.inCoda}) - {dettaglioCoperti.serviti } seduti + in coda - serviti
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: '0.65rem', color: 'gray', fontWeight: 'bold', display: 'block', flexShrink: 0 }}>
                                Previsione piatti
                            </Typography>
                            <Box sx={{ border: '1px solid #eee', borderRadius: '4px', flexGrow: 0, height: 'auto', maxHeight: '40vh', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fa' }}>
                                        <tr style={{ borderBottom: '2px solid #1976d2' }}>
                                            <th style={{ textAlign: 'left', padding: '6px 10px' }}>Piatto</th>
                                            <th style={{ textAlign: 'right', padding: '6px 10px' }}>Calcolo</th>
                                            <th style={{ textAlign: 'right', padding: '6px 10px' }}>Stima</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {menuPrevisionale.map((item) => {
                                            const percentualeDecimale = item.percentuale / 100;
                                            const quantitaPrevista = Math.ceil(copertiInAttesa * percentualeDecimale);
                                            return (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '4px 10px' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#333' }}>{item.piatto}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#888' }}>{item.percentuale}%</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '4px 10px', color: '#666', fontSize: '0.75rem' }}>
                                                        {copertiInAttesa}×{percentualeDecimale.toFixed(2)}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '4px 10px' }}>
                                                        <b style={{ fontSize: '1.05rem', color: '#1976d2' }}>{quantitaPrevista}</b>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </Box>
                            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                <Button variant="contained" onClick={handleClosePopup} size="small" sx={{ borderRadius: '20px', px: 4, textTransform: 'none' }}>
                                    Chiudi
                                </Button>
                            </Box>
                        </Box>
                    </Modal>

                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={6001}
                        onClose={handleClose}
                        message={snackbarMessage} // <-- ORA LEGGE IL MESSAGGIO SALVA
                    />
                    <Snackbar

                    />
                </main>
            );
        }
    } else {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Accesso Negato</span>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
}