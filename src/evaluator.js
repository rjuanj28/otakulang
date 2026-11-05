 // Evaluador de OtakuLang: recorre el AST y calcula los resultados.
//
//   tokens ──parser──▶ AST ──evaluador──▶ valores
//
// Reglas de diseño:
//
// VALORES (representación en JS):
// - números → number, cadenas → string, hai/iie → boolean,
//   nada → null, listas → array de JS, funciones → objeto FuncionOtaku.
//
// EXPRESIONES:
// - Aritmética + - * / % solo con números.
// - El operador + concatena si ALGUNO de los dos operandos es cadena;
//   el otro se convierte con aTextoValor.
// - Comparaciones < > <= >= solo entre dos números o dos cadenas.
// - == y != comparan SIN convertir tipos (5 == "5" es iie).
// - Verdad/falsedad: son falsos solo iie, nada, 0 y la cadena vacía "".
// - && y || usan cortocircuito y devuelven un booleano (hai/iie).
// - Unarios: - solo con números; ! con cualquier valor (regla de verdad).
// - División o módulo entre cero: ErrorEjecucion con línea y columna.
// - Operar tipos incompatibles (por ejemplo "a" * 2): ErrorEjecucion.
//
// VARIABLES Y ÁMBITOS:
// - ninja x = expr; declara la variable en el ámbito ACTUAL.
//   ninja x; sin valor la deja en nada.
// - Declarar de nuevo un nombre que ya existe en el MISMO ámbito:
//   ErrorEjecucion. Declararlo en un ámbito interno SOMBREA al de afuera.
// - Leer busca en el ámbito actual y luego hacia los padres.
// - Asignar busca hacia los padres y modifica la primera que encuentre.
// - Cada bloque { } crea un ámbito nuevo cuyo padre es el ámbito actual.
//
// FUNCIONES (etapa 6):
// - jutsu nombre(a, b) { ... } crea un valor función que RECUERDA el
//   entorno donde fue definido (ámbito léxico) y lo declara con ese
//   nombre en el ámbito actual. Nombre repetido en el mismo ámbito:
//   ErrorEjecucion.
// - Una llamada crea un Environment cuyo padre es el entorno de
//   DEFINICIÓN de la función (no el de quien llama), declara los
//   parámetros ahí y ejecuta el cuerpo.
// - kaeri expr; termina la función y devuelve el valor. kaeri sin valor,
//   o llegar al final sin kaeri, devuelve nada.
// - kaeri fuera de una función: ErrorEjecucion.
// - Número de argumentos distinto al de parámetros: ErrorEjecucion
//   indicando cuántos se esperaban y cuántos llegaron.
// - Llamar algo que no es función: ErrorEjecucion.
// - Recursión demasiado profunda (desbordamiento de pila de JS): se
//   captura y se convierte en ErrorEjecucion "Recursión demasiado
//   profunda", sin que se caiga el intérprete.
// - No hay hoisting: una función se puede llamar solo después de definida.
// - Las funciones son valores: se pueden devolver y guardar en variables
//   (esto da closures gratis).
//
// LISTAS (etapa 7):
// - [a, b, c] crea una lista; l[i] lee; l[i] = v; asigna.
// - Los índices deben ser enteros en 0..longitud-1; si no, ErrorEjecucion
//   con el índice y la longitud.
// - Las listas se pasan por referencia: si una función modifica una lista,
//   el cambio se ve afuera.
// - Indexar una cadena devuelve el carácter en esa posición (solo lectura).
// - Indexar otro tipo: ErrorEjecucion.
//
// FUNCIONES INTEGRADAS:
// - Viven en un entorno EXTERIOR al global, para que el usuario pueda
//   declarar una variable con el mismo nombre sin error de redeclaración.
// - gritar(...): imprime sus argumentos separados por espacio.
// - poder(x): longitud de una lista o cadena; otro tipo: ErrorEjecucion.
// - aNumero(x): cadena numérica → número (si no se puede, ErrorEjecucion);
//   número se devuelve igual; hai → 1, iie → 0.
// - aTexto(x): usa aTextoValor.
// - agregar(lista, x): añade al final, modifica la lista y devuelve nada.
// - Todas validan número y tipo de argumentos con ErrorEjecucion.

