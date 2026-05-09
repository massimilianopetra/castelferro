// app/api/next-client/route.js
import { broadcastNextClient } from '../queue/broadcast';

// Variabili globali per gestire lo stato in memoria durante la sessione
let clients = [];
let history = []; 

export async function POST(request) {
    const body = await request.json();

if (body.type === 'NEW_TICKET') {
        // AGGIORNAMENTO: Inviamo anche i dati del ticket appena creato
        const message = `data: ${JSON.stringify({ 
            type: 'NEW_TICKET', 
            ticket: body.ticket // Il distributore dovrà passarci l'oggetto ticket
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else if (body.type === 'REFRESH_TABLE') {
        // Reset totale: svuota cronologia e pulisce il display
        history = []; 
        const message = `data: ${JSON.stringify({ 
            type: 'REFRESH_TABLE', 
            history: [], 
            numero: null 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else if (body.type === 'SET_SITTING') {
        // Quando un numero si siede, aggiorniamo la cronologia sul display
        history = history.filter(n => n !== body.numero);
        const message = `data: ${JSON.stringify({ 
            type: 'UPDATE_HISTORY', 
            history: history.slice(1, 6) 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else {
        // LOGICA CHIAMA: numero chiamato inviato al display
        if (body.numero) {
            broadcastNextClient(body.numero);
            
            if (history[0] !== body.numero) {
                history = [body.numero, ...history.filter(n => n !== body.numero)];
                history = history.slice(0, 15); 
            }

            const message = `data: ${JSON.stringify({ 
                type: 'CALL_NUMBER', 
                numero: body.numero,
                history: history 
            })}\n\n`;
            
            clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
        }
    }

    return Response.json({ success: true });
}

export async function GET(request) {
    const stream = new ReadableStream({
        start(controller) {
            clients.push(controller);
            
            // Stato iniziale per chi si connette
            const initMsg = `data: ${JSON.stringify({ 
                type: 'CALL_NUMBER', 
                history: history,
                numero: history[0] || null
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initMsg));

            const keepAlive = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
                } catch (err) {}
            }, 15000);

            request.signal.onabort = () => {
                clearInterval(keepAlive);
                clients = clients.filter(c => c !== controller);
            };
        }
    });
    
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}