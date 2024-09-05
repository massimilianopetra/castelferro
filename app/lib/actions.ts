'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, DbConsumazioniPrezzo, DbConsumazioni, DbFiera } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';


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
      data: ""
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
      data: ""
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
  const d = new Date()
  var date_format_str = d.getFullYear().toString() + "-" + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-" + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":00";
  console.log(date_format_str);

  c.map(async (item) => {
    if (item.id == -1) {
      return await sql`
         INSERT INTO consumazioni (id_comanda, id_piatto, piatto, quantita, cucina, giorno, data)
         VALUES (${item.id_comanda}, ${item.id_piatto}, ${item.piatto}, ${item.quantita}, ${item.cucina},${item.giorno},${date_format_str})
         ON CONFLICT (id) DO NOTHING;
      `;
    } else {
      return await sql`
         UPDATE consumazioni
         SET quantita = ${item.quantita},
             data = ${date_format_str}
         WHERE id = ${item.id};
      `;
    }
  });
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
