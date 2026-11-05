// Pruebas de la Etapa 1 (Lexer) para correr con: node prueba-lexer.js
// Cada prueba imprime lo que obtuvo y lo que se esperaba.

import { Lexer } from '../../src/lexer.js';

let pasadas = 0;
let fallidas = 0;

function revisar(nombre, obtenido, esperado) {
  if (obtenido === esperado) {
    pasadas++;
    console.log(`✔ ${nombre}`);
  } else {
    fallidas++;
    console.log(`✘ ${nombre}`);
    console.log(`  Esperado: ${esperado}`);
    console.log(`  Obtenido: ${obtenido}`);
  }
}

// Prueba 1: cadena sin cerrar debe dar Error LÉXICO.
try {
  new Lexer('ninja s = "hola').tokenizar();
  revisar('Prueba 1: cadena sin cerrar', 'no lanzó error', 'Error LÉXICO');
} catch (e) {
  const ok = e.toString().includes('LÉXICO');
  revisar('Prueba 1: cadena sin cerrar', ok ? 'Error LÉXICO' : e.toString(), 'Error LÉXICO');
  console.log(`  Mensaje: ${e.toString()}`);
}

// Prueba 2: operadores de dos caracteres salen como un solo token.
{
  const t = new Lexer('a != b && c <= 3.14 || !d').tokenizar();
  const salida = t.map((x) => x.tipo + '(' + x.literal + ')').join(' ');
  revisar(
    'Prueba 2: operadores de dos caracteres',
    salida,
    'IDENT(a) !=(!=) IDENT(b) &&(&&) IDENT(c) <=(<=) NUMERO(3.14) ||(||) !(!) IDENT(d) EOF()'
  );
}

// Prueba 3: el error de la segunda línea debe reportar línea 2.
try {
  new Lexer('ninja a = 1;\nninja b = 2 & 3;').tokenizar();
  revisar('Prueba 3: línea del error', 'no lanzó error', 'línea 2');
} catch (e) {
  const ok = e.toString().includes('línea 2');
  revisar('Prueba 3: línea del error', ok ? 'línea 2' : e.toString(), 'línea 2');
  console.log(`  Mensaje: ${e.toString()}`);
}

console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
process.exit(fallidas > 0 ? 1 : 0);
