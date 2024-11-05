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
    disponibile: 'Y',
    alias: 'Pane e Coperto'
  },
  {
    id: 2,
    piatto: 'Bresaola equina e rucola',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Bresaola'
  },
  {
    id: 3,
    piatto: 'Antipasto equino',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Equino'
  },
  {
    id: 4,
    piatto: 'Prosciutto crudo e melone',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Crudo e Melone'
  },
  {
    id: 5,
    piatto: 'Robiola biologica 100% latte di capra',
    prezzo: 3.50,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Robiola'
  },
  {
    id: 6,
    piatto: 'Caprino alle erbe',
    prezzo: 3.50,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Caprino'
  },
  {
    id: 7,
    piatto: 'Agnolotti al sugo',
    prezzo: 7.50,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Agnolotti al sugo'
  },
  {
    id: 8,
    piatto: 'Agnolotti al vino',
    prezzo: 6.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Agnolotti al vino'
  },
  {
    id: 9,
    piatto: 'Agnolotti al burro e/o formaggio',
    prezzo: 6.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Agnolotti burro/form.'
  },
  {
    id: 10,
    piatto: 'Polenta e tapulone',
    prezzo: 8.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Polenta e tapulone'
  },
  {
    id: 11,
    piatto: 'Polenta',
    prezzo: 4.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Polenta'
  },
  {
    id: 12,
    piatto: 'Prosciutto Crudo',
    prezzo: 5.00,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Prosciutto Crudo'
  },
  {
    id: 13,
    piatto: 'Polenta al sugo',
    prezzo: 8.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Polenta al sugo'
  },
  {
    id: 14,
    piatto: 'Polenta e stracotto',
    prezzo: 12.00,
    cucina: 'Primi',
    disponibile: "Y",
    alias: 'Polenta e stracotto'
  },
  {
    id: 15,
    piatto: 'Arrosto d`asino',
    prezzo: 9.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Arrosto d`asino'
  },
  {
    id: 16,
    piatto: 'Stracotto d`asino',
    prezzo: 9.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Stracotto d`asino'
  },
  {
    id: 17,
    piatto: 'Salamini al cartoccio',
    prezzo: 7.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Salamini al cartoccio'
  },
  {
    id: 18,
    piatto: 'Braciola di maiale',
    prezzo: 6.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Braciola di maiale'
  }, 
  {
    id: 19,
    piatto: 'Patatine fritte',
    prezzo: 3.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Patatine'
  },
  {
    id: 20,
    piatto: 'Peperonata',
    prezzo: 3.50,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Peperonata'
  },
  {
    id: 21,
    piatto: 'Insalasta tricolore',
    prezzo: 3.00,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Insalata'
  },
  {
    id: 23,
    piatto: 'Fagioli alla texana',
    prezzo: 3.50,
    cucina: 'Secondi',
    disponibile: "Y",
    alias: 'Fagioli'
  },
  {
    id: 24,
    piatto: 'Melone a fette',
    prezzo: 2.00,
    cucina: 'Antipasti',
    disponibile: "Y",
    alias: 'Melone'
  },
  {
    id: 25,
    piatto: 'Torta di nocciole',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y",
    alias: 'Torta nocciole'
  },
  {
    id: 26,
    piatto: 'Crostata',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y",
    alias: 'Crostata'
  },
  {
    id: 27,
    piatto: 'Salame dolce al cioccolato',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y",
    alias: 'Salame cioccolato'
  },
  {
    id: 28,
    piatto: 'Salame dolce al marmellata',
    prezzo: 3.50,
    cucina: 'Dolci',
    disponibile: "Y",
    alias: 'Salame marmellata'
  },
  {
    id: 29,
    piatto: 'Pastine della nonna',
    prezzo: 2.50,
    cucina: 'Dolci',
    disponibile: "Y",
    alias: 'Pastine'
  },
  {
    id: 30,
    piatto: 'Dolcetto d`Ovada DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Dolcetto'
  },
  {
    id: 31,
    piatto: 'Barbera del monferrato DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Barbera'
  },
  {
    id: 32,
    piatto: 'Bonarda',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Bonarda'
  },
  {
    id: 33,
    piatto: 'Pinot Bianco DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Pinot Bianco'
  },
  {
    id: 34,
    piatto: 'Rugiada Chardonnay DOC',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Rugiada'
  },
  {
    id: 35,
    piatto: 'Moscato Piemonte',
    prezzo: 7.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Moascato'
  },
  {
    id: 36,
    piatto: 'Birra artigianale 0,4lt',
    prezzo: 4.00,
    cucina: 'Birre',
    disponibile: "Y",
    alias: 'Birra'
  },
  {
    id: 37,
    piatto: 'Acqua Minerale naturale 0,5lt',
    prezzo: 1.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Acqua Naturale'
  },
  {
    id: 38,
    piatto: 'Acqua Minerale frizzante 0,5lt',
    prezzo: 1.00,
    cucina: 'Bevande',
    disponibile: "Y",
    alias: 'Acqua Frizzante'
  },
  {
    id: 39,
    piatto: 'Salamini da asporto',
    prezzo: 2.00,
    cucina: 'Cassa',
    disponibile: "Y",
    alias: 'Salamini asporto'
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