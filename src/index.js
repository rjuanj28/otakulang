// Punto de entrada de OtakuLang.
//
// Modo archivo:  node src/index.js programa.otaku
//   Lee el archivo, lo ejecuta y muestra lo que imprime gritar.
//   Si hay un error, imprime SOLO "[Error TIPO] mensaje (línea X, columna Y)"
//   y termina con código de salida 1.
//
// Modo REPL:  node src/index.js
//   Consola interactiva con prompt "otaku> ". Ejecuta línea por línea,
//   conserva variables y funciones entre líneas, muestra los errores
//   sin cerrarse, y se sale escribiendo "salir".

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { parsear } from './parser.js';
import { evaluarPrograma, crearEntornoGlobal, aTextoValor } from './evaluator.js';
import { ErrorOtaku } from './errors.js';

// Convierte cualquier error capturado en un mensaje comprensible.
// Los ErrorOtaku ya tienen formato; los errores internos de JavaScript
// (TypeError, etc.) se reportan como error interno sin stack trace.
function mensajeDeError(e) {
  if (e instanceof ErrorOtaku) return e.toString();
  return `[Error INTERNO] ${e.message}`;
}

// Ejecuta código en un entorno. Lanza ErrorOtaku si algo falla.
function ejecutar(codigo, entorno) {
  const ast = parsear(codigo);
  return evaluarPrograma(ast, entorno);
}

// ---------- Modo archivo ----------

function correrArchivo(ruta) {
  let codigo;
  try {
    codigo = readFileSync(ruta, 'utf8');
  } catch {
    console.log(`[Error ARCHIVO] No se pudo leer el archivo: ${ruta}`);
    process.exit(1);
  }

  try {
    ejecutar(codigo, crearEntornoGlobal());
  } catch (e) {
    console.log(mensajeDeError(e));
    process.exit(1);
  }
}

// ---------- Modo REPL ----------

function iniciarRepl() {
  console.log('OtakuLang REPL — escribe "salir" para terminar.');
  const entorno = crearEntornoGlobal(); // se conserva entre líneas

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt('otaku> ');
  rl.prompt();

  rl.on('line', (linea) => {
    const texto = linea.trim();
    if (texto === 'salir') {
      console.log('Sayonara!');
      rl.close();
      return;
    }
    if (texto !== '') {
      try {
        const resultado = ejecutar(texto, entorno);
        // Si la línea fue una expresión, mostrar su valor (como un REPL real).
        if (resultado !== null && resultado !== undefined) {
          console.log(aTextoValor(resultado));
        }
      } catch (e) {
        // Mostrar el error pero NO cerrar el REPL.
        console.log(mensajeDeError(e));
      }
    }
    rl.prompt();
  });

  rl.on('close', () => process.exit(0));
}

// ---------- Arranque ----------

const argumento = process.argv[2];
if (argumento) {
  correrArchivo(argumento);
} else {
  iniciarRepl();
}