import { ErrorEjecucion } from './errors.js';
import { Environment } from './environment.js';

// Salida de gritar: por defecto imprime a la consola. El editor web la
// reemplaza para imprimir en su panel de salida (ver editor.html).
export const salida = {
  imprimir: (texto) => console.log(texto),
};

// ============================================================
// VALORES
// ============================================================

// Convierte cualquier valor a texto para imprimir (gritar, aTexto, REPL).
export function aTextoValor(valor) {
  if (valor === null) return 'nada';
  if (valor === true) return 'hai';
  if (valor === false) return 'iie';
  if (Array.isArray(valor)) return '[' + valor.map(aTextoValor).join(', ') + ']';
  if (valor instanceof FuncionOtaku) return `<jutsu ${valor.nombre}(${valor.parametros.join(', ')})>`;
  return String(valor);
}

// Regla de verdad: solo iie, nada, 0 y "" son falsos; todo lo demás es verdadero.
export function esVerdad(valor) {
  if (valor === false || valor === null) return false;
  if (typeof valor === 'number' && valor === 0) return false;
  if (typeof valor === 'string' && valor === '') return false;
  return true;
}

// Lanza un error de ejecución con la posición del nodo.
function error(nodo, mensaje) {
  throw new ErrorEjecucion(mensaje, nodo.linea, nodo.columna);
}

// Nombre legible de un valor para los mensajes de error.
function tipoDe(valor) {
  if (valor === null) return 'nada';
  if (typeof valor === 'boolean') return valor ? 'hai' : 'iie';
  if (typeof valor === 'number') return 'número';
  if (typeof valor === 'string') return 'cadena';
  if (Array.isArray(valor)) return 'lista';
  if (valor instanceof FuncionOtaku) return 'función';
  if (valor instanceof FuncionIntegrada) return 'función integrada';
  return 'desconocido';
}

// Valor función jutsu: recuerda su cuerpo, sus parámetros y el entorno
// donde fue definida (ámbito léxico). Las funciones son valores.
class FuncionOtaku {
  constructor(nombre, parametros, cuerpo, entornoDefinicion) {
    this.nombre = nombre;
    this.parametros = parametros; // lista de nombres
    this.cuerpo = cuerpo; // nodo Bloque
    this.entornoDefinicion = entornoDefinicion; // cierre léxico
  }
}

// Señal interna que propaga el kaeri desde dentro de la función.
// Guarda la posición del kaeri para reportar el error si llega al global.
class SenalRetorno {
  constructor(valor, linea, columna) {
    this.valor = valor;
    this.linea = linea;
    this.columna = columna;
  }
}

// ============================================================
// EXPRESIONES
// ============================================================

// Evalúa un nodo de expresión y devuelve su valor.
export function evaluarExpresion(nodo, entorno) {
  switch (nodo.tipo) {
    // --- Literales ---
    case 'Numero':
      return nodo.valor;
    case 'Cadena':
      return nodo.valor;
    case 'Booleano':
      return nodo.valor;
    case 'Nulo':
      return null;

    // --- Variables: buscar en el ámbito actual y luego en los padres ---
    case 'Variable': {
      const valor = entorno.leer(nodo.nombre);
      if (valor === undefined) {
        error(nodo, `Variable no definida: '${nodo.nombre}'`);
      }
      return valor;
    }

    // --- Operaciones ---
    case 'OpBinaria':
      return evaluarBinaria(nodo, entorno);
    case 'OpUnaria':
      return evaluarUnaria(nodo, entorno);
    case 'Llamada':
      return evaluarLlamada(nodo, entorno);

    // --- Listas ---
    case 'ListaLiteral':
      return nodo.elementos.map((e) => evaluarExpresion(e, entorno));
    case 'Indice':
      return evaluarIndice(nodo, entorno);

    default:
      error(nodo, `No sé evaluar el nodo: ${nodo.tipo}`);
  }
}

