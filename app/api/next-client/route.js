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
        // Lo togliamo dall'array history ovunque si trovi
        history = history.filter(n => n !== body.numero);
        
        // Inviamo al display la cronologia aggiornata (prendendo i primi 5 dopo l'attuale)
        const message = `data: ${JSON.stringify({ 
            type: 'UPDATE_HISTORY', 
            history: history.slice(1, 6) 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else {
        // LOGICA CHIAMA (body.numero contiene il numero chiamato)
        broadcastNextClient(body.numero);
        
        // Se il numero non è già in testa alla cronologia, lo aggiungiamo
        if (history[0] !== body.numero) {
            // Lo mettiamo davanti e filtriamo se era già presente nei precedenti
            history = [body.numero, ...history.filter(n => n !== body.numero)];
            // Teniamo un buffer di 10-15 per sicurezza nel DB, ma ne mostriamo 5
            history = history.slice(0, 15); 
        }

        // Messaggio per il display: 
        // numero = attuale, history = i 5 precedenti (dal secondo al sesto dell'array)
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
            clients.push(controller);
            
            // Appena un client (Display) si connette, gli mandiamo lo stato attuale
            const initMsg = `data: ${JSON.stringify({ 
                type: 'UPDATE_HISTORY', 
                history: history.slice(1, 6),
                numero: history[0] || 0
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initMsg));

            request.signal.onabort = () => {
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