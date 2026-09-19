
/*
          // Header
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x38])) // Font A 2x2 Bold
            .text('TEST STILI E FONT')
            .raw(Buffer.from([0x1b, 0x21, 0x00]))
            .text('--------------------------------');

          // 1. FONT B MICRO (Sottile)
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x01]))
            .text('1. Font B Micro [0x01]')
            .text('Conto:123 (1/4) - ABCDEF123456');

          // 2. FONT B + BOLD (Consigliato per leggibilita)
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x09]))
            .text('2. Font B + Bold [0x09]')
            .text('Conto:123 (1/4) - ABCDEF123456');

          // 3. FONT B + DOPPIA ALTEZZA
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x11]))
            .text('3. Font B + Alta [0x11]')
            .text('Conto:123 (1/4)');

          // 4. FONT B + DOPPIA LARGHEZZA
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x21]))
            .text('4. Font B + Larga [0x21]')
            .text('Conto:123 (1/4)');

          // Separatore
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x00]))
            .text('--------------------------------');

          // 5. FONT A STANDARD
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x00]))
            .text('5. Font A Standard [0x00]')
            .text('Conto:123 (1/4)');

          // 6. FONT A + BOLD
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x08]))
            .text('6. Font A + Bold [0x08]')
            .text('Conto:123 (1/4)');

          // 7. FONT A + DOPPIA ALTEZZA
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x10]))
            .text('7. Font A + Alta [0x10]')
            .text('Conto:123 (1/4)');

          // 8. FONT A + DOPPIA LARGHEZZA
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x20]))
            .text('8. Font A + Larga [0x20]')
            .text('Conto:123');

          // 9. FONT A + 2x2 (GRANDE)
          printer
            .raw(Buffer.from([0x1b, 0x21, 0x30]))
            .text('9. Font 2x2 [0x30]')
    .feed(2)
    .cut();
*/
import { NextResponse } from 'next/server';
const path = require('path');

