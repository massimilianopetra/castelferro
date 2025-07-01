'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { Button, ButtonGroup, Grid2, Link, Paper, Snackbar, TextField } from '@mui/material';
import type { DbConsumazioniPrezzo, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto, aggiornaConto, stampaConto, riapriConto, apriConto, getContoPiuAlto } from '@/app/lib/actions';
import { writeLog, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils'
import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import TheBill from '@/app/ui/dashboard/thebill';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';

import * as React from 'react';


export default function Page({ params }: { params: { foglietto: string } }) {



  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [importValue, setImportValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [phase, setPhase] = useState('elaborazione');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [products, setProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [iniProducts, setIniProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [numero, setNumero] = useState<number | string>('');
  const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
  const [conto, setConto] = useState<DbConti>();
  const [lastLog, setLastLog] = useState<DbLog[]>([]);
  const { data: session } = useSession();
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
  const [nuovaquantitaValue, setQuantitaValue] = useState('');
  const [idmodificaquantitaValue, setIdModQuantita] = useState(1);
  const [piattomodificaquantitaValue, setPiattoModQuantita] = useState("non definito");

  useEffect(() => {
    const fetchData = async () => {
      const gg = await getGiornoSagra();
      if (gg) {
        setSagra(gg);
        const log = await getLastLog(gg.giornata, 'Casse');
        if (log) {
          setLastLog(log);
        }

        const num = +params.foglietto;
        if (isNaN(num) || num < 1 || num > 9999) {
          setOpenSnackbar(true);
          return;
        }

        const c = await getConsumazioniCassa(num, gg.giornata);
        if (c) {
          setProducts(c);
          setIniProducts(c);
        }

        // console.log('----------');
        // console.log(`estrazione conto ${num} giornata: ${gg.giornata}`);
        const cc = await getConto(num, gg.giornata);
        //  console.log('>>>record: ');
        //  console.log(cc?.stato);
        //  console.log('----------');
        setConto(cc);
        if (cc?.stato == 'APERTO') {
          setNumeroFoglietto(num.toString());
          await writeLog(num, gg.giornata, 'Casse', '', 'OPEN', ''); // Logger
          const cc = await getLastLog(gg.giornata, 'Casse');
          if (cc) {
            setLastLog(cc);
          }
          setPhase('aperto');
        } else if (cc?.stato == 'STAMPATO') {
          setNumeroFoglietto(num.toString());
          await writeLog(num, gg.giornata, 'Casse', '', 'OPEN', ''); // Logger
          const cc = await getLastLog(gg.giornata, 'Casse');
          if (cc) {
            setLastLog(cc);
          }
          setPhase('stampato');
        } else if (cc?.stato == 'CHIUSO' || cc?.stato == 'CHIUSOPOS' || cc?.stato == 'CHIUSOALTRO') {
          setPhase('chiuso');
        } else if (Number(num) > 8999 && cc?.stato == undefined) {  // siamo nella condizione che c'è un conto aperto tra 8000 e 9000 quindi va bene (che è minore 9999 già verificato sopra)
          setNumeroFoglietto(num.toString());
          setSagra(gg);
          setPhase('elaborazione');
          await apriConto(Number(num), gg.giornata, 'Casse');
          await writeLog(Number(num), gg.giornata, 'Casse', '', 'START', ''); // Logger
          setPhase('aperto');
        } else {
          setNumero(num.toString());
          setNumeroFoglietto(num.toString());
          setPhase('none');
        }
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumero(event.target.value);
  };

  async function carica(num: number) {
    router.push(`/dashboard/casse/${num}`);
  }

  const handleButtonClickCarica = async () => {
    const num = Number(numero);
    const gg = await getGiornoSagra();
    if (gg) {
      setSagra(gg);
      const cc = await getConto(num, gg.giornata);

      if (isNaN(num) || num < 1 || num > 9999) {
        setOpenSnackbar(true);
        return;
      } else if (num > 8999 && cc?.stato == undefined) {  // siamo nella condizione che c'è un conto aperto tra 8000 e 9000 quindi va bene (che è minore 9999 già verificato sopra)
        setOpenSnackbar(true);
        return;
      }
      router.push(`/dashboard/casse/${numero}`);
      setNumero('');//azzera inputo box
    }
  };

  const handleButtonClickCaricaAsporto = async () => {
    const ultconto = await getContoPiuAlto();
    var uc = Number(ultconto);
    if (uc < 8999)
      uc = 9000
    await writeLog(uc + 1, sagra.giornata, 'Casse', '', 'OPEN', 'Bottone Asporto');
    carica(uc + 1);
  };

  const handleButtonClickCaricaConto1 = async () => {
    carica(1);
  };

  const handleModificaQuantita = async () => {

    const newProducts = products.map((item) => {
      if (item.id_piatto == idmodificaquantitaValue) {
        console.log(item);
        return ({ ...item, quantita: Number(nuovaquantitaValue) });
      }
      else
        return (item);
    });
    setProducts(newProducts);
    // setPhase('aperto');
    setPhase('modificato');
  };

  const handleAnnulla = async () => {
    setPhase('aperto');
  }

  const handleAggiorna = async () => {
    console.log(`Aggiornamento n. foglietto: ${numeroFoglietto}`);
    const fetchData = async () => {
      setPhase('caricamento');
      var totale = 0;

      for (let i of products) {
        totale += i.quantita * i.prezzo_unitario;
      }
      await sendConsumazioni(products);
      await aggiornaConto(Number(numeroFoglietto), sagra.giornata, totale);

      // Gestione log
      const logArray = products.map((item) => {
        const orig = iniProducts.find(o => o.id_piatto == item.id_piatto);
        if (orig) {
          if (item.quantita > orig.quantita) {
            return ({ id: item.id_comanda, message: `Aggiunti: ${item.quantita - orig.quantita} ${item.piatto}` });
          } else if (item.quantita < orig.quantita) {
            return ({ id: item.id_comanda, message: `Eliminati: ${orig.quantita - item.quantita} ${item.piatto}` });
          } else {
            return ({ id: -1, message: `` });
          }
        }
        return { id: -1, message: `` };
      });

      for (var index = 0; index < logArray.length; index++) {
        if (logArray[index].id != -1) {
          await writeLog(logArray[index].id, sagra.giornata, 'Casse', '', 'UPDATE', logArray[index].message);
        }
      }
      setPhase('aperto');
    };
    fetchData();
  };

  const handleStampa = async () => {

    const fetchData = async () => {
      setPhase('elaborazione');
      var totale = 0;

      for (let i of products) {
        totale += i.quantita * i.prezzo_unitario;
      }

      await aggiornaConto(Number(numeroFoglietto), sagra.giornata, totale);
      await stampaConto(Number(numeroFoglietto), sagra.giornata);
      await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'PRINT', 'Stampa conto');
      {/* setPhase('stampato');  {/*BRUNO */ }
      setPhase('iniziale_stampato');
    };
    fetchData();
    print();

  };

  const handleButtonRiapri = async () => {

    if (conto?.id_comanda) {
      setPhase('elaborazione');
      await riapriConto(conto.id_comanda, sagra.giornata);
      await writeLog(conto.id_comanda, sagra.giornata, 'Casse', '', 'RESTART', 'Conto riaperto');
      setNumeroFoglietto(conto.id_comanda.toString())
      setPhase('aperto');
    }
  }

  const handleButtonCrea = async () => {
    if (numeroFoglietto) {
      setPhase('elaborazione');
      await apriConto(Number(numeroFoglietto), sagra.giornata, 'Casse');
      await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'START', ''); // Logger
      setPhase('aperto');
      setNumero('');//azzera inputo box
    }
  }


  const print = () => {
    const printArea = printRef.current;

    if (!printArea) return; // Se il riferimento non esiste, interrompe l'esecuzione.

    const newWindow = window.open("", "", "width=600,height=400");

    // Verifica se newWindow non è null prima di proseguire
    if (newWindow) {
      newWindow.document.write('<html><head><title>Stampa Documento</title>');
      newWindow.document.write('</head><body >');
      newWindow.document.write(printArea.innerHTML);
      newWindow.document.write('</body></html>');
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
      newWindow.close();
    } else {
      console.error("Impossibile aprire la finestra di stampa.");
    }
  };

  const handleAChiudi = async () => {

    const fetchData = async () => {
      setPhase('elaborazione');
      const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, 1);
      const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
      await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato contanti');
      setConto(cc);
      setPhase('chiuso');
    };
    fetchData();
  };

  const handleAChiudiPos = async () => {

    const fetchData = async () => {
      setPhase('elaborazione');
      const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, 2);
      const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
      await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Pagato POS');
      setConto(cc);
      setPhase('chiuso');
    };
    fetchData();
  };

  const handleCompletatoGratis = async () => {

    const fetchData = async () => {
      setPhase('elaborazione');
      const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, 3, textValue, importValue);
      const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
      await writeLog(Number(numeroFoglietto), sagra.giornata, 'Casse', '', 'CLOSE', 'Altro Importo');
      setConto(cc);
      setPhase('chiuso');
    };
    fetchData();
  };

  const handleChiudiGratis = async () => {
    setPhase('gratis');
  }

  const handleAnnullaGratis = async () => {
    setPhase('stampato');
  }

  const handleSet = (id: number) => {
    setIdModQuantita(Number(id));

    const newProducts = products.map((item) => {
      if (item.id_piatto == id) {
        setPiattoModQuantita(item.piatto);
        setQuantitaValue(item.quantita + "");
      }
    });
    setPhase('modificaquantita');
  };

  const handleAdd = (id: number) => {
    const newProducts = products.map((item) => {
      if (item.id_piatto == id) {
        console.log(item);
        return ({ ...item, quantita: item.quantita + 1, cucina: "Casse" });
      }
      else
        return (item);
    });
    setPhase('modificato');
    setProducts(newProducts);
  };
  const handleAdd10 = (id: number) => {
    const newProducts = products.map((item) => {
      if (item.id_piatto == id) {
        console.log(item);
        return ({ ...item, quantita: item.quantita + 10, cucina: "Casse" });
      }
      else
        return (item);
    });
    setPhase('modificato');
    setProducts(newProducts);
  };

  const handleRemove = (id: number) => {
    const newProducts = products.map((item) => {
      if (item.id_piatto == id) {
        console.log(item);
        if (item.quantita > 0)
          return ({ ...item, quantita: item.quantita - 1, cucina: "Casse" });
        else
          return ({ ...item });
      }
      else
        return (item);
    });
    setPhase('modificato');
    setProducts(newProducts);
  };

  const handleClose = () => {
    setOpenSnackbar(false);
  };

  const renderPhaseContent = () => {

    switch (phase) {
      case 'iniziale':
        console.log('iniziale');
        return (
          <>
            <main>
              <div className="container">
                <header className="top-section">
                </header>

                <main className="middle-section">
                  <div className='z-0 text-center'>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <p className="text-2xl md:text-5xl py-4">
                      Inserire Numero del Foglietto
                    </p>
                    <CircularProgress size="9rem" />
                  </div>
                </main>

                <footer className="bottom-section">
                  <div className="sez-sx-bassa"></div>
                  <div className="sez-dx-bassa"></div>
                </footer>
              </div>
            </main>
          </>

        );
      case 'iniziale_stampato':
        console.log('iniziale_stampato');
        return (
          <main>
            <div className="container">
              <header className="top-section">
                <div className="sez-sx">
                  <div className="p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                    <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
                      <li className="flex-1 mr-2font-bold py-2 ">
                        <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                          Casse
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
                                textAlign: 'right', // Allinea il testo a destra
                              },
                            }}
                            type="number"
                          />
                        </div>

                      </li>
                      <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 ">
                        <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Button variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                        </ButtonGroup>
                        <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                          <Button size="small" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                        </ButtonGroup>

                      </li>
                    </ul>
                  </div>
                  <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                    <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                      <p><span className="text-blue-800 ">Ultimi ricercati &nbsp;</span>
                        {lastLog.map((row) => (
                          <>
                            <Button size="medium" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                            &nbsp;
                          </>
                        ))}</p>
                    </ButtonGroup>
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                      <p><span className="text-blue-800 ">Ultimi  &nbsp;</span>
                        {lastLog.map((row) => (
                          <>
                            <Button size="small" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                            &nbsp;
                          </>
                        ))}</p>
                    </ButtonGroup>
                  </div>

                </div>
                <div className="sez-dx" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                  <div className="xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                    <Button size="medium" className="font-semibold" variant="outlined" onClick={handleButtonClickCaricaAsporto} style={{ borderRadius: '9999px' }}>Asporto</Button>
                    &nbsp;&nbsp;
                    <Button size="medium" color="secondary" className="font-semibold " variant="outlined" onClick={handleButtonClickCaricaConto1} style={{ borderRadius: '9999px' }}>Camerieri</Button>
                  </div>

                </div>
              </header>

              <main className="middle-section">
                <br></br>
                <p className="text-2xl md:text-5xl py-4 text-center  text-blue-800">
                  Conto:&nbsp;
                  <span className="font-extrabold text-blue-800">
                    <Link href={`/dashboard/casse/${numeroFoglietto}`}>{numeroFoglietto}</Link>
                  </span> inviato in stampa.
                  <br></br>
                  <br></br>
                  Caricare un nuovo foglietto!
                </p>
              </main>

              <footer className="bottom-section">
                <div className="sez-sx-bassa"></div>
                <div className="sez-dx-bassa"></div>
              </footer>
            </div>
          </main>
        );
      case 'caricamento':
        return (
          <>
            <main>
              <div className="container">
                <header className="top-section">
                </header>

                <main className="middle-section">
                  <div className='z-0 text-center'>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <p className="text-2xl md:text-5xl py-4">
                      Caricamento in corso ...
                    </p>
                    <CircularProgress size="9rem" />
                  </div>
                </main>

                <footer className="bottom-section">
                  <div className="sez-sx-bassa"></div>
                  <div className="sez-dx-bassa"></div>
                </footer>
              </div>
            </main>
          </>
        );
      case 'elaborazione':
        return (
          <>
            <main>
              <div className="container">
                <header className="top-section">
                </header>

                <main className="middle-section">
                  <div className='z-0 text-center'>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <p className="text-2xl md:text-5xl py-4">
                      Elaborazione in corso ...
                    </p>
                    <CircularProgress size="9rem" />
                  </div>
                </main>

                <footer className="bottom-section">
                  <div className="sez-sx-bassa"></div>
                  <div className="sez-dx-bassa"></div>
                </footer>
              </div>
            </main>
          </>
        );
      case 'gratis':
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
      case 'aperto':
        return (
          <main>
            <div className="container">
              <header className="top-section">
                <div className="sez-sx">
                  <div className="p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                    <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
                      <li className="flex-1 mr-2font-bold py-2 ">
                        <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                          Casse
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
                                textAlign: 'right', // Allinea il testo a destra
                              },
                            }}
                            type="number"
                          />
                        </div>

                      </li>
                      <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 ">
                        <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Button variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                        </ButtonGroup>
                        <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                          <Button size="small" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                        </ButtonGroup>

                      </li>
                    </ul>
                  </div>
                  <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                    <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                      <p><span className="text-blue-800 ">Ultimi ricercati &nbsp;</span>
                        {lastLog.map((row) => (
                          <>
                            <Button size="medium" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                            &nbsp;
                          </>
                        ))}</p>
                    </ButtonGroup>
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                      <p><span className="text-blue-800 ">Ultimi  &nbsp;</span>
                        {lastLog.map((row) => (
                          <>
                            <Button size="small" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                            &nbsp;
                          </>
                        ))}</p>
                    </ButtonGroup>
                  </div>

                </div>
                <div className="sez-dx">
                  <div className="text-base md:text-2xl py-2 md:py-4 font-extralight text-end">
                    <Button size="medium" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
                    &nbsp;&nbsp;
                    <Button size="medium" color="secondary" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                    <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                      <p>  Conto:{" "}            <span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>
                      <p>  Conto aperto da:{" "}  <span className="font-extrabold text-blue-800"> {deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp; </span></p>
                      <p>  Cameriere:{" "}        <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span></p>
                    </ButtonGroup>
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                      <p>Conto:{" "}<span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;</span>{" ("}<span className="text-blue-800 font-bold"> {deltanow(conto?.data_apertura)}</span>{") "}
                        &nbsp;Cameriere:{" "}<span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span></p>
                    </ButtonGroup>
                  </div>
                </div>
              </header>
              <main className="middle-section_XS">
                <TabellaConto item={products} onAdd10={handleAdd10} onAdd={handleAdd} onRemove={handleRemove} onSet={handleSet} />
              </main>

  <footer className="bottom-section">
                  <div className="sez-sx-bassa ">
                    <div className="z-0 text-2xl font-extralight text-end">
                    </div>
                    {+numeroFoglietto > 9 ? <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} >Stampa Conto</Button> :
                      <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled >Stampa Conto</Button>
                    }
                    &nbsp;<Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleAggiorna} disabled>Aggiorna Conto</Button>
                    <br />
                    {+numeroFoglietto < 10 ? <p> Conto "non stampabile" numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p> : <p> Conto "aperto" numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>}
                  </div>

                  <div className="sez-dx-bassa">
                    <ul className="inline-block text-base md:text-2xl py-3  font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                      &nbsp;Chiudi conto&nbsp;&nbsp;
                      <ButtonGroup size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} >
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleAChiudiPos} disabled>  POS  </Button>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleAChiudi} disabled>Contanti</Button>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleChiudiGratis} disabled>Altro Importo</Button>
                      </ButtonGroup>
                      &nbsp;&nbsp;
                    </ul>
                  </div>
                </footer>
                </div>
 
               

                {/* Sezione che verrà stampata */}
                <div ref={printRef} className="hidden">
                  <TheBill item={products} />
                </div>

            </main>
  
        );
      case 'modificato':
        return (
          <>
            <main>
              <div className="container">
                <header className="top-section">
                  <div className="sez-sx">
                    <div className="p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                      <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
                        <li className="flex-1 mr-2font-bold py-2 ">
                          <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                            Casse
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
                                  textAlign: 'right', // Allinea il testo a destra
                                },
                              }}
                              type="number"
                            />
                          </div>

                        </li>
                        <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 ">
                          <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Button variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                          </ButtonGroup>
                          <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Button size="small" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                          </ButtonGroup>

                        </li>
                      </ul>
                    </div>
                    <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                      <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                        <p><span className="text-blue-800 ">Ultimi ricercati &nbsp;</span>
                          {lastLog.map((row) => (
                            <>
                              <Button size="medium" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                              &nbsp;
                            </>
                          ))}</p>
                      </ButtonGroup>
                      <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                        <p><span className="text-blue-800 ">Ultimi  &nbsp;</span>
                          {lastLog.map((row) => (
                            <>
                              <Button size="small" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                              &nbsp;
                            </>
                          ))}</p>
                      </ButtonGroup>
                    </div>

                  </div>
                <div className="sez-dx">
                  <div className="text-base md:text-2xl py-2 md:py-4 font-extralight text-end">
                    <Button size="medium" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
                    &nbsp;&nbsp;
                    <Button size="medium" color="secondary" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                      <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                      <p>  Conto:{" "}            <span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>
                      <p>  Conto aperto da:{" "}  <span className="font-extrabold text-blue-800"> {deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp; </span></p>
                      <p>  Cameriere:{" "}        <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span></p>
                    </ButtonGroup>
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                      <p>Conto:{" "}<span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;</span>{" ("}<span className="text-blue-800 font-bold"> {deltanow(conto?.data_apertura)}</span>{") "}
                        &nbsp;Cameriere:{" "}<span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;</span></p>
                    </ButtonGroup>
                  </div>
                </div>
                </header>
                <main className="middle-section_XS">
                  <TabellaConto item={products} onAdd10={handleAdd10} onAdd={handleAdd} onRemove={handleRemove} onSet={handleSet} />
                </main>

                <footer className="bottom-section">
                  <div className="sez-sx-bassa ">
                    <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled >Stampa Conto</Button>
                    &nbsp;<Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleAggiorna} >Aggiorna Conto</Button>
                    <br />
                    <p> Conto "modificato" numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>
                  </div>

                  <div className="sez-dx-bassa">
                    <ul className="inline-block text-base md:text-2xl py-3 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                      &nbsp;Chiudi conto&nbsp;&nbsp;
                      <ButtonGroup size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} >
                        <Button size="medium" className="rounded-full" variant="contained" onClick={handleAChiudiPos} disabled>  POS  </Button>
                        <Button size="medium" className="rounded-full" variant="contained" onClick={handleAChiudi} disabled>Contanti</Button>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleChiudiGratis} disabled>Altro Importo</Button>
                      </ButtonGroup>
                      &nbsp;&nbsp;
                    </ul>
                  </div>
                </footer>

                {/* Sezione che verrà stampata */}
                <div ref={printRef} className="hidden">
                  <TheBill item={products} />
                </div>
              </div>
            </main>
          </>

        );
      case 'stampato':
        return (

          <>
            <main>
              <div className="container">
                <header className="top-section">
                  <div className="sez-sx">
                    <div className="p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full" style={{ borderRadius: '9999px' }}>
                      <ul className="flex rounded-full" style={{ borderRadius: '9999px' }}>
                        <li className="flex-1 mr-2font-bold py-2 ">
                          <a className="text-center block text-blue-700 font-extraligh text-2xl md:text-5xl">
                            Casse
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
                                  textAlign: 'right', // Allinea il testo a destra
                                },
                              }}
                              type="number"
                            />
                          </div>

                        </li>
                        <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 ">
                          <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Button variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                          </ButtonGroup>
                          <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Button size="small" variant="contained" onClick={handleButtonClickCarica} style={{ borderRadius: '9999px' }}>Carica Foglietto</Button>
                          </ButtonGroup>

                        </li>
                      </ul>
                    </div>
                    <div className="text-base md:text-xl" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                      <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                        <p><span className="text-blue-800 ">Ultimi ricercati &nbsp;</span>
                          {lastLog.map((row) => (
                            <>
                              <Button size="medium" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                              &nbsp;
                            </>
                          ))}</p>
                      </ButtonGroup>
                      <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                        <p><span className="text-blue-800 ">Ultimi  &nbsp;</span>
                          {lastLog.map((row) => (
                            <>
                              <Button size="small" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />} style={{ borderRadius: '9999px' }}>{row.foglietto}</Button>
                              &nbsp;
                            </>
                          ))}</p>
                      </ButtonGroup>
                    </div>

                  </div>

                 <div className="sez-dx">
                  <div className="text-base md:text-2xl py-2 md:py-4 font-extralight text-end">
                    <Button size="medium" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
                    &nbsp;&nbsp;
                    <Button size="medium" color="secondary" className="font-semibold rounded-full" style={{ borderRadius: '9999px' }} variant="outlined" onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                    <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                      <p>  Conto:{" "}            <span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>
                      <p>  Conto aperto da:{" "}  <span className="font-extrabold text-blue-800"> {deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp; </span></p>
                      <p>  Cameriere:{" "}        <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span></p>
                    </ButtonGroup>
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                      <p>Conto:{" "}<span className="font-extrabold text-blue-800 ">{numeroFoglietto}&nbsp;</span>{" ("}<span className="text-blue-800 font-bold"> {deltanow(conto?.data_apertura)}</span>{") "}
                        &nbsp;Cameriere:{" "}<span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;</span></p>
                    </ButtonGroup>
                    </div>
                  </div>
                </header>
                <main className="middle-section_XS">
                  <TabellaConto item={products} onAdd10={handleAdd10} onAdd={handleAdd} onRemove={handleRemove} onSet={handleSet} />
                </main>


                <footer className="bottom-section">
                  <ButtonGroup sx={{ display: { xs: 'none', md: 'block' } }}>
                    {+numeroFoglietto > 9 ? <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} >Stampa Conto</Button> :
                      <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled >Stampa Conto</Button>
                    }
                    &nbsp;<Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleAggiorna} disabled>Aggiorna Conto</Button>
                    <br />
                    <p> Conto "stampato" numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span></p>
                   <br />

                  <div className="sez-dx-bassa">
                    <ul className="inline-block text-base md:text-2xl py-3 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                      &nbsp;Chiudi conto&nbsp;&nbsp;
                      <ButtonGroup size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }}>
                        <Button size="medium" className="rounded-full" variant="contained" onClick={handleAChiudiPos} >  POS  </Button>
                        <Button size="medium" className="rounded-full" variant="contained" onClick={handleAChiudi} >Contanti</Button>
                        <Button size="medium" className="rounded-full" variant="contained" onClick={handleChiudiGratis} >Altro Importo</Button>
                      </ButtonGroup>
                      &nbsp;&nbsp;
                    </ul>
                  </div>  </ButtonGroup>
                 
                 
                 
                    <ButtonGroup sx={{ display: { xs: 'block', md: 'none' } }}>
                    <div className=" justify-center">
                      {+numeroFoglietto > 9 ? <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} >Stampa Conto</Button> :
                        <Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleStampa} disabled >Stampa Conto</Button>
                      }
                      &nbsp;<Button size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }} onClick={handleAggiorna} disabled>Aggiorna Conto</Button>

                      <ButtonGroup size="medium" className="rounded-full" variant="contained" style={{ borderRadius: '9999px' }}>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleAChiudiPos} >  POS  </Button>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleAChiudi} >Contanti</Button>
                        <Button size="medium" className="rounded-full" variant="contained"  onClick={handleChiudiGratis} >Altro Importo</Button>
                      </ButtonGroup>
                    </div>
                  </ButtonGroup>
 
                  
                </footer>

                {/* Sezione che verrà stampata */}
                <div ref={printRef} className="hidden">
                  <TheBill item={products} />
                </div>
              </div>
            </main>
          </>

        );
      case 'chiuso':
        return (
          <>
            <header className="top-section">
              <div className="sez-sx">
                <div className="font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
                  <ul className="flex rounded-full">
                    <li className="flex-1 mr-2 font-bold py-4 rounded-full">
                      <a className="text-center block text-white font-extralight text-2xl  md:text-5xl ">
                        Casse
                      </a>
                      <div className="text-xs text-center text-white ">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>
                    </li>
                    <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4">

                      <div className='text-center text-emerald-600'>
                        <TextField
                          autoFocus
                          className="p-2"
                          label="Numero Foglietto"
                          variant="outlined"
                          value={numero}
                          onChange={handleInputChange}
                          sx={{
                            input: {
                              textAlign: 'right', // Allinea il testo a destra
                            },
                          }}
                          type="number"
                        />
                      </div>

                    </li>
                    <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                      <Button className="rounded-full" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                    </li>
                  </ul>
                </div>
                <div className=" xl:text-2xl  xl:py-4 font-extralight xl:text-end md:text-base md:py-2 md:text-center">
                  Ultimi ricercati: &nbsp;
                  {lastLog.map((row) => (
                    <>
                      <Button size="medium" className="rounded-full" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />}>{row.foglietto}</Button>
                      &nbsp;&nbsp;
                    </>
                  ))}

                </div>

              </div>
              <div className="sez-dx">
                <div className="xl:text-2xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                  <Button size="medium" className="font-semibold rounded-full" variant="outlined" onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
                  &nbsp;&nbsp;
                  <Button size="medium" color="secondary" className="font-semibold rounded-full" variant="outlined" onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                </div>
                <br /><br /><br /><br /><br />
              </div>
            </header>

            <main className="middle-section">
              <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50  text-center" role="alert">
                <span className="text-xl font-semibold">Dark alert!</span> Conto {conto?.id_comanda} chiuso in data: {milltodatestring(conto?.data_chiusura)} totale: {conto?.totale} Euro.
              </div>

            </main>
            <footer className="bottom-section">
              <div className="sez-sx-bassa">
                <div>
                  <Button size="medium" className="rounded-full" variant="contained" onClick={handleButtonRiapri}>Riapri Conto</Button>
                </div>
              </div>
              <div className="sez-dx-bassa">
              </div>
            </footer>
          </>
        );
      case 'modificaquantita':
        return (
          <div className="flex items-center justify-center min-h-screen rounded">
            <div className="w-[600px] p-4  space-y-4 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded -translate-y-16">
              <p className="text-xl py-1 rounded">
                Per il conto numero: <span className="font-extrabold text-blue-800">{conto?.id_comanda} </span>
                inserisci la quantità di porzioni per il piatto: <span className="font-extrabold text-blue-800">{piattomodificaquantitaValue}
                </span>
              </p>
              <TextField
                label="Modifica quantità"
                variant="outlined"
                value={nuovaquantitaValue}
                onChange={(e) => setQuantitaValue(e.target.value)}
                type="number"
                size="medium"
                fullWidth
              />

              <div className="flex justify-center space-x-4">
                <Button size="small" variant="contained" color="primary" onClick={handleModificaQuantita}>
                  Salva e chiudi
                </Button>
                <Button size="small" variant="contained" color="primary" onClick={handleAnnulla}>
                  Annulla
                </Button>
              </div>
            </div>
          </div>
        );
      case 'none':
        return (
          <>

            <header className="top-section">
              <div className="sez-sx">
                <div className="font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
                  <ul className="flex rounded-full">
                    <li className="flex-1 mr-2  font-bold py-4 rounded-full">
                      <a className="text-center block text-white font-extralight text-2xl  md:text-5xl ">
                        Casse
                      </a>
                      <div className="text-xs text-center text-white ">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>
                    </li>
                    <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4">

                      <div className='text-center text-emerald-600'>
                        <TextField
                          autoFocus
                          className="p-2"
                          label="Numero Foglietto"
                          variant="outlined"
                          value={numero}
                          onChange={handleInputChange}
                          sx={{
                            input: {
                              textAlign: 'right', // Allinea il testo a destra
                            },
                          }}
                          type="number"
                        />
                      </div>

                    </li>
                    <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                      <Button className="rounded-full" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
                    </li>
                  </ul>
                </div>
                <div className=" xl:text-2xl  xl:py-4 font-extralight xl:text-end md:text-base md:py-2 md:text-center">
                  Ultimi ricercati: &nbsp;
                  {lastLog.map((row) => (
                    <>
                      <Button size="medium" className="rounded-full" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />}>{row.foglietto}</Button>
                      &nbsp;&nbsp;
                    </>
                  ))}

                </div>

              </div>
              <div className="sez-dx">
                <div className="xl:text-2xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                  <Button size="medium" className="font-semibold rounded-full" variant="outlined" onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
                  &nbsp;&nbsp;
                  <Button size="medium" color="secondary" className="font-semibold rounded-full" variant="outlined" onClick={handleButtonClickCaricaConto1}>Camerieri</Button>
                </div>
                <br /><br /><br /><br /><br />
              </div>
            </header>

            <main className="middle-section">
              <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50  text-center" role="alert">
                <span className="text-xl font-semibold">Dark alert!</span> Conto non esistente.
              </div>
            </main>

            <footer className="bottom-section">
              <div className="sez-sx-bassa">
                <div>
                  <Button size="medium" className="rounded-full" variant="contained" onClick={handleButtonCrea}>Crea Nuovo Conto</Button>
                </div>
              </div>
              <div className="sez-dx-bassa">
              </div>
            </footer>
          </>
        );

      default:
        return null;
    }
  };

  if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {

    if (sagra.stato == 'CHIUSA') {
      return (
        <main>
          <div className="flex flex-wrap flex-col">
            <div className='text-center '>
              <div className="p-4 mb-4 text-xl text-yellow-800 rounded-lg bg-yellow-50" role="alert">
                <span className="text-xl font-semibold">Warning alert!</span> La giornata non è stata ancora aperta!
              </div>
            </div>
          </div>
        </main>

      )
    } else {
      return (
        <main>
          {renderPhaseContent()}

          <Snackbar
            open={openSnackbar}
            autoHideDuration={6001}
            onClose={handleClose}
            message={(+numeroFoglietto) > 9999 ?
              "3 Inserisci un numero foglietto valido (minore di 8999)" :
              "4 Hai inserito un numero riservato asporto (compreso tra 9000 e 9999)"
            }
          />

        </main>
      )
    }
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