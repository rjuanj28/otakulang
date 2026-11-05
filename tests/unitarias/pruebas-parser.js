// Pruebas de la Etapa 2 (Parser y AST) para correr con: node pruebas-parser.js
// Verifica que el parser sigue la gramática EBNF y reporta errores sintácticos.

import { Lexer } from '../../src/lexer.js';
import { Parser } from '../../src/parser.js';
import { imprimirAST } from '../../src/ast.js';

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

// Parsea código y devuelve el AST, o el mensaje de error si falla.
function parsear(codigo) {
  try {
    return new Parser(new Lexer(codigo).tokenizar()).parsearPrograma();
  } catch (e) {
    return e;
  }
}

// --- Prueba 1: precedencia 1 + 2 * 3 debe agrupar como 1 + (2 * 3) ---
{
  const ast = parsear('ninja x = 1 + 2 * 3;');
  const decl = ast.sentencias[0];
  // La raíz debe ser '+' y su derecha debe ser '*'
  const ok =
    decl.valor.tipo === 'OpBinaria' &&
    decl.valor.operador === '+' &&
    decl.valor.derecha.operador === '*';
  revisar('Prueba 1: precedencia 1 + 2 * 3', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 2: asociatividad izquierda 10 - 4 - 3 = (10 - 4) - 3 ---
{
  const ast = parsear('ninja x = 10 - 4 - 3;');
  const op = ast.sentencias[0].valor;
  // La raíz es '-' y su IZQUIERDA es otro '-' (asociatividad a la izquierda)
  const ok = op.operador === '-' && op.izquierda.operador === '-';
  revisar('Prueba 2: asociatividad izquierda 10 - 4 - 3', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 3: precedencia de && sobre || ---
{
  const ast = parsear('ninja x = hai || iie && hai;');
  const op = ast.sentencias[0].valor;
  // La raíz debe ser '||' y su derecha debe ser '&&'
  const ok = op.operador === '||' && op.derecha.operador === '&&';
  revisar('Prueba 3: precedencia && sobre ||', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 4: unario -x * 2 agrupa como (-x) * 2 ---
{
  const ast = parsear('ninja x = -x * 2;');
  const op = ast.sentencias[0].valor;
  const ok = op.operador === '*' && op.izquierda.tipo === 'OpUnaria' && op.izquierda.operador === '-';
  revisar('Prueba 4: unario -x * 2', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 5: condicional anidado nani/baka nani ---
{
  const ast = parsear('nani (hai) { } baka nani (iie) { } baka { }');
  const cond = ast.sentencias[0];
  // bakaRama debe ser otro Condicional (else if)
  const ok = cond.tipo === 'Condicional' && cond.bakaRama.tipo === 'Condicional';
  revisar('Prueba 5: condicional anidado baka nani', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 6: ciclo entrenar con sus tres partes ---
{
  const ast = parsear('entrenar (ninja i = 0; i < 10; i = i + 1) { gritar(i); }');
  const para = ast.sentencias[0];
  const ok =
    para.tipo === 'Para' &&
    para.inicial.tipo === 'Declaracion' &&
    para.condicion.tipo === 'OpBinaria' &&
    para.incremento.tipo === 'Asignacion';
  revisar('Prueba 6: ciclo entrenar (inicial; cond; incremento)', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 7: función jutsu con parámetros ---
{
  const ast = parsear('jutsu sumar(a, b, c) { kaeri a + b + c; }');
  const fn = ast.sentencias[0];
  const ok =
    fn.tipo === 'Funcion' &&
    fn.nombre === 'sumar' &&
    fn.parametros.join(',') === 'a,b,c' &&
    fn.cuerpo.sentencias[0].tipo === 'Retorno';
  revisar('Prueba 7: función jutsu con parámetros y kaeri', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 8: lista con índices y llamada encadenada ---
{
  const ast = parsear('ninja x = lista[0][1](2, 3);');
  const decl = ast.sentencias[0];
  // La estructura debe ser Llamada(Indice(Indice(Variable lista)))
  const ok =
    decl.valor.tipo === 'Llamada' &&
    decl.valor.callee.tipo === 'Indice' &&
    decl.valor.callee.expresion.tipo === 'Indice' &&
    decl.valor.callee.expresion.expresion.tipo === 'Variable' &&
    decl.valor.argumentos.length === 2;
  revisar('Prueba 8: índices y llamadas encadenados', ok ? 'correcta' : 'incorrecta', 'correcta');
}

// --- Prueba 9: error sintáctico, falta ';' ---
{
  const resultado = parsear('ninja x = 1');
  const ok = resultado instanceof Error && resultado.toString().includes('SINTÁCTICO');
  revisar('Prueba 9: falta ; da ErrorSintactico', ok ? 'Error SINTÁCTICO' : 'otra cosa', 'Error SINTÁCTICO');
  if (ok) console.log(`  Mensaje: ${resultado.toString()}`);
}

// --- Prueba 10: error sintáctico, paréntesis sin cerrar ---
{
  const resultado = parsear('ninja x = (1 + 2;');
  const ok = resultado instanceof Error && resultado.toString().includes('SINTÁCTICO');
  revisar('Prueba 10: paréntesis sin cerrar da ErrorSintactico', ok ? 'Error SINTÁCTICO' : 'otra cosa', 'Error SINTÁCTICO');
  if (ok) console.log(`  Mensaje: ${resultado.toString()}`);
}

// --- Prueba 11: error sintáctico reporta línea y columna ---
{
  const resultado = parsear('ninja a = 1;\nninja b = ;');
  const ok =
    resultado instanceof Error &&
    resultado.linea === 2 &&
    typeof resultado.columna === 'number';
  revisar('Prueba 11: el error reporta línea 2', ok ? 'línea 2' : 'otra cosa', 'línea 2');
  if (resultado instanceof Error) console.log(`  Mensaje: ${resultado.toString()}`);
}

// --- Prueba 12: error típico, ninja sin nombre de variable ---
{
  const resultado = parsear('ninja = 5;');
  const ok =
    resultado instanceof Error &&
    resultado.toString().includes('SINTÁCTICO') &&
    resultado.toString().includes('nombre');
  revisar('Prueba 12: ninja = 5; da ErrorSintactico (falta nombre)', ok ? 'Error SINTÁCTICO' : 'otra cosa', 'Error SINTÁCTICO');
  if (resultado instanceof Error) console.log(`  Mensaje: ${resultado.toString()}`);
}

// --- Demostración: imprimirAST de un programa pequeño ---
console.log('\n--- Ejemplo de imprimirAST ---');
const demo = parsear('ninja poder = 9000 + 1;\nnani (poder > 9000) { gritar("NANI?!"); }');
imprimirAST(demo);

console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
process.exit(fallidas > 0 ? 1 : 0);
