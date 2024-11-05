'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, DbConsumazioniPrezzo, DbConsumazioni, DbFiera, DbConti, DbCamerieri, DbLog } from '@/app/lib/definitions';
import { QueryResult, sql } from '@vercel/postgres';
import { date } from 'zod';
import exp from 'constants';


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

export async function getMenu(): Promise<DbMenu[] | undefined> {
  console.log("getMenu");
  try {
    const menus = await sql<DbMenu>`SELECT * FROM menus ORDER BY id`;
    return menus.rows;
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    throw new Error('Failed to fetch menu.');
  }
}

export async function updatetMenu(record: DbMenu) {
  console.log("updateMenu");
  return await sql`
         UPDATE menus
         SET disponibile = ${record.disponibile}
         WHERE id = ${record.id};
      `;
}

export async function setMenuAllAvailable() {
  console.log("updateMenu");
  return await sql`
         UPDATE menus
         SET disponibile = 'Y';
      `;
}


export async function getConsumazioni(cucina: string, comanda: number = -1, giornata: number, available = 'ALWAYS'): Promise<DbConsumazioni[] | undefined> {
  console.log("getConsumazioni");
  var menus = undefined;

  try {
    if (available == 'ALWAYS') {
      menus = await sql<DbMenu>`SELECT * FROM menus  WHERE cucina = ${cucina} OR cucina = 'All' ORDER BY id`;
    } else {
      menus = await sql<DbMenu>`SELECT * FROM menus  WHERE (cucina = ${cucina} OR cucina = 'All') AND disponibile = 'Y' ORDER BY id`;
    }

    const consumazioni_menu: DbConsumazioni[] = menus.rows.map((item) => ({
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
      const cosumazioni_tavolo = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE (cucina = ${cucina} OR cucina = 'All') AND id_comanda = ${comanda} AND giorno = ${giornata}`;
      // Fonde consumazioni esistenti con lista piatti menu della cucina
      const consumazioni = consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.rows.find(t2 => t2.id_piatto === t1.id_piatto) }));
      return consumazioni;
    }

    return consumazioni_menu;
  } catch (error) {
    console.error('Failed to fetch consumazioni:', error);
    throw new Error('Failed to fetch consumazioni.');
  }
}

export async function getConsumazioniCassa(comanda: number = -1, giornata: number): Promise<DbConsumazioniPrezzo[] | undefined> {
  console.log("getConsumazioniCassa");
  try {
    const menus = await sql<DbMenu>`SELECT * FROM menus ORDER BY id`;
    const consumazioni_menu: DbConsumazioniPrezzo[] = menus.rows.map((item) => ({
      id: -1,
      id_comanda: comanda,
      id_piatto: item.id,
      piatto: item.piatto,
      prezzo_unitario: item.prezzo,
      quantita: 0,
      cucina: item.cucina,
      giorno: giornata,
      data: 0,
      alias:item.alias
    }));
    if (comanda != -1) {
      console.log(`Richiesta comanda n. ${comanda}`)
      // Ricerca consumazioni esistenti con codice comanda
      const cosumazioni_tavolo = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE id_comanda = ${comanda} AND giorno = ${giornata}`;
      // Fonde consumazioni esistenti con lista piatti menu della cucina
      const consumazioni = consumazioni_menu.map(t1 => ({ ...t1, ...cosumazioni_tavolo.rows.find(t2 => t2.id_piatto === t1.id_piatto) }));
      return consumazioni;
    }

    return consumazioni_menu;
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
      return await sql`
         INSERT INTO consumazioni (id_comanda, id_piatto, piatto, quantita, cucina, giorno, data, alias)
         VALUES (${item.id_comanda}, ${item.id_piatto}, ${item.piatto}, ${item.quantita}, ${item.cucina},${item.giorno},${date_format_millis}, ${item.alias})
         ON CONFLICT (id) DO NOTHING;
      `;
    } else {
      return await sql`
         UPDATE consumazioni
         SET quantita = ${item.quantita},
             data = ${date_format_millis}
         WHERE id = ${item.id};
      `;
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
    const c = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;
    return c.rows[0];
  } catch (error) {
    console.error('Failed to fetch conto:', error);
    throw new Error('Failed to fetch conto.');
  }
}

export async function getUltimiConti(giorno: number): Promise<DbConti[] | undefined> {
  console.log("getConto");
  try {
    const c = await sql<DbConti>`SELECT * FROM conti  WHERE giorno = ${giorno} ORDER BY data_apertura DESC LIMIT 3`;
    return c.rows;
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

    const c = await sql<DbCamerieri>`SELECT * FROM camerieri  WHERE foglietto_end >= ${foglietto} AND foglietto_start <= ${foglietto}`;
    if (c)
      return (c.rows[0].nome)
  } catch (error) {
    return ('Sconosciuto');
  }

  return (undefined);
}

export async function updateCamerieri(c: DbCamerieri[]) {
  console.log('updateCamerieri');

  c.map(async (item) => {
    return await sql`
         UPDATE camerieri
         SET nome = ${item.nome},
             foglietto_start = ${item.foglietto_start},
             foglietto_end = ${item.foglietto_end}
         WHERE id = ${item.id};
      `;
  });
}

export async function getListaCamerieri(): Promise<DbCamerieri[] | undefined> {
  try {
    console.log(`Get Lista Camerieri`);


    const c = await sql<DbCamerieri>`SELECT * FROM camerieri ORDER BY foglietto_start`;
    if (c)
      return (c.rows)
  } catch (error) {
    return (undefined);
  }

  return (undefined);
}

export async function addCamerieri(nome: string, foglietto_start: number, foglietto_end: number) {
  console.log("Add camerieri")
  return await sql`INSERT INTO camerieri (nome,foglietto_start,foglietto_end)
  VALUES (${nome},${foglietto_start},${foglietto_end})
  ON CONFLICT (id) DO NOTHING;
  `;
}

export async function listTables(): Promise<any[] | undefined> {
  const result  = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`;
  return result.rows;
}

export async function doQuery(tableName: string): Promise<any[] | undefined> {
  try {
    
    const query = `SELECT * FROM ${tableName}`;
    console.log(query)
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function doTruncate(tableName: string): Promise<any[] | undefined> {
  try {
    
    const query = `TRUNCATE TABLE ${tableName}`;
    console.log(query)
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function doDrop(tableName: string): Promise<any[] | undefined> {
  try {
    
    const query = `DROP TABLE ${tableName}`;
    console.log(query)
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function delCamerieri(id: number) {
  console.log(`Del camerieri ${id}`);
  await sql`DELETE FROM camerieri
  WHERE id=${id};`
}

export async function listConti(stato: string, giornata: number): Promise<DbConti[] | undefined> {

  if (stato == '*') {
    const current = await sql<DbConti>`SELECT * FROM conti  WHERE giorno = ${giornata} ORDER BY data_apertura`;
    return current.rows;
  } else {
    const current = await sql<DbConti>`SELECT * FROM conti  WHERE stato = ${stato} AND giorno = ${giornata} ORDER BY data_apertura`;
    return current.rows;
  }
}

export async function listContiGratis(): Promise<DbConti[] | undefined> {

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda < 10`;
  return current.rows;
}

export async function listContiGratisFogliettoN(stato: string, giornata: number, foglietto: number): Promise<DbConti[] | undefined> {

  if (stato == '*') {
    const current = await sql<DbConti>`SELECT * FROM conti  WHERE giorno = ${giornata} AND id_comanda = ${foglietto} ORDER BY data_apertura`;
    return current.rows;
  } else {
    const current = await sql<DbConti>`SELECT * FROM conti  WHERE stato = ${stato} AND id_comanda = ${foglietto} AND giorno = ${giornata} ORDER BY data_apertura`;
    return current.rows;
  }
}

export async function listLog(giornata: number): Promise<DbLog[] | undefined> {

  const current = await sql<DbLog>`SELECT * FROM logger  WHERE giornata = ${giornata} ORDER BY data DESC`;
  return current.rows;

}

export async function listConsumazioni(id_piatto: number, giornata: number): Promise<DbConsumazioni[] | undefined> {

  if (id_piatto == -1) {
    const current = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE giorno = ${giornata}`;
    return current.rows;
  } else {
    const current = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND id_piatto = ${id_piatto}`;
    return current.rows;
  }
}

export async function listConsumazioniGratis(): Promise<DbConsumazioni[] | undefined> {

  const current = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE id_comanda < 10`;
  return current.rows;
}

export async function listConsumazioniFogliettoN(id_piatto: number, giornata: number, foglietto: number,): Promise<DbConsumazioni[] | undefined> {

  if (id_piatto == -1) {
    const current = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND id_comanda = ${foglietto}`;
    return current.rows;
  } else {
    const current = await sql<DbConsumazioni>`SELECT * FROM consumazioni  WHERE giorno = ${giornata} AND d_comanda = ${foglietto} AND id_piatto = ${id_piatto}`;
    return current.rows;
  }
}

export async function apriConto(foglietto: number, giorno: number, cameriere: string) {

  const date_format_millis = Date.now();

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;

  if (current.rows[0]) {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} risulta paerto in data: ${current.rows[0].data_apertura}`);
  } else {
    console.log(`Inserimento conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await sql`INSERT INTO conti (id_comanda, stato, totale, cameriere, giorno, data_apertura, data, data_chiusura)
    VALUES (${foglietto}, 'APERTO', 0.0,${cameriere},${giorno},${date_format_millis},${date_format_millis},0)
    ON CONFLICT (id) DO NOTHING;
    `;
  }
}

