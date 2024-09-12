// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: number;
};
export type DbMenu =   {
  id: number;
  piatto: string;
  prezzo: number;
  cucina: string;
  disponibile: string;
};

export type DbConsumazioni =   {
  id: number;
  id_comanda: number;
  id_piatto: number;
  piatto: string;
  quantita: number;
  cucina: string;
  giorno: number;
  data: string;
};

export type DbConsumazioniPrezzo =   {
  id: number;
  id_comanda: number;
  id_piatto: number;
  piatto: string;
  prezzo_unitario: number;
  quantita: number;
  cucina: string;
  giorno: number;
  data: string;
};

export type DbConti =   {
  id: number;
  id_comanda: number;
  stato: string;
  totale: number;
  cameriere: string;
  giorno: number;
  data_apertura: string;
  data: string;
  data_chiusura: string;
};

export type DbCamerieri =   {
  id: number;
  nome: string;
  foglietto_start: number;
  foglietto_end: number;
};

export type DbFiera =   {
  id: number;
  giornata: number;
  stato: string;
};
