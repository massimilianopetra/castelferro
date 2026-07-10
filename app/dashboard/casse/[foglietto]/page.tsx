'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button, ButtonGroup, Link, Snackbar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Box,FormControlLabel, Switch, Typography
} from '@mui/material';
import Filter1Icon from '@mui/icons-material/Filter1';
import * as React from 'react';

import type { DbConsumazioni, DbConsumazioniPrezzo, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import {
  getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto,
  aggiornaConto, stampaConto, riapriConto, apriConto, getContoPiuAlto,
  writeLog, getGiornoSagra, getLastLog, salvaComandaCompleta,
  getInizializzazioneCassa, updateTotaleConto
} from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils';
import { useConfig } from '@/context/ConfigContext';

import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import Summary from '@/app/ui/dashboard/summary';
import Summarythebill from '@/app/ui/dashboard/summarythebill';
import Thebill from '@/app/ui/dashboard/thebill';

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

  // NUOVO STATO PER IL CARICAMENTO INIZIALE
  const [isSagraLoading, setIsSagraLoading] = useState(true);

  // STATO PER IL DIALOG DI CONFERMA NUOVO CONTO
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // STATO PER IL POPUP DI AVVISO STAMPANTE MANCANTE
  const [openPrinterWarning, setOpenPrinterWarning] = useState(false);

  const [tempQty, setTempQty] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [chiamataunicaDB, setChiamataunicaDB] = useState(false);
  const [copertipass, setCopertiPass] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      const num = +params.foglietto;
      if (isNaN(num) || num < 1 || num > 9999) {
        setSnackbarMessage("Il foglietto non è gestibile.");
        setOpenSnackbar(true);
        setIsSagraLoading(false);
        return;
      }

      setNumeroFoglietto(num.toString());

      try {
        const data = await getInizializzazioneCassa(num);
        if (!data) {
          setIsSagraLoading(false);
          return;
        }

        const { gg, cc, c, log } = data;

        setSagra(gg);
        setConto(cc);

        if (log && log.length > 0) {
          setLastLog(log);
        }

        if (c) {
          setProducts(c);
          setIniProducts(c);
          setCopertiPass(c.find((o) => o.id_piatto === 1)?.quantita ?? 0);
        }

        if (!cc || !cc.stato || cc.stato === 'NUOVO') {
          setIsNewConto(true);
          setOpenConfirmDialog(true);
          setIsSagraLoading(false);
          return;
        }

        setIsNewConto(false);
        if (['CHIUSO', 'CHIUSOPOS', 'CHIUSOALTRO'].includes(cc.stato)) {
          setPhase('chiuso');
          setIsSagraLoading(false);
          return;
        }

        setPhase(cc.stato === 'APERTO' ? 'aperto' : 'stampato');

        // Spegniamo il loader prima di attendere la scrittura del log per accorciare i tempi della UI
        setIsSagraLoading(false);

        if (cc.stato === 'APERTO') {
          await writeLog(num, gg.giornata, 'Casse', '', 'OPEN', 'Apertura conto');
        }

      } catch (error) {
        console.error("Errore:", error);
        setIsSagraLoading(false);
      }
    };

    fetchData();
  }, [params.foglietto]);

  const handlechiamataunicaDB = () => setChiamataunicaDB(prev => !prev);

  const handleConfirmNewConto = () => {
    setOpenConfirmDialog(false);
    setPhase('aperto');
  };

  const handleCancelNewConto = () => {
    setOpenConfirmDialog(false);
    router.push('/dashboard/casse');
  };

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

    if (isNaN(num) || num < 1 || num > 9999) {
      setSnackbarMessage("5 .Inserisci un numero foglietto valido (da 1 a 9999)");
      setOpenSnackbar(true);
      return;
    }

    if (num >= 9000 && num <= 9999) {
      const contoEsistente = await getConto(num, sagra.giornata);

      if (contoEsistente) {
        carica(num);
        setNumero('');
        return;
      } else {
        setSnackbarMessage("6. Hai inserito un numero riservato asporto non ancora esistente (compreso tra 9000 e 9999)");
        setOpenSnackbar(true);
        return;
      }
    }

    carica(num);
    setNumero('');
  };

  const handleButtonClickCaricaAsporto = async () => {
    const ultconto = await getContoPiuAlto();
    let uc = Number(ultconto);
    if (isNaN(uc) || uc < 9000) uc = 9000;
    carica(uc + 1);
  };

  const handleButtonClickCaricaConto1 = () => carica(1);

  const checkAndSaveToDb = async () => {
    const haPortate = products.some(p => p.quantita > 0);

    if (!haPortate && isNewConto) {
      setSnackbarMessage("Inserire almeno una portata prima di salvare.");
      setOpenSnackbar(true);
      return false;
    }

    if (isNewConto) {
      const numFogl = Number(numeroFoglietto);
      await Promise.all([
        apriConto(numFogl, sagra.giornata, 'Casse'),
        writeLog(numFogl, sagra.giornata, 'Casse', '', 'START', 'Creazione differita')
      ]);
      setIsNewConto(false);
    }
    return true;
  };
  /*
    const handleAggiorna = async () => {
      const canProceed = await checkAndSaveToDb();
      if (!canProceed) return;
  
      setPhase('caricamento');
      const numFogl = Number(numeroFoglietto);
      const totale = products.reduce((acc, i) => acc + (i.quantita * i.prezzo_unitario), 0);
  
      const logPromises = products
        .map(item => {
          const orig = iniProducts.find(o => o.id_piatto === item.id_piatto);
          if (orig && item.quantita !== orig.quantita) {
            const msg = item.quantita > orig.quantita
              ? `Aggiunti: ${item.quantita - orig.quantita} ${item.piatto}`
              : `Eliminati: ${orig.quantita - item.quantita} ${item.piatto}`;
            return writeLog(numFogl, sagra.giornata, 'Casse', '', 'UPDATE', msg);
          }
          return null;
        })
        .filter((p): p is Promise<void> => p !== null);
  
      await Promise.all([
        sendConsumazioni(products),
        aggiornaConto(numFogl, sagra.giornata, totale),
        ...logPromises
      ]);
  
      const newCc = await getConto(numFogl, sagra.giornata);
  
      setConto(newCc);
      setPhase('aperto');
    };
  */
  /* ------------------------------AGGIORNA CONSUMAZIONI------------------------------ */
  const handleAggiorna = async () => {
   // if (chiamataunicaDB) {
   //   setSnackbarMessage("handleAggiornaNew chiamata unica DB");
   //   setOpenSnackbar(true);
   //   await handleAggiornaNew();
   // } else {
   //   setSnackbarMessage("handleAggiornaOld chiamate standard");
   //   setOpenSnackbar(true);
      await handleAggiornaOld();
   // }
  };
  /*const handleAggiornaNew = async () => {
    const haPortateValide = products.some(item => item.quantita > 0);

    if (!haPortateValide && isNewConto) {
      setPhase('iniziale');
      setProducts([]);
      setIniProducts([]);
      return;
    }

    setPhase('caricamento');

    try {
      const numFoglietto = Number(numeroFoglietto);

      // 1. COSTRUIAMO IL PAYLOAD COMPLETO (Includendo i piatti eliminati o portati a zero)
      // Partiamo clonando i prodotti attualmente visibili a schermo
      const datiDaInviare = [...products];

      // CORREZIONE: Confrontiamo con lo stato iniziale per trovare i piatti che l'utente ha del tutto rimosso dallo schermo
      iniProducts.forEach(itemIniziale => {
        const esisteAncoraA_Schermo = products.some(itemSchermo => itemSchermo.id_piatto === itemIniziale.id_piatto);

        // Se il piatto era presente all'apertura ma ora non c'è più nell'array dello schermo,
        // lo reinseriamo nel payload forzando la quantità a 0 per dire al backend di eliminarlo/azzerarlo.
        if (!esisteAncoraA_Schermo) {
          datiDaInviare.push({
            ...itemIniziale,
            quantita: 0
          });
        }
      });

      // 2. Generiamo l'array dei messaggi di LOG basandoci sul nuovo array 'datiDaInviare'
      // In questo modo i log conterranno correttamente anche le diciture "Eliminati: X ..." per i piatti spariti
      const logMessaggi = datiDaInviare
        .map(item => {
          const orig = iniProducts.find(o => o.id_piatto === item.id_piatto);
          const origQuantita = orig ? orig.quantita : 0;
          if (item.quantita === origQuantita) return null;

          return item.quantita > origQuantita
            ? `Aggiunti: ${item.quantita - origQuantita} ${item.piatto}`
            : `Eliminati: ${origQuantita - item.quantita} ${item.piatto}`;
        })
        .filter((msg): msg is string => msg !== null);

      // 3. Chiamata UNICA al Database (passando 'datiDaInviare' invece di 'products')
      const response = await salvaComandaCompleta(
        numFoglietto,
        sagra.giornata,
        'Casse',
        'Casse',
        isNewConto,
        datiDaInviare, // <-- Array corretto con i piatti a quantità 0
        logMessaggi
      );

      if (response.success === false && response.error === 'DUPLICATE_CONTO') {
        setSnackbarMessage("ATTENZIONE: Un'altra postazione ha appena aperto questo conto. Operazione bloccata per evitare duplicati.");
        setOpenSnackbar(true);
        setPhase('iniziale');
        return;
      }

      // 4. Aggiornamento dello stato della UI con la risposta del server
      if (isNewConto) setIsNewConto(false);
      if (response.logs) setLastLog(response.logs);
      if (response.conto) setConto(response.conto);

      setPhase('aperto');

    } catch (error) {
      console.error("Errore nell'invio:", error);
      setSnackbarMessage("Errore durante il salvataggio.");
      setOpenSnackbar(true);
      setPhase('iniziale');
    }
  };
*/
  const handleAggiornaOld = async () => {
    const haPortateValide = products.some(item => item.quantita > 0);

    // NUOVO CONTROLLO: Se il conto è NUOVO (isNewConto === true) e non ha piatti (> 0),
    // allora usciamo subito senza toccare il DB, pulendo solo la schermata.
    if (!haPortateValide && isNewConto) {
      setPhase('iniziale');
      setProducts([]);
      setIniProducts([]);
      return;
    }

    // Impostiamo la fase di invio in corso per mostrare lo spinner
    setPhase('caricamento');

    try {
      const numFoglietto = Number(numeroFoglietto);

      // 1. SCARICHIAMO I DATI FRESCHI DAL DB ADESSO
      const [consumazioniFresh, contoFresh] = await Promise.all([
        getConsumazioniCassa(numFoglietto, sagra.giornata),
        getConto(numFoglietto, sagra.giornata)
      ]);

      if (isNewConto && contoFresh) {
        // Se nel frattempo un'altra cucina ha già aperto il conto
        setSnackbarMessage("ATTENZIONE: Un'altra postazione ha appena aperto questo conto. Operazione bloccata per evitare duplicati.");
        setOpenSnackbar(true);
        setPhase('iniziale');
        return;
      }

      if (isNewConto) {
        await Promise.all([
          apriConto(numFoglietto, sagra.giornata, 'Casse'),
          writeLog(numFoglietto, sagra.giornata, 'Casse', '', 'UPDATE', '')
        ]);
        setIsNewConto(false);
      }

      // 2. UNIAMO LE QUANTITÀ DELLO SCHERMO CON GLI ID DEL DATABASE APPENA SCARICATI
      const datiDaInviare: DbConsumazioni[] = [];

      // Gestiamo prima i prodotti attualmente visibili a schermo
      products.forEach(itemSchermo => {
        const riscontroDb = consumazioniFresh?.find(dbItem => dbItem.id_piatto === itemSchermo.id_piatto);
        const orig = iniProducts.find(o => o.id_piatto === itemSchermo.id_piatto);

        // Controlliamo se l'operatore ha modificato questo piatto rispetto a quando ha aperto la pagina
        const rigaModificataDallUtente = orig ? orig.quantita !== itemSchermo.quantita : itemSchermo.quantita > 0;

        let quantitaFinale = itemSchermo.quantita;

        // Se l'utente NON ha toccato questo piatto, appartiene a un'altra cucina ed esiste già sul DB,
        // allora preserviamo il valore fresco del DB (evita di sovrascrivere modifiche concorrenti).
        // Se invece l'utente l'ha modificato (es. diminuito o azzerato), inviamo il suo nuovo valore.
        if (!rigaModificataDallUtente && itemSchermo.cucina !== 'Casse' && riscontroDb) {
          quantitaFinale = riscontroDb.quantita;
        }

        datiDaInviare.push({
          ...itemSchermo,
          id: riscontroDb ? riscontroDb.id : -1,
          quantita: quantitaFinale
        });
      });

      // CORREZIONE CRUCIALE: Recuperiamo i piatti che erano nel DB ma sono stati COMPLETAMENTE CANCELLATI dall'array 'products'
      if (consumazioniFresh) {
        consumazioniFresh.forEach(dbItem => {
          const esisteInSchermo = products.some(itemSchermo => itemSchermo.id_piatto === dbItem.id_piatto);
          const eraNeiProdottiIniziali = iniProducts.some(o => o.id_piatto === dbItem.id_piatto);

          // Se il piatto non c'è più a schermo è stato portato a 0, ma era presente all'inizio (o appartiene alle Casse), dobbiamo inviarlo con quantità 0 per rimuoverlo
          if (!esisteInSchermo && (eraNeiProdottiIniziali || dbItem.cucina === 'Casse')) {
            datiDaInviare.push({
              ...dbItem,
              quantita: 0 // Comunica al backend di azzerare/eliminare la riga
            });
          }
        });
      }

      // 3. Generiamo i log basandoci su 'datiDaInviare' confrontati con i vecchi 'iniProducts'
      // In questo modo intercettiamo correttamente anche i log di eliminazione totale dei piatti rimossi dallo stato
      const logPromises = datiDaInviare
        .map(item => {
          const orig = iniProducts.find(o => o.id_piatto === item.id_piatto);
          const origQuantita = orig ? orig.quantita : 0;

          if (item.quantita === origQuantita) return null;

          const nomePiatto = item.piatto || orig?.piatto || `Piatto #${item.id_piatto}`;
          const message = item.quantita > origQuantita
            ? `Aggiunti: ${item.quantita - origQuantita} ${nomePiatto}`
            : `Eliminati: ${origQuantita - item.quantita} ${nomePiatto}`;

          return writeLog(item.id_comanda || numFoglietto, sagra.giornata, 'Casse', '', 'UPDATE', message);
        })
        .filter((p): p is Promise<any> => p !== null);

      // 4. INVIAMO E ATTENDIAMO REALMENTE IL COMPLETAMENTO
      await Promise.all([
        ...logPromises,
        sendConsumazioni(datiDaInviare)
      ]);

      // 5. OTTIMIZZAZIONE 2: Aggiornamento log e conto freschi
      const [logs, newCc] = await Promise.all([
        getLastLog(sagra.giornata, 'Casse'),
        getConto(numFoglietto, sagra.giornata)
      ]);

      if (logs) setLastLog(logs);

      setConto(newCc);
      setPhase('aperto');

    } catch (error) {
      console.error("Errore nell'invio:", error);
      setSnackbarMessage("Errore durante il salvataggio.");
      setOpenSnackbar(true);
      setPhase('iniziale');
    }
  };


  const handleStampa = async () => {
    const canProceed = await checkAndSaveToDb();
    if (!canProceed) return;

    setPhase('elaborazione');
    const numFogl = Number(numeroFoglietto);
    const totale = products.reduce((acc, i) => acc + (i.quantita * i.prezzo_unitario), 0);

    try {
      await sendConsumazioni(products);
      await aggiornaConto(numFogl, sagra.giornata, totale);
      await stampaConto(numFogl, sagra.giornata);

      await Promise.all([
        writeLog(numFogl, sagra.giornata, 'Casse', '', 'PRINT', 'Stampa conto'),
        (async () => {
          const gg = await getGiornoSagra();
          if (gg) {
            const logs = await getLastLog(gg.giornata, 'Casse');
            if (logs) setLastLog(logs);
          }
        })(),
        new Promise<void>((resolve) => {
          print();
          resolve();
        })
      ]);

      setPhase('iniziale_stampato');
    } catch (error) {
      console.error("Errore:", error);
      setPhase('aperto');
    }
  };
