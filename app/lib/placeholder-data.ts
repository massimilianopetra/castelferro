// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
const users = [
  {
    id: 1,
    name: 'Antipasti',
    email: 'antipasti@castelferro.it',
    password: 'antipasti$'
  },
  {
    id: 2,
    name: 'Bevande',
    email: 'bevande@castelferro.it',
    password: 'bevande$'
  },
  {
    id: 3,
    name: 'Casse',
    email: 'casse@castelferro.it',
    password: 'casse$'
  },
  {
    id: 4,
    name: 'Dolci',
    email: 'dolci@castelferro.it',
    password: 'dolci$'
  },
  {
    id: 5,
    name: 'Primi',
    email: 'primi@castelferro.it',
    password: 'primi$'
  },
  {
    id: 6,
    name: 'Secondi',
    email: 'secondi@castelferro.it',
    password: 'secondi$'
  },
  {
    id: 7,
    name: 'Birre',
    email: 'birre@castelferro.it',
    password: 'birre$'
  },
  {
    id: 8,
    name: 'SuperUser',
    email: 'superuser@castelferro.it',
    password: 'superuser$'
  },

];


export { users };

const menu = [
  {
    id: 1,
    piatto: 'Pane e Coperto',
    prezzo: 2.50,
    cucina: 'All',
    disponibile: 'Y'
  },
  {
    id: 2,
    piatto: 'Bresaola equina e rucola',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 3,
    piatto: 'Antipasto equino',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 4,
    piatto: 'Prosciutto crudo e melone',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 5,
    piatto: 'Robiola biologica 100% latte di capra',
    prezzo: 3.50,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 6,
    piatto: 'Caprino alle erbe',
    prezzo: 3.50,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 7,
    piatto: 'Agnolotti al sugo',
    prezzo: 7.50,
    cucina: 'Primi',
    disponibile: "Y"
  },
  {
    id: 8,
    piatto: 'Agnolotti al vino',
    prezzo: 6.00,
    cucina: 'Primi',
    disponibile: "Y"
  },
  {
    id: 9,
    piatto: 'Agnolotti al butto e/o formaggio',
    prezzo: 6.00,
    cucina: 'Primi',
    disponibile: "Y"
  },
  {
    id: 10,
    piatto: 'Polenta e tapulone',
    prezzo: 8.00,
    cucina: 'Primi',
    disponibile: "Y"
  },
  {
    id: 11,
    piatto: 'Arrosto d`asino',
    prezzo: 9.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 12,
    piatto: 'Stracotto d`asino',
    prezzo: 9.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 13,
    piatto: 'Salamini al cartoccio',
    prezzo: 7.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 14,
    piatto: 'Braciola di maiale',
    prezzo: 6.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 15,
    piatto: 'Patatine fritte',
    prezzo: 3.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 16,
    piatto: 'Peperonata',
    prezzo: 3.50,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 17,
    piatto: 'Insalasta verde',
    prezzo: 3.00,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 18,
    piatto: 'Fagioli alla texana',
    prezzo: 3.50,
    cucina: 'Secondi',
    disponibile: "Y"
  },
  {
    id: 19,
    piatto: 'Melone a fette',
    prezzo: 2.00,
    cucina: 'Antipasti',
    disponibile: "Y"
  },
  {
    id: 20,
    piatto: 'Torta di nocciole',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y"
  },
  {
    id: 21,
    piatto: 'Crostata',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y"
  },
  {
    id: 22,
    piatto: 'Salame dolce al cioccolato',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y"
  },
  {
    id: 23,
    piatto: 'Salame dolce al marmellata',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y"
  },
  {
    id: 24,
    piatto: 'Pastine della nonna',
    prezzo: 2.50,
    cucina: 'Dolci',
    disponibile: "Y"
  },
  {
    id: 25,
    piatto: 'Dolcetto d`Ovada DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 26,
    piatto: 'Barbera del monferrato DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 27,
    piatto: 'Bonarda',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 28,
    piatto: 'Pinot Bianco DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 29,
    piatto: 'Rugiada Chardonnay DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 30,
    piatto: 'Moscato Piemonte',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 31,
    piatto: 'Birra artigianale 0,4lt',
    prezzo: 4.00,
    cucina: 'Birre',
    disponibile: "Y"
  },
  {
    id: 32,
    piatto: 'Acqua Minerale naturale 0,5lt',
    prezzo: 1.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
  {
    id: 33,
    piatto: 'Acqua Minerale frizzante 0,5lt',
    prezzo: 1.00,
    cucina: 'Bevande',
    disponibile: "Y"
  },
];
export { menu };

const waiters = [
  {
    id: 1,
    name: 'Tizio',
    figlietto_start: 100,
    foglietto_end: 124
  },
  {
    id: 2,
    name: 'Caio',
    figlietto_start: 125,
    foglietto_end: 149
  },
  {
    id: 3,
    name: 'Sempronio',
    figlietto_start: 150,
    foglietto_end: 174
  },
  {
    id: 4,
    name: 'Pippo',
    figlietto_start: 175,
    foglietto_end: 199
  },
  {
    id: 5,
    name: 'Pluto',
    figlietto_start: 200,
    foglietto_end: 224
  },
  {
    id: 6,
    name: 'Paperino',
    figlietto_start: 225,
    foglietto_end: 249
  },
];

export { waiters };