export async function stampaConto(foglietto: number, giorno: number) {

  const date_format_millis = Date.now();

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;

  if (current.rows[0]) {
    console.log(`Apertura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await sql`
    UPDATE conti
    SET stato = 'STAMPATO',
        data = ${date_format_millis}
    WHERE id = ${current.rows[0].id};
    `;
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}

export async function aggiornaConto(foglietto: number, giorno: number, totale: number) {

  const date_format_millis = Date.now();

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;

  if (current.rows[0]) {
    console.log(`Apertura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await sql`
    UPDATE conti
    SET totale = ${totale},
        data = ${date_format_millis},
        stato = 'APERTO'
    WHERE id = ${current.rows[0].id};
    `;
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}


export async function chiudiConto(foglietto: number, giorno: number, mode: Number = 1) {

  const date_format_millis = Date.now();

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;

  if (current.rows[0]) {
    console.log(`Chiusura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    if (mode == 2) {
      return await sql`
                      UPDATE conti
                      SET stato = 'CHIUSOPOS',
                      data_chiusura = ${date_format_millis}
                      WHERE id = ${current.rows[0].id};
                      `;
    } else if (mode == 3) {
      return await sql`
                      UPDATE conti
                      SET stato = 'CHIUSOGRATIS',
                      data_chiusura = ${date_format_millis}
                      WHERE id = ${current.rows[0].id};
      `;
    } else {
      return await sql`
                      UPDATE conti
                      SET stato = 'CHIUSO',
                      data_chiusura = ${date_format_millis}
                      WHERE id = ${current.rows[0].id};
      `;
    }
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}


export async function updateGiornoSagra(giornata: number, stato: string) {

  console.log('updateFiera');

  return await sql`
           UPDATE fiera
           SET giornata = ${giornata},
               stato = ${stato}
           WHERE id = 1;
        `;
}

export async function getGiornoSagra(): Promise<DbFiera | undefined> {
  console.log("getGiornoFiera");
  try {
    const gg = await sql<DbFiera>`SELECT * FROM fiera WHERE id = 1`;
    return gg.rows[0];
  } catch (error) {
    console.error('Failed to fetch fiera:', error);
    throw new Error('Failed to fetch fiera.');
  }
}

export async function writeLog(foglietto: number, giorno: number, cucina: string, utente: string, azione: string, note: string) {

  const date_format_millis = Date.now();

  console.log(`Logging ${foglietto} giorno n. ${giorno}`);
  await sql`INSERT INTO logger (foglietto, azione, note, cucina, utente, giornata, data)
    VALUES (${foglietto},${azione},${note},${cucina},${utente},${giorno},${date_format_millis})
    `;
}

export async function getLastLog(giorno: number, cucina: string): Promise<DbLog[] | undefined> {
  console.log("getConto");
  try {
    const c = await sql<DbLog>`WITH ranked_data AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY foglietto ORDER BY data DESC) AS rn
    FROM logger
    WHERE cucina = ${cucina} AND giornata = ${giorno}
    )
    SELECT *
    FROM ranked_data
    WHERE rn = 1
    ORDER BY data DESC
    LIMIT 3;`;
    return c.rows;
  } catch (error) {
    console.error('Failed to fetch logger:', error);
    throw new Error('Failed to fetch logger.');
  }
}

export async function clearLog() {
  await sql`TRUNCATE TABLE logger`;
}

export async function clearConti() {
  await sql`TRUNCATE TABLE conti`;
}

export async function clearConsumazioni() {
  await sql`TRUNCATE TABLE consumazioni`;
}
