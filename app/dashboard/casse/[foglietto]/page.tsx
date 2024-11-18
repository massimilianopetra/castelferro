'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { Button, ButtonGroup, Snackbar, TextField } from '@mui/material';
import type { DbConsumazioniPrezzo, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto, aggiornaConto, stampaConto, riapriConto, apriConto, getContoPiuAlto } from '@/app/lib/actions';
import { writeLog, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils'
import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import TheBill from '@/app/ui/dashboard/thebill';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';
import { The_Nautigal } from 'next/font/google';


export default function Page({ params }: { params: { foglietto: string } }) {

  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [importValue, setImportValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [phase, setPhase] = useState('iniziale');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [products, setProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [iniProducts, setIniProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [numero, setNumero] = useState<number | string>('');
  const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
  const [conto, setConto] = useState<DbConti>();
  const [lastLog, setLastLog] = useState<DbLog[]>([]);
  const { data: session } = useSession();
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

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

        //console.log(`estrazione conto ${num} giornata: ${gg.giornata}`);
        const cc = await getConto(num, gg.giornata);
        //console.log('record: ');
        //console.log(cc);
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
        } else if (Number(num) > 5999) {
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

  const handleButtonClickCarica = () => {
    const num = Number(numero);
    if (isNaN(num) || num < 1 || num > 9999) {
      setOpenSnackbar(true);
      return;
    }

    router.push(`/dashboard/casse/${numero}`);
  };

  const handleButtonClickCaricaAsporto = async () => {
    const ultconto = await getContoPiuAlto();
    var uc = Number(ultconto);
    if (uc < 5999)
        uc = 6000 
    carica(uc+1);
};

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
     {/* setPhase('stampato');  {/*BRUNO */}  
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
            <div className='z-0 text-center'>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <p className="text-5xl py-4">
                Caricare un numero foglietto!!
              </p>
            </div>
          </>
        );
      case 'iniziale_stampato':
        console.log('iniziale_stampato');
          return (
            <>
              <div className='z-0 text-center'>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <p className="text-5xl py-4">
                  Conto  <span className="font-extrabold text-blue-800">
                    {numeroFoglietto}
                  </span> inviato in stampa. 
                  <br></br>      
                  <br></br>  
                  Caricare un numero foglietto!!
                </p>
              </div>
            </>
          );
      case 'caricamento':
        return (
          <>
            <div className='z-0 text-center'>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <p className="text-5xl py-4">
                Caricamento in corso ...
              </p>
              <CircularProgress />
            </div>

          </>
        );
      case 'elaborazione':
        return (
          <>
            <div className='z-0 text-center '>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <p className="text-5xl py-4">
                Elaborazione in corso ...
              </p>
              <CircularProgress />
            </div>

          </>
        );
      case 'gratis':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-[600px] p-4 border rounded-lg space-y-4">
            <p className="text-xl py-4">
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
                <Button variant="contained" color="primary" onClick={handleCompletatoGratis}>
                  Salva e chiudi
                </Button>
                <Button variant="contained" color="primary" onClick={handleAnnullaGratis}>
                  Annulla
                </Button>
              </div>
            </div>
          </div>
        )
      case 'aperto':
        return (
          <>
            <br></br>
            <br></br>
            <br></br>
            <div className="z-0 text-center">
              <div className="z-0 text-2xl font-extralight text-end"> 
                <p>
                  Conto aperto da:{" "}
                  <span className="font-extrabold text-blue-800">
                    {deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;
                  </span>
                </p>
                <p>
                  Cameriere:{" "}
                  <span className="font-extrabold text-blue-800">
                    {conto?.cameriere}&nbsp;&nbsp;&nbsp;
                  </span>
                </p>
                <p>
                  Conto:{" "}
                  <span className="font-extrabold text-blue-800">
                    {numeroFoglietto}&nbsp;&nbsp;&nbsp;
                  </span>
                </p>
              </div>
              <div>
                <TabellaConto
                  item={products}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                />
              </div>
              <div className="z-0 text-2xl font-extralight text-end">
                <p>
                  Conto:{" "}
                  <span className="font-extrabold text-blue-800">  {numeroFoglietto}&nbsp;&nbsp;&nbsp; </span>
                </p>
              </div>
              &nbsp;
              <div className="text-center ">
                {+numeroFoglietto > 10 ? (
                  <Button variant="contained" onClick={handleStampa}>
                    Stampa Conto
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleStampa} disabled>
                    Stampa Conto
                  </Button>
                )}
                &nbsp;&nbsp;
                <ul className="inline-block py-3 text-xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                  &nbsp;Chiudi conto&nbsp;&nbsp;
                  <ButtonGroup variant="contained" aria-label="xccc">
                    <Button variant="contained" onClick={handleAChiudiPos} disabled>{" "}POS{" "}</Button>
                    <Button variant="contained" onClick={handleAChiudi} disabled> Contanti </Button>
                    <Button variant="contained" onClick={handleChiudiGratis} disabled>Altro Importo</Button>
                  </ButtonGroup>
                  &nbsp;&nbsp;
                </ul>
                &nbsp;&nbsp;
                <Button variant="contained" onClick={handleAggiorna} disabled>
                  Aggiorna Conto
                </Button>
              </div>
            </div>

            {/* Sezione che verrà stampata */}
            <div ref={printRef} className="hidden">
              <TheBill item={products} />
            </div>
          </>
        );
      case 'modificato':
        return (
          <>
            <div className="z-0 text-center">
              <div className="z-0 xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                <p >
                  Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div>
                <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
              <div className="z-0 xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                <p >
                  Conto: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              &nbsp;
              <div className='text-center'>
                <Button variant="contained" onClick={handleStampa} disabled>Stampa Conto</Button>
                &nbsp;&nbsp;
                <ul className="inline-block py-3 text-xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                  &nbsp;Chiudi conto&nbsp;&nbsp;
                  <ButtonGroup variant="contained" aria-label="xccc">
                    <Button variant="contained" onClick={handleAChiudiPos} disabled>  POS  </Button>
                    <Button variant="contained" onClick={handleAChiudi} disabled>Contanti</Button>
                    <Button variant="contained" onClick={handleChiudiGratis} disabled>Altro Importo</Button>
                  </ButtonGroup>
                  &nbsp;&nbsp;
                </ul>
                &nbsp;&nbsp;
                <Button variant="contained" onClick={handleAggiorna}>Aggiorna Conto</Button>

              </div>
            </div>
          </>
        );
      case 'stampato':
        return (
          <>
            <div className="z-0 text-center">
              <br></br>
              <br></br>
              <div className="z-0 text-3xl xl:py-4 font-extralight text-end lg:py-1">
                <p >
                  Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Conto stampato numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <ul className="inline-block py-3 text-2xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                &nbsp;Chiudi conto&nbsp;&nbsp;
                <ButtonGroup variant="contained" aria-label="xccc">
                  <Button variant="contained" size="large" onClick={handleAChiudiPos} >  POS  </Button>
                  <Button variant="contained" size="large" onClick={handleAChiudi} >Contanti</Button>
                  <Button variant="contained" size="large" onClick={handleChiudiGratis} >Altro Importo</Button>
                </ButtonGroup>
                &nbsp;&nbsp;
              </ul>
              <br />

              <div>
                <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
              <div className="z-0 xl:text-3xl xl:py-4 font-extralight text-end lg:text-base lg:py-1">
                <p >
                  Conto stampato numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div className="z-0 text-center">
                {+numeroFoglietto > 10 ? <Button variant="contained" onClick={handleStampa} >Stampa Conto</Button> :
                  <Button variant="contained" onClick={handleStampa} disabled >Stampa Conto</Button>
                }
                &nbsp;&nbsp;

                <ul className="inline-block py-3 text-2xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                  &nbsp;Chiudi conto&nbsp;&nbsp;
                  <ButtonGroup variant="contained" aria-label="xccc">
                    <Button variant="contained" onClick={handleAChiudiPos} >  POS  </Button>
                    <Button variant="contained" onClick={handleAChiudi} >Contanti</Button>
                    <Button variant="contained" onClick={handleChiudiGratis} >Altro Importo</Button>
                  </ButtonGroup>
                  &nbsp;&nbsp;
                </ul>
                &nbsp;&nbsp;
                <Button variant="contained" onClick={handleAggiorna} disabled>Aggiorna Conto</Button>
              </div>
            </div>

            {/* Sezione che verrà stampata */}
            <div ref={printRef} className="hidden">
              <TheBill item={products} />
            </div>
          </>
        );
      case 'chiuso':
        return (
          <>
            <main>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50  text-center" role="alert">
                <span className="text-xl font-semibold">Dark alert!</span> Conto {conto?.id_comanda} chiuso in data: {milltodatestring(conto?.data_chiusura)} totale: {conto?.totale} Euro.
              </div>
              <div>
                <Button className="rounded-full" variant="contained" onClick={handleButtonRiapri}>Riapri Conto</Button>
              </div>
            </main>
          </>
        );
      case 'none':
        return (
          <>
            <main>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <div className="p-4 mb-4 text-xl text-gray-800 rounded-lg bg-gray-50  text-center" role="alert">
                <span className="text-xl font-semibold">Dark alert!</span> Conto non esistente.
              </div>
              <div>
                <Button className="rounded-full" variant="contained" onClick={handleButtonCrea}>Crea Nuovo Conto</Button>
              </div>
            </main>
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
          <div className="z-50 xl:fixed lg:fixed p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
            <ul className="flex rounded-full">
              <li className="flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                <a className="text-center block text-white font-extralight ">
                  Casse
                </a>
                <div className="text-xs text-center text-white ">SAGRA:  {sagra.stato}&nbsp;&nbsp;{(sagra.stato == 'CHIUSA') ? "" : "(" + sagra.giornata + ")"}</div>
              </li>
              <li className="text-right flex-1 mr-2 text-5xl  text-white font-bold py-4">
                <a>
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
                </a>
              </li>
              <li className="text-left flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                <Button className="rounded-full" variant="contained" onClick={handleButtonClickCarica}>Carica Foglietto</Button>
              </li>
            </ul>
          </div>
          <div className="z-0 xl:text-3xl font-extralight xl:text-end lg:text-2xl lg:py-2 lg:text-center">
            <p>Ultimi: &nbsp;
              {lastLog.map((row) => (
                <>
                  <Button size="medium" className="rounded-full" variant="contained" onClick={() => {
                      if  (phase == 'iniziale_stampato') 
                        setPhase('stampato') 
                      else
                        carica(row.foglietto) }} startIcon={<Filter1Icon />}>{row.foglietto}</Button>
                  &nbsp;&nbsp;
                </>
              ))
            }
            <Button size="medium" className="font-semibold rounded-full" variant="outlined"  onClick={handleButtonClickCaricaAsporto}>Asporto</Button>
        
            </p>
          
          </div>
          {renderPhaseContent()}
          <div>
            <Snackbar
              open={openSnackbar}
              autoHideDuration={6000}
              message="Inserisci un numero foglietto valido"
              onClose={handleClose}
            />
          </div>

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