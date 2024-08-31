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
  data: string;
};
