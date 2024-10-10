'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { Button, ButtonGroup, TextField } from '@mui/material';
import type { DbConsumazioniPrezzo, DbFiera, DbConti, DbLog } from '@/app/lib/definitions';
import { getConsumazioniCassa, sendConsumazioni, getConto, chiudiConto, aggiornaConto, stampaConto } from '@/app/lib/actions';
import { writeLog, getGiornoSagra, getLastLog } from '@/app/lib/actions';
import { deltanow, milltodatestring } from '@/app/lib/utils'
import TabellaConto from '@/app/ui/dashboard/TabellaConto';
import TheBill from '@/app/ui/dashboard/thebill';
import CircularProgress from '@mui/material/CircularProgress';
import Filter1Icon from '@mui/icons-material/Filter1';


export default function Page({ params }: { params: { foglietto: string } }) {

  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState('iniziale');
  const [products, setProducts] = useState<DbConsumazioniPrezzo[]>([]);
  const [numero, setNumero] = useState<number | string>('');
  const [numeroFoglietto, setNumeroFoglietto] = useState<number | string>('');
  const [conto, setConto] = useState<DbConti>();
  const [lastLog, setLastLog] = useState<DbLog[]>([]);
  const { data: session } = useSession();
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });

  useEffect(() => {
    const fetchData = async () => {

      const num = +params.foglietto;
      if (isNaN(num) || num < 1 || num > 9999) {
        alert('Inserisci un numero foglietto valido');
        return;
      }

      const gg = await getGiornoSagra();
      if (gg) {
        setSagra(gg);
        const log = await getLastLog(gg.giornata, 'Casse');
        if (log) {
          setLastLog(log);
        }


        const c = await getConsumazioniCassa(num, gg.giornata);
        if (c) setProducts(c);

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
        } else if (cc?.stato == 'CHIUSO' || cc?.stato == 'CHIUSOPOS') {
          setPhase('chiuso');
        } else {
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
    router.push(`/dashboard/casse/${numero}`);
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
      setPhase('stampato');
    };
    fetchData();
    print();
  };

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
      const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata);
      const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
      setConto(cc);
      setPhase('chiuso');
    };
    fetchData();
  };

  const handleAChiudiPos = async () => {

    const fetchData = async () => {
      setPhase('elaborazione');
      const c = await chiudiConto(Number(numeroFoglietto), sagra.giornata, true);
      const cc = await getConto(Number(numeroFoglietto), sagra.giornata);
      setConto(cc);
      setPhase('chiuso');
    };
    fetchData();
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
              <p className="text-5xl py-4">
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
              <p className="text-5xl py-4">
                Elaborazione in corso ...
              </p>
              <CircularProgress />
            </div>

          </>
        );
      case 'aperto':
        return (
          <>
            <div className="z-0 text-center">

              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Nome Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Conto caricato per Consultazione/Modifiche numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div>
                <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto caricato per Consultazione/Modifiche numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              &nbsp;
              <div className='text-center '>
                <Button variant="contained" onClick={handleStampa}>Stampa Conto</Button>
                &nbsp;&nbsp;
                <ul className="inline-block py-3 text-xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                  &nbsp;Chiudi conto&nbsp;&nbsp;
                  <ButtonGroup variant="contained" aria-label="xccc">
                    <Button variant="contained" onClick={handleAChiudiPos} disabled>  POS  </Button>
                    <Button variant="contained" onClick={handleAChiudi} disabled>Contanti</Button>
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
      case 'modificato':
        return (
          <>
            <div className="z-0 text-center">

              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Nome Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Conto caricato per Consultazione/Modifiche numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div>
                <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto caricato per Consultazione/Modifiche numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
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
              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto aperto da: <span className="font-extrabold text-blue-800">{deltanow(conto?.data_apertura)}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Nome Cameriere: <span className="font-extrabold text-blue-800">{conto?.cameriere}&nbsp;&nbsp;&nbsp;</span>
                </p>
                <p >
                  Conto stampato numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div>
                <TabellaConto item={products} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
              <div className="z-0 xl:text-2xl xl:py-4 font-extralight text-end md:text-base md:py-1">
                <p >
                  Conto stampato numero: <span className="font-extrabold text-blue-800">{numeroFoglietto}&nbsp;&nbsp;&nbsp;</span>
                </p>
              </div>
              <div className="z-0 text-center">
                <Button variant="contained" onClick={handleStampa} >Stampa Conto</Button>
                &nbsp;&nbsp;
                <ul className="inline-block py-3 text-xl font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200  rounded-full">
                  &nbsp;Chiudi conto&nbsp;&nbsp;
                  <ButtonGroup variant="contained" aria-label="xccc">
                    <Button variant="contained" onClick={handleAChiudiPos} >  POS  </Button>
                    <Button variant="contained" onClick={handleAChiudi} >Contanti</Button>
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
          <div className="z-50 lg:fixed xl:fixed md:fixed p-1 mb-1 font-extralight border-4 border-blue-600 shadow-2xl bg-blue-200 text-end rounded-full">
            <ul className="flex rounded-full">
              <li className="flex-1 mr-2 text-5xl font-bold py-4 rounded-full">
                <a className="text-center block text-white font-extralight ">
                  Casse
                </a>
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
          <div className="z-0 xl:text-2xl  xl:py-4 font-extralight xl:text-end md:text-base md:py-2 md:text-center">
            <p>Ultimi ricercati: &nbsp;
              {lastLog.map((row) => (
                <>
                  <Button size="small" className="rounded-full" variant="contained" onClick={() => { carica(row.foglietto) }} startIcon={<Filter1Icon />}>{row.foglietto}</Button>
                  &nbsp;&nbsp;
                </>
              ))}
            </p>
          </div>
          {renderPhaseContent()}

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