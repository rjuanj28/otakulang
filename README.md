# OtakuLang 🍥

Un lenguaje de programación con temática anime/otaku, implementado como un intérprete en JavaScript puro (Node.js, **sin dependencias**). Sus palabras clave vienen del japonés y de animes famosos como *Naruto* y *Dragon Ball*.

```otaku
jutsu factorial(n) {
  nani (n <= 1) { kaeri 1; }
  kaeri n * factorial(n - 1);
}
gritar("5! =", factorial(5));   # 5! = 120
```

## Integrantes

- Juan Jose Restrepo Davila
- Valeria Gomez
- Isaac David Chagüi Galeano

## Requisitos

- Node.js 18 o superior (no hay que instalar nada más, el proyecto no tiene dependencias).

## Cómo usarlo

### Ejecutar un archivo

```bash
node src/index.js examples/01-variables.otaku
```

Si el programa tiene un error, se imprime un único mensaje con el tipo de error, la descripción, la línea y la columna, y el proceso termina con código 1.

### Modo REPL (interactivo)

```bash
node src/index.js
```

Entra al REPL de OtakuLang: escribe una línea, se ejecuta al instante y las variables y funciones quedan guardadas entre líneas. Escribe `salir` para terminar.

```
otaku> ninja nombre = "Goku";
otaku> gritar("Hola,", nombre);
Hola, Goku
otaku> 2 + 2
4
otaku> salir
```

### Ejecutar las pruebas

```bash
npm test
```

Corre las 5 suites de pruebas unitarias (lexer, parser, evaluador, ámbitos, funciones) y las pruebas de integración (`tests/validos/` y `tests/errores/`), y muestra un resumen final. Si algo falla, el comando termina con código 1.

### Editor web

```bash
npm run editor
```

