'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button, ButtonGroup, Link, Snackbar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,CircularProgress,
  Box,
  Typography
} from '@mui/material';
import Filter1Icon from '@mui/icons-material/Filter1';
import * as React from 'react';

import type { DbConsumazioniPrezzo, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import {
  getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto,
  aggiornaConto, stampaConto, riapriConto, apriConto, getContoPiuAlto,
  writeLog, getGiornoSagra, getLastLog
} from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';
import { useConfig } from '@/context/ConfigContext';

import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import Summary from '@/app/ui/dashboard/summary';
import Summarythebill from '@/app/ui/dashboard/summarythebill';

export default function Page({ params }: { params: { foglietto: string } }) {
  const config = useConfig();
  const router = useRouter();
  const { data: session } = useSession();

  const printRef = useRef<HTMLDivElement | null>(null);

  const [importValue, setImportValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [phase, setPhase] = useState('elaborazione');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [products, setProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [iniProducts, setIniProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [numero, setNumero] = useState<number | string>('');
  const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
  const [conto, setConto] = useState<DbConti>();
  const [lastLog, setLastLog] = useState<DbLog[]>([]);
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
  const [isNewConto, setIsNewConto] = useState(false);
const [isPrinting, setIsPrinting] = useState(false);
  const [openDialogQty, setOpenDialogQty] = useState(false);
  const [tempQty, setTempQty] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('');

  const [copertipass, setCopertiPass] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      const gg = await getGiornoSagra();
      if (gg) {
        setSagra(gg);
        const log = await getLastLog(gg.giornata, 'Casse');
        if (log) setLastLog(log);

        const num = +params.foglietto;
        if (isNaN(num) || num < 1 || num > 9999) {
          setSnackbarMessage("Il foglietto non è gestibile.");
          setOpenSnackbar(true);
          return;
        }

        const c = await getConsumazioniCassa(num, gg.giornata);
        if (c) {
          setProducts(c);
          setIniProducts(c);
          setCopertiPass(c.find((o) => o.id_piatto === 1)?.quantita || 0);
        }

        const cc = await getConto(num, gg.giornata);
        setConto(cc);
        setNumeroFoglietto(num.toString());

        if (cc?.stato == 'APERTO' || cc?.stato == 'STAMPATO') {
          setIsNewConto(false);
          await writeLog(num, gg.giornata, 'Casse', '', 'OPEN', '');
          const refreshedLog = await getLastLog(gg.giornata, 'Casse');
          if (refreshedLog) setLastLog(refreshedLog);
          setPhase(cc.stato === 'APERTO' ? 'aperto' : 'stampato');
        } else if (['CHIUSO', 'CHIUSOPOS', 'CHIUSOALTRO'].includes(cc?.stato || '')) {
          setIsNewConto(false);
          setPhase('chiuso');
        } else {
          // Se il conto non esiste, NON chiamiamo apriConto qui.
          // Lo teniamo solo in memoria locale
          setIsNewConto(true);
          setPhase('aperto');
        }
      }
    };
    fetchData();
  }, [params.foglietto]);

  const handleOpenSetQty = (id: number) => {
    const p = products.find(i => i.id_piatto === id);
    if (p) {
      setSelectedProductId(id);
      setSelectedProductName(p.alias || p.piatto);
      setTempQty(p.quantita.toString());
      setOpenDialogQty(true);
    }
  };

  const handleConfirmQty = () => {
    if (selectedProductId !== null) {
      const newQty = parseInt(tempQty) || 0;
      setProducts(prev => prev.map(item =>
        item.id_piatto === selectedProductId
          ? { ...item, quantita: newQty, cucina: "Casse" }
          : item
      ));
      setPhase('modificato');
    }
    setOpenDialogQty(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setNumero(e.target.value);
  const carica = (num: number | string) => router.push(`/dashboard/casse/${num}`);

  const handleButtonClickCarica = async () => {
    const num = Number(numero);
    if (num > 9999 || isNaN(num) || num < 1) {
      setSnackbarMessage("Foglietto non valido.");
      setOpenSnackbar(true);
      return;
    }
    carica(numero);
    setNumero('');
  };

  const handleButtonClickCaricaAsporto = async () => {
    const ultconto = await getContoPiuAlto();
    let uc = Number(ultconto);
    if (isNaN(uc) || uc < 9000) uc = 9000;
    carica(uc + 1);
  };

  const handleButtonClickCaricaConto1 = () => carica(1);

  // LOGICA DI SALVATAGGIO INTEGRATA
  const checkAndSaveToDb = async () => {
    const haPortate = products.some(p => p.quantita > 0);
    if (!haPortate) {
        setSnackbarMessage("Inserire almeno una portata prima di salvare.");
        setOpenSnackbar(true);
        return false;
    }

    if (isNewConto) {
        await apriConto(Number(numeroFoglietto), sagra.giornata, 'Casse');
        await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'START', 'Creazione differita');
        setIsNewConto(false);
    }
    return true;
  };

  const handleAggiorna = async () => {
    const canProceed = await checkAndSaveToDb();
    if (!canProceed) return;

    setPhase('caricamento');
    const totale = products.reduce((acc, i) => acc + (i.quantita * i.prezzo_unitario), 0);
    await sendConsumazioni(products);
    await aggiornaConto(Number(numeroFoglietto), sagra.giornata, totale);

    for (const item of products) {
      const orig = iniProducts.find(o => o.id_piatto == item.id_piatto);
      if (orig && item.quantita !== orig.quantita) {
        const msg = item.quantita > orig.quantita
          ? `Aggiunti: ${item.quantita - orig.quantita} ${item.piatto}`
          : `Eliminati: ${orig.quantita - item.quantita} ${item.piatto}`;
        await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'UPDATE', msg);
      }
    }
    // Rinfresco il conto locale per avere i dati corretti (es. data apertura)
    const newCc = await getConto(Number(numeroFoglietto), sagra.giornata);
    setConto(newCc);
    setPhase('aperto');
  };

  const handleStampa = async () => {
    const canProceed = await checkAndSaveToDb();
    if (!canProceed) return;

    setPhase('elaborazione');
    const totale = products.reduce((acc, i) => acc + (i.quantita * i.prezzo_unitario), 0);
    await sendConsumazioni(products); // Assicuriamoci che i prodotti siano salvati
    await aggiornaConto(Number(numeroFoglietto), sagra.giornata, totale);
    await stampaConto(Number(numeroFoglietto), sagra.giornata);
    await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'PRINT', 'Stampa conto');
    setPhase('iniziale_stampato');
    print();
  };

  const print = () => {
    const printArea = printRef.current;
    if (!printArea) return;
    const newWindow = window.open("", "", "width=800,height=900");
    if (newWindow) {
      newWindow.document.write('<html><head><title>Stampa Conto</title>');
      document.querySelectorAll('link[rel="stylesheet"], style').forEach(s => newWindow.document.write(s.outerHTML));
      newWindow.document.write('</head><body><div class="print-container">');
      newWindow.document.write(printArea.innerHTML);
      newWindow.document.write('</div></body></html>');
      newWindow.document.close();
      setTimeout(() => { newWindow.focus(); newWindow.print(); newWindow.close(); }, 500);
    }
  };

  const handleFinalizzaChiusura = async (tipo: number, nota = '', importo = '', skipPrintWait = false) => {
    setPhase('elaborazione');
    setIsPrinting(true); // Attiva il loader a schermo intero

    const logMsg = tipo === 1 ? 'Pagato contanti' : tipo === 2 ? 'Pagato POS' : 'Altro Importo';

    // Eseguiamo prima le operazioni sul DB
    await chiudiConto(Number(numeroFoglietto), sagra.giornata, tipo, nota, importo);
    await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', logMsg);

    const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
    setConto(cc);

    if (skipPrintWait) {
      // Se l'utente clicca "Annulla attesa", lanciamo la stampa "fire and forget"
      inviaStampaPass();
      setIsPrinting(false);
      setPhase('chiuso');
    } else {
      // Altrimenti attendiamo la risposta della stampante
      await inviaStampaPass();
      setIsPrinting(false);
      setPhase('chiuso');
    }
  };

  const inviaStampaPass = async () => {
    try {
      await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroFoglietto,
          coperti: copertipass,
          giornata: sagra.giornata,
          ipAddress: config.stampante_wifi,
          isPass: true
        }),
      });
    } catch (err) { console.error("Errore invio stampa:", err); }
  };

  const handleAdd = (id: number, qty = 1) => {
    setProducts(prev => prev.map(item => item.id_piatto === id ? { ...item, quantita: item.quantita + qty, cucina: "Casse" } : item));
    setPhase('modificato');
  };
  const handleRemove = (id: number) => {
    setProducts(prev => prev.map(item => (item.id_piatto === id && item.quantita > 0) ? { ...item, quantita: item.quantita - 1, cucina: "Casse" } : item));
    setPhase('modificato');
  };

  const HeaderCasse = () => (
    <div className="p-1 mt-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
      <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
        <li className="flex-1 mr-2 font-bold py-2">
          <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">Casse</a>
          <div className="text-xs text-center text-blue-700">
            SAGRA: <span className="text-xs text-center text-blue-800 font-semibold">
              {` ${sagra.stato} ${sagra.stato !== 'CHIUSA' ? `(${sagra.giornata})` : ""}`}
            </span>
          </div>
        </li>
        <li className="text-right flex-1 mr-2 text-5xl text-white font-bold py-4 rounded-full" style={{ borderRadius: '9999px' }}>
          <div className="text-center text-emerald-600">
            <TextField autoFocus className="p-2" label="Numero Foglietto" variant="outlined" value={numero} onChange={handleInputChange} style={{ borderRadius: '9999px' }} sx={{ input: { textAlign: 'right' } }} type="number" />
          </div>
        </li>
        <li className="text-left flex-1 mr-2 text-5xl font-bold py-4">
          <Button variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }} size="medium">
            Carica Foglietto
          </Button>
        </li>
      </ul>
    </div>
  );

  const UltimiRicercati = () => (
    <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
      <p>
        <span className="text-blue-800">Ultimi ricercati &nbsp;</span>
        {lastLog.slice(0, 3).map((row, idx) => (
          <Button
            key={idx}
            size="small"
            variant="contained"
            onClick={() => carica(row.foglietto)}
            startIcon={<Filter1Icon />}
            style={{ borderRadius: '9999px', margin: '0 4px' }}
          >
            {row.foglietto}
          </Button>
        ))}
      </p>
    </div>
  );

  const BottoniServizio = () => (
    <div className="sez-dx" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
      <div className="xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
        <Button size="medium" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaAsporto} style={{ borderRadius: '9999px' }}>Asporto</Button>
        &nbsp;&nbsp;
        <Button size="medium" color="secondary" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaConto1} style={{ borderRadius: '9999px' }}>Camerieri</Button>
      </div>
    </div>
  );

  if (sagra.stato === 'CHIUSA' && (session?.user?.name === "Casse" || session?.user?.name === "SuperUser")) {
    return (
      <main><div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50 text-center">
        <span className="font-semibold">Attenzione:</span> |Casse [foglietto]| la giornata non è stata ancora aperta!
      </div></main>
    );
  }

  if (session?.user?.name !== "Casse" && session?.user?.name !== "SuperUser") {
    return (
      <main><div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50 text-center">
        <span className="font-semibold">Violazione:</span> utente non autorizzato.
      </div></main>
    );
  }
 
  if (isPrinting) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw', // Assicura che copra tutta la larghezza
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: 'rgba(255,255,255,0.9)', // Sfondo semitrasparente
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 9999 
      }}>
        <CircularProgress size="6rem" />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Invio alla stampa in corso ...</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}> Annulla invio a stampante e vai avanti (il conto sarà regolarmente chiuso)</Typography>

        <Button 
          variant="contained" 
          color="error" 
          size="large"
          sx={{ mt: 4, borderRadius: '9999px', px: 4 }}
          onClick={() => {
              setIsPrinting(false);
              setPhase('chiuso');
          }}
        >
          Annulla attesa e prosegui
        </Button>
      </Box>
    );
  }
  return (
    
    <main>
      {(() => {
        switch (phase) {
          case 'iniziale_stampato':
            return (
              <div className="container">
                <header className="top-section"><div className="sez-sx"><HeaderCasse /><UltimiRicercati /></div><BottoniServizio /></header>
                <main className="middle-section"><br />
                  <p className="text-2xl md:text-5xl py-4 text-center text-blue-800">
                    Conto: <span className="font-extrabold"><Link href={`/dashboard/casse/${numeroFoglietto}`}>{numeroFoglietto}</Link></span> inviato in stampa.<br /><br />
                    Caricare un nuovo foglietto!
                  </p>
                </main>
              </div>
            );

          case 'gratis':
            return (
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-[600px] p-4 border rounded-lg space-y-4">
                  <p className="text-xl">Conto: <b>{conto?.id_comanda}</b> - Incasso: <b>{conto?.totale} €</b></p>
                  <TextField label="Nuovo importo" variant="outlined" value={importValue} onChange={(e) => setImportValue(e.target.value)} type="number" fullWidth />
                  <TextField label="Note" variant="outlined" value={textValue} onChange={(e) => setTextValue(e.target.value)} fullWidth />
                  <div className="flex justify-center space-x-4">
                    <Button variant="contained" onClick={() => handleFinalizzaChiusura(3, textValue, importValue)}>Salva e chiudi</Button>
                    <Button variant="contained" onClick={() => setPhase('stampato')}>Annulla</Button>
                  </div>
                </div>
              </div>
            );

          case 'aperto':
          case 'modificato':
          case 'stampato':
          case 'caricamento':
            return (
              <div className="container">
                <header className="top-section mb-2">
                  <div className="sez-sx"><HeaderCasse /><UltimiRicercati /></div>
                  <div className="sez-dx">
                    <BottoniServizio />
                    <div className="text-base md:text-2xl py-2 text-end">
                      <p>Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}</span> {conto ? `(${deltanow(conto?.data_apertura)})` : "(Nuovo)"}</p>
                      <p>Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere || 'Casse'}</span></p>
                    </div>
                  </div>
                </header>
                <main className="middle-section_XS">
                  <TabellaConto
                    item={products}
                    onAdd10={(id) => handleAdd(id, 10)}
                    onAdd={(id) => handleAdd(id)}
                    onRemove={handleRemove}
                    onSet={handleOpenSetQty}
                  />
                </main>
                <footer className="bottom-section">
                  <div className="sez-sx-bassa">
                    <Button variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled={phase === 'modificato' || phase === 'caricamento'}>Stampa Conto</Button>
                    &nbsp;
                    <Button variant="contained" style={{ borderRadius: '9999px' }} onClick={handleAggiorna} disabled={phase !== 'modificato'}>Aggiorna Conto</Button>
                    <p>Stato: <span className="font-extrabold text-blue-800">{isNewConto ? 'DA CREARE' : phase}</span> n. {numeroFoglietto}</p>
                  </div>
                  <div className="sez-dx-bassa">
                    <ul className=" inline-block p-3 border-2 border-blue-600 bg-blue-200 rounded-full"
                      style={{ marginTop: '1px' }}>
                      Chiudi conto &nbsp;
                      <ButtonGroup variant="contained">
                        <Button onClick={() => handleFinalizzaChiusura(2)} disabled={phase !== 'stampato'}>POS</Button>
                        <Button onClick={() => handleFinalizzaChiusura(1)} disabled={phase !== 'stampato'}>Contanti</Button>
                        <Button onClick={() => setPhase('gratis')} disabled={phase !== 'stampato'}>Altro</Button>
                      </ButtonGroup>
                    </ul>
                  </div>
                </footer>
                <div ref={printRef} className="hidden"><Summarythebill item={products} /></div>
              </div>
            );

          case 'chiuso':
          case 'none':
            return (
              <div className="container">
                <header className="top-section"><div className="sez-sx"><HeaderCasse /><UltimiRicercati /></div><BottoniServizio /></header>
                <main className="middle-section">
                  <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50 text-center">
                    {phase === 'chiuso' ? (
                      <>
                        <span className="font-semibold">Informazione:</span>{` conto ${conto?.id_comanda} chiuso il ${milltodatestring(conto?.data_chiusura)} - ${conto?.totale} €.`}
                        <Summary item={products} />
                      </>
                    ) : <><span className="font-semibold">Informazione:</span> conto non esistente.</>}
                  </div>
                </main>
                <footer className="bottom-section">
                   {phase === 'chiuso' && (
                      <Button variant="contained" className="rounded-full" onClick={async () => {
                        await riapriConto(conto!.id_comanda, sagra.giornata);
                        setPhase('aperto');
                      }}>
                        Riapri Conto
                      </Button>
                   )}
                </footer>
              </div>
            );
          default: return null;
        }
      })()}

      <Dialog open={openDialogQty} onClose={() => setOpenDialogQty(false)}>
        <DialogTitle>Modifica Quantità: {selectedProductName}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Inserisci quantità"
            type="number"
            fullWidth
            variant="standard"
            value={tempQty}
            onChange={(e) => setTempQty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmQty();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogQty(false)}>Annulla</Button>
          <Button onClick={handleConfirmQty} variant="contained">Conferma</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </main>
  );
}