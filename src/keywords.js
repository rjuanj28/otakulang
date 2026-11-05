// Palabras clave de OtakuLang: el vocabulario temático del lenguaje.
// Cada palabra reservada se asocia al tipo de token que produce el lexer.

const KEYWORDS = {
  ninja: 'NINJA',       // declaración de variable
  jutsu: 'JUTSU',       // declaración de función
  kaeri: 'KAERI',       // retorno
  nani: 'NANI',         // condicional (if)
  baka: 'BAKA',         // sino (else)
  kamehameha: 'KAMEHAMEHA', // ciclo while
  entrenar: 'ENTRENAR', // ciclo for
  hai: 'HAI',           // verdadero
  iie: 'IIE',           // falso
  nada: 'NADA',         // nulo
};

// Devuelve el tipo de token si la palabra es reservada; si no, es un IDENT.
function buscarPalabraClave(palabra) {
  return KEYWORDS[palabra] || 'IDENT';
}

export { KEYWORDS, buscarPalabraClave };
