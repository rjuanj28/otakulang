// Errores del intérprete OtakuLang.
// Los tres tipos de error comparten la misma forma: tipo, mensaje, línea y columna.

// Clase base: guarda el tipo de error y dónde ocurrió.
class ErrorOtaku extends Error {
  constructor(tipo, mensaje, linea, columna) {
    super(mensaje);
    this.name = 'ErrorOtaku';
    this.tipo = tipo; // "LÉXICO", "SINTÁCTICO" o "EJECUCIÓN"
    this.mensaje = mensaje;
    this.linea = linea;
    this.columna = columna;
  }

  // Formato uniforme para mostrar el error al usuario.
  toString() {
    return `[Error ${this.tipo}] ${this.mensaje} (línea ${this.linea}, columna ${this.columna})`;
  }
}

// Error de léxico: carácter o token que el lexer no puede reconocer.
class ErrorLexico extends ErrorOtaku {
  constructor(mensaje, linea, columna) {
    super('LÉXICO', mensaje, linea, columna);
    this.name = 'ErrorLexico';
  }
}

// Error de sintaxis: secuencia de tokens que no cumple la gramática.
class ErrorSintactico extends ErrorOtaku {
  constructor(mensaje, linea, columna) {
    super('SINTÁCTICO', mensaje, linea, columna);
    this.name = 'ErrorSintactico';
  }
}

// Error de ejecución: código válido que falla al evaluarse.
class ErrorEjecucion extends ErrorOtaku {
  constructor(mensaje, linea, columna) {
    super('EJECUCIÓN', mensaje, linea, columna);
    this.name = 'ErrorEjecucion';
  }
}

export { ErrorOtaku, ErrorLexico, ErrorSintactico, ErrorEjecucion };
