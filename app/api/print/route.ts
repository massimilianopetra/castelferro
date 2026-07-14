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
    // 1. RESET TOTALE SCONTRINO (Pulisce i vecchi comandi size della stampa precedente)
    .hardware('INIT') 
    .lineSpace(0) // Riduce lo spazio sopra al minimo per il titolo gigante

    // 2. PASS USCITA (Grosso e Centrato)
    .align('ct')
    .font('a') // Usa il Font A per la scritta grande
    .style('b')
    .size(3, 3) // Massimo ingrandimento hardware
    .text('PASS USCITA')

    // 3. TEXT RESET: Ritorniamo al font minuscolo del selftest per il resto dello scontrino
    // Reimpostando size(1,1) dopo un size(3,3) forziamo la stampante a resettare la scala dei caratteri
    .size(1, 1) 
    .lineSpace() // Ripristina lo spazio tra le righe standard o i testi si sovrapporranno

    // 4. GIORNO IN GRASSETTO (Dimensione Media)
    .align('ct')
    .font('a')
    .style('b')
    .size(2, 2) 
    .text(`${nomeGiorno}`) 

    // 5. CONTO E DETTAGLI (PICCOLO COME IL SELFTEST)
    // Per farlo minuscolo dobbiamo attivare esplicitamente il FONT B della stampante
    .align('ct')
    .font('b')      // <--- FONT B: Attiva i caratteri piccoli del selftest (9x17 punti)
    .style('normal')
    .size(1, 1)     // <--- Ora 1,1 sarà applicato al carattere piccolo, non a quello grande!
    .text(`Conto:${numeroFoglietto} (${i}/${totaleCoperti})`);

  // 6. Immagine sempre in fondo (se presente)
  if (image) {
    await printer.image(image, 'D24');
  }

  // 7. TAGLIO SENZA FEED AGGIUNTIVO
  // Rimosso .feed(1) per evitare che spinga fuori ulteriore carta bianca prima di tagliare!
  printer.cut(); 
}
            } else {
              console.log(`Stampa tickets`);
              // --- LOGICA STAMPA STANDARD (Invariata) ---
              if (image) {
                await printer.image(image, 'D24');
              }
              printer
                .style('b').font('b').size(2, 2)
                .text(new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }))
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