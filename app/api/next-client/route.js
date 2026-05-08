// app/api/next-client/route.js
import { broadcastNextClient } from '../queue/broadcast';

// Variabili globali per gestire lo stato in memoria durante la sessione
let clients = [];
let history = []; 

export async function POST(request) {
    const body = await request.json();

    if (body.type === 'NEW_TICKET') {
        // Notifica alle tabelle (pagina Chiama) che c'è un nuovo ticket da caricare
        const message = `data: ${JSON.stringify({ type: 'REFRESH_TABLE' })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    } 
    else if (body.type === 'REFRESH_TABLE') {
        // AZZERAMENTO TOTALE: Svuotiamo la cronologia e resettiamo il display
        history = []; 
        
        const message = `data: ${JSON.stringify({ 
            type: 'UPDATE_HISTORY', 
            history: [], 
            numero: 0 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else if (body.type === 'SET_SITTING') {
        // RIMUPZIONE SINGOLO: Quando un numero si siede o viene cancellato dalla lista
        history = history.filter(n => n !== body.numero);
        
        const message = `data: ${JSON.stringify({ 
            type: 'UPDATE_HISTORY', 
            history: history.slice(1, 6) 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else {
        // LOGICA CHIAMA (body.numero contiene il numero chiamato)
        broadcastNextClient(body.numero);
        
        if (history[0] !== body.numero) {
            history = [body.numero, ...history.filter(n => n !== body.numero)];
            history = history.slice(0, 15); 
        }

        const message = `data: ${JSON.stringify({ 
            type: 'CALL_NUMBER', 
            numero: body.numero,
            history: history.slice(1, 6) 
        })}\n\n`;
        
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }

    return Response.json({ success: true });
}

export async function GET(request) {
    const stream = new ReadableStream({
        start(controller) {
            // Aggiungiamo il client alla lista
            clients.push(controller);
            
            // Invio dello stato iniziale (se c'è già un numero chiamato)
            const initMsg = `data: ${JSON.stringify({ 
                type: 'UPDATE_HISTORY', 
                history: history.slice(1, 6),
                numero: history[0] || 0
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initMsg));

            // --- INIZIO LOGICA KEEP-ALIVE ---
            // Invia un commento SSE (inizia con ':') ogni 15 secondi per mantenere la connessione viva
            const keepAlive = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
                } catch (err) {
                    // Se il controller è chiuso, l'intervallo verrà pulito dall'onabort
                }
            }, 15000);
            // --- FINE LOGICA KEEP-ALIVE ---

            request.signal.onabort = () => {
                // Fermiamo l'intervallo e rimuoviamo il client quando si disconnette
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