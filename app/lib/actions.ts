'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, DbConsumazioniPrezzo, DbConsumazioni, DbFiera, DbConti, DbCamerieri, DbLog, DbUser, DbSintesiPiatti } from '@/app/lib/definitions';
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

async function executeQuery<T>(query: string): Promise<T[] | undefined> {
  console.log(query);
  if (provider === 'pg') {
    if (!pool) {
      throw new Error('Pool non configurato per pg');
    }
    const client = await pool.connect();
    try {
      const res = await client.query(query);
      return res.rows;
    } finally {
      client.release();
    }
  } else {
    return (await sql.query(query)).rows;
  }
}


/* ************************ SEED DATABASE **************************** */

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
       alias VARCHAR(255)
     );
   `);

  console.log(`CREATED TABLE menus`);


  const insertedMenu = await Promise.all(
    menu.map(async (item) => {
      console.log(`VALUES ${item.id}, ${item.piatto}, ${item.prezzo}, ${item.cucina},${item.disponibile}, ${item.alias}`);
      return executeQuery(`
           INSERT INTO menus (id, piatto, prezzo, cucina, disponibile, alias)
           VALUES (${item.id}, '${item.piatto}', ${item.prezzo}, '${item.cucina}','${item.disponibile}','${item.alias}')
           ON CONFLICT (id) DO NOTHING;
        `);
    }),
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
      console.log(`VALUES ${item.id}, ${item.name}, ${item.figlietto_start}, ${item.foglietto_end}`);
      return executeQuery(`
         INSERT INTO camerieri (id, nome, foglietto_start, foglietto_end)
         VALUES (${item.id}, '${item.name}', ${item.figlietto_start}, ${item.foglietto_end})
         ON CONFLICT (id) DO NOTHING;
      `);
    }),
  );

  console.log(`INSERTED TABLE camerieri`);

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
    await seedMenu();
    await seedConsumazioni();
    await seedFiera();
    await seedConti();
    await seedCamerieri();
    await seedLog();

    console.log('Database seed completed');
  } catch (error) {

  }

}

/* ************************ AUTHENTICATION **************************** */

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
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
    if (user)
      return user[0];
    else
      return undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

/* ************************ GESTIONE DB **************************** */

export async function getMenu(): Promise<DbMenu[] | undefined> {
  console.log("getMenu");
  try {
    const menus = await executeQuery<DbMenu>(`SELECT * FROM menus ORDER BY id`);
    return menus;
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    throw new Error('Failed to fetch menu.');
  }
}

export async function updatetMenu(record: DbMenu) {
  console.log("updateMenu");
  return await executeQuery(`
         UPDATE menus
         SET disponibile = '${record.disponibile}'
         WHERE id = ${record.id};
      `);
}

export async function overwriteMenu(record: DbMenu[]) {
  await executeQuery(`
         TRUNCATE TABLE menus;
      `);

  record.map(async (item) => {
    console.log(`VALUES ${item.id}, '${item.piatto}', ${item.prezzo}, '${item.cucina}','${item.disponibile}', '${item.alias}'`);
    return await executeQuery(`
             INSERT INTO menus (id, piatto, prezzo, cucina, disponibile, alias)
             VALUES (${item.id}, '${item.piatto}', ${item.prezzo}, '${item.cucina}','${item.disponibile}','${item.alias}')
             ON CONFLICT (id) DO NOTHING;
          `);
  })
}

export async function setMenuAllAvailable() {
  console.log("updateMenu");
  return await executeQuery(`
         UPDATE menus
         SET disponibile = 'Y';
      `);
}


export async function getConsumazioni(cucina: string, comanda: number = -1, giornata: number, available = 'ALWAYS'): Promise<DbConsumazioni[] | undefined> {
  console.log("getConsumazioni");
  var menus = undefined;

  try {
    if (available == 'ALWAYS') {
      menus = await executeQuery<DbMenu>(`SELECT * FROM menus  WHERE cucina = '${cucina}' OR cucina = 'All' ORDER BY id`);
    } else {
      menus = await executeQuery<DbMenu>(`SELECT * FROM menus  WHERE (cucina = '${cucina}' OR cucina = 'All') AND disponibile = 'Y' ORDER BY id`);
    }

    if (menus) {
      const consumazioni_menu: DbConsumazioni[] = menus.map((item) => ({
        id: -1,
        id_comanda: comanda,
        id_piatto: item.id,
        piatto: item.piatto,
        quantita: 0,
        cucina: item.cucina,
        giorno: giornata,
        data: 0,
        alias: item.alias
      }));
      if (comanda != -1) {
        console.log(`Richiesta comanda n. ${comanda}`)
        // Ricerca consumazioni esistenti con codice comanda
        const cosumazioni_tavolo = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE (cucina = '${cucina}' OR cucina = 'All') AND id_comanda = ${comanda} AND giorno = ${giornata}`);
        // Fonde consumazioni esistenti con lista piatti menu della cucina
        if (cosumazioni_tavolo) {
          const consumazioni = consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.find(t2 => t2.id_piatto === t1.id_piatto) }));
          return consumazioni;
        }
      }

      return consumazioni_menu;
    }
  } catch (error) {
    console.error('Failed to fetch consumazioni:', error);
    throw new Error('Failed to fetch consumazioni.');
  }
}

