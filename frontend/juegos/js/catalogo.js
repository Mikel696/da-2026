// 19-JUE · Fuente única de los juegos: el vestíbulo y cada juego leen de aquí nombres, colores,
// controles y créditos. Si cambias un control en un juego, cámbialo aquí y en su tabla `acciones`.

export const JUEGOS = [
  {
    id: 'neon', nombre: 'Neón GP', genero: 'Carreras', archivo: 'juegos/neon.html', color: '#ff9a3c', listo: false,
    lema: 'Circuito urbano de noche contra cinco rivales. Derrapa para cargar el nitro.',
    tabla: 'carrera', menorEsMejor: true, formato: 'tiempo',
    controles: [
      ['Acelerar', 'W · ↑', 'RT'], ['Frenar / reversa', 'S · ↓', 'LT'], ['Girar', 'A D · ← →', 'Stick izq.'],
      ['Derrapar', 'Espacio', 'B'], ['Nitro', 'Shift', 'A'], ['Cámara', 'C', 'Y'], ['Reaparecer', 'R', 'Select'], ['Pausa', 'Esc · P', 'Start'],
    ],
  },
  {
    id: 'bastion', nombre: 'Bastión', genero: 'Shooter', archivo: 'juegos/bastion.html', color: '#58e1ff', listo: false,
    lema: 'Arena en primera persona. Aguanta oleadas de drones.',
    tabla: 'puntos', menorEsMejor: false, formato: 'puntos',
    controles: [],
  },
  {
    id: 'gravita', nombre: 'Gravita', genero: 'Arcade', archivo: 'juegos/gravita.html', color: '#c08bff', listo: false,
    lema: 'Inclina el mundo y lleva la esfera hasta la meta.',
    tabla: 'puntos', menorEsMejor: false, formato: 'puntos',
    controles: [],
  },
];

// Qué se tomó de cada proyecto y bajo qué licencia (verificado en el repositorio original, 23-oct-2026).
export const CREDITOS = [
  { que: 'three.js 0.186.1', quien: 'three.js authors', licencia: 'MIT', url: 'https://github.com/mrdoob/three.js',
    uso: 'Motor 3D, vendorizado sin modificar. Del ejemplo games_fps vienen Octree y Capsule.' },
  { que: 'racing-game', quien: 'Poimandres (pmndrs)', licencia: 'MIT', url: 'https://github.com/pmndrs/racing-game',
    uso: 'Base de diseño de Neón GP: tuning de coche arcade, nitro, cámara de persecución, motor con marchas, tabla de tiempos. Reescrito en JavaScript sin React ni build.' },
  { que: 'games_fps (ejemplo de three.js)', quien: 'three.js authors', licencia: 'MIT', url: 'https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html',
    uso: 'Base de Bastión: jugador con cápsula y colisiones por octree.' },
  { que: 'Dive', quien: 'Mugen87', licencia: 'MIT (solo código)', url: 'https://github.com/Mugen87/dive',
    uso: 'Diseño de la IA de enemigos de Bastión. Sus modelos y sonidos NO se usan: varios son CC BY-NC o sin licencia.' },
  { que: 'Astray', quien: 'wwwtyro', licencia: 'Unlicense (dominio público)', url: 'https://github.com/wwwtyro/Astray',
    uso: 'Base de Gravita: una esfera que rueda por un laberinto que se inclina.' },
];
