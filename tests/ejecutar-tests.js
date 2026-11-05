// Ejecutor de pruebas de integración.
// Recorre tests/validos/ y tests/errores/, ejecuta cada programa .otaku
// con node src/index.js y compara la salida con el archivo .esperado.
//
// - tests/validos/: el programa debe terminar sin error (exit 0) y su
//   salida debe ser EXACTAMENTE la del .esperado.
// - tests/errores/: el programa debe fallar (exit 1) y el mensaje de
//   error debe ser EXACTAMENTE el del .esperado.
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let pasaron = 0;
let fallaron = 0;
const detalles = [];

// Ejecuta un programa y devuelve su salida normalizada (sin \r).
function ejecutar(ruta) {
  const r = spawnSync(process.execPath, ['src/index.js', ruta], { encoding: 'utf8' });
  return {
    salida: (r.stdout || '').replace(/\r\n/g, '\n').trimEnd(),
    exit: r.status,
  };
}

function probarCarpeta(carpeta, debeFallar) {
  const archivos = readdirSync(carpeta).filter(f => f.endsWith('.otaku'));
  for (const archivo of archivos) {
    const ruta = `${carpeta}/${archivo}`;
    const esperado = readFileSync(`${ruta}.esperado`, 'utf8').trimEnd();
    const { salida, exit } = ejecutar(ruta);

    let ok;
    if (debeFallar) {
      ok = exit === 1 && salida === esperado; // debe fallar con ese mensaje
    } else {
      ok = exit === 0 && salida === esperado; // debe exito con esa salida
    }

    if (ok) {
      pasaron++;
      console.log(`  ✔ ${archivo}`);
    } else {
      fallaron++;
      detalles.push({ archivo, esperado, salida, exit });
      console.log(`  ✘ ${archivo}`);
      console.log(`      exit: ${exit}`);
      console.log(`      esperado: ${JSON.stringify(esperado)}`);
      console.log(`      obtenido: ${JSON.stringify(salida)}`);
    }
  }
}

console.log('Pruebas válidos (deben correr sin error y coincidir con .esperado):');
probarCarpeta('tests/validos', false);

console.log('');
console.log('Pruebas errores (deben fallar con el mensaje del .esperado):');
probarCarpeta('tests/errores', true);

console.log('');
console.log(`Resultado: ${pasaron} pasaron, ${fallaron} fallaron, de ${pasaron + fallaron} pruebas`);
process.exit(fallaron > 0 ? 1 : 0);