Levanta un pequeño servidor local (Node puro, sin dependencias) y abre [`http://localhost:3000`](http://localhost:3000) en el navegador. Ahí hay un editor de OtakuLang con fondo de anime donde puedes escribir código, ejecutarlo con el botón **Kamehameha** (o `Ctrl+Enter`), ver la salida en el panel derecho y cargar cualquiera de los ejemplos del proyecto desde el selector. Los errores se muestran en rojo con su línea y columna.

## El lenguaje

### Palabras clave

| Palabra | Significado | Equivalente |
|---|---|---|
| `ninja` | declarar variable | `let` / `var` |
| `jutsu` | declarar función | `function` |
| `kaeri` | retornar valor | `return` |
| `nani` | condicional | `if` |
| `baka` | si no | `else` |
| `kamehameha` | ciclo mientras | `while` |
| `entrenar` | ciclo para | `for` |
| `hai` | verdadero | `true` |
| `iie` | falso | `false` |
| `nada` | valor nulo | `null` |

### Tipos de datos

- **Números**: enteros y decimales (`42`, `2.5`).
- **Cadenas**: entre comillas dobles (`"Dattebayo"`). Se pueden indexar (`cadena[0]`).
- **Booleanos**: `hai` e `iie`.
- **Nulo**: `nada`.
- **Listas**: `[1, 2, 3]`, con índices desde 0. Se pasan por referencia.

### Reglas principales

- Las sentencias terminan en `;`.
- Los comentarios empiezan con `#` y van hasta el final de la línea.
- `ninja` declara una variable **en el ámbito actual**; redeclarar en el mismo ámbito es un error. Sin `ninja`, la asignación busca la variable en los ámbitos exteriores.
- Una variable local con el mismo nombre **no afecta** a la global (la sombrea solo dentro de su ámbito).
- `+` concatena si algún operando es cadena; `==` y `!=` no convierten tipos (`5 == "5"` es `iie`).
- `&&` y `||` usan cortocircuito.
- Regla de verdad: solo `iie`, `nada`, `0` y `""` son falsos; todo lo demás es verdadero.
- Las funciones recuerdan el ámbito donde fueron creadas (closures) y pueden ser recursivas.

### Precedencia (de menor a mayor)

```
||  →  &&  →  == !=  →  < > <= >=  →  + -  →  * / %  →  ! - (unarios)  →  llamadas e índices
```

Los operadores binarios asocian a la izquierda: `10 - 4 - 3` es `(10 - 4) - 3 = 3`.

### Funciones integradas

| Función | Descripción |
|---|---|
| `gritar(...)` | Imprime sus argumentos separados por espacio. |
| `poder(x)` | Longitud de una cadena o lista. |
| `aNumero(x)` | Convierte a número (cadenas y booleanos). |
| `aTexto(x)` | Convierte cualquier valor a texto. |
| `agregar(lista, valor)` | Añade un valor al final de una lista. |

### Errores

Tres tipos, siempre con línea y columna:

```
[Error LÉXICO]     Carácter no válido: '@' (línea 3, columna 10)
[Error SINTÁCTICO] Se esperaba ';' después de la declaración (línea 3, columna 1)
[Error EJECUCIÓN]  Variable no definida: 'zzz' (línea 2, columna 8)
```

## Estructura del proyecto

```
src/
  keywords.js     Palabras clave del lenguaje
  lexer.js        Tokenizador (texto → tokens)
  parser.js       Parser descendente recursivo (tokens → AST)
  ast.js          Nodos del AST y función para imprimirlo
  evaluator.js    Evaluador del AST (intérprete)
  environment.js  Ámbitos con cadena de entornos padre-hijo
  errors.js       Los tres tipos de error con línea y columna
  index.js        Punto de entrada: modo archivo y modo REPL
editor.html       Editor web (usa el mismo intérprete en el navegador)
servidor.js       Servidor local mínimo para el editor web
images.jpg        Fondo de anime del editor
examples/         Un programa .otaku por característica del lenguaje
tests/
  unitarias/      Pruebas por módulo (lexer, parser, evaluador, ámbitos, funciones)
  validos/        Programas válidos con su salida esperada (.esperado)
  errores/        Programas con error y su mensaje esperado (.esperado)
  ejecutar-tests.js  Ejecuta validos/ y errores/ comparando con .esperado
  ejecutar.js        Orquestador: corre todas las suites con `npm test`
```

## Ejemplos

Cada archivo de [`examples/`](examples) demuestra una característica. Se corren con `node src/index.js examples/NN-*.otaku`:

| Archivo | Demuestra |
|---|---|
| `01-variables.otaku` | Declarar con `ninja`, asignar, `hai`/`iie`/`nada` |
| `02-expresiones.otaku` | Precedencia, asociatividad, concatenación, comparaciones |
| `03-condicionales.otaku` | `nani`/`baka`, encadenado `baka nani`, regla de verdad |
| `04-ciclos.otaku` | `kamehameha` (while) y `entrenar` (for) |
| `05-funciones.otaku` | `jutsu` con parámetros, `kaeri`, funciones sin retorno |
| `06-recursion.otaku` | Factorial, Fibonacci y suma recursiva |
| `07-ambitos.otaku` | Local vs global, sombreado, ámbitos de bloque |
| `08-listas.otaku` | Índices, asignación por posición, paso por referencia |
| `09-integradas.otaku` | `gritar`, `poder`, `aNumero`, `aTexto`, `agregar` |
| `10-closures.otaku` | Funciones que recuerdan su ámbito |
| `11-completo.otaku` | El Torneo del Poder: combina todas las características |

## Pruebas

- **Unitarias** ([`tests/unitarias/`](tests/unitarias)): 73 pruebas que verifican el lexer, el parser, el evaluador, los ámbitos y las funciones directamente, módulo por módulo.
- **De integración** ([`tests/validos/`](tests/validos) y [`tests/errores/`](tests/errores)): 22 programas `.otaku`, cada uno con su archivo `.esperado`. Los válidos deben correr sin error y producir exactamente la salida esperada; los de error deben fallar con exactamente el mensaje esperado (línea y columna incluidas).

Todo corre con un solo comando:

```bash
npm test
```
