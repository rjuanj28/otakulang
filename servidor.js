// Mini servidor web para el editor de OtakuLang (Node puro, sin dependencias).
//
// Uso:  node servidor.js
// Luego abre http://localhost:3000 en el navegador.
//
// ¿Por qué hace falta? Los navegadores bloquean los módulos ES cuando se
// abren con file:// (doble clic en editor.html). Con un servidor HTTP los
// archivos src/*.js se cargan como módulos normalmente.

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const PUERTO = 3000;

// Tipos MIME que necesita el editor.
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.otaku': 'text/plain; charset=utf-8',
};

const server = createServer((pedido, respuesta) => {
  // Ruta pedida: "/" sirve editor.html; se bloquea cualquier ruta que suba
  // fuera de la carpeta del proyecto (seguridad básica).
  let ruta = pedido.url.split('?')[0];
  if (ruta === '/') ruta = '/editor.html';
  if (ruta.includes('..')) {
    respuesta.writeHead(403);
    respuesta.end('Prohibido');
    return;
  }

  const archivo = join('.', ruta);
  if (!existsSync(archivo)) {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('No encontrado: ' + ruta);
    return;
  }

  const tipo = TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream';
  respuesta.writeHead(200, { 'Content-Type': tipo });
  respuesta.end(readFileSync(archivo));
});

server.listen(PUERTO, () => {
  console.log(`Editor de OtakuLang: http://localhost:${PUERTO}`);
  console.log('Presiona Ctrl+C para detener.');
});
