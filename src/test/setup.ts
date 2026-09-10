// IndexedDB no existe en Node. fake-indexeddb/auto instala una
// implementacion completa en el ambito global, asi que Dexie funciona
// igual que en el navegador y los tests prueban el codigo de verdad,
// no un doble.
import "fake-indexeddb/auto";