export async function getConsumazioniCassa(comanda: number = -1, giornata: number): Promise<DbConsumazioniPrezzo[] | undefined> {
  console.log("getConsumazioniCassa");
  try {
    const menus = await executeQuery<DbMenu>(`SELECT * FROM menus ORDER BY id`);
    if (menus) {
      const consumazioni_menu: DbConsumazioniPrezzo[] = menus.map((item) => ({
        id: -1,
        id_comanda: comanda,
        id_piatto: item.id,
        piatto: item.piatto,
        prezzo_unitario: item.prezzo,
        quantita: 0,
        cucina: item.cucina,
        giorno: giornata,
        data: 0,
        alias: item.alias
      }));
      if (comanda != -1) {
        console.log(`Richiesta comanda n. ${comanda}`)
        // Ricerca consumazioni esistenti con codice comanda
        const cosumazioni_tavolo = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE id_comanda = ${comanda} AND giorno = ${giornata}`);
        // Fonde consumazioni esistenti con lista piatti menu della cucina
        if (cosumazioni_tavolo) {
          const consumazioni = consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.find(t2 => t2.id_piatto === t1.id_piatto) }));
          return consumazioni;
        }
      }

      return consumazioni_menu;
    }
  } catch (error) {
    console.error('Failed to fetch consumazioni:', error);
    throw new Error('Failed to fetch consumazioni.');
  }
}

export async function sendConsumazioni(c: DbConsumazioni[]) {
  console.log('sendConsumazioni');
  const date_format_millis = Date.now();
  console.log(date_format_millis);

  c.map(async (item) => {
    if (item.id == -1) {
      return await executeQuery(`
         INSERT INTO consumazioni (id_comanda, id_piatto, piatto, quantita, cucina, giorno, data, alias)
         VALUES (${item.id_comanda}, ${item.id_piatto}, '${item.piatto}', ${item.quantita}, '${item.cucina}',${item.giorno},${date_format_millis}, '${item.alias}')
         ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      return await executeQuery(`
         UPDATE consumazioni
         SET quantita = ${item.quantita},
             data = ${date_format_millis}
         WHERE id = ${item.id};
      `);
    }
  });


}

export async function updateTotaleConto(foglietto: number, giorno: number) {

  // ISSUE 1: usato in fase di invio consumazioni per aggiornare il totale del conto associato

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
  console.log("getConto");
  try {
    const c = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);
    if (c)
      return c[0];
    else
      return undefined;
  } catch (error) {
    return undefined
  }
}

