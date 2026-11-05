// Parser de OtakuLang: descendente recursivo, una función por regla de la EBNF.
//
//   tokens ──parser──▶ AST
//
// Gramática (EBNF) que implementa este archivo:
//   programa     = { sentencia } ;
//   sentencia    = declaracion | asignacion | condicional | mientras
//                | para | funcion | retorno | exprSentencia | bloque ;
//   declaracion  = "ninja" IDENT [ "=" expresion ] ";" ;
//   asignacion   = destino "=" expresion ";" ;
//   destino      = IDENT { "[" expresion "]" } ;
//   condicional  = "nani" "(" expresion ")" bloque [ "baka" ( condicional | bloque ) ] ;
//   mientras     = "kamehameha" "(" expresion ")" bloque ;
//   para         = "entrenar" "(" declaracion expresion ";" destino "=" expresion ")" bloque ;
//   funcion      = "jutsu" IDENT "(" [ parametros ] ")" bloque ;
//   parametros   = IDENT { "," IDENT } ;
//   retorno      = "kaeri" [ expresion ] ";" ;
//   exprSentencia= expresion ";" ;
//   bloque       = "{" { sentencia } "}" ;
//   expresion    = o ;
//   o            = y { "||" y } ;
//   y            = igualdad { "&&" igualdad } ;
//   igualdad     = comparacion { ( "==" | "!=" ) comparacion } ;
//   comparacion  = suma { ( "<" | ">" | "<=" | ">=" ) suma } ;
//   suma         = producto { ( "+" | "-" ) producto } ;
//   producto     = unario { ( "*" | "/" | "%" ) unario } ;
//   unario       = ( "-" | "!" ) unario | llamada ;
//   llamada      = primario { "(" [ argumentos ] ")" | "[" expresion "]" } ;
//   primario     = NUMERO | CADENA | "hai" | "iie" | "nada" | IDENT
//                | "(" expresion ")" | "[" [ argumentos ] "]" ;
//   argumentos   = expresion { "," expresion } ;