// Evalúa una operación binaria con las reglas de tipos.
function evaluarBinaria(nodo, entorno) {
  const { operador } = nodo;

  // && y || con cortocircuito: no evalúan la derecha si la izquierda decide.
  if (operador === '&&') {
    const izquierda = evaluarExpresion(nodo.izquierda, entorno);
    if (!esVerdad(izquierda)) return false; // ya se sabe: el total es falso
    return esVerdad(evaluarExpresion(nodo.derecha, entorno));
  }
  if (operador === '||') {
    const izquierda = evaluarExpresion(nodo.izquierda, entorno);
    if (esVerdad(izquierda)) return true; // ya se sabe: el total es verdadero
    return esVerdad(evaluarExpresion(nodo.derecha, entorno));
  }

  // El resto de operadores evalúa ambos lados.
  const izquierda = evaluarExpresion(nodo.izquierda, entorno);
  const derecha = evaluarExpresion(nodo.derecha, entorno);

  // == y != comparan sin convertir tipos (5 == "5" es iie).
  if (operador === '==') return izquierda === derecha;
  if (operador === '!=') return izquierda !== derecha;

  // Comparaciones < > <= >= solo entre dos números o dos cadenas.
  if (['<', '>', '<=', '>='].includes(operador)) {
    const ambosNumeros = typeof izquierda === 'number' && typeof derecha === 'number';
    const ambasCadenas = typeof izquierda === 'string' && typeof derecha === 'string';
    if (!ambosNumeros && !ambasCadenas) {
      error(nodo, `No se puede comparar ${tipoDe(izquierda)} ${operador} ${tipoDe(derecha)}`);
    }
    switch (operador) {
      case '<': return izquierda < derecha;
      case '>': return izquierda > derecha;
      case '<=': return izquierda <= derecha;
      case '>=': return izquierda >= derecha;
    }
  }

  // + concatena si alguno de los dos es cadena; el otro se convierte a texto.
  if (operador === '+') {
    if (typeof izquierda === 'string' || typeof derecha === 'string') {
      return aTextoValor(izquierda) + aTextoValor(derecha);
    }
    if (typeof izquierda === 'number' && typeof derecha === 'number') {
      return izquierda + derecha;
    }
    error(nodo, `No se puede sumar ${tipoDe(izquierda)} + ${tipoDe(derecha)}`);
  }

  // - * / % solo con números.
  if (['-', '*', '/', '%'].includes(operador)) {
    if (typeof izquierda !== 'number' || typeof derecha !== 'number') {
      error(nodo, `No se puede operar ${tipoDe(izquierda)} ${operador} ${tipoDe(derecha)}`);
    }
    if ((operador === '/' || operador === '%') && derecha === 0) {
      error(nodo, `División entre cero (${izquierda} ${operador} 0)`);
    }
    switch (operador) {
      case '-': return izquierda - derecha;
      case '*': return izquierda * derecha;
      case '/': return izquierda / derecha;
      case '%': return izquierda % derecha;
    }
  }

  error(nodo, `Operador desconocido: ${operador}`);
}

// Evalúa una operación unaria.
function evaluarUnaria(nodo, entorno) {
  const valor = evaluarExpresion(nodo.operando, entorno);
  if (nodo.operador === '-') {
    // - solo con números.
    if (typeof valor !== 'number') {
      error(nodo, `No se puede negar ${tipoDe(valor)}: '-' solo funciona con números`);
    }
    return -valor;
  }
  if (nodo.operador === '!') {
    // ! con cualquier valor, usando la regla de verdad.
    return !esVerdad(valor);
  }
  error(nodo, `Operador unario desconocido: ${nodo.operador}`);
}

// Evalúa un acceso por índice: expresion[indice].
function evaluarIndice(nodo, entorno) {
  const coleccion = evaluarExpresion(nodo.expresion, entorno);
  const indice = evaluarExpresion(nodo.indice, entorno);

  // Indexar una cadena devuelve el carácter en esa posición (solo lectura).
  if (typeof coleccion === 'string') {
    if (!esIndiceValido(indice, coleccion.length)) {
      errorIndice(nodo, indice, coleccion.length, 'cadena');
    }
    return coleccion[indice];
  }

  // Indexar una lista devuelve el elemento.
  if (Array.isArray(coleccion)) {
    if (!esIndiceValido(indice, coleccion.length)) {
      errorIndice(nodo, indice, coleccion.length, 'lista');
    }
    return coleccion[indice];
  }

  error(nodo, `No se puede indexar un valor de tipo ${tipoDe(coleccion)}`);
}

