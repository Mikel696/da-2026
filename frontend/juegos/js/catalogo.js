// 19-JUE · Fuente única de los juegos: el vestíbulo y cada juego leen de aquí nombres, colores,
// controles y créditos. Si cambias un control en un juego, cámbialo aquí y en su tabla `acciones`.

// Corredor ocupa el puesto del primer juego de carreras (circuito urbano, coche de cajas). Ese juego ya no sale en
// la sala, pero sigue abriendo por su dirección (juegos/neon.html) y conserva sus récords.
export const ANTERIORES = [
  {
    id: 'neon', nombre: 'Luciérnaga', genero: 'Carreras', archivo: 'juegos/neon.html', color: '#ff9a3c', listo: true,
    lema: 'Contrarreloj de tres vueltas en un circuito urbano de noche. Derrapa en las curvas para cargar el nitro.',
    tabla: 'carrera', menorEsMejor: true, formato: 'tiempo',
    controles: [
      ['Acelerar', 'W · ↑', 'RT'], ['Frenar / reversa', 'S · ↓', 'LT'], ['Girar', 'A D · ← →', 'Stick izq.'],
      ['Derrapar', 'Espacio', 'B'], ['Nitro', 'Shift', 'A'], ['Cámara', 'C', 'Y'], ['Reaparecer', 'R', 'Select'], ['Pausa', 'Esc · P', 'Start'],
    ],
  },
];

export const JUEGOS = [
  {
    id: 'corredor', nombre: 'Corredor', genero: 'Misión', archivo: 'juegos/corredor.html', color: '#d9c9a3', listo: true,
    lema: 'Lleva suministros en una camioneta por una carretera minada. El radar marca las minas; tú decides por dónde pasar.',
    tabla: 'tramo1', menorEsMejor: true, formato: 'tiempo',
    controles: [
      ['Acelerar', 'W · ↑', 'RT'], ['Frenar / marcha atrás', 'S · ↓', 'LT'], ['Girar', 'A D · ← →', 'Stick izq.'], ['Freno de mano', 'Espacio', 'A'],
      ['Mirar atrás', 'B', 'B'], ['Mirar alrededor', '—', 'Stick der.'], ['Cámara', 'C', 'Y'], ['Volver al centro de la vía', 'R', 'Select'], ['Pausa', 'Esc · P', 'Start'],
    ],
  },
  {
    id: 'atalaya', nombre: 'Atalaya', genero: 'Shooter', archivo: 'juegos/atalaya.html', color: '#58e1ff', listo: false,
    lema: 'Arena en primera persona. Aguanta oleadas de drones.',
    tabla: 'puntos', menorEsMejor: false, formato: 'puntos',
    controles: [],
  },
  {
    id: 'vaiven', nombre: 'Vaivén', genero: 'Arcade', archivo: 'juegos/vaiven.html', color: '#c08bff', listo: false,
    lema: 'Inclina el mundo y lleva la esfera hasta la meta.',
    tabla: 'puntos', menorEsMejor: false, formato: 'puntos',
    controles: [],
  },
];

// Qué se tomó de cada proyecto y bajo qué licencia (verificado en el repositorio original, 23-oct-2026).
export const CREDITOS = [
  { que: 'three.js 0.186.1', quien: 'three.js authors', licencia: 'MIT', url: 'https://github.com/mrdoob/three.js',
    uso: 'Motor 3D, vendorizado sin modificar. Del ejemplo games_fps vienen Octree y Capsule.' },
  { que: 'Poly Haven · 15 piezas escaneadas', quien: 'Greg Zaal, Jarod Guest, Rob Tuytel, Amal Kumar, Dario Barresi, Rico Cilliers, Jenelle van Heerden, James Ray Cock, Sean Buckley, Jurita Burger y Serhii Khromov', licencia: 'CC0 1.0 (dominio público)', url: 'https://polyhaven.com',
    uso: 'Corredor: cielos HDR, asfalto, tierra, grava y chapa escaneados; rocas, arbustos, tronco, barrera, bidón, caja y barril. Pieza por pieza, con autor y fuente, en juegos/assets/ph/CREDITOS.json.' },
  { que: 'racing-game', quien: 'Poimandres (pmndrs)', licencia: 'MIT', url: 'https://github.com/pmndrs/racing-game',
    uso: 'Base de diseño de Luciérnaga: tuning de coche arcade, nitro, cámara de persecución, motor con marchas, tabla de tiempos. Reescrito en JavaScript sin React ni build.' },
  { que: 'games_fps (ejemplo de three.js)', quien: 'three.js authors', licencia: 'MIT', url: 'https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html',
    uso: 'Base de Atalaya: jugador con cápsula y colisiones por octree.' },
  { que: 'Dive', quien: 'Mugen87', licencia: 'MIT (solo código)', url: 'https://github.com/Mugen87/dive',
    uso: 'Diseño de la IA de enemigos de Atalaya. Sus modelos y sonidos NO se usan: varios son CC BY-NC o sin licencia.' },
  { que: 'Astray', quien: 'wwwtyro', licencia: 'Unlicense (dominio público)', url: 'https://github.com/wwwtyro/Astray',
    uso: 'Base de Vaivén: una esfera que rueda por un laberinto que se inclina.' },
];