const print = () => {
    const printArea = printRef.current;
    if (!printArea) {
      console.warn("ATTENZIONE: La stampa è fallita perché 'printRef.current' è NULL.");
      return;
    }
    const newWindow = window.open("", "", "width=800,height=900");
    if (newWindow) {
      newWindow.document.write('<html><head><title>Stampa Conto</title>');

      // FORZIAMO IL RESET STRUTTURALE (Risolve il problema del container Docker)
      // Questo mini-bundle CSS emula esattamente il comportamento locale e impedisce alle scritte di unirsi
      newWindow.document.write(`
        <style>
          /* Reset globale per la finestra di stampa */
          html, body {
            height: auto !important;
            overflow: visible !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            size: auto;
            margin: 4mm 6mm 4mm 6mm !important; /* Margini fisici dello scontrino */
          }

          /* Struttura per preservare gli allineamenti orizzontali dei div ed elementi inline */
          div, span, p {
            box-sizing: border-box !important;
          }

          /* Se usi tabelle standard HTML, impediamo che collassino o azzerino i padding */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 5px !important;
            margin-bottom: 5px !important;
          }
          th, td {
            padding: 4px 6px !important;
            line-height: 1.4 !important;
          }

          /* Supporto nativo di emergenza per le classi Tailwind (se usate nel preconto) */
          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: 700 !important; }
          .w-full { width: 100% !important; }
          .whitespace-nowrap { white-space: nowrap !important; }
          
          /* Separatori */
          .border-t { border-top: 1px solid #000000 !important; }
          .border-b { border-bottom: 1px solid #000000 !important; }
          .border-dashed { border-style: dashed !important; }
        </style>
      `);

      newWindow.document.write('</head><body>');
      // Cloniamo l'HTML esatto generato a schermo dal tuo componente
      newWindow.document.write(printArea.innerHTML);
      newWindow.document.write('</body></html>');
      newWindow.document.close();

      // Un piccolo ritardo (400ms) permette al motore del browser in produzione 
      // di applicare le regole CSS prima di aprire la schermata di stampa
      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 400);
    }
  };