// ¿Es un índice entero dentro de 0..longitud-1?
function esIndiceValido(indice, longitud) {
  return typeof indice === 'number' && Number.isInteger(indice) && indice >= 0 && indice < longitud;
}

// Lanza el error de índice con el índice y la longitud.
function errorIndice(nodo, indice, longitud, tipoColeccion) {
  if (typeof indice !== 'number' || !Number.isInteger(indice)) {
    error(nodo, `El índice de una ${tipoColeccion} debe ser un número entero`);
  }
  error(nodo, `Índice ${indice} fuera de rango en la ${tipoColeccion} (longitud ${longitud})`);
}

// ============================================================
// LLAMADAS Y FUNCIONES
// ============================================================

// Evalúa una llamada: callee(argumentos).
function evaluarLlamada(nodo, entorno) {
  const callee = evaluarExpresion(nodo.callee, entorno);
  const argumentos = nodo.argumentos.map((a) => evaluarExpresion(a, entorno));

  // Función integrada (nativa de JS).
  if (callee instanceof FuncionIntegrada) {
    callee.validarArity(nodo, argumentos);
    return callee.llamar(nodo, argumentos);
  }

  // Función jutsu definida por el usuario.
  if (callee instanceof FuncionOtaku) {
    return llamarFuncion(nodo, callee, argumentos);
  }

  // Llamar algo que no es función.
  error(nodo, `No se puede llamar a un valor de tipo ${tipoDe(callee)}: no es una función`);
}

// Ejecuta una función jutsu con sus argumentos.
function llamarFuncion(nodo, funcion, argumentos) {
  // Número de argumentos distinto al de parámetros: ErrorEjecucion.
  if (argumentos.length !== funcion.parametros.length) {
    error(
      nodo,
      `La función '${funcion.nombre}' esperaba ${funcion.parametros.length} ` +
        `argumento(s) pero llegaron ${argumentos.length}`
    );
  }

  // La llamada crea un entorno cuyo padre es el entorno de DEFINICIÓN
  // de la función (ámbito léxico), no el de quien llama.
  const entornoFuncion = new Environment(funcion.entornoDefinicion);

  // Declara los parámetros en el nuevo entorno.
  funcion.parametros.forEach((nombre, i) => {
    entornoFuncion.declarar(nombre, argumentos[i]);
  });

  // Ejecuta el cuerpo capturando la señal de retorno y el desbordamiento.
  try {
    ejecutarBloque(funcion.cuerpo, entornoFuncion);
    return null; // llegó al final sin kaeri: devuelve nada
  } catch (e) {
    if (e instanceof SenalRetorno) {
      return e.valor; // kaeri expr;
    }
    if (e instanceof RangeError) {
      // Desbordamiento de pila de JS: recursión demasiado profunda.
      error(nodo, 'Recursión demasiado profunda');
    }
    throw e; // cualquier otro error sube normal
  }
}

// ============================================================
// FUNCIONES INTEGRADAS
// ============================================================

// Una función integrada: envuelve una función nativa de JS.
class FuncionIntegrada {
  constructor(nombre, minArgs, maxArgs, llamar) {
    this.nombre = nombre;
    this.minArgs = minArgs;
    this.maxArgs = maxArgs; // Infinity para gritar(...)
    this.llamar = llamar; // (nodo, argumentos) => valor
  }

  // Valida la cantidad de argumentos antes de llamar.
  validarArity(nodo, argumentos) {
    if (argumentos.length < this.minArgs || argumentos.length > this.maxArgs) {
      const rango =
        this.minArgs === this.maxArgs
          ? `${this.minArgs}`
          : this.maxArgs === Infinity
            ? `al menos ${this.minArgs}`
            : `${this.minArgs} a ${this.maxArgs}`;
      error(
        nodo,
        `'${this.nombre}' esperaba ${rango} argumento(s) pero llegaron ${argumentos.length}`
      );
    }
  }
}