export async function getUltimiConti(giorno: number): Promise<DbConti[] | undefined> {
  console.log("getUltimiConti");
  try {
    const c = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE giorno = ${giorno} ORDER BY data_apertura DESC LIMIT 3`);
    return c;
  } catch (error) {
    console.error('Failed to fetch conto:', error);
    throw new Error('Failed to fetch conto.');
  }
}

export async function getCamerieri(foglietto: number): Promise<string | undefined> {
  try {
    console.log(`Get Camerieri foglietto n. ${foglietto}`)

    if (foglietto < 10) {
      return ('Gratuito');
    }

    const c = await executeQuery<DbCamerieri>(`SELECT * FROM camerieri  WHERE foglietto_end >= ${foglietto} AND foglietto_start <= ${foglietto}`);
    if (c)
      return (c[0].nome)
  } catch (error) {
    return ('Sconosciuto');
  }

  return (undefined);
}

export async function updateCamerieri(c: DbCamerieri[]) {
  console.log('updateCamerieri');

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

export async function getListaCamerieri(): Promise<DbCamerieri[] | undefined> {
  try {
    console.log(`Get Lista Camerieri`);


    const c = await executeQuery<DbCamerieri>(`SELECT * FROM camerieri ORDER BY foglietto_start`);
    if (c)
      return (c)
  } catch (error) {
    return (undefined);
  }

  return (undefined);
}

export async function addCamerieri(nome: string, foglietto_start: number, foglietto_end: number) {
  console.log("Add camerieri")
  return await executeQuery(`INSERT INTO camerieri (nome,foglietto_start,foglietto_end)
  VALUES ('${nome}',${foglietto_start},${foglietto_end})
  ON CONFLICT (id) DO NOTHING;
  `);
}

export async function listTables(): Promise<any[] | undefined> {
  const result = await executeQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
  return result;
}

export async function getListaSintesiPiatti(giorno: number): Promise<DbSintesiPiatti[] | undefined> {
  try {
    console.log(`getListaSintesiPiatti giorno ${giorno}`);


    const c = await executeQuery<DbSintesiPiatti>(`SELECT  DISTINCT m.id,m.prezzo,m.alias
              FROM menus m
              JOIN consumazioni c ON m.id = c.id_piatto AND c.giorno = ${giorno} AND c.quantita > 0;`);
    if (c)
      console.log(c);
    return (c)
  } catch (error) {
    console.log("getListaSintesiPiatti: QUQERY ERROR")
    return (undefined);
  }
}

export async function getSintesiPiatti(id: number, giorno: number): Promise<{
  ordinati: number,
  stampati: number,
  aperto: number,
  pagatocontanti: number,
  pagatopos: number,
  pagatoaltro: number
} | undefined> {
  try {
    console.log(`getSintesiPiatti giorno ${giorno}`);

    const result = await executeQuery<{
      ordinati: string;
      stampati: string;
      aperti: string;
      pagatocontanti: string;
      pagatopos: string;
      pagatoaltro: string;
    }>(`
SELECT
    SUM(c.quantita) AS ordinati,
    SUM(CASE WHEN s.stato = 'STAMPATO' THEN c.quantita ELSE 0 END) AS stampati,
    SUM(CASE WHEN s.stato = 'APERTO' THEN c.quantita ELSE 0 END) AS aperti,
    SUM(CASE WHEN s.stato = 'CHIUSO' THEN c.quantita ELSE 0 END) AS pagatocontanti,
    SUM(CASE WHEN s.stato = 'CHIUSOPOS' THEN c.quantita ELSE 0 END) AS pagatopos,
    SUM(CASE WHEN s.stato = 'CHIUSOALTRO' THEN c.quantita ELSE 0 END) AS pagatoaltro
FROM consumazioni c
LEFT JOIN (
    SELECT DISTINCT id_comanda, stato
    FROM conti
) s ON c.id_comanda = s.id_comanda
WHERE c.id_piatto = ${id}
  AND c.giorno = ${giorno}
  AND c.quantita > 0;
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
    console.log("undefined");
    return (undefined);
  }

}

export async function doSelect(tableName: string): Promise<any[] | undefined> {
  try {

    const query = `SELECT * FROM ${tableName}`;
    console.log(query)
    const result = await executeQuery(query);
    console.log(result);
    return result;
  } catch (error) {
    console.log(`ERROR: doSelect(SELECT * FROM ${tableName})`);
    console.log(error);
    return [];
  }
}