/*
  const print = () => {
    const printArea = printRef.current;
    if (!printArea) {
      console.warn("ATTENZIONE: La stampa è fallita perché 'printRef.current' è NULL.");
      return;
    }
    const newWindow = window.open("", "", "width=800,height=900");
    if (newWindow) {
      newWindow.document.write('<html><head><title>Stampa Conto</title>');

      document.querySelectorAll('link[rel="stylesheet"]').forEach(s => {
        const href = s.getAttribute('href');
        if (href && href.startsWith('/')) {
          newWindow.document.write(`<link rel="stylesheet" href="${window.location.origin}${href}">`);
        } else {
          newWindow.document.write(s.outerHTML);
        }
      });

      document.querySelectorAll('style').forEach(s => newWindow.document.write(s.outerHTML));

      newWindow.document.write(`
      <style>
        html, body {
          height: auto !important;
          overflow: visible !important;
          background-color: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        @page {
          size: auto;
          margin: 4mm 6mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-container {
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
      </style>
    `);

      newWindow.document.write('</head><body><div class="print-container">');
      newWindow.document.write(printArea.innerHTML);
      newWindow.document.write('</div></body></html>');
      newWindow.document.close();

      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 600);
    }
  };*/

  const handleFinalizzaChiusura = async (tipo: number, nota = '', importo = '', skipPrintWait = false) => {
    const savedPrinterIp = typeof window !== 'undefined' ? localStorage.getItem('sagra_printer_ip') : null;
    if (!savedPrinterIp) {
      setOpenPrinterWarning(true);
    }

    setPhase('elaborazione');
    setIsPrinting(true);

    const logMsg = tipo === 1 ? 'Pagato contanti' : tipo === 2 ? 'Pagato POS' : 'Altro Importo';
    const numFogl = Number(numeroFoglietto);

    try {
      await Promise.all([
        chiudiConto(numFogl, sagra.giornata, tipo, nota, importo),
        writeLog(numFogl, sagra.giornata, 'Casse', '', 'CLOSE', logMsg)
      ]);

      const cc = await getConto(numFogl, sagra.giornata);
      setConto(cc);

      if (skipPrintWait) {
        inviaStampaPass();
      } else {
        await inviaStampaPass();
      }
    } catch (error) {
      console.error("Errore durante la chiusura:", error);
    } finally {
      setIsPrinting(false);
      setPhase('chiuso');
    }
  };

  const inviaStampaPass = async () => {
    const savedPrinterIp = localStorage.getItem('sagra_printer_ip');

    try {
      await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroFoglietto,
          coperti: copertipass,
          giornata: sagra.giornata,
          ipAddress: savedPrinterIp,
          isPass: true
        }),
      });
    } catch (err) { console.error("Errore invio stampa:", err); }
  };

  const handleAdd = (id: number, qty = 1) => {
    setProducts(prev => prev.map(item => item.id_piatto === id ? { ...item, quantita: item.quantita + qty, cuisine: "Casse" } : item));
    setPhase('modificato');
  };
  const handleRemove = (id: number) => {
    setProducts(prev => prev.map(item => (item.id_piatto === id && item.quantita > 0) ? { ...item, quantita: item.quantita - 1, cuisine: "Casse" } : item));
    setPhase('modificato');
  };

  const headerCasse = (
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

  const ultimiRicercati = (
    <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
      <p>
        <span className="text-blue-800">Ultimi ricercati &nbsp;</span>
        {Array.isArray(lastLog) && lastLog.slice(0, 3).map((row, idx) => (
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

  const bottoniServizio = (
    <div className="sez-dx" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
      <div className="xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
        <Button size="medium" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaAsporto} style={{ borderRadius: '9999px' }}>Asporto</Button>
        &nbsp;&nbsp;
        <Button size="medium" color="secondary" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaConto1} style={{ borderRadius: '9999px' }}>Camerieri</Button>
        &nbsp;
    </div>
    </div>
  );

  // 1. ROTELLA DI CARICAMENTO DURANTE L'INIZIALIZZAZIONE DELLA PAGINA
  if (isSagraLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100%', // Evita scrollbar orizzontali indesiderate
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >  <CircularProgress size="6rem" />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold', color: 'text.secondary' }}>
          Verifica stato apertura giornata sagra (CASSE)
        </Typography>
      </Box>
    );
  }

  // 2. ERRORE MOSTRATO SOLO SE DOPO IL CARICAMENTO LA GIORNATA È EFFETTIVAMENTE CHIUSA
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
    const activePrinterIp = typeof window !== 'undefined' ? localStorage.getItem('sagra_printer_ip') : null;

    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
        alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.9)',
        position: 'fixed', top: 0, left: 0, zIndex: 9999
      }}>
        <CircularProgress size="6rem" />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>Invio alla stampa in corso ...</Typography>

        <Typography variant="body1" sx={{ mt: 1, fontFamily: 'monospace', color: activePrinterIp ? 'text.secondary' : 'error.main', fontWeight: activePrinterIp ? 'normal' : 'bold' }}>
          {activePrinterIp ? `IP Stampante: ${activePrinterIp}` : 'Nessuna stampante configurata'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}> Se annulli comunque i pass risulteranno  regolarmente distribuiti</Typography>

        <Button variant="contained" color="error" size="large" sx={{ mt: 4, borderRadius: '9999px', px: 4 }}
          onClick={() => { setIsPrinting(false); setPhase('chiuso'); }}>
          Annulla attesa e prosegui
        </Button>

        <Dialog open={openPrinterWarning} onClose={() => setOpenPrinterWarning(false)}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>⚠️ Stampante Termica Non Configurata</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Attenzione: l'IP della stampante termica non è impostato nelle impostazioni locali di questo browser.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              La chiusura del conto procederà comunque regolarmente sul database, ma la stampa fisica dei pass non verrà inviata.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPrinterWarning(false)} variant="contained" color="error" sx={{ borderRadius: '9999px' }}>
              Ho Capito, Continua
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <main>
      {(() => {
        switch (phase) {
          case 'iniziale':
            return (
              <div className="container">
                <header className="top-section"><div className="sez-sx">{headerCasse}{ultimiRicercati}</div>{bottoniServizio}</header>       <main className="middle-section"><br />
                  <p className="text-2xl md:text-5xl py-4 text-center text-blue-800">
                    Conto: <span className="font-extrabold">{numeroFoglietto}</span> aperto contestualmente per evitare doppioni. Riaprire <Link href={`/dashboard/casse/${numeroFoglietto}`}>{numeroFoglietto}</Link><br /><br />
                  </p>
                </main>
              </div>
            );

          case 'iniziale_stampato':
            return (
              <div className="container">
                <header className="top-section"><div className="sez-sx">{headerCasse}{ultimiRicercati}</div>{bottoniServizio}</header>       <main className="middle-section"><br />
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
          case 'elaborazione':
            return (
              <div className="container">
                <header className="top-section mb-2">
                  <div className="sez-sx">
                    {headerCasse}
                    {ultimiRicercati}
                  </div>
                  <div className="sez-dx">
                    {bottoniServizio}
                    <div className="text-base md:text-2xl py-2 text-end">
                      <p>Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}</span> {conto ? `(${deltanow(conto?.data_apertura)})` : "(Nuovo)"}</p>
                      <p>Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere || 'Casse'}</span></p>
                    </div>
                  </div>
                </header>
                <main className="middle-section_XS">
                  {phase === 'caricamento' || phase === 'elaborazione' ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%' }}>
                      <CircularProgress size="4rem" />
                    </Box>
                  ) : (
                    <TabellaConto
                      item={products}
                      onAdd10={(id) => handleAdd(id, 10)}
                      onAdd={(id) => handleAdd(id)}
                      onRemove={handleRemove}
                      onSet={handleOpenSetQty}
                    />
                  )}
                </main>
                <footer className="bottom-section">
                  <div className="sez-sx-bassa">
                    <Button variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled={phase === 'modificato' || phase === 'caricamento' || phase === 'elaborazione'}>Stampa Conto</Button>
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
              </div>
            );

          case 'chiuso':
          case 'none':
            return (
              <div className="container">
                <header className="top-section"><div className="sez-sx">{headerCasse}{ultimiRicercati}</div>{bottoniServizio}</header>   <main className="middle-section">
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
                      setPhase('elaborazione');
                      try {
                        await riapriConto(conto!.id_comanda, sagra.giornata);
                        const data = await getInizializzazioneCassa(Number(numeroFoglietto));
                        if (data) {
                          setConto(data.cc);
                          if (data.c) {
                            setProducts(data.c);
                            setIniProducts(data.c);
                          }
                        }
                        setPhase('aperto');
                      } catch (err) {
                        console.error("Errore riapertura:", err);
                        setPhase('chiuso');
                      }
                    }}>
                      Riapri Conto
                    </Button>
                  )}
                </footer>
              </div>
            );
          default: return (
            <div className="container">
              <header className="top-section"><div className="sez-sx">{headerCasse}{ultimiRicercati}</div>{bottoniServizio}</header>     <div className="text-center p-10"><CircularProgress /></div>
            </div>
          );
        }
      })()}

      <div ref={printRef} className="hidden"><Summarythebill item={products} /></div>

      <Dialog open={openConfirmDialog} onClose={handleCancelNewConto}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>Apertura Nuovo Conto</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Vuoi davvero aprire il conto <b>{numeroFoglietto}</b>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Il foglietto non risulta registrato per la giornata odierna.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCancelNewConto} variant="outlined" color="error" sx={{ borderRadius: '9999px' }}>
            No, annulla
          </Button>
          <Button onClick={handleConfirmNewConto} variant="contained" color="primary" sx={{ borderRadius: '9999px' }}>
            Sì, apri conto
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPrinterWarning} onClose={() => setOpenPrinterWarning(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>⚠️ Stampante Termica Non Configurata</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Attenzione: l'IP della stampante termica non è impostato nelle impostazioni locali di questo browser.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            La chiusura del conto procederà comunque regolarmente sul database, ma la stampa fisica dei pass non verrà inviata.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPrinterWarning(false)} variant="contained" color="error" sx={{ borderRadius: '9999px' }}>
            Ho Capito, Continua
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialogQty} onClose={() => setOpenDialogQty(false)}>
        <DialogTitle>Modifica Quantità: {selectedProductName}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Inserisci quantità" type="number" fullWidth variant="standard" value={tempQty}
            onChange={(e) => setTempQty(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmQty(); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogQty(false)}>Annulla</Button>
          <Button onClick={handleConfirmQty} variant="contained">Conferma</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)} message={snackbarMessage} />
    </main>
  );
}