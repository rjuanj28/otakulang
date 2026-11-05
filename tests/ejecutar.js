// Ejecutor principal: corre todas las suites (unitarias + integración) con un solo comando.
// Uso: npm test   (o: node tests/ejecutar.js)
import { spawnSync } from 'node:child_process';

// Todas las suites del proyecto, en orden.
const SUITES = [
  'tests/unitarias/prueba-lexer.js',
  'tests/unitarias/pruebas-parser.js',
  'tests/unitarias/pruebas-evaluador.js',
  'tests/unitarias/pruebas-ambitos.js',
  'tests/unitarias/pruebas-funciones.js',
  'tests/ejecutar-tests.js', // integración: tests/validos y tests/errores
];

let pasaron = 0;
let fallaron = 0;

console.log('=== Pruebas de OtakuLang ===\n');

for (const suite of SUITES) {
  console.log(`--- ${suite} ---`);
  const r = spawnSync(process.execPath, [suite], { encoding: 'utf8' });
  // Mostramos la salida de la suite tal cual (con sus propios ✔/✘ y conteos).
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  if (r.status === 0) {
    pasaron++;
  } else {
    fallaron++;
    console.log(`✘ La suite ${suite} FALLÓ (código de salida ${r.status})\n`);
  }
}

console.log('=== Resumen final ===');
console.log(`Suites: ${pasaron} pasaron, ${fallaron} fallaron, de ${SUITES.length} suites`);
process.exit(fallaron > 0 ? 1 : 0);
