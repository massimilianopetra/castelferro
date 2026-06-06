'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, DbConsumazioniPrezzo, DbConsumazioni, DbFiera, DbConti, DbCamerieri, DbLog, DbUser, DbSintesiPiatti, DbExtendedConti, DbTickets } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';
import { Pool } from 'pg';
import { date } from 'zod';
import exp from 'constants';
import bcrypt from 'bcrypt';
import { users, waiters } from '../lib/placeholder-data';
import { menu } from '../lib/placeholder-data';
import { cookies } from 'next/headers';


/* ******************** CONFIGURAZIONE CLIENT    ********************* */

const provider = process.env.DATABASE_PROVIDER; // "vercel" o "pg"
const pool = provider === 'pg' ? new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
}) : null;

async function executeQuery<T>(query: string, params?: any[]): Promise<T[] | undefined> {
  if (provider === 'pg') {
    if (!pool) {
      throw new Error('Pool non configurato per pg');
    }
    const client = await pool.connect();
    try {
      const res = params ? await client.query(query, params) : await client.query(query);
      return res.rows;
    } finally {
      client.release();
    }
  } else {
    const res = params ? await sql.query(query, params) : await sql.query(query);
    return res.rows;
  }
}


/* ************************ SEED DATABASE **************************** */
async function seedTickets() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS tickets (
       id INTEGER PRIMARY KEY,
       numpersone  INTEGER NOT NULL,
       seduto INTEGER NOT NULL, 
       caricato INTEGER NOT NULL,    
       data_distributo BIGINT,
       data_chiamato BIGINT 
     );
   `);
  console.log(`CREATED TABLE tickets`);
}

async function seedUsers() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL
     );
   `);
  console.log(`CREATED TABLE users`);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      try {
        executeQuery(`
           INSERT INTO users (id, name, email, password)
           VALUES (${user.id}, '${user.name}', '${user.email}', '${hashedPassword}')
           ON CONFLICT (id) DO NOTHING;
        `);
        return "";
      } catch (error) {
        console.log(error);
        return "";
      }
    }),
  );
  console.log(`INSERTED users`);
  return insertedUsers;
}

async function seedMenu() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS menus (
       id INTEGER PRIMARY KEY,
       piatto VARCHAR(255) UNIQUE,
       prezzo REAL,
       cucina VARCHAR(255),
       disponibile VARCHAR(3),
       alias VARCHAR(255),
       percentuale REAL
     );
   `);
  console.log(`CREATED TABLE menus`);

 const insertedMenu = await Promise.all(
    menu.map(async (item) => {
      const prezzo = isNaN(item.prezzo) ? 0 : item.prezzo;
      const percentuale = isNaN(item.percentuale) ? 0 : item.percentuale;
      return executeQuery(
        // CORRETTO: cambiato "cuisine" in "cucina"
        `INSERT INTO menus (id, piatto, prezzo, cucina, disponibile, alias, percentuale)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [item.id, item.piatto, prezzo, item.cucina, item.disponibile, item.alias, percentuale]
      );
    })
  );
  console.log(`INSERTED TABLE menus`);
  return insertedMenu;
}

