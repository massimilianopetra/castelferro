import { NextResponse } from 'next/server';
const escpos = require('escpos');
escpos.Network = require('escpos-network');
const path = require('path');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Aggiungiamo isPass e giornata ai parametri ricevuti
    const { numeroFoglietto ,numeroTicket, coperti, ipAddress, titolo, edizione, inizio, fine, mese, giornata, isPass } = body;

    if (!ipAddress) {
      return NextResponse.json({ success: false, error: "IP Stampante mancante" }, { status: 400 });
    }

    const device = new escpos.Network(ipAddress, 9100);
    const printer = new escpos.Printer(device, { encoding: 'GB18030' });

    // Scegliamo il logo in base al tipo di stampa
    const logoName = isPass ? 'homecasteluscita.png' : 'homecastel100x91.png';
    const logoPath = path.join(process.cwd(), 'public', logoName);

    await new Promise((resolve, reject) => {
      escpos.Image.load(logoPath, function (image: any) {
        device.open(async (err: any) => {
          if (err) return reject(err);

          try {
            printer.model('qsprinter').font('a').align('ct');

            if (isPass) {
              // --- LOGICA STAMPA PASS MULTIPLI ---
              const totaleCoperti = Number(coperti) || 1;
              
              for (let i = 1; i <= totaleCoperti; i++) {
                printer.font('b').size(1, 1).style('normal')
                  .text(`Pass di uscita ${i} di ${totaleCoperti}`)
                  .font('a')
                  .text(`Conto: ${numeroFoglietto} Giornata: ${giornata}`);

                if (image) {
                  await printer.image(image, 'D24');
                }

                printer.feed(2).cut();
              }
            } else {
              // --- LOGICA STAMPA STANDARD (Esistente) ---
              if (image) {
                await printer.image(image, 'D24');
              }
              printer
                .style('b').font('b').size(1, 1)
                .text('------------------------')
                .style('normal')
                .text(new Date().toLocaleString('it-IT'))
                .size(3, 3).style('b')
                .text(`${numeroTicket}`)
                .font('b').size(1, 1)
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