export async function doTruncate(tableName: string): Promise<any[] | undefined> {
  try {

    const query = `TRUNCATE TABLE ${tableName}`;
    console.log(query)
    const result = await executeQuery(query);
    return result;
  } catch (error) {
    return [];
  }
}

export async function doDrop(tableName: string): Promise<any[] | undefined> {
  try {

    const query = `DROP TABLE ${tableName}`;
    console.log(query)
    const result = await executeQuery(query);
    return result;
  } catch (error) {
    return [];
  }
}

export async function delCamerieri(id: number) {
  console.log(`Del camerieri ${id}`);
  await executeQuery(`DELETE FROM camerieri
  WHERE id=${id};`);
}

export async function listConti(stato: string, giornata: number): Promise<DbConti[] | undefined> {

  if (stato == '*') {
    const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE giorno = ${giornata} ORDER BY data_apertura`);
    return current;
  } else {
    const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE stato = '${stato}' AND giorno = ${giornata} ORDER BY data_apertura`);
    return current;
  }
}

export async function getContoPiuAlto(): Promise<Number | undefined> {
  try {
    console.log("getContoPiuAlto");
    const cc = await executeQuery<DbConti>(`SELECT * FROM conti ORDER BY Id_comanda DESC`);
    if (cc) {
      var uc = Number(cc[0].id_comanda)
      console.log(">>getContoPiuAlto>>");
      console.log(uc);

      return uc;
    }
  } catch (error) {
    console.log(':', error);
    throw new Error('Failed getContoPiuAlto.');
  }
}


export async function listContiGratis(): Promise<DbConti[] | undefined> {

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda < 10`);
  return current;
}

export async function listContiGratisFogliettoN(stato: string, giornata: number, foglietto: number): Promise<DbConti[] | undefined> {

  if (stato == '*') {
    const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE giorno = ${giornata} AND id_comanda = ${foglietto} ORDER BY data_apertura`);
    return current;
  } else {
    const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE stato = '${stato}' AND id_comanda = ${foglietto} AND giorno = ${giornata} ORDER BY data_apertura`);
    return current;
  }
}

export async function listLog(giornata: number): Promise<DbLog[] | undefined> {

  const current = await executeQuery<DbLog>(`SELECT * FROM logger  WHERE giornata = ${giornata} ORDER BY data DESC`);
  return current;

}

export async function listConsumazioni(id_piatto: number, giornata: number): Promise<DbConsumazioni[] | undefined> {

  if (id_piatto == -1) {
    const current = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE giorno = ${giornata}`);
    return current;
  } else {
    const current = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND id_piatto = ${id_piatto}`);
    return current;
  }
}

export async function listConsumazioniGratis(): Promise<DbConsumazioni[] | undefined> {

  const current = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE id_comanda < 10`);
  return current;
}

export async function listConsumazioniFogliettoN(id_piatto: number, giornata: number, foglietto: number,): Promise<DbConsumazioni[] | undefined> {

  if (id_piatto == -1) {
    const current = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND id_comanda = ${foglietto}`);
    return current;
  } else {
    const current = await executeQuery<DbConsumazioni>(`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND d_comanda = ${foglietto} AND id_piatto = ${id_piatto}`);
    return current;
  }
}

export async function apriConto(foglietto: number, giorno: number, cameriere: string) {

  const date_format_millis = Date.now();

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);

  if (current && current?.length > 0) {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} risulta paerto in data: ${current[0].data_apertura}`);
  } else {
    console.log(`Inserimento conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await executeQuery(`INSERT INTO conti (id_comanda, stato, totale, cameriere, giorno, data_apertura, data, data_chiusura)
    VALUES (${foglietto}, 'APERTO', 0.0,'${cameriere}',${giorno},${date_format_millis},${date_format_millis},0)
    ON CONFLICT (id) DO NOTHING;
    `);
  }
}

export async function stampaConto(foglietto: number, giorno: number) {

  const date_format_millis = Date.now();

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);

  if (current) {
    console.log(`Apertura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await executeQuery(`
    UPDATE conti
    SET stato = 'STAMPATO',
        data = ${date_format_millis},
        data_stampa = ${date_format_millis}
    WHERE id = ${current[0].id};
    `);
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}

export async function aggiornaConto(foglietto: number, giorno: number, totale: number) {

  const date_format_millis = Date.now();

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);

  if (current) {
    console.log(`Apertura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await executeQuery(`
    UPDATE conti
    SET totale = ${totale},
        data = ${date_format_millis},
        stato = 'APERTO'
    WHERE id = ${current[0].id};
    `);
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta aperto`);
  }
}