async function seedConsumazioni() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS consumazioni (
       id SERIAL PRIMARY KEY,
       id_comanda INTEGER,
       id_piatto INTEGER,
       piatto VARCHAR(255) NOT NULL,
       quantita INTEGER,
       cucina VARCHAR(255) NOT NULL,
       giorno INTEGER,
       data BIGINT,
       alias VARCHAR(255) NOT NULL
     );
   `);
  console.log(`CREATED TABLE consumazioni`);
}

async function seedCamerieri() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS camerieri (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(64),
      foglietto_start INTEGER,
      foglietto_end INTEGER
    );
  `);

  console.log(`CREATED TABLE camerieri`);

  const inserted = await Promise.all(
    waiters.map(async (item) => {
      return executeQuery(
        `
        INSERT INTO camerieri (
          id,
          nome,
          foglietto_start,
          foglietto_end
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          item.id,
          item.name,
          item.figlietto_start,
          item.foglietto_end,
        ]
      );
    })
  );

  // IMPORTANTISSIMO:
  // riallinea la sequence del SERIAL al valore massimo presente
  await executeQuery(`
    SELECT setval(
      pg_get_serial_sequence('camerieri', 'id'),
      COALESCE((SELECT MAX(id) FROM camerieri), 1)
    );
  `);

  console.log(`INSERTED TABLE camerieri`);
  console.log(`SEQUENCE camerieri_id_seq sincronizzata`);

  return inserted;
}

async function seedConti() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS conti (
       id SERIAL PRIMARY KEY,
       id_comanda INTEGER,
       stato VARCHAR(32),
       totale REAL,
       cameriere VARCHAR(64),
       giorno INTEGER,
       data_apertura BIGINT,
       data BIGINT,
       data_chiusura BIGINT,
       note VARCHAR(256),
       data_stampa BIGINT
     );
   `);
  console.log(`CREATED TABLE conti`);
}

async function seedFiera() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS fiera (
       id SERIAL PRIMARY KEY,
       giornata INTEGER,
       stato VARCHAR(32)
     );
   `);
  await executeQuery(`
           INSERT INTO fiera (id, giornata, stato)
           VALUES (1,1,'CHIUSA')
           ON CONFLICT (id) DO NOTHING;
    `);
  console.log(`CREATED TABLE fiera`);
}

async function seedLog() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS logger (
       id SERIAL PRIMARY KEY,
       foglietto INTEGER,
       azione VARCHAR(32),
       note VARCHAR(128),
       cucina VARCHAR(32),
       utente VARCHAR(128),
       giornata INTEGER,
       data BIGINT
     );
   `);
  console.log(`CREATED TABLE logger`);
}

export async function seedDatabase() {
  try {
    console.log('**** Database seeding ****');
    await seedUsers();
    await seedTickets();
    await seedMenu(); // L'errore fatale avviene qui!
    await seedConsumazioni();
    await seedFiera();
    await seedConti();
    await seedCamerieri();
    await seedLog();
    console.log('Database seed completed');
  } catch (error) {
    // Aggiungi questa riga per vedere gli errori futuri!
    console.error('Errore fatale durante il seed del database:', error); 
  }
}