import { ErrorSintactico } from './errors.js';
import { Lexer } from './lexer.js';
import * as ast from './ast.js';

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0; // posición del token actual
  }

  // --- Utilidades básicas ---

  // Token actual sin avanzar.
  actual() {
    return this.tokens[this.pos];
  }

  // Mira el token en pos + n sin avanzar.
  mirar(n) {
    return this.tokens[this.pos + n] ?? this.tokens[this.tokens.length - 1];
  }

  // Avanza y devuelve el token que se consumió.
  avanzar() {
    const token = this.tokens[this.pos];
    if (token.tipo !== 'EOF') this.pos++;
    return token;
  }

  // Comprueba que el token actual sea del tipo dado (sin avanzar).
  es(tipo) {
    return this.actual().tipo === tipo;
  }

  // Si el token actual es del tipo dado, lo consume y devuelve true.
  coincidir(tipo) {
    if (this.es(tipo)) {
      this.avanzar();
      return true;
    }
    return false;
  }

  // Exige un token del tipo dado o lanza ErrorSintactico con línea y columna.
  exigir(tipo, mensaje) {
    if (this.es(tipo)) return this.avanzar();
    const t = this.actual();
    throw new ErrorSintactico(mensaje, t.linea, t.columna);
  }

  // Descripción del token actual para los mensajes de error.
  descripcionActual() {
    const t = this.actual();
    return t.tipo === 'EOF' ? 'fin del archivo' : `'${t.literal}'`;
  }

  // --- programa = { sentencia } ; ---

  parsearPrograma() {
    const sentencias = [];
    while (!this.es('EOF')) {
      sentencias.push(this.sentencia());
    }
    return ast.Programa(sentencias);
  }

  // --- sentencia = declaracion | asignacion | condicional | mientras
  //              | para | funcion | retorno | exprSentencia | bloque ; ---

  sentencia() {
    const t = this.actual();
    switch (t.tipo) {
      case 'NINJA':
        return this.declaracion();
      case 'NANI':
        return this.condicional();
      case 'KAMEHAMEHA':
        return this.mientras();
      case 'ENTRENAR':
        return this.para();
      case 'JUTSU':
        return this.funcion();
      case 'KAERI':
        return this.retorno();
      case '{':
        return this.bloque();
      case 'IDENT': {
        // Puede ser asignación (si tras el destino viene '=') o una expresión.
        if (this.esAsignacion()) {
          return this.asignacion();
        }
        return this.exprSentencia();
      }
      default:
        return this.exprSentencia();
    }
  }

  // Decide si lo que sigue es una asignación: IDENT { "[" expresion "]" } "="
  // Se usa para distinguir "x = 5;" de una expresión como "x + 5;".
  esAsignacion() {
    let i = 1; // 0 es el IDENT actual
    while (this.mirar(i).tipo === '[') {
      // Salta el corchete, la expresión del índice y el corchete de cierre.
      // Para decidir basta mirar si tras los índices viene '='.
      i++;
      let nivel = 1;
      while (nivel > 0) {
        const tipo = this.mirar(i).tipo;
        if (tipo === '[') nivel++;
        else if (tipo === ']') nivel--;
        else if (tipo === 'EOF' || tipo === ';') return false;
        i++;
      }
    }
    return this.mirar(i).tipo === '=';
  }

  // --- declaracion = "ninja" IDENT [ "=" expresion ] ";" ; ---

  declaracion() {
    const t = this.exigir('NINJA', "Se esperaba 'ninja'");
    const nombre = this.exigir('IDENT', 'Se esperaba un nombre de variable');
    let valor = ast.Nulo(t.linea, t.columna);
    if (this.coincidir('=')) {
      valor = this.expresion();
    }
    this.exigir(';', "Se esperaba ';' después de la declaración");
    return ast.Declaracion(nombre.literal, valor, t.linea, t.columna);
  }

  // --- asignacion = destino "=" expresion ";" ; ---
  // --- destino = IDENT { "[" expresion "]" } ; ---

  asignacion() {
    const t = this.actual();
    let destino = ast.Variable(t.literal, t.linea, t.columna);
    this.avanzar(); // consume el IDENT
    // Índices del destino: lista[0] = ... o matriz[0][1] = ...
    while (this.es('[')) {
      this.avanzar();
      const indice = this.expresion();
      this.exigir(']', "Se esperaba ']' después del índice");
      destino = ast.Indice(destino, indice, t.linea, t.columna);
    }
    this.exigir('=', "Se esperaba '=' en la asignación");
    const valor = this.expresion();
    this.exigir(';', "Se esperaba ';' después de la expresión");
    return ast.Asignacion(destino, valor, t.linea, t.columna);
  }

  // Igual que asignacion() pero sin exigir ';' al final.
  // Se usa en el incremento del "entrenar", que la gramática cierra con ')'.
  asignacionSinPuntoYComa() {
    const t = this.actual();
    let destino = ast.Variable(t.literal, t.linea, t.columna);
    this.avanzar(); // consume el IDENT
    while (this.es('[')) {
      this.avanzar();
      const indice = this.expresion();
      this.exigir(']', "Se esperaba ']' después del índice");
      destino = ast.Indice(destino, indice, t.linea, t.columna);
    }
    this.exigir('=', "Se esperaba '=' en la asignación");
    const valor = this.expresion();
    return ast.Asignacion(destino, valor, t.linea, t.columna);
  }

  // --- condicional = "nani" "(" expresion ")" bloque [ "baka" ( condicional | bloque ) ] ; ---

  condicional() {
    const t = this.exigir('NANI', "Se esperaba 'nani'");
    this.exigir('(', "Se esperaba '(' después de 'nani'");
    const condicion = this.expresion();
    this.exigir(')', "Se esperaba ')' después de la condición");
    const ramaEntonces = this.bloque();
    let bakaRama = null;
    if (this.coincidir('BAKA')) {
      // baka puede ir seguido de otro nani (else if) o de un bloque (else).
      if (this.es('NANI')) {
        bakaRama = this.condicional();
      } else {
        bakaRama = this.bloque();
      }
    }
    return ast.Condicional(condicion, ramaEntonces, bakaRama, t.linea, t.columna);
  }

  // --- mientras = "kamehameha" "(" expresion ")" bloque ; ---

  mientras() {
    const t = this.exigir('KAMEHAMEHA', "Se esperaba 'kamehameha'");
    this.exigir('(', "Se esperaba '(' después de 'kamehameha'");
    const condicion = this.expresion();
    this.exigir(')', "Se esperaba ')' después de la condición");
    const cuerpo = this.bloque();
    return ast.Mientras(condicion, cuerpo, t.linea, t.columna);
  }

  // --- para = "entrenar" "(" declaracion expresion ";" destino "=" expresion ")" bloque ; ---

  para() {
    const t = this.exigir('ENTRENAR', "Se esperaba 'entrenar'");
    this.exigir('(', "Se esperaba '(' después de 'entrenar'");
    const inicial = this.declaracion(); // incluye su ';'
    const condicion = this.expresion();
    this.exigir(';', "Se esperaba ';' después de la condición del 'entrenar'");
    // El incremento es "destino = expresion" SIN ';' (la gramática cierra con ')').
    const incremento = this.asignacionSinPuntoYComa();
    this.exigir(')', "Se esperaba ')' después del incremento del 'entrenar'");
    const cuerpo = this.bloque();
    return ast.Para(inicial, condicion, incremento, cuerpo, t.linea, t.columna);
  }

  // --- funcion = "jutsu" IDENT "(" [ parametros ] ")" bloque ; ---

  funcion() {
    const t = this.exigir('JUTSU', "Se esperaba 'jutsu'");
    const nombre = this.exigir('IDENT', 'Se esperaba un nombre de función');
    this.exigir('(', "Se esperaba '(' después del nombre de la función");
    const parametros = [];
    if (!this.es(')')) {
      parametros.push(this.exigir('IDENT', 'Se esperaba un nombre de parámetro').literal);
      while (this.coincidir(',')) {
        parametros.push(this.exigir('IDENT', 'Se esperaba un nombre de parámetro').literal);
      }
    }
    this.exigir(')', "Se esperaba ')' después de los parámetros");
    const cuerpo = this.bloque();
    return ast.Funcion(nombre.literal, parametros, cuerpo, t.linea, t.columna);
  }

  // --- retorno = "kaeri" [ expresion ] ";" ; ---

  retorno() {
    const t = this.exigir('KAERI', "Se esperaba 'kaeri'");
    let valor = null;
    if (!this.es(';')) {
      valor = this.expresion();
    }
    this.exigir(';', "Se esperaba ';' después del 'kaeri'");
    return ast.Retorno(valor, t.linea, t.columna);
  }

  // --- exprSentencia = expresion ";" ; ---

  exprSentencia() {
    const t = this.actual();
    const expresion = this.expresion();
    this.exigir(';', "Se esperaba ';' después de la expresión");
    return ast.ExprSentencia(expresion, t.linea, t.columna);
  }

  // --- bloque = "{" { sentencia } "}" ; ---

  bloque() {
    const t = this.exigir('{', "Se esperaba '{' para abrir un bloque");
    const sentencias = [];
    while (!this.es('}') && !this.es('EOF')) {
      sentencias.push(this.sentencia());
    }
    this.exigir('}', "Se esperaba '}' para cerrar el bloque");
    return ast.Bloque(sentencias, t.linea, t.columna);
  }

  // --- Reglas de expresiones (precedencia de menor a mayor) ---

  // expresion = o ;
  expresion() {
    return this.o();
  }

  // o = y { "||" y } ;
  o() {
    let izquierda = this.y();
    while (this.es('||')) {
      const t = this.avanzar();
      const derecha = this.y();
      izquierda = ast.OpBinaria('||', izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // y = igualdad { "&&" igualdad } ;
  y() {
    let izquierda = this.igualdad();
    while (this.es('&&')) {
      const t = this.avanzar();
      const derecha = this.igualdad();
      izquierda = ast.OpBinaria('&&', izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // igualdad = comparacion { ( "==" | "!=" ) comparacion } ;
  igualdad() {
    let izquierda = this.comparacion();
    while (this.es('==') || this.es('!=')) {
      const t = this.avanzar();
      const derecha = this.comparacion();
      izquierda = ast.OpBinaria(t.tipo, izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // comparacion = suma { ( "<" | ">" | "<=" | ">=" ) suma } ;
  comparacion() {
    let izquierda = this.suma();
    while (['<', '>', '<=', '>='].includes(this.actual().tipo)) {
      const t = this.avanzar();
      const derecha = this.suma();
      izquierda = ast.OpBinaria(t.tipo, izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // suma = producto { ( "+" | "-" ) producto } ;
  suma() {
    let izquierda = this.producto();
    while (this.es('+') || this.es('-')) {
      const t = this.avanzar();
      const derecha = this.producto();
      izquierda = ast.OpBinaria(t.tipo, izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // producto = unario { ( "*" | "/" | "%" ) unario } ;
  producto() {
    let izquierda = this.unario();
    while (['*', '/', '%'].includes(this.actual().tipo)) {
      const t = this.avanzar();
      const derecha = this.unario();
      izquierda = ast.OpBinaria(t.tipo, izquierda, derecha, t.linea, t.columna);
    }
    return izquierda;
  }

  // unario = ( "-" | "!" ) unario | llamada ;
  unario() {
    if (this.es('-') || this.es('!')) {
      const t = this.avanzar();
      const operando = this.unario();
      return ast.OpUnaria(t.tipo, operando, t.linea, t.columna);
    }
    return this.llamada();
  }

  // llamada = primario { "(" [ argumentos ] ")" | "[" expresion "]" } ;
  llamada() {
    let expresion = this.primario();
    while (true) {
      if (this.es('(')) {
        const t = this.avanzar();
        const argumentos = [];
        if (!this.es(')')) {
          argumentos.push(this.expresion());
          while (this.coincidir(',')) {
            argumentos.push(this.expresion());
          }
        }
        this.exigir(')', "Se esperaba ')' después de los argumentos");
        expresion = ast.Llamada(expresion, argumentos, t.linea, t.columna);
      } else if (this.es('[')) {
        const t = this.avanzar();
        const indice = this.expresion();
        this.exigir(']', "Se esperaba ']' después del índice");
        expresion = ast.Indice(expresion, indice, t.linea, t.columna);
      } else {
        break;
      }
    }
    return expresion;
  }

  // primario = NUMERO | CADENA | "hai" | "iie" | "nada" | IDENT
  //          | "(" expresion ")" | "[" [ argumentos ] "]" ;
  primario() {
    const t = this.actual();
    switch (t.tipo) {
      case 'NUMERO':
        this.avanzar();
        return ast.Numero(t.valor, t.linea, t.columna);
      case 'CADENA':
        this.avanzar();
        return ast.Cadena(t.valor, t.linea, t.columna);
      case 'HAI':
        this.avanzar();
        return ast.Booleano(true, t.linea, t.columna);
      case 'IIE':
        this.avanzar();
        return ast.Booleano(false, t.linea, t.columna);
      case 'NADA':
        this.avanzar();
        return ast.Nulo(t.linea, t.columna);
      case 'IDENT':
        this.avanzar();
        return ast.Variable(t.literal, t.linea, t.columna);
      case '(': {
        this.avanzar();
        const expresion = this.expresion();
        this.exigir(')', "Se esperaba ')' después de la expresión");
        return expresion;
      }
      case '[': {
        this.avanzar();
        const elementos = [];
        if (!this.es(']')) {
          elementos.push(this.expresion());
          while (this.coincidir(',')) {
            elementos.push(this.expresion());
          }
        }
        this.exigir(']', "Se esperaba ']' después de los elementos de la lista");
        return ast.ListaLiteral(elementos, t.linea, t.columna);
      }
      default:
        throw new ErrorSintactico(
          `Se esperaba una expresión pero se encontró ${this.descripcionActual()}`,
          t.linea,
          t.columna
        );
    }
  }
}

// Comodidad: tokeniza y parsea un programa completo en un solo paso.
function parsear(codigo) {
  return new Parser(new Lexer(codigo).tokenizar()).parsearPrograma();
}

export { Parser, parsear };