export async function POST(req: Request) {
  try {
    const body = await req.json();
const { 
  numeroTicket, coperti, ipAddress, isPass, isConto, giornata, numeroFoglietto, prodotti,anno,
  titolo, edizione, inizio, fine, mese 
} = body;
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

    const SET_WPC1252 = Buffer.from([0x1B, 0x74, 0x10]);
    const EURO_BYTE = Buffer.from([0x80]); // Simbolo € in WPC1252
    const Cerchietto_BYTE = Buffer.from([0xF8]);

    await new Promise((resolve, reject) => {

      const totaleCoperti = Number(coperti) || 1;
      const mappaGiorni = ["", "GIOVEDI'", "VENERDI'", "SABATO", "DOMENICA", "LUNEDI'", "MARTEDI'", "MERCOLEDI'", "GIOVEDI'"];
      const nomeGiorno = mappaGiorni[Number(giornata)] || `GIORNO ${giornata}`;

      escpos.Image.load(logoPath, function (image: any) {
        device.open(async (err: any) => {
          if (err) return reject(err);

          try {
            // Reset iniziale e impostazione Font A Standard [0x00]

            printer.hardware('INIT').raw(Buffer.from([0x1b, 0x21, 0x00]));

            // 2. Costruzione dell'header
            const rigaHeader2 = `${inizio || ''}-${fine || ''} ${mese || ''} ${anno || ''}`.trim();
// Impostiamo la codepage CP850 (ESC t 2)
  const SET_CP850 = Buffer.from([0x1B, 0x74, 0x02]);
            // --- STAMPA HEADER CENTRATO ---
            if (rigaHeader2 || titolo) {
              printer
                .align('ct')
                .raw(SET_CP850)                       // Imposta tabella caratteri
                .raw(Buffer.from([0x1b, 0x21, 0x10]))  // Doppia altezza
                .raw(Buffer.from(`${edizione || ''}`))  // Numero edizione (es. 50)
                .raw(Cerchietto_BYTE)                   // Byte 0xB0 per '°'
                .text(` ${titolo || ''}`);             // Titolo + A Capo

              printer
                .raw(Buffer.from([0x1b, 0x21, 0x08]))  // Bold
                .text(rigaHeader2)
                .feed(1);                               // Spazio prima del conto
            }
            if (isConto) {
              // --- STAMPA DEL CONTO SU STAMPANTE TERMICA ---
              const numCoperti = Number(coperti) || 1;
              let totale = 0;
              // 1. Formattazione Data e Ora (senza secondi HH:MM)
              const oraSenzaSecondi = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const dataStr = new Date().toLocaleDateString('it-IT');

              // 2. Composizione della prima riga: "CONTO N. X" a sinistra, "Data: DD/MM/YYYY" a destra
              // Calcolo spazi: 42 caratteri totali
              const contoStr = `      CONTO N. ${numeroFoglietto}`;
              const dataEtichetta = `Data: ${dataStr}`;
              const spaziData = 42 - contoStr.length - dataEtichetta.length;
              const riga1 = contoStr + ' '.repeat(Math.max(0, spaziData)) + dataEtichetta;

              // 3. Composizione della seconda riga: "Ora: HH:MM" allineata a destra sotto la data
              const oraEtichetta = `Ora: ${oraSenzaSecondi}`;
              const riga2 = oraEtichetta.padStart(42);
              printer
                .align('lt')
                // RIGA 1: "CONTO N. X" in Doppia Altezza [0x10] + "Data: ..."
                .raw(Buffer.from([0x1b, 0x21, 0x10]))
                .text(riga1)

                // RIGA 2: "Ora: HH:MM" in Bold [0x08] allineato a destra
                .raw(Buffer.from([0x1b, 0x21, 0x08]))
                .text(riga2)

                // Reset Stile e Separatore
                .raw(Buffer.from([0x1b, 0x21, 0x00]))

                .text('------------------------------------------------');

              printer
                              .raw(SET_WPC1252)       
                .raw(Buffer.from('Q'.padStart(3) + ' ' + '     '.padEnd(25) + 'Prezzo('))
                .raw(EURO_BYTE)                             // Stampa € per la colonna prezzo
                .raw(Buffer.from(')'))                     // Chiude la parentesi
                .raw(Buffer.from(' SUBTOT('))               // Spazio di separazione + SUBTOT(
                .raw(EURO_BYTE)                             // Stampa € per la colonna subtotale
                .text(')');
              printer.text('------------------------------------------------');

              // Ciclo articoli
              if (Array.isArray(prodotti)) {
                prodotti.forEach((p: any) => {
                  const qty = Number(p.quantita) || 0;
                  const prezzoUnit = Number(p.prezzo_unitario) || 0;
                  const subTot = qty * prezzoUnit;
                  totale += subTot;

                  const qtyStr = qty.toString().padStart(3) + ' ';
                  let aliasStr = (p.alias || p.piatto || '').substring(0, 26).padEnd(27);
                  const prezzoStr = prezzoUnit.toFixed(1).padStart(6);
                  const subTotStr = subTot.toFixed(1).padStart(10);

                  printer.text(`${qtyStr}${aliasStr}${prezzoStr}${subTotStr}`);
                });
              }

              printer.text('------------------------------------------------');

              // Totale e Costo a testa
              const costoATesta = totale / numCoperti;


              // TOTALE: Altezza Doppia [0x10]

              printer
                .align('rt')
                .raw(SET_WPC1252)                       // Imposta tabella WPC1252
                .raw(Buffer.from([0x1b, 0x21, 0x10]))  // Stile: Altezza doppia
                .raw(Buffer.from('TOTALE: '))          // "TOTALE: "
                .raw(Buffer.from(`${totale.toFixed(1)}`)) // Stampa la cifra numerica + spazio
                .raw(EURO_BYTE)                        // Stampa il simbolo €
                .text('');                             // Va a capo

              // --- CONTO A COPERTO: Bold [0x08] ---
              printer
                .raw(Buffer.from([0x1b, 0x21, 0x08]))  // Stile: Bold
                .raw(Buffer.from('Conto a coperto: ')) // "Conto a coperto: "
                .raw(Buffer.from(`${costoATesta.toFixed(1)}`)) // Stampa la cifra numerica + spazio
                .raw(EURO_BYTE)                        // Stampa il simbolo €
                .raw(Buffer.from(` (${numCoperti})`))
                .text('')                              // Va a capo
                .raw(Buffer.from([0x1b, 0x21, 0x00]))  // Reset stile a normale

                .feed(2)
                .align('ct')
                .text('Grazie e Arrivederci!')
                .feed(2)
                .cut();
            } else if (isPass) {
              // --- STAMPA PASS USCITA ---

              for (let i = 1; i <= totaleCoperti; i++) {
                printer
                  .hardware('INIT')
                  .lineSpace(0)
                  .align('ct')
                  .font('a')
                  .style('b')
                  .size(3, 3)
                  .text('PASS USCITA')
                  .size(1, 1)
                  .lineSpace()
                  .align('ct')
                  .font('a')
                  .style('b')
                  .size(2, 2)
                  .text(`${nomeGiorno}`)
                  .align('ct')
                  .font('b')
                  .style('normal')
                  .size(1, 1)
                  .text(`Conto:${numeroFoglietto} (${i}/${totaleCoperti})`);

                if (image) {
                  await printer.image(image, 'D24');
                }
                printer.cut();
              }
            } else {
              // --- STAMPA TICKET STANDARD ---
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