export async function riapriConto(foglietto: number, giorno: number) {
  const date_format_millis = Date.now();

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);

  if (current) {
    console.log(`Ri-Apertura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await executeQuery(`
    UPDATE conti
    SET data = ${date_format_millis},
        stato = 'APERTO'
    WHERE id = ${current[0].id};
    `);
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}

export async function chiudiConto(foglietto: number, giorno: number, mode: Number = 1, note: string = "", totale: string = "0.0") {

  const date_format_millis = Date.now();

  const current = await executeQuery<DbConti>(`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`);

  if (current) {
    console.log(`Chiusura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    if (mode == 2) {
      return await executeQuery(`
                      UPDATE conti
                      SET stato = 'CHIUSOPOS',
                      data_chiusura = ${date_format_millis}
                      WHERE id = ${current[0].id};
                      `);
    } else if (mode == 3) {
      return await executeQuery(`
                      UPDATE conti
                      SET stato = 'CHIUSOALTRO',
                      data_chiusura = ${date_format_millis},
                      note = '${note}',
                      totale = ${totale}
                      WHERE id = ${current[0].id};
                      `);
    } else {
      return await executeQuery(`
                      UPDATE conti
                      SET stato = 'CHIUSO',
                      data_chiusura = ${date_format_millis}
                      WHERE id = ${current[0].id};
                      `);
    }
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}


export async function updateGiornoSagra(giornata: number, stato: string) {

  console.log('updateFiera');

  return await executeQuery(`
           UPDATE fiera
           SET giornata = ${giornata},
               stato = '${stato}'
           WHERE id = 1;
        `);
}

export async function getGiornoSagra(): Promise<DbFiera | undefined> {
  console.log("getGiornoFiera");
  try {
    const gg = await executeQuery<DbFiera>(`SELECT * FROM fiera WHERE id = 1`);
    if (gg)
      return gg[0];
  } catch (error) {
    console.error('Failed to fetch fiera:', error);
    throw new Error('Failed to fetch fiera.');
  }
}

export async function writeLog(foglietto: number, giorno: number, cucina: string, utente: string, azione: string, note: string) {

  const date_format_millis = Date.now();

  console.log(`Logging ${foglietto} giorno n. ${giorno}`);
  await executeQuery(`INSERT INTO logger (foglietto, azione, note, cucina, utente, giornata, data)
    VALUES (${foglietto},'${azione}','${note}','${cucina}','${utente}',${giorno},${date_format_millis})
    `);
}

export async function getLastLog(giorno: number, cucina: string): Promise<DbLog[] | undefined> {
  console.log("getLastLog");
  try {
    const c = await executeQuery<DbLog>(`WITH ranked_data AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY foglietto ORDER BY data DESC) AS rn
    FROM logger
    WHERE cucina = '${cucina}' AND giornata = ${giorno}
    )
    SELECT *
    FROM ranked_data
    WHERE rn = 1
    ORDER BY data DESC
    LIMIT 3;`);
    return c;
  } catch (error) {
    console.error('Failed to fetch logger:', error);
    throw new Error('Failed to fetch logger.');
  }
}

export async function clearLog() {
  await executeQuery(`TRUNCATE TABLE logger`);
}

export async function clearConti() {
  await executeQuery(`TRUNCATE TABLE conti`);
}

export async function clearConsumazioni() {
  await executeQuery(`TRUNCATE TABLE consumazioni`);
}
