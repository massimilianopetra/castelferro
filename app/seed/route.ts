import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { users } from '../lib/placeholder-data';
import { menu } from '../lib/placeholder-data';

const client = await db.connect();

async function seedUsers() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL
     );
   `;

  console.log(`CREATED TABLE users`);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      console.log(`VALUES ${user.id}, ${user.name}, ${user.email}, ${hashedPassword}`);
      return client.sql`
           INSERT INTO users (id, name, email, password)
           VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
           ON CONFLICT (id) DO NOTHING;
        `;
    }),
  );

  return insertedUsers;
}

async function seedMenu() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS menus (
       id INTEGER PRIMARY KEY,
       piatto VARCHAR(255) UNIQUE,
       prezzo REAL,
       cucina VARCHAR(255),
       disponibile VARCHAR(3)
     );
   `;

  console.log(`CREATED TABLE menus`);


  const insertedMenu = await Promise.all(
    menu.map(async (item) => {
      console.log(`VALUES ${item.id}, ${item.piatto}, ${item.prezzo}, ${item.cucina},${item.disponibile}`);
      return client.sql`
           INSERT INTO menus (id, piatto, prezzo, cucina,disponibile)
           VALUES (${item.id}, ${item.piatto}, ${item.prezzo}, ${item.cucina},${item.disponibile})
           ON CONFLICT (id) DO NOTHING;
        `;
    }),
  );

  return insertedMenu;
}

async function seedConsumazioni() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS consumazioni (
       id SERIAL PRIMARY KEY,
       id_comanda INTEGER,
       id_piatto INTEGER,
       piatto VARCHAR(255) NOT NULL,
       quantita INTEGER,
       cucina VARCHAR(255) NOT NULL,
       giorno INTEGER,
       data VARCHAR(32)
     );
   `;

  console.log(`CREATED TABLE consumazioni`);
}

async function seedConti() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS conti (
       id SERIAL PRIMARY KEY,
       id_comanda INTEGER,
       stato VARCHAR(32),
       totale REAL,
       giorno INTEGER,
       data_apertura VARCHAR(32),
       data VARCHAR(32),
       data_chiusura VARCHAR(32)
     );
   `;

  console.log(`CREATED TABLE conti`);
}

async function seedFiera() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS fiera (
       id SERIAL PRIMARY KEY,
       giornata INTEGER,
       stato VARCHAR(32)
     );
   `;

  await client.sql`
           INSERT INTO fiera (id, giornata, stato)
           VALUES (1,1,'CHIUSA')
           ON CONFLICT (id) DO NOTHING;
    `;

  console.log(`CREATED TABLE fiera`);
}


export async function GET() {

  try {
    await client.sql`BEGIN`;
    await seedUsers();
    await seedMenu();
    await seedConsumazioni();
    await seedFiera();
    await seedConti();
    await client.sql`COMMIT`;

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }

}
