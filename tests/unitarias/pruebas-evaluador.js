// Pruebas de la Etapa 3 (Evaluador de expresiones) para correr con: node pruebas-evaluador.js

import { Lexer } from '../../src/lexer.js';
import { Parser } from '../../src/parser.js';
import { evaluarPrograma, crearEntornoGlobal } from '../../src/evaluator.js';

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

// Evalúa una expresión (como sentencia) y devuelve su valor o el error.
function evaluar(codigo) {
  try {
    const ast = new Parser(new Lexer(codigo).tokenizar()).parsearPrograma();
    return evaluarPrograma(ast, crearEntornoGlobal());
  } catch (e) {
    return e;
  }
}

// Evalúa y devuelve el texto del resultado (para comparar fácilmente).
function evaluarTexto(codigo) {
  const r = evaluar(codigo);
  if (r instanceof Error) return 'ERROR: ' + r.toString();
  if (r === null) return 'nada';
  if (r === true) return 'hai';
  if (r === false) return 'iie';
  if (Array.isArray(r)) return '[' + r.map(String).join(', ') + ']';
  return String(r);
}

// --- Casos requeridos ---

revisar('2 + 3 * 4', evaluarTexto('2 + 3 * 4;'), '14');
revisar('10 - 4 - 3 (asociatividad izquierda)', evaluarTexto('10 - 4 - 3;'), '3');
revisar('(2 + 3) * 4 (paréntesis)', evaluarTexto('(2 + 3) * 4;'), '20');
revisar('"hola" + 5 (concatenación)', evaluarTexto('"hola" + 5;'), 'hola5');
revisar('7 % 3 (módulo)', evaluarTexto('7 % 3;'), '1');
revisar('5 == "5" es iie (sin conversión)', evaluarTexto('5 == "5";'), 'iie');
revisar('hai && iie es iie', evaluarTexto('hai && iie;'), 'iie');

// Cortocircuito: el lado derecho NO se evalúa, así que 1/0 no da error.
revisar('iie && (1 / 0) NO da error (cortocircuito)', evaluarTexto('iie && (1 / 0);'), 'iie');
revisar('hai || (1 / 0) NO da error (cortocircuito)', evaluarTexto('hai || (1 / 0);'), 'hai');

// Errores de ejecución.
{
  const r = evaluar('10 / 0;');
  const ok = r instanceof Error && r.toString().includes('EJECUCIÓN');
  revisar('10 / 0 da ErrorEjecucion', ok ? 'Error EJECUCIÓN' : 'otra cosa', 'Error EJECUCIÓN');
  if (ok) console.log(`  Mensaje: ${r.toString()}`);
}
{
  const r = evaluar('"a" * 2;');
  const ok = r instanceof Error && r.toString().includes('EJECUCIÓN');
  revisar('"a" * 2 da ErrorEjecucion', ok ? 'Error EJECUCIÓN' : 'otra cosa', 'Error EJECUCIÓN');
  if (ok) console.log(`  Mensaje: ${r.toString()}`);
}
{
  const r = evaluar('-"x";');
  const ok = r instanceof Error && r.toString().includes('EJECUCIÓN');
  revisar('-"x" da ErrorEjecucion', ok ? 'Error EJECUCIÓN' : 'otra cosa', 'Error EJECUCIÓN');
  if (ok) console.log(`  Mensaje: ${r.toString()}`);
}

// --- Casos extra de las reglas de diseño ---

revisar('!nada es hai (regla de verdad)', evaluarTexto('!nada;'), 'hai');
revisar('!0 es hai (0 es falso)', evaluarTexto('!0;'), 'hai');
revisar('!"" es hai (cadena vacía es falsa)', evaluarTexto('!"";'), 'hai');
revisar('"abc" < "abd" (comparación de cadenas)', evaluarTexto('"abc" < "abd";'), 'hai');
revisar('3 <= 3', evaluarTexto('3 <= 3;'), 'hai');
revisar('5 != 5 es iie', evaluarTexto('5 != 5;'), 'iie');
revisar('nada == nada es hai', evaluarTexto('nada == nada;'), 'hai');
revisar('-7 + 10 (unario y suma)', evaluarTexto('-7 + 10;'), '3');
revisar('2.5 * 2 (decimales)', evaluarTexto('2.5 * 2;'), '5');

// gritar imprime y devuelve nada.
console.log('\n--- Prueba de gritar ---');
const rGritar = evaluar('gritar("Kamehameha!", 9000 + 1);');
revisar('gritar devuelve nada', rGritar === null ? 'nada' : 'otra cosa', 'nada');

console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
process.exit(fallidas > 0 ? 1 : 0);
