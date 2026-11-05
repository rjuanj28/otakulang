// Lexer de OtakuLang: convierte el código fuente en una lista de tokens.
//
//   código fuente ──lexer──▶ tokens ──parser──▶ AST ──evaluador──▶ resultado
//
// Tokens reconocidos (según la especificación):
//   NUMERO   dígitos con parte decimal opcional (5, 3.14)
//   CADENA   texto entre comillas dobles
//   IDENT    letra o _ seguida de letras, dígitos o _
//   Comentarios: # hasta el final de la línea (se ignoran)
//   Operadores: + - * / % == != < > <= >= && || ! =
//   Delimitadores: ( ) { } [ ] , ;

import { ErrorLexico } from './errors.js';
import { buscarPalabraClave } from './keywords.js';

// Caracteres que pueden iniciar o formar un identificador.
function esLetra(c) {
  return /[A-Za-z_]/.test(c);
}

function esDigito(c) {
  return /[0-9]/.test(c);
}

class Lexer {
  constructor(entrada) {
    this.entrada = entrada;
    this.pos = 0; // posición actual en la cadena
    this.linea = 1; // línea actual (empieza en 1)
    this.columna = 1; // columna actual (empieza en 1)
  }

  // Mira el carácter en la posición actual sin avanzar.
  actual() {
    return this.entrada[this.pos] ?? '';
  }

  // Mira el carácter siguiente sin avanzar.
  siguiente() {
    return this.entrada[this.pos + 1] ?? '';
  }

  // Consume un carácter y actualiza línea/columna.
  avanzar() {
    if (this.actual() === '\n') {
      this.linea++;
      this.columna = 1;
    } else {
      this.columna++;
    }
    this.pos++;
  }

  // Salta espacios, tabulaciones, saltos de línea y comentarios (# ...).
  saltarBlancos() {
    while (true) {
      const c = this.actual();
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        this.avanzar();
      } else if (c === '#') {
        // Comentario: se ignora todo hasta el final de la línea.
        while (this.actual() !== '\n' && this.actual() !== '') {
          this.avanzar();
        }
      } else {
        break;
      }
    }
  }

  // Tokeniza toda la entrada y devuelve la lista de tokens (termina con EOF).
  tokenizar() {
    const tokens = [];
    while (true) {
      const token = this.siguienteToken();
      tokens.push(token);
      if (token.tipo === 'EOF') break;
    }
    return tokens;
  }

  // Produce el siguiente token de la entrada.
  siguienteToken() {
    this.saltarBlancos();

    const linea = this.linea;
    const columna = this.columna;
    const c = this.actual();

    // Fin de la entrada.
    if (c === '') {
      return { tipo: 'EOF', literal: '', linea, columna };
    }

    // Números: dígitos con parte decimal opcional (5, 3.14).
    if (esDigito(c)) {
      return this.leerNumero(linea, columna);
    }

    // Identificadores y palabras clave.
    if (esLetra(c)) {
      return this.leerIdentificador(linea, columna);
    }

    // Cadenas entre comillas dobles.
    if (c === '"') {
      return this.leerCadena(linea, columna);
    }

    // Operadores de dos caracteres.
    const dosCaracteres = c + this.siguiente();
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(dosCaracteres)) {
      this.avanzar();
      this.avanzar();
      return { tipo: dosCaracteres, literal: dosCaracteres, linea, columna };
    }

    // Operadores de un carácter.
    if ('+-*/%<>!='.includes(c)) {
      this.avanzar();
      return { tipo: c, literal: c, linea, columna };
    }

    // Delimitadores.
    if ('(){}[],;'.includes(c)) {
      this.avanzar();
      return { tipo: c, literal: c, linea, columna };
    }

    // Cualquier otro carácter es un error léxico.
    throw new ErrorLexico(
      `Carácter no válido: '${c}'`,
      linea,
      columna
    );
  }

  // Lee un número: parte entera, y si hay un punto, parte decimal.
  leerNumero(linea, columna) {
    let texto = '';
    while (esDigito(this.actual())) {
      texto += this.actual();
      this.avanzar();
    }
    // Parte decimal opcional: un punto seguido de al menos un dígito.
    if (this.actual() === '.' && esDigito(this.siguiente())) {
      texto += '.';
      this.avanzar();
      while (esDigito(this.actual())) {
        texto += this.actual();
        this.avanzar();
      }
    }
    return { tipo: 'NUMERO', literal: texto, valor: Number(texto), linea, columna };
  }

  // Lee un identificador (o palabra clave) y decide su tipo de token.
  leerIdentificador(linea, columna) {
    let texto = '';
    while (esLetra(this.actual()) || esDigito(this.actual())) {
      texto += this.actual();
      this.avanzar();
    }
    const tipo = buscarPalabraClave(texto);
    return { tipo, literal: texto, linea, columna };
  }

  // Lee una cadena entre comillas dobles; el literal es el contenido sin comillas.
  leerCadena(linea, columna) {
    this.avanzar(); // consume la comilla de apertura
    let texto = '';
    while (true) {
      const c = this.actual();
      if (c === '"') {
        this.avanzar(); // consume la comilla de cierre
        return { tipo: 'CADENA', literal: texto, valor: texto, linea, columna };
      }
      if (c === '' || c === '\n') {
        // La cadena no se cerró antes de terminar la línea o la entrada.
        throw new ErrorLexico('Cadena sin cerrar: falta la comilla de cierre', linea, columna);
      }
      texto += c;
      this.avanzar();
    }
  }
}

export { Lexer };
