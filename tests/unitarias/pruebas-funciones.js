// Pruebas de las etapas 6 y 7: funciones, recursión, listas e integradas.
// Cada caso ejecuta un programa completo (texto → lexer → parser → evaluador)
// y compara lo que imprime gritar, o el error esperado.

import { parsear } from '../../src/parser.js';
import { evaluarPrograma, crearEntornoGlobal } from '../../src/evaluator.js';
import { ErrorOtaku } from '../../src/errors.js';

let pasaron = 0;
let fallaron = 0;

// Ejecuta un programa y devuelve todo lo que imprimió gritar (separado por \n).
function ejecutar(codigo) {
  const ast = parsear(codigo); // parsear tokeniza y parsea en un solo paso
  const salida = [];
  const original = console.log;
  console.log = (...args) => salida.push(args.join(' '));
  try {
    evaluarPrograma(ast, crearEntornoGlobal());
  } finally {
    console.log = original; // siempre restaurar
  }
  return salida.join('\n');
}

// Ejecuta un programa que DEBE fallar y devuelve el mensaje del error.
function ejecutarError(codigo) {
  try {
    ejecutar(codigo);
  } catch (e) {
    if (e instanceof ErrorOtaku) return e.toString();
    throw e; // no es un error del lenguaje: es un bug de las pruebas
  }
  throw new Error('Este programa debía fallar pero corrió sin error');
}

// Prueba de un programa válido: el texto que imprime debe ser exacto.
function probar(nombre, codigo, esperado) {
  try {
    const salida = ejecutar(codigo);
    if (salida === esperado) {
      console.log(`✔️  ${nombre}`);
      pasaron++;
    } else {
      console.log(`✘  ${nombre}`);
      console.log(`     esperado: ${JSON.stringify(esperado)}`);
      console.log(`     obtenido: ${JSON.stringify(salida)}`);
      fallaron++;
    }
  } catch (e) {
    console.log(`✘  ${nombre}`);
    console.log(`     falló inesperadamente: ${e.message}`);
    fallaron++;
  }
}

// Prueba de un programa inválido: el error debe contener el texto esperado.
function probarError(nombre, codigo, textoEsperado) {
  try {
    const mensaje = ejecutarError(codigo);
    if (mensaje.includes(textoEsperado)) {
      console.log(`✔️  ${nombre}`);
      pasaron++;
    } else {
      console.log(`✘  ${nombre}`);
      console.log(`     el error no contiene "${textoEsperado}":`);
      console.log(`     obtenido: ${mensaje}`);
      fallaron++;
    }
  } catch (e) {
    console.log(`✘  ${nombre}`);
    console.log(`     falló inesperadamente: ${e.message}`);
    fallaron++;
  }
}

console.log('--- Funciones ---');

// 1. Factorial recursivo.
probar(
  'factorial recursivo de 5',
  `jutsu factorial(n) {
    nani (n <= 1) { kaeri 1; }
    kaeri n * factorial(n - 1);
  }
  gritar(factorial(5));`,
  '120'
);

// 2. Fibonacci recursivo.
probar(
  'fibonacci recursivo de 10',
  `jutsu fib(n) {
    nani (n < 2) { kaeri n; }
    kaeri fib(n - 1) + fib(n - 2);
  }
  gritar(fib(10));`,
  '55'
);

// 3. Ámbito léxico: f ve la x GLOBAL, no la de quien la llama.
probar(
  'ámbito léxico (no dinámico)',
  `ninja x = 1;
  jutsu f() { kaeri x; }
  jutsu g() { ninja x = 2; kaeri f(); }
  gritar(g());`,
  '1'
);

// 4. Función con dos parámetros.
probar(
  'función con dos parámetros',
  `jutsu suma(a, b) { kaeri a + b; }
  gritar(suma(2, 3));`,
  '5'
);

// 5. Función sin kaeri devuelve nada.
probar(
  'función sin kaeri devuelve nada',
  `jutsu f() { ninja x = 1; }
  gritar(f());`,
  'nada'
);

// 6. Número incorrecto de argumentos.
probarError(
  'número incorrecto de argumentos',
  `jutsu suma(a, b) { kaeri a + b; }
  suma(1);`,
  'esperaba 2 argumento(s) pero llegaron 1'
);

// 7. Llamar algo que no es función.
probarError(
  'llamar algo que no es función',
  `ninja n = 5;
  n(1);`,
  'no es una función'
);

// 8. kaeri fuera de una función.
probarError(
  'kaeri fuera de una función',
  `kaeri 1;`,
  "'kaeri' solo se puede usar dentro de una función"
);

// 9. Recursión infinita: error controlado, el intérprete sigue vivo.
probarError(
  'recursión demasiado profunda',
  `jutsu inf(n) { kaeri inf(n + 1); }
  inf(0);`,
  'Recursión demasiado profunda'
);

// 10. Closure: la función recuerda su variable entre llamadas.
probar(
  'closure con contador',
  `jutsu crearContador() {
    ninja cuenta = 0;
    jutsu inc() { cuenta = cuenta + 1; kaeri cuenta; }
    kaeri inc;
  }
  ninja c = crearContador();
  gritar(c());
  gritar(c());`,
  '1\n2'
);

console.log('--- Listas ---');

// 11. Asignación a una posición de la lista.
probar(
  'asignación a índice de lista',
  `ninja l = [1, 2, 3];
  l[0] = 9;
  gritar(l);`,
  '[9, 2, 3]'
);

// 12. Índice fuera de rango.
probarError(
  'índice fuera de rango',
  `ninja l = [1, 2, 3];
  gritar(l[5]);`,
  'fuera de rango'
);

// 13. Indexar una cadena.
probar(
  'indexar una cadena',
  `gritar("hola"[1]);`,
  'o'
);

// 14. Lista pasada por referencia: el cambio se ve afuera.
probar(
  'lista por referencia en función',
  `jutsu modificar(l) { l[0] = 100; }
  ninja lista = [1, 2];
  modificar(lista);
  gritar(lista);`,
  '[100, 2]'
);

console.log('--- Funciones integradas ---');

// 15. poder con cadena y lista.
probar(
  'poder de cadena y lista',
  `gritar(poder("hola"), poder([1, 2]));`,
  '4 2'
);

// 16. aNumero con cadena numérica.
probar(
  'aNumero con cadena numérica',
  `gritar(aNumero("42") + 1);`,
  '43'
);

// 17. aNumero con cadena no numérica.
probarError(
  'aNumero con cadena no numérica',
  `aNumero("abc");`,
  'No se puede convertir a número'
);

// 18. agregar y poder sobre la misma lista.
probar(
  'agregar y poder',
  `ninja l = [];
  agregar(l, 7);
  agregar(l, 8);
  gritar(l, poder(l));`,
  '[7, 8] 2'
);

// 19. Sumar una lista con kamehameha y poder.
probar(
  'suma de lista con kamehameha',
  `ninja l = [1, 2, 3, 4];
  ninja suma = 0;
  ninja i = 0;
  kamehameha (i < poder(l)) {
    suma = suma + l[i];
    i = i + 1;
  }
  gritar(suma);`,
  '10'
);

// 20. Reusar el nombre de una integrada como variable (sombreado).
probar(
  'variable con nombre de integrada',
  `ninja poder = 9001;
  gritar(poder);`,
  '9001'
);

// Resumen.
console.log('');
console.log(`Pasaron: ${pasaron}  Fallaron: ${fallaron}`);
if (fallaron > 0) process.exit(1);