// Crea el entorno de integradas: es el PADRE del entorno global, así el
// usuario puede declarar "ninja poder = 9001;" sin error de redeclaración
// (su variable sombrea a la integrada en el ámbito global).
function crearEntornoIntegradas() {
  const env = new Environment(null);

  // gritar(...): imprime sus argumentos separados por espacio.
  env.declarar(
    'gritar',
    new FuncionIntegrada('gritar', 0, Infinity, (_nodo, args) => {
      salida.imprimir(args.map(aTextoValor).join(' '));
      return null;
    })
  );

  // poder(x): longitud de una lista o cadena.
  env.declarar(
    'poder',
    new FuncionIntegrada('poder', 1, 1, (nodo, args) => {
      const x = args[0];
      if (typeof x === 'string' || Array.isArray(x)) return x.length;
      error(nodo, `'poder' esperaba una lista o una cadena pero llegó ${tipoDe(x)}`);
    })
  );

  // aNumero(x): convierte a número.
  env.declarar(
    'aNumero',
    new FuncionIntegrada('aNumero', 1, 1, (nodo, args) => {
      const x = args[0];
      if (typeof x === 'number') return x;
      if (x === true) return 1;
      if (x === false) return 0;
      if (typeof x === 'string') {
        const n = Number(x.trim());
        if (!Number.isNaN(n)) return n;
        error(nodo, `No se puede convertir a número la cadena "${x}"`);
      }
      error(nodo, `'aNumero' no puede convertir ${tipoDe(x)} a número`);
    })
  );

  // aTexto(x): convierte cualquier valor a texto con aTextoValor.
  env.declarar(
    'aTexto',
    new FuncionIntegrada('aTexto', 1, 1, (_nodo, args) => aTextoValor(args[0]))
  );

  // agregar(lista, x): añade x al final de la lista (por referencia).
  env.declarar(
    'agregar',
    new FuncionIntegrada('agregar', 2, 2, (nodo, args) => {
      const [lista, x] = args;
      if (!Array.isArray(lista)) {
        error(nodo, `'agregar' esperaba una lista pero llegó ${tipoDe(lista)}`);
      }
      lista.push(x);
      return null;
    })
  );

  return env;
}

// ============================================================
// SENTENCIAS
// ============================================================

