// Pruebas de las etapas 4 y 5 (variables, ámbitos, condicionales y ciclos).
// Correr con: node pruebas-ambitos.js
// Cada caso ejecuta un programa completo (fuente → lexer → parser → evaluador)
// y compara lo que imprime gritar con el resultado esperado.

import { Lexer } from '../../src/lexer.js';
import { Parser } from '../../src/parser.js';
import { evaluarPrograma, crearEntornoGlobal } from '../../src/evaluator.js';

let pasadas = 0;
let fallidas = 0;

// Ejecuta un programa y devuelve { salida, error }.
// La salida es lo que imprimió gritar, una línea por llamada.
function ejecutar(codigo) {
  const lineas = [];
  const consoleOriginal = console.log;
  console.log = (...args) => lineas.push(args.join(' '));
  try {
    const ast = new Parser(new Lexer(codigo).tokenizar()).parsearPrograma();
    evaluarPrograma(ast, crearEntornoGlobal());
    return { salida: lineas, error: null };
  } catch (e) {
    return { salida: lineas, error: e };
  } finally {
    console.log = consoleOriginal;
  }
}

function revisar(nombre, codigo, salidaEsperada, errorEsperado = null) {
  const { salida, error } = ejecutar(codigo);
  const salidaTexto = salida.join(' | ');
  const ok =
    salidaTexto === salidaEsperada &&
    ((errorEsperado === null && error === null) ||
      (errorEsperado !== null && error !== null && error.toString().includes(errorEsperado)));
  if (ok) {
    pasadas++;
    console.log(`✔ ${nombre}`);
  } else {
    fallidas++;
    console.log(`✘ ${nombre}`);
    console.log(`  Esperado: salida="${salidaEsperada}" error=${errorEsperado ?? 'ninguno'}`);
    console.log(`  Obtenido: salida="${salidaTexto}" error=${error ? error.toString() : 'ninguno'}`);
  }
}

// 1) Declarar, asignar y leer.
revisar(
  '1) x = 5; x = x + 1; gritar(x)',
  'ninja x = 5; x = x + 1; gritar(x);',
  '6'
);

// 2) Sombreado: la x del bloque no modifica la de afuera.
revisar(
  '2) sombreado: ninja x = 1; nani (hai) { ninja x = 2; gritar(x); } gritar(x)',
  'ninja x = 1; nani (hai) { ninja x = 2; gritar(x); } gritar(x);',
  '2 | 1'
);

// 3) Asignar dentro del bloque modifica la variable de afuera.
revisar(
  '3) asigna al de afuera: nani (hai) { x = 2; } gritar(x)',
  'ninja x = 1; nani (hai) { x = 2; } gritar(x);',
  '2'
);

// 4) ninja a; sin valor la deja en nada.
revisar(
  '4) ninja a; gritar(a) -> nada',
  'ninja a; gritar(a);',
  'nada'
);

// 5) Variable no definida.
revisar(
  '5) gritar(zzz) -> ErrorEjecucion variable no definida',
  'gritar(zzz);',
  '',
  'Variable no definida'
);

// 6) Redeclaración en el mismo ámbito.
revisar(
  '6) ninja x = 1; ninja x = 2; -> ErrorEjecucion redeclaración',
  'ninja x = 1; ninja x = 2;',
  '',
  'ya declarada'
);

// 7) Asignar a una variable no declarada.
revisar(
  '7) y = 5; -> ErrorEjecucion variable no declarada',
  'y = 5;',
  '',
  'Variable no definida'
);

// 8) while: suma 1+2+3+4+5.
revisar(
  '8) kamehameha: suma 1..5 -> 15',
  'ninja s = 0; ninja i = 1; kamehameha (i <= 5) { s = s + i; i = i + 1; } gritar(s);',
  '15'
);

// 9) for: imprime 0, 1, 2.
revisar(
  '9) entrenar: imprime 0, 1, 2',
  'entrenar (ninja i = 0; i < 3; i = i + 1) { gritar(i); }',
  '0 | 1 | 2'
);

// 10) La variable del for no existe después del ciclo.
revisar(
  '10) entrenar: i no existe afuera -> ErrorEjecucion',
  'entrenar (ninja i = 0; i < 3; i = i + 1) { } gritar(i);',
  '',
  'Variable no definida'
);

// 11) baka nani (else if).
revisar(
  '11) baka nani: n = 7 -> medio',
  'ninja n = 7; nani (n > 10) { gritar("grande"); } baka nani (n > 5) { gritar("medio"); } baka { gritar("chico"); }',
  'medio'
);

// 12) nani (0): 0 es falso, va al baka.
revisar(
  '12) nani (0) -> baka: imprime b',
  'nani (0) { gritar("a"); } baka { gritar("b"); }',
  'b'
);

// --- Casos extra ---

// while con condición falsa desde el inicio: no ejecuta nada.
revisar(
  '13) kamehameha con condición falsa no ejecuta nada',
  'ninja x = 0; kamehameha (x > 5) { gritar("nunca"); } gritar(x);',
  '0'
);

// nani anidado dentro de nani.
revisar(
  '14) nani anidado',
  'ninja n = 15; nani (n > 10) { nani (n > 20) { gritar("gigante"); } baka { gritar("grande"); } }',
  'grande'
);

// El bloque suelto { } también crea ámbito.
revisar(
  '15) bloque suelto crea ámbito',
  'ninja x = 1; { ninja x = 99; gritar(x); } gritar(x);',
  '99 | 1'
);

// for con decremento.
revisar(
  '16) entrenar hacia atrás: 2, 1, 0',
  'entrenar (ninja i = 2; i >= 0; i = i - 1) { gritar(i); }',
  '2 | 1 | 0'
);

console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
process.exit(fallidas > 0 ? 1 : 0);