/* ************************ AUTHENTICATION **************************** */
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function getUser(email: string): Promise<DbUser | undefined> {
  try {
    const user = await executeQuery<DbUser>(`SELECT * FROM users WHERE email='${email}'`);
    if (user) return user[0];
    else return undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

/* ************************ GESTIONE DB **************************** */
export async function getTickets(modo: string): Promise<DbTickets[] | undefined> {
  try {
    let query = `SELECT * FROM tickets`;
    let conditions = "";
    switch (modo) {
      case 'all': conditions = ""; break;
      case 'seduti': conditions = "WHERE seduto = 1"; break;
      case 'non-seduti': conditions = "WHERE seduto = 0"; break;
      case 'automatico': conditions = "WHERE caricato = 0"; break;
      case 'manuale': conditions = "WHERE caricato = 1"; break;
      case 'entrata-libera': conditions = "WHERE caricato = 2"; break;
      case 'distribuiti': conditions = "WHERE data_distributo IS NOT NULL"; break;
      default: conditions = "";
    }
    const tickets = await executeQuery<DbTickets>(`${query} ${conditions} ORDER BY id`);
    return tickets;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    throw new Error('Failed to fetch tickets.');
  }
}

export async function updateTickets(record: DbTickets) {
  return await executeQuery(`
    UPDATE tickets
    SET 
      seduto = ${record.seduto},
      caricato = ${record.caricato},
      data_distributo = COALESCE(data_distributo, ${record.data_distributo ?? 'NULL'}),
      data_chiamato = COALESCE(data_chiamato, ${record.data_chiamato ?? 'NULL'})
    WHERE id = ${record.id};
  `);
}

export async function deleteTicket(id: number) {
  return await executeQuery(`DELETE FROM tickets WHERE id = ${id};`);
}

export async function clearAllTickets() {
  return await executeQuery(`TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;`);
}

export async function addTickets(id: number, numero_persone: number, seduto: number, caricato: number, data_distributo: number | null, data_chiamato: number | null) {
  try {
    await executeQuery(`
      INSERT INTO tickets (id, numpersone, seduto, caricato, data_distributo, data_chiamato)
      VALUES (${id}, ${numero_persone}, ${seduto}, ${caricato}, ${data_distributo ?? 'NULL'}, ${data_chiamato ?? 'NULL'});
    `);
    return { success: true };
  } catch (error: any) {
    return { error: 'DUPLICATE_ID', message: error.message };
  }
}

export async function getNextTickets(): Promise<number> {
  try {
    const tickets = await executeQuery<{ maxId: number | null }>(`SELECT MAX(id) AS "maxId" FROM tickets`);
    const row = tickets?.[0];
    const lastId = row ? (row.maxId ?? 0) : 0;
    return Number(lastId) + 1;
  } catch (error) {
    throw new Error('Failed to fetch getNextTickets.');
  }
}


export async function getFirstFreeTicket(): Promise<number> {
  try {
    // Aggiungiamo la condizione 'AND caricato != 100' per escludere quelli terminati (100 è il valore che gli do quando li cancello da CHIAMA)
    const result = await executeQuery<{ freeId: number }>(`
      SELECT MIN(t1.id + 1) AS "freeId"
      FROM tickets t1
      LEFT JOIN tickets t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL AND t1.caricato != 100
    `);
    
    const firstGap = result?.[0]?.freeId;
    
    // Verifica se il ticket 1 esiste e non è caricato 100
    const checkOne = await executeQuery(`SELECT id FROM tickets WHERE id = 1 AND caricato != 100`);
    
    if (!checkOne || checkOne.length === 0) return 1;
    return firstGap ? Number(firstGap) : 1;
  } catch (error) {
    return 1;
  }
}

export async function getStimaAttesa() {
  try {
    const result = await executeQuery<{ media_minuti: string }>(`
      SELECT AVG(data_chiamato - data_distributo) / 60000 AS media_minuti
      FROM (
        SELECT data_distributo, data_chiamato
        FROM tickets
        WHERE caricato = 0 AND data_distributo IS NOT NULL AND data_chiamato IS NOT NULL
        ORDER BY data_chiamato DESC
        LIMIT 10
      ) AS ultimi_tickets
    `);
    const media = result?.[0]?.media_minuti;
    if (!media || Number(media) === 0) {
      return { success: false, message: "Dati insufficienti per la stima" };
    }
    return { success: true, media: Math.round(Number(media)) };
  } catch (error) {
    return { success: false };
  }
}

export async function getPuntiGraficoAttesa() {
  try {
    const oraAttuale = Date.now();
    const mezzOraFa = oraAttuale - (30 * 60 * 1000);
    const result = await executeQuery<{ slot: string, attesa_media: string }>(`
      SELECT 
        (data_chiamato / 300000) * 300000 AS slot,
        AVG(data_chiamato - data_distributo) / 60000 AS attesa_media
      FROM tickets
      WHERE caricato = 0 AND data_chiamato >= ${mezzOraFa} AND data_chiamato <= ${oraAttuale}
      GROUP BY slot
      ORDER BY slot ASC
    `);
    return result || [];
  } catch (error) {
    return [];
  }
}
 
export async function updateTicket(id: number, valoreCaricato: number) {
  try {
    return await executeQuery(`
      UPDATE tickets
      SET caricato = ${valoreCaricato}
      WHERE id = ${id};
    `);
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del ticket ${id} a ${valoreCaricato}:`, error);
    throw new Error('Impossibile aggiornare lo stato del ticket.');
  }
}

export async function getTicketById(id: number): Promise<DbTickets | undefined> {
  try {
    const res = await executeQuery<DbTickets>(`SELECT * FROM tickets WHERE id = ${id}`);
    if (res && res.length > 0) return res[0];
    return undefined;
  } catch (error) {
    console.error('Failed to fetch ticket by ID:', error);
    return undefined;
  }
}

export async function updateTicketCoperti(id: number, nuoviCoperti: number) {
  try {
    return await executeQuery(`
      UPDATE tickets
      SET numpersone = ${nuoviCoperti}
      WHERE id = ${id};
    `);
  } catch (error) {
    console.error(`Errore durante l'aggiornamento dei coperti del ticket ${id}:`, error);
    throw new Error('Impossibile aggiornare i coperti del ticket.');
  }
}

export async function getStatoContiStats(giornata: number) {
  try {
    const query = `
      WITH PrioritaPassaggi AS (
        SELECT 
          foglietto, 
          cucina,
          ROW_NUMBER() OVER(
            PARTITION BY foglietto 
            ORDER BY 
              -- Priorità: i piatti hanno la precedenza (valore 1), bevande/birre per ultime (valore 2)
              CASE 
                WHEN LOWER(cucina) IN ('casse') THEN 1
                WHEN LOWER(cucina) IN ('antipasti', 'primi', 'secondi', 'dolci') THEN 2
                WHEN LOWER(cucina) IN ('bevande', 'birre') THEN 3
                ELSE 4
              END ASC,
              -- A parità di priorità, prendiamo il movimento più recente
              data DESC
          ) as rn
        FROM logger
        WHERE giornata = ${giornata} AND LOWER(cucina) IN ('antipasti', 'primi', 'secondi', 'dolci', 'bevande', 'birre', 'casse')
      ),
      ContiAttivi AS (
        SELECT id_comanda, stato
        FROM conti
        WHERE giorno = ${giornata} AND stato IN ('APERTO', 'STAMPATO')
      )
      SELECT
        COUNT(c.id_comanda)::int AS totale,
        SUM(CASE WHEN c.stato = 'STAMPATO' THEN 1 ELSE 0 END)::int AS stampati,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'antipasti' THEN 1 ELSE 0 END)::int AS antipasti,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'primi' THEN 1 ELSE 0 END)::int AS primi,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'secondi' THEN 1 ELSE 0 END)::int AS secondi,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'dolci' THEN 1 ELSE 0 END)::int AS dolci,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'bevande' THEN 1 ELSE 0 END)::int AS bevande,
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'birre' THEN 1 ELSE 0 END)::int AS birre, 
        SUM(CASE WHEN c.stato = 'APERTO' AND LOWER(u.cucina) = 'casse' THEN 1 ELSE 0 END)::int AS casse
      FROM ContiAttivi c
      LEFT JOIN PrioritaPassaggi u ON c.id_comanda = u.foglietto AND u.rn = 1;
    `;
    const result = await executeQuery<any>(query);
    return result?.[0] || { totale: 0, stampati: 0, antipasti: 0, primi: 0, secondi: 0, dolci: 0, bevande: 0, birre: 0 };
  } catch (error) {
    console.error("Errore in getStatoContiStats:", error);
    return null;
  }
}

export async function getMenu(): Promise<DbMenu[] | undefined> {
  try {
    return await executeQuery<DbMenu>(`SELECT * FROM menus ORDER BY id`);
  } catch (error) {
    throw new Error('Failed to fetch menu.');
  }
}

export async function updatetMenu(record: DbMenu) {
  return await executeQuery(`UPDATE menus SET disponibile = '${record.disponibile}' WHERE id = ${record.id};`);
}

export async function overwriteMenu(record: DbMenu[]) {
  await executeQuery(`TRUNCATE TABLE menus;`);
  record.map(async (item) => {
    return await executeQuery(`
       INSERT INTO menus (id, piatto, prezzo, cucina, disponibile, alias, percentuale)
       VALUES (${item.id}, '${item.piatto}', ${item.prezzo}, '${item.cucina}','${item.disponibile}','${item.alias}',${item.percentuale})
       ON CONFLICT (id) DO NOTHING;
    `);
  });
}

export async function setMenuAllAvailable() {
  return await executeQuery(`UPDATE menus SET disponibile = 'Y';`);
}

export async function getConsumazioni(cucina: string, comanda: number = -1, giornata: number, available = 'ALWAYS'): Promise<DbConsumazioni[] | undefined> {
  var menus = undefined;
  try {
    if (available == 'ALWAYS') {
      menus = await executeQuery<DbMenu>(`SELECT * FROM menus WHERE cucina = '${cucina}' OR cucina = 'All' ORDER BY id`);
    } else {
      menus = await executeQuery<DbMenu>(`SELECT * FROM menus WHERE (cucina = '${cucina}' OR cucina = 'All') AND disponibile = 'Y' ORDER BY id`);
    }

    if (menus) {
      const consumazioni_menu: DbConsumazioni[] = menus.map((item) => ({
        id: -1, id_comanda: comanda, id_piatto: item.id, piatto: item.piatto, quantita: 0, cucina: item.cucina, giorno: giornata, data: 0, alias: item.alias
      }));
      if (comanda != -1) {
        const cosumazioni_tavolo = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE (cucina = '${cucina}' OR cucina = 'All') AND id_comanda = ${comanda} AND giorno = ${giornata}`);
        if (cosumazioni_tavolo) {
          return consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.find(t2 => t2.id_piatto === t1.id_piatto) }));
        }
      }
      return consumazioni_menu;
    }
  } catch (error) {
    throw new Error('Failed to fetch consumazioni.');
  }
}

export async function getConsumazioniCassa(comanda: number = -1, giornata: number): Promise<DbConsumazioniPrezzo[] | undefined> {
  try {
    const menus = await executeQuery<DbMenu>(`SELECT * FROM menus ORDER BY id`);
    if (menus) {
      const consumazioni_menu: DbConsumazioniPrezzo[] = menus.map((item) => ({
        id: -1, id_comanda: comanda, id_piatto: item.id, piatto: item.piatto, prezzo_unitario: item.prezzo, quantita: 0, cucina: item.cucina, giorno: giornata, data: 0, alias: item.alias
      }));
      if (comanda != -1) {
        const cosumazioni_tavolo = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE id_comanda = ${comanda} AND giorno = ${giornata}`);
        if (cosumazioni_tavolo) {
          return consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.find(t2 => t2.id_piatto === t1.id_piatto) }));
        }
      }
      return consumazioni_menu;
    }
  } catch (error) {
    throw new Error('Failed to fetch consumazioni.');
  }
}