// Ejecuta una sentencia en el entorno dado.
function ejecutarSentencia(nodo, entorno) {
  switch (nodo.tipo) {
    // ninja x = expr;  → declara en el ámbito ACTUAL.
    case 'Declaracion': {
      const valor = nodo.valor ? evaluarExpresion(nodo.valor, entorno) : null;
      if (!entorno.declarar(nodo.nombre, valor)) {
        error(nodo, `Variable '${nodo.nombre}' ya declarada en este ámbito`);
      }
      return null;
    }

    // x = expr;  → busca hacia los padres y modifica la primera que encuentre.
    case 'Asignacion': {
      const valor = evaluarExpresion(nodo.valor, entorno);
      if (nodo.destino.tipo === 'Variable') {
        if (!entorno.asignar(nodo.destino.nombre, valor)) {
          error(nodo, `Variable no definida: '${nodo.destino.nombre}'`);
        }
      } else if (nodo.destino.tipo === 'Indice') {
        // Asignación a posición de lista: l[0] = 9;
        asignarIndice(nodo.destino, valor, entorno);
      } else {
        error(nodo, 'Destino de asignación no válido');
      }
      return null;
    }

    // nani (cond) {..} baka {..}  → regla de verdad; bakaRama puede ser
    // otro Condicional (baka nani) o un Bloque.
    case 'Condicional': {
      const condicion = evaluarExpresion(nodo.condicion, entorno);
      if (esVerdad(condicion)) {
        ejecutarBloque(nodo.ramaEntonces, entorno);
      } else if (nodo.bakaRama) {
        ejecutarSentencia(nodo.bakaRama, entorno);
      }
      return null;
    }

    // kamehameha (cond) {..}  → evalúa la condición antes de cada vuelta.
    case 'Mientras': {
      while (esVerdad(evaluarExpresion(nodo.condicion, entorno))) {
        ejecutarBloque(nodo.cuerpo, entorno);
      }
      return null;
    }

    // entrenar (ninja i = 0; i < 3; i = i + 1) {..}
    // La variable del inicio vive solo dentro del ciclo: ámbito propio.
    case 'Para': {
      const entornoCiclo = new Environment(entorno); // ámbito propio del for
      ejecutarSentencia(nodo.inicial, entornoCiclo);
      while (esVerdad(evaluarExpresion(nodo.condicion, entornoCiclo))) {
        ejecutarBloque(nodo.cuerpo, entornoCiclo);
        ejecutarSentencia(nodo.incremento, entornoCiclo);
      }
      return null;
    }

    // jutsu nombre(a, b) { ... }  → crea el valor función (con su cierre
    // léxico) y lo declara en el ámbito actual.
    case 'Funcion': {
      const funcion = new FuncionOtaku(nodo.nombre, nodo.parametros, nodo.cuerpo, entorno);
      if (!entorno.declarar(nodo.nombre, funcion)) {
        error(nodo, `Función '${nodo.nombre}' ya declarada en este ámbito`);
      }
      return null;
    }

    // kaeri expr;  → señal que sube hasta la función que la contiene.
    case 'Retorno': {
      const valor = nodo.valor ? evaluarExpresion(nodo.valor, entorno) : null;
      throw new SenalRetorno(valor, nodo.linea, nodo.columna);
    }

    // expresion;  → se evalúa y se descarta el resultado.
    case 'ExprSentencia': {
      evaluarExpresion(nodo.expresion, entorno);
      return null;
    }

    // { sentencias }  → cada bloque crea un ámbito nuevo.
    case 'Bloque': {
      ejecutarBloque(nodo, entorno);
      return null;
    }

    default:
      error(nodo, `Sentencia no implementada: ${nodo.tipo}`);
  }
}

// Ejecuta un bloque creando un ámbito nuevo cuyo padre es el actual.
function ejecutarBloque(bloque, entorno) {
  const entornoBloque = new Environment(entorno);
  for (const sentencia of bloque.sentencias) {
    ejecutarSentencia(sentencia, entornoBloque);
  }
}

// Asigna a una posición de lista: l[0] = valor; (soporta l[0][1] = ...)
function asignarIndice(destino, valor, entorno) {
  // Obtiene la colección donde hay que escribir.
  const coleccion = evaluarExpresion(destino.expresion, entorno);
  const indice = evaluarExpresion(destino.indice, entorno);

  if (!Array.isArray(coleccion)) {
    error(destino, `No se puede indexar un valor de tipo ${tipoDe(coleccion)}`);
  }
  if (!esIndiceValido(indice, coleccion.length)) {
    errorIndice(destino, indice, coleccion.length, 'lista');
  }
  coleccion[indice] = valor;
}

// ============================================================
// PROGRAMA
// ============================================================

// Crea el entorno global (hijo del entorno de integradas).
export function crearEntornoGlobal() {
  return new Environment(crearEntornoIntegradas());
}

// Ejecuta un programa completo en el entorno global dado.
// Devuelve el valor de la última sentencia de expresión (útil para el REPL).
export function evaluarPrograma(programa, entorno) {
  let resultado = null;
  let dentroDeFuncion = false; // para detectar kaeri fuera de función

  // El kaeri global no debe ser una SenalRetorno que escape: se detecta
  // envolviendo la ejecución. Si una SenalRetorno llega hasta aquí,
  // el kaeri estaba fuera de una función.
  try {
    for (const sentencia of programa.sentencias) {
      if (sentencia.tipo === 'ExprSentencia') {
        resultado = evaluarExpresion(sentencia.expresion, entorno);
      } else {
        ejecutarSentencia(sentencia, entorno);
      }
    }
    return resultado;
  } catch (e) {
    if (e instanceof SenalRetorno) {
      // kaeri fuera de una función: la señal llegó al nivel del programa.
      error(
        { linea: e.linea, columna: e.columna },
        "'kaeri' solo se puede usar dentro de una función"
      );
    }
    throw e;
  }
}
