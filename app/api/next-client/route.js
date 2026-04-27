// app/api/next-client/route.js
import { broadcastNextClient } from '../queue/broadcast';

let clients = [];
let history = []; // Variabile globale per la cronologia

export async function POST(request) {
    const body = await request.json();

    if (body.type === 'NEW_TICKET') {
        const message = `data: ${JSON.stringify({ type: 'REFRESH_TABLE' })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    } 
    else if (body.type === 'SET_SITTING') {
        // PUNTO CRITICO: Rimuoviamo il numero dalla cronologia
        history = history.filter(n => n !== body.numero);
        
        // Inviamo al display la cronologia pulita (sempre i primi 5)
        // NOTA: il numero attualmente grande è gestito a parte, 
        // qui mandiamo i "GIA' CHIAMATI"
        const message = `data: ${JSON.stringify({ 
            type: 'UPDATE_HISTORY', 
            history: history.slice(1, 6) 
        })}\n\n`;
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }
    else {
        // Logica CHIAMA (body.numero contiene il nuovo numero chiamato)
        broadcastNextClient(body.numero);
        
        // Se il numero non è già in testa alla cronologia, lo aggiungiamo
        if (history[0] !== body.numero) {
            // Lo mettiamo davanti e filtriamo eventuali duplicati dello stesso numero
            history = [body.numero, ...history.filter(n => n !== body.numero)];
            // Teniamo un buffer di 10 per sicurezza, ma ne mostreremo 5
            history = history.slice(0, 10); 
        }

        const message = `data: ${JSON.stringify({ 
            type: 'CALL_NUMBER', 
            numero: body.numero,
            history: history.slice(1, 6) // Prende esattamente i 5 dopo quello attuale
        })}\n\n`;
        
        clients.forEach(c => c.enqueue(new TextEncoder().encode(message)));
    }

    return Response.json({ success: true });
}

export async function GET(request) {
    const stream = new ReadableStream({
        start(controller) {
            clients.push(controller);
            // Al collegamento inviamo lo stato attuale
            const initMsg = `data: ${JSON.stringify({ 
                type: 'UPDATE_HISTORY', 
                history: history.slice(1, 6) 
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