export async function sendConsumazioni(c: DbConsumazioni[]) {
  const date_format_millis = Date.now();
  c.map(async (item) => {
    if (item.id == -1) {
      return await executeQuery(`
         INSERT INTO consumazioni (id_comanda, id_piatto, piatto, quantita, cucina, giorno, data, alias)
         VALUES (${item.id_comanda}, ${item.id_piatto}, '${item.piatto}', ${item.quantita}, '${item.cucina}',${item.giorno},${date_format_millis}, '${item.alias}')
         ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      return await executeQuery(`UPDATE consumazioni SET quantita = ${item.quantita}, data = ${date_format_millis} WHERE id = ${item.id};`);
    }
  });
}

export async function updateTotaleConto(foglietto: number, giorno: number) {
  const consumazioni = await getConsumazioniCassa(foglietto, giorno);
  var totale = 0;
  if (consumazioni) {
    for (let i of consumazioni) {
      totale += i.quantita * i.prezzo_unitario;
    }
    aggiornaConto(foglietto, giorno, totale);
  }
}

export async function getConto(foglietto: number, giorno: number): Promise<DbConti | undefined> {
  try {
    const c = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
    if (c) return c[0];
    else return undefined;
  } catch (error) {
    return undefined;
  }
}

export async function getUltimiConti(giorno: number): Promise<DbConti[] | undefined> {
  try {
    return await executeQuery<DbConti>(`SELECT * FROM conti WHERE giorno = ${giorno} ORDER BY data_apertura DESC LIMIT 3`);
  } catch (error) {
    throw new Error('Failed to fetch conto.');
  }
}

export async function getCamerieri(foglietto: number): Promise<string | undefined> {
  try {
    if (foglietto < 10) return 'Gratuito';
    const c = await executeQuery<DbCamerieri>(`SELECT * FROM camerieri WHERE foglietto_end >= ${foglietto} AND foglietto_start <= ${foglietto}`);
    if (c) return c[0].nome;
  } catch (error) {
    return 'Sconosciuto';
  }
  return undefined;
}

export async function updateCamerieri(c: DbCamerieri[]) {
  c.map(async (item) => {
    return await executeQuery(`
         UPDATE camerieri
         SET nome = '${item.nome}',
             foglietto_start = ${item.foglietto_start},
             foglietto_end = ${item.foglietto_end}
         WHERE id = ${item.id};
      `);
  });
}

// Sostituisci la funzione esistente in actions.ts con questa:
export async function getClassificaCopertiCamerieri(giorno?: number): Promise<{ nome: string; coperti: number }[] | undefined> {
  try {
    const hasGiorno = giorno !== undefined && giorno > 0;
    
    const res = await executeQuery<{ nome: string; coperti: number }>(`
      WITH ultimi_coperti AS (
        SELECT id_comanda, quantita, giorno,
               ROW_NUMBER() OVER(PARTITION BY id_comanda, giorno ORDER BY data DESC) as rn
        FROM consumazioni
        WHERE id_piatto = 1 AND quantita > 0 ${hasGiorno ? `AND giorno = ${giorno}` : ''}
      ),
      coperti_validi AS (
        SELECT id_comanda, quantita, giorno
        FROM ultimi_coperti
        WHERE rn = 1
      )
      SELECT c.nome, COALESCE(SUM(cv.quantita), 0)::int as coperti
      FROM camerieri c
      LEFT JOIN conti co ON TRIM(LOWER(c.nome)) = TRIM(LOWER(co.cameriere)) 
        AND co.stato IN ('CHIUSO', 'CHIUSOPOS', 'CHIUSOALTRO')
        ${hasGiorno ? `AND co.giorno = ${giorno}` : ''}
      LEFT JOIN coperti_validi cv ON co.id_comanda = cv.id_comanda AND co.giorno = cv.giorno
      WHERE c.nome IS NOT NULL AND c.nome != ''
      GROUP BY LOWER(c.nome), c.nome
      ORDER BY coperti DESC
    `);
    
    return res;
  } catch (error) {
    console.error('Failed to fetch classifica coperti:', error);
    throw new Error('Failed to fetch classifica coperti.');
  }
}
/* MODIFICATO: Include il calcolo automatico dei conti fatti nell'intervallo */
export async function getListaCamerieri(): Promise<any[] | undefined> {
  try {
    console.log(`Get Lista Camerieri con Conteggio Conti Real-Time`);

    // Calcoliamo quanti record nella tabella "conti" hanno un "id_comanda" compreso nel range del cameriere
    const query = `
      SELECT 
        ca.id,
        ca.nome,
        ca.foglietto_start,
        ca.foglietto_end,
        COUNT(co.id_comanda)::int AS n_conti
      FROM camerieri ca
      LEFT JOIN conti co ON co.id_comanda >= ca.foglietto_start AND co.id_comanda <= ca.foglietto_end
      GROUP BY ca.id, ca.nome, ca.foglietto_start, ca.foglietto_end
      ORDER BY ca.foglietto_start;
    `;

    const c = await executeQuery<any>(query);
    if (c) return c;
  } catch (error) {
    console.error("Errore in getListaCamerieri:", error);
    return undefined;
  }
  return undefined;
}

/* MODIFICATO: Aggiunto RETURNING id per sincronizzare l'ID generato in inserimento */
export async function addCamerieri(nome: string, foglietto_start: number, foglietto_end: number) {
  console.log("Add camerieri");
  return await executeQuery<{ id: number }>(`
    INSERT INTO camerieri (nome, foglietto_start, foglietto_end)
    VALUES ('${nome}', ${foglietto_start}, ${foglietto_end})
    RETURNING id;
  `);
}

export async function listTables(): Promise<any[] | undefined> {
  return await executeQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
}

export async function getListaSintesiPiatti(giorno: number): Promise<DbSintesiPiatti[] | undefined> {
  try {
    return await executeQuery<DbSintesiPiatti>(`
      SELECT DISTINCT m.id, m.prezzo, m.alias
      FROM menus m
      JOIN consumazioni c ON m.id = c.id_piatto AND c.giorno = ${giorno} AND c.quantita > 0;
    `);
  } catch (error) {
    return undefined;
  }
}

export async function getSintesiPiatti(id: number, giorno: number): Promise<{ ordinati: number, stampati: number, aperto: number, pagatocontanti: number, pagatopos: number, pagatoaltro: number } | undefined> {
  try {
    const result = await executeQuery<{ ordinati: string; stampati: string; aperti: string; pagatocontanti: string; pagatopos: string; pagatoaltro: string; }>(`
      SELECT
          SUM(c.quantita) AS ordinati,
          SUM(CASE WHEN s.stato = 'STAMPATO' THEN c.quantita ELSE 0 END) AS stampati,
          SUM(CASE WHEN s.stato = 'APERTO' THEN c.quantita ELSE 0 END) AS aperti,
          SUM(CASE WHEN s.stato = 'CHIUSO' THEN c.quantita ELSE 0 END) AS pagatocontanti,
          SUM(CASE WHEN s.stato = 'CHIUSOPOS' THEN c.quantita ELSE 0 END) AS pagatopos,
          SUM(CASE WHEN s.stato = 'CHIUSOALTRO' THEN c.quantita ELSE 0 END) AS pagatoaltro
      FROM consumazioni c
      LEFT JOIN (
          SELECT id_comanda, MAX(stato) AS stato
          FROM conti
          GROUP BY id_comanda
      ) s ON c.id_comanda = s.id_comanda
      WHERE c.id_piatto = ${id} AND c.giorno = ${giorno} AND c.quantita > 0;
    `);
    return {
      ordinati: Number(result?.[0]?.ordinati || 0),
      stampati: Number(result?.[0]?.stampati || 0),
      aperto: Number(result?.[0]?.aperti || 0),
      pagatocontanti: Number(result?.[0]?.pagatocontanti || 0),
      pagatopos: Number(result?.[0]?.pagatopos || 0),
      pagatoaltro: Number(result?.[0]?.pagatoaltro || 0),
    };
  } catch (error) {
    return undefined;
  }
}

export async function doSelect(tableName: string): Promise<any[] | undefined> {
  try {
    return await executeQuery(`SELECT * FROM ${tableName}`);
  } catch (error) {
    return [];
  }
}

export async function doTruncate(tableName: string): Promise<any[] | undefined> {
  try {
    return await executeQuery(`TRUNCATE TABLE ${tableName}`);
  } catch (error) {
    return [];
  }
}

export async function doDrop(tableName: string): Promise<any[] | undefined> {
  try {
    return await executeQuery(`DROP TABLE ${tableName}`);
  } catch (error) {
    return [];
  }
}

export async function delCamerieri(id: number) {
  await executeQuery(`DELETE FROM camerieri WHERE id=${id};`);
}

export async function listConti(stato: string, giornata: number): Promise<DbConti[] | undefined> {
  if (stato == '*') {
    return await executeQuery<DbConti>(`SELECT * FROM conti WHERE giorno = ${giornata} ORDER BY data_apertura`);
  } else {
    return await executeQuery<DbConti>(`SELECT * FROM conti WHERE stato = '${stato}' AND giorno = ${giornata} ORDER BY data_apertura`);
  }
}

export async function listContiPerChiusra(giornata: number): Promise<DbExtendedConti[] | undefined> {
  return await executeQuery<DbExtendedConti>(`
    SELECT DISTINCT ON (s.id_comanda) s.*, c.quantita as coperti 
    FROM conti s
    LEFT JOIN consumazioni c ON c.id_comanda = s.id_comanda
    WHERE s.giorno = ${giornata} AND s.id_comanda > 9 AND c.id_piatto = 1 AND s.stato IN ('STAMPATO')
    ORDER BY s.id_comanda;
  `);
}

export async function getContoPiuAlto(): Promise<Number | undefined> {
  try {
    const cc = await executeQuery<DbConti>(`SELECT * FROM conti ORDER BY Id_comanda DESC`);
    if (cc) return Number(cc[0].id_comanda);
  } catch (error) {
    throw new Error('Failed getContoPiuAlto.');
  }
}

export async function listContiGratis(): Promise<DbConti[] | undefined> {
  return await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda < 10`);
}

export async function listContiGratisFogliettoN(stato: string, giornata: number, foglietto: number): Promise<DbConti[] | undefined> {
  if (stato == '*') {
    return await executeQuery<DbConti>(`SELECT * FROM conti WHERE giorno = ${giornata} AND id_comanda = ${foglietto} ORDER BY data_apertura`);
  } else {
    return await executeQuery<DbConti>(`SELECT * FROM conti WHERE stato = '${stato}' AND id_comanda = ${foglietto} AND giorno = ${giornata} ORDER BY data_apertura`);
  }
}

export async function listLog(giornata: number): Promise<DbLog[] | undefined> {
  return await executeQuery<DbLog>(`SELECT * FROM logger WHERE giornata = ${giornata} ORDER BY data DESC`);
}

export async function listConsumazioni(id_piatto: number, giornata: number): Promise<DbConsumazioni[] | undefined> {
  if (id_piatto == -1) {
    return await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE giorno = ${giornata}`);
  } else {
    return await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE giorno = ${giornata} AND id_piatto = ${id_piatto}`);
  }
}

export async function listConsumazioniGratis(): Promise<DbConsumazioni[] | undefined> {
  return await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE id_comanda < 10`);
}

export async function listConsumazioniFogliettoN(id_piatto: number, giornata: number, foglietto: number): Promise<DbConsumazioni[] | undefined> {
  if (id_piatto == -1) {
    return await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE giorno = ${giornata} AND id_comanda = ${foglietto}`);
  } else {
    return await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni WHERE giorno = ${giornata} AND d_comanda = ${foglietto} AND id_piatto = ${id_piatto}`);
  }
}

export async function apriConto(foglietto: number, giorno: number, cameriere: string) {
  const date_format_millis = Date.now();
  const current = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
  if (!(current && current?.length > 0)) {
    return await executeQuery(`INSERT INTO conti (id_comanda, stato, totale, cameriere, giorno, data_apertura, data, data_chiusura)
    VALUES (${foglietto}, 'APERTO', 0.0,'${cameriere}',${giorno},${date_format_millis},${date_format_millis},0)
    ON CONFLICT (id) DO NOTHING;
    `);
  }
}

export async function stampaConto(foglietto: number, giorno: number) {
  const date_format_millis = Date.now();
  const current = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
  if (current) {
    return await executeQuery(`UPDATE conti SET stato = 'STAMPATO', data = ${date_format_millis}, data_stampa = ${date_format_millis} WHERE id = ${current[0].id};`);
  }
}

export async function aggiornaConto(foglietto: number, giorno: number, totale: number) {
  const date_format_millis = Date.now();
  const current = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
  if (current) {
    return await executeQuery(`UPDATE conti SET totale = ${totale}, data = ${date_format_millis}, stato = 'APERTO' WHERE id = ${current[0].id};`);
  }
}

export async function riapriConto(foglietto: number, giorno: number) {
  const date_format_millis = Date.now();
  const current = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
  if (current) {
    return await executeQuery(`UPDATE conti SET data = ${date_format_millis}, stato = 'APERTO' WHERE id = ${current[0].id};`);
  }
}

export async function chiudiConto(foglietto: number, giorno: number, mode: Number = 1, note: string = "", totale: string = "0.0") {
  const date_format_millis = Date.now();
  const current = await executeQuery<DbConti>(`SELECT * FROM conti WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
  if (current) {
    if (mode == 2) {
      return await executeQuery(`UPDATE conti SET stato = 'CHIUSOPOS', data_chiusura = ${date_format_millis} WHERE id = ${current[0].id};`);
    } else if (mode == 3) {
      return await executeQuery(`UPDATE conti SET stato = 'CHIUSOALTRO', data_chiusura = ${date_format_millis}, note = '${note}', totale = ${totale} WHERE id = ${current[0].id};`);
    } else {
      return await executeQuery(`UPDATE conti SET stato = 'CHIUSO', data_chiusura = ${date_format_millis} WHERE id = ${current[0].id};`);
    }
  }
}

export async function updateGiornoSagra(giornata: number, stato: string) {
  return await executeQuery(`UPDATE fiera SET giornata = ${giornata}, stato = '${stato}' WHERE id = 1;`);
}

export async function getGiornoSagra(): Promise<DbFiera | undefined> {
  try {
    const gg = await executeQuery<DbFiera>(`SELECT * FROM fiera WHERE id = 1`);
    if (gg) return gg[0];
  } catch (error) {
    throw new Error('Failed to fetch fiera.');
  }
}

export async function writeLog(foglietto: number, giorno: number, cuisine: string, utente: string, azione: string, note: string) {
  const date_format_millis = Date.now();
  await executeQuery(`INSERT INTO logger (foglietto, azione, note, cucina, utente, giornata, data)
    VALUES (${foglietto},'${azione}','${note}','${cuisine}','${utente}',${giorno},${date_format_millis})
    `);
}

export async function getLastLog(giorno: number, cucina: string): Promise<DbLog[] | undefined> {
  try {
    return await executeQuery<DbLog>(`
      WITH ranked_data AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY foglietto ORDER BY data DESC) AS rn
        FROM logger WHERE cucina = '${cucina}' AND giornata = ${giorno}
      )
      SELECT * FROM ranked_data WHERE rn = 1 ORDER BY data DESC LIMIT 3;
    `);
  } catch (error) {
    throw new Error('Failed to fetch logger.');
  }
}

/*export async function getLastLog(giorno: number, cucina: string): Promise<DbLog[] | undefined> {
  try {
    // Questa query prende i 3 foglietti più recenti su cui hai lavorato
    return await executeQuery<DbLog>(`
      SELECT DISTINCT ON (foglietto) *
      FROM logger 
      WHERE cucina = $1 AND giornata = $2
      ORDER BY foglietto, data DESC
      LIMIT 3;
    `, [cucina, giorno]); // Usa i parametri!
  } catch (error) {
    throw new Error('Failed to fetch logger.');
  }
}*/
export async function clearLog() { await executeQuery(`TRUNCATE TABLE logger`); }
export async function clearConti() { await executeQuery(`TRUNCATE TABLE conti`); }
export async function clearConsumazioni() { await executeQuery(`TRUNCATE TABLE consumazioni`); }

export async function getInizializzazioneCassa(num: number) {
  const gg = await getGiornoSagra();
  if (!gg) return null;

  const [log, cc, c] = await Promise.all([
    getLastLog(gg.giornata, 'Casse'),
    getConto(num, gg.giornata),
    getConsumazioniCassa(num, gg.giornata)
  ]);

  // Restituiamo un array vuoto se log è undefined
  return { gg, log: log || [], cc, c }; 
}
