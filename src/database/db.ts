import Dexie, { type EntityTable } from 'dexie';

// Definimos la interfaz de nuestro registro
export interface SolveRecord {
  id?: number; // IndexedDB lo autoincrementará
  time: number; // Tiempo en milisegundos
  scramble: string;
  date: Date;
}

// Inicializamos la base de datos
const db = new Dexie('UGOSmartTimerDB') as Dexie & {
  solves: EntityTable<SolveRecord, 'id'>;
};

// Declaramos el esquema (solo necesitas indexar los campos por los que vas a buscar o filtrar)
// '++id' significa que es la llave primaria y se autoincrementa
db.version(1).stores({
  solves: '++id, date'
});

export { db };