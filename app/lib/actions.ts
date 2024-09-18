'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, DbConsumazioniPrezzo, DbConsumazioni, DbFiera, DbConti, DbCamerieri } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';
import { date } from 'zod';


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
    const menus = await sql<DbMenu>`SELECT * FROM menus`;
    return menus.rows;
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    throw new Error('Failed to fetch menu.');
  }
}

export async function getConsumazioni(cucina: string, comanda: number = -1, giornata: number): Promise<DbConsumazioni[] | undefined> {
  console.log("getConsumazioni");
  try {
    const menus = await sql<DbMenu>`SELECT * FROM menus  WHERE cucina = ${cucina} OR cucina = 'All'`;
    const consumazioni_menu: DbConsumazioni[] = menus.rows.map((item) => ({
      id: -1,
      id_comanda: comanda,
      id_piatto: item.id,
      piatto: item.piatto,
      quantita: 0,
      cucina: item.cucina,
      giorno: giornata,
      data: 0
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
  console.log("getConsumazioni");
  try {
    const menus = await sql<DbMenu>`SELECT * FROM menus`;
    const consumazioni_menu: DbConsumazioniPrezzo[] = menus.rows.map((item) => ({
      id: -1,
      id_comanda: comanda,
      id_piatto: item.id,
      piatto: item.piatto,
      prezzo_unitario: item.prezzo,
      quantita: 0,
      cucina: item.cucina,
      giorno: giornata,
      data: 0
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
         INSERT INTO consumazioni (id_comanda, id_piatto, piatto, quantita, cucina, giorno, data)
         VALUES (${item.id_comanda}, ${item.id_piatto}, ${item.piatto}, ${item.quantita}, ${item.cucina},${item.giorno},${date_format_millis})
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

export async function getListaCamerieri(): Promise<DbCamerieri[] | undefined> {
  try {
    console.log(`Get Lista Camerieri`);


    const c = await sql<DbCamerieri>`SELECT * FROM camerieri`;
    if (c)
      return (c.rows)
  } catch (error) {
    return (undefined);
  }

  return (undefined);
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
        data = ${date_format_millis}
    WHERE id = ${current.rows[0].id};
    `;
  } else {
    console.log(`Il conto foglietto n. ${foglietto} giorno n. ${giorno} non risulta paerto`);
  }
}


export async function chiudiConto(foglietto: number, giorno: number) {

  const date_format_millis = Date.now();

  const current = await sql<DbConti>`SELECT * FROM conti  WHERE id_comanda = ${foglietto} AND giorno = ${giorno}`;

  if (current.rows[0]) {
    console.log(`Chiusura conto foglietto n. ${foglietto} giorno n. ${giorno}`);
    return await sql`
    UPDATE conti
    SET stato = 'CHIUSO',
        data_chiusura = ${date_format_millis}
    WHERE id = ${current.rows[0].id};
    `;
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
