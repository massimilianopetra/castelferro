'use server';
 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import type { DbMenu, Consumazioni } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';
 
// ...
 
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

export async function getConsumazioni(cucina: string): Promise<Consumazioni[] | undefined> {
  console.log("getMenu");
  try {
      const menus = await sql<DbMenu>`SELECT * FROM menus  WHERE cucina = ${cucina}`;
      const consumazioni:Consumazioni[] = menus.rows.map((item) => ({piatto : item.piatto, quantita: 0}));
      return consumazioni;
  } catch (error) {
      console.error('Failed to fetch consumazioni:', error);
      throw new Error('Failed to fetch consumazioni.');
  }
}