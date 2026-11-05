// AST de OtakuLang: los nodos que produce el parser.
// Cada nodo guarda su línea y columna para poder reportar errores de ejecución.

// --- Nodos de programa y sentencias ---

// Programa completo: lista de sentencias.
function Programa(sentencias) {
  return { tipo: 'Programa', sentencias };
}

// Declaración de variable: ninja x = expresion;
function Declaracion(nombre, valor, linea, columna) {
  return { tipo: 'Declaracion', nombre, valor, linea, columna };
}

// Asignación: destino = expresion;  (destino: variable o posición de lista)
function Asignacion(destino, valor, linea, columna) {
  return { tipo: 'Asignacion', destino, valor, linea, columna };
}

// Condicional: nani (cond) {..} baka {..}  (bakaRama puede ser null)
function Condicional(condicion, ramaEntonces, bakaRama, linea, columna) {
  return { tipo: 'Condicional', condicion, ramaEntonces, bakaRama, linea, columna };
}

// Ciclo while: kamehameha (cond) {..}
function Mientras(condicion, cuerpo, linea, columna) {
  return { tipo: 'Mientras', condicion, cuerpo, linea, columna };
}

// Ciclo for: entrenar (inicial; cond; incremento) {..}
function Para(inicial, condicion, incremento, cuerpo, linea, columna) {
  return { tipo: 'Para', inicial, condicion, incremento, cuerpo, linea, columna };
}

// Declaración de función: jutsu nombre(params) {..}
function Funcion(nombre, parametros, cuerpo, linea, columna) {
  return { tipo: 'Funcion', nombre, parametros, cuerpo, linea, columna };
}

// Retorno: kaeri expresion;  (expresion puede ser null)
function Retorno(valor, linea, columna) {
  return { tipo: 'Retorno', valor, linea, columna };
}

// Sentencia de expresión: expresion;
function ExprSentencia(expresion, linea, columna) {
  return { tipo: 'ExprSentencia', expresion, linea, columna };
}

// Bloque: { sentencias }
function Bloque(sentencias, linea, columna) {
  return { tipo: 'Bloque', sentencias, linea, columna };
}

// --- Nodos de expresiones ---

// Operación binaria: izquierda operador derecha
function OpBinaria(operador, izquierda, derecha, linea, columna) {
  return { tipo: 'OpBinaria', operador, izquierda, derecha, linea, columna };
}

// Operación unaria: operador operando
function OpUnaria(operador, operando, linea, columna) {
  return { tipo: 'OpUnaria', operador, operando, linea, columna };
}

// Llamada a función: callee(argumentos)
function Llamada(callee, argumentos, linea, columna) {
  return { tipo: 'Llamada', callee, argumentos, linea, columna };
}

// Acceso por índice: expresion[indice]
function Indice(expresion, indice, linea, columna) {
  return { tipo: 'Indice', expresion, indice, linea, columna };
}

// Literales y variables
function Numero(valor, linea, columna) {
  return { tipo: 'Numero', valor, linea, columna };
}

function Cadena(valor, linea, columna) {
  return { tipo: 'Cadena', valor, linea, columna };
}

function Booleano(valor, linea, columna) {
  return { tipo: 'Booleano', valor, linea, columna };
}

function Nulo(linea, columna) {
  return { tipo: 'Nulo', linea, columna };
}

function Variable(nombre, linea, columna) {
  return { tipo: 'Variable', nombre, linea, columna };
}

// Lista literal: [a, b, c]
function ListaLiteral(elementos, linea, columna) {
  return { tipo: 'ListaLiteral', elementos, linea, columna };
}

// --- imprimirAST: muestra el árbol con sangría ---

// Convierte un valor simple a texto para imprimirlo.
function aTexto(valor) {
  if (typeof valor === 'string') return `"${valor}"`;
  return String(valor);
}

// Imprime un nodo y sus hijos con sangría creciente.
function imprimirAST(nodo, sangria = '') {
  switch (nodo.tipo) {
    case 'Programa':
      console.log(`${sangria}Programa`);
      nodo.sentencias.forEach((s) => imprimirAST(s, sangria + '  '));
      break;
    case 'Declaracion':
      console.log(`${sangria}Declaracion ninja ${nodo.nombre}`);
      imprimirAST(nodo.valor, sangria + '  ');
      break;
    case 'Asignacion':
      console.log(`${sangria}Asignacion`);
      console.log(`${sangria}  Destino:`);
      imprimirAST(nodo.destino, sangria + '    ');
      console.log(`${sangria}  Valor:`);
      imprimirAST(nodo.valor, sangria + '    ');
      break;
    case 'Condicional':
      console.log(`${sangria}Condicional nani`);
      console.log(`${sangria}  Condición:`);
      imprimirAST(nodo.condicion, sangria + '    ');
      console.log(`${sangria}  Entonces:`);
      imprimirAST(nodo.ramaEntonces, sangria + '    ');
      if (nodo.bakaRama) {
        console.log(`${sangria}  Sino:`);
        imprimirAST(nodo.bakaRama, sangria + '    ');
      }
      break;
    case 'Mientras':
      console.log(`${sangria}Mientras kamehameha`);
      console.log(`${sangria}  Condición:`);
      imprimirAST(nodo.condicion, sangria + '    ');
      console.log(`${sangria}  Cuerpo:`);
      imprimirAST(nodo.cuerpo, sangria + '    ');
      break;
    case 'Para':
      console.log(`${sangria}Para entrenar`);
      console.log(`${sangria}  Inicial:`);
      imprimirAST(nodo.inicial, sangria + '    ');
      console.log(`${sangria}  Condición:`);
      imprimirAST(nodo.condicion, sangria + '    ');
      console.log(`${sangria}  Incremento:`);
      imprimirAST(nodo.incremento, sangria + '    ');
      console.log(`${sangria}  Cuerpo:`);
      imprimirAST(nodo.cuerpo, sangria + '    ');
      break;
    case 'Funcion':
      console.log(`${sangria}Funcion jutsu ${nodo.nombre}(${nodo.parametros.join(', ')})`);
      console.log(`${sangria}  Cuerpo:`);
      imprimirAST(nodo.cuerpo, sangria + '    ');
      break;
    case 'Retorno':
      console.log(`${sangria}Retorno kaeri`);
      if (nodo.valor) imprimirAST(nodo.valor, sangria + '  ');
      break;
    case 'ExprSentencia':
      console.log(`${sangria}ExprSentencia`);
      imprimirAST(nodo.expresion, sangria + '  ');
      break;
    case 'Bloque':
      console.log(`${sangria}Bloque`);
      nodo.sentencias.forEach((s) => imprimirAST(s, sangria + '  '));
      break;
    case 'OpBinaria':
      console.log(`${sangria}OpBinaria ${nodo.operador}`);
      imprimirAST(nodo.izquierda, sangria + '  ');
      imprimirAST(nodo.derecha, sangria + '  ');
      break;
    case 'OpUnaria':
      console.log(`${sangria}OpUnaria ${nodo.operador}`);
      imprimirAST(nodo.operando, sangria + '  ');
      break;
    case 'Llamada':
      console.log(`${sangria}Llamada`);
      console.log(`${sangria}  Función:`);
      imprimirAST(nodo.callee, sangria + '    ');
      console.log(`${sangria}  Argumentos:`);
      nodo.argumentos.forEach((a) => imprimirAST(a, sangria + '    '));
      break;
    case 'Indice':
      console.log(`${sangria}Indice`);
      console.log(`${sangria}  Colección:`);
      imprimirAST(nodo.expresion, sangria + '    ');
      console.log(`${sangria}  Índice:`);
      imprimirAST(nodo.indice, sangria + '    ');
      break;
    case 'Numero':
    case 'Cadena':
      console.log(`${sangria}${nodo.tipo} ${aTexto(nodo.valor)}`);
      break;
    case 'Booleano':
      console.log(`${sangria}Booleano ${nodo.valor ? 'hai' : 'iie'}`);
      break;
    case 'Nulo':
      console.log(`${sangria}Nulo nada`);
      break;
    case 'Variable':
      console.log(`${sangria}Variable ${nodo.nombre}`);
      break;
    case 'ListaLiteral':
      console.log(`${sangria}ListaLiteral`);
      nodo.elementos.forEach((e) => imprimirAST(e, sangria + '  '));
      break;
    default:
      console.log(`${sangria}Nodo desconocido: ${nodo.tipo}`);
  }
}

export {
  Programa,
  Declaracion,
  Asignacion,
  Condicional,
  Mientras,
  Para,
  Funcion,
  Retorno,
  ExprSentencia,
  Bloque,
  OpBinaria,
  OpUnaria,
  Llamada,
  Indice,
  Numero,
  Cadena,
  Booleano,
  Nulo,
  Variable,
  ListaLiteral,
  imprimirAST,
};
