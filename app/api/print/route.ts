import { NextResponse } from 'next/server';
const path = require('path');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numeroTicket, coperti, ipAddress, isPass, giornata, numeroFoglietto } = body;

    // --- CONTROLLO AMBIENTE ---
    if (process.env.VERCEL === '1') {
      console.log("Cloud detected: skipping physical print.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const escpos = require('escpos');
    escpos.Network = require('escpos-network');

    if (!ipAddress) {
      return NextResponse.json({ success: false, error: "IP Stampante mancante" }, { status: 400 });
    }

    const device = new escpos.Network(ipAddress, 9100);
    const printer = new escpos.Printer(device, { encoding: 'CP850' });

    const logoName = isPass ? 'homecasteluscita.png' : 'homecastel100x91.png';
    const logoPath = path.join(process.cwd(), 'public', logoName);

    await new Promise((resolve, reject) => {
      escpos.Image.load(logoPath, function (image: any) {
        device.open(async (err: any) => {
          if (err) return reject(err);

          try {
            printer.model('qsprinter').font('a').align('ct');

            if (isPass) {
              console.log(`Stampa pass`);
              // --- LOGICA STAMPA PASS MULTIPLI ---
              const totaleCoperti = Number(coperti) || 1;

              const mappaGiorni = [
                "",
                "GIOVEDI'",
                "VENERDI'",
                "SABATO",
                "DOMENICA",
                "LUNEDI'",
                "MARTEDI'",
                "MERCOLEDI'",
                "GIOVEDI'"
              ];

              const indiceGiorno = Number(giornata);
              const nomeGiorno = mappaGiorni[indiceGiorno] || `GIORNO ${giornata}`;

              for (let i = 1; i <= totaleCoperti; i++) {
                printer
                  // RESET FONT: Forza il font 'a' all'inizio di OGNI scontrino
                  .font('a')

                  // 1. PASS USCITA (Grosso e Centrato)
                  .align('ct')
                  .style('b').size(3, 3)
                  .text('PASS USCITA')
                  .feed(1)

                  // 2 e 3. GIORNO IN GRASSETTO + (CONTO) NORMALE SULLA STESSA RIGA
                  .align('ct')
                  .size(2, 2) // Dimensione standard obbligatoria per mescolare gli stili sulla stessa riga
                  .style('b') // Attiva il grassetto per il giorno
                  .print(`${nomeGiorno}`) // .print() scrive il giorno SENZA andare a capo
                  .font('b').style('normal').size(1, 1)
                  .text(`(${numeroFoglietto}.${i}/${totaleCoperti})`); // .text() chiude la riga e va a capo

                // 4. Immagine sempre in fondo (se presente)
                if (image) {
                  await printer.image(image, 'D24');
                }

                // Taglio del foglio
                printer.feed(2).cut();
              }
            } else {
              console.log(`Stampa tickets`);
              // --- LOGICA STAMPA STANDARD (Invariata) ---
              if (image) {
                await printer.image(image, 'D24');
              }
              printer
                .style('b').font('b').size(2, 2)
                .text(new Date().toLocaleDateString('it-IT'))
                .size(3, 3).style('b')
                .text(`${numeroTicket}`)
                .style('normal').font('b').size(1, 1)
                .text(`Coperti: ${coperti}`)
                .feed(1).style('b')
                .text('BENVENUTI!')
                .feed(2).cut();
            }

            printer.close();
            resolve(true);
          } catch (printError) {
            reject(printError);
          }
        });
      });
    });


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRORE API PRINT:", error);
    return NextResponse.json({ success: false, error: "Errore comunicazione" }, { status: 500 });
  }
}