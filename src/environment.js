// Entornos de variables de OtakuLang (ámbito léxico).
//
// Cada Environment es una tabla de variables con una referencia a su entorno
// PADRE. La búsqueda de una variable empieza en el ámbito actual y sube por
// la cadena de padres hasta encontrarla (o fallar en el global).
//
//   global:      { x: 1 }
//                  ↑ padre
//   bloque:      { x: 2 }   ← sombrea a la x de afuera sin modificarla
//
// Reglas:
// - declarar (ninja): crea la variable en el ámbito ACTUAL.
// - leer: busca en el actual y luego hacia los padres.
// - asignar: busca hacia los padres y modifica la PRIMERA que encuentre.

class Environment {
  // padre es null solo en el entorno global.
  constructor(padre = null) {
    this.padre = padre;
    this.valores = new Map(); // nombre → valor
  }

  // Declara una variable en el ámbito actual.
  // Devuelve true si se pudo declarar; false si ya existe en ESTE ámbito.
  declarar(nombre, valor) {
    if (this.valores.has(nombre)) {
      return false; // redeclaración en el mismo ámbito: error del evaluador
    }
    this.valores.set(nombre, valor);
    return true;
  }

  // Busca el entorno (ámbito) donde vive la variable, o null si no existe.
  buscar(nombre) {
    if (this.valores.has(nombre)) return this;
    if (this.padre) return this.padre.buscar(nombre);
    return null;
  }

  // Lee una variable: busca en el actual y luego hacia los padres.
  // Devuelve undefined si no existe en ningún ámbito.
  leer(nombre) {
    const entorno = this.buscar(nombre);
    if (entorno) return entorno.valores.get(nombre);
    return undefined;
  }

  // Asigna a una variable existente: modifica la primera que encuentre
  // subiendo por los padres. Devuelve true si la encontró, false si no.
  asignar(nombre, valor) {
    const entorno = this.buscar(nombre);
    if (!entorno) return false;
    entorno.valores.set(nombre, valor);
    return true;
  }
}

export { Environment };
