export interface Sticker {
  numero: number
  codigo: string
  equipo: string
  jugador: string
  seccion: string
  es_especial: boolean
}

export const STICKERS: Sticker[] = [
  // ─── INTRO ───────────────────────────────────────────────────────────────
  { numero: 1,  codigo: 'INT-1', equipo: 'FIFA',      jugador: 'Logo FIFA World Cup 2026',    seccion: 'Intro', es_especial: false },
  { numero: 2,  codigo: 'INT-2', equipo: 'FIFA',      jugador: 'Mascota Oficial',              seccion: 'Intro', es_especial: false },
  { numero: 3,  codigo: 'INT-3', equipo: 'FIFA',      jugador: 'Estadio MetLife',              seccion: 'Intro', es_especial: false },
  { numero: 4,  codigo: 'INT-4', equipo: 'FIFA',      jugador: 'Estadio Azteca',               seccion: 'Intro', es_especial: false },
  { numero: 5,  codigo: 'INT-5', equipo: 'FIFA',      jugador: 'Balón Oficial',                seccion: 'Intro', es_especial: true  },

  // ─── COLOMBIA ─────────────────────────────────────────────────────────────
  { numero: 6,  codigo: 'COL-1',  equipo: 'Colombia', jugador: 'Escudo Colombia',              seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 7,  codigo: 'COL-2',  equipo: 'Colombia', jugador: 'Camilo Vargas',                seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 8,  codigo: 'COL-3',  equipo: 'Colombia', jugador: 'Daniel Muñoz',                 seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 9,  codigo: 'COL-4',  equipo: 'Colombia', jugador: 'Davinson Sánchez',             seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 10, codigo: 'COL-5',  equipo: 'Colombia', jugador: 'Carlos Cuesta',                seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 11, codigo: 'COL-6',  equipo: 'Colombia', jugador: 'Johan Mojica',                 seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 12, codigo: 'COL-7',  equipo: 'Colombia', jugador: 'Wilmar Barrios',               seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 13, codigo: 'COL-8',  equipo: 'Colombia', jugador: 'Mateus Uribe',                 seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 14, codigo: 'COL-9',  equipo: 'Colombia', jugador: 'Richard Ríos',                 seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 15, codigo: 'COL-10', equipo: 'Colombia', jugador: 'Juan Cuadrado',                seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 16, codigo: 'COL-11', equipo: 'Colombia', jugador: 'James Rodríguez',              seccion: 'CONMEBOL - Colombia', es_especial: true  },
  { numero: 17, codigo: 'COL-12', equipo: 'Colombia', jugador: 'Luis Díaz',                    seccion: 'CONMEBOL - Colombia', es_especial: true  },
  { numero: 18, codigo: 'COL-13', equipo: 'Colombia', jugador: 'Jhon Córdoba',                 seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 19, codigo: 'COL-14', equipo: 'Colombia', jugador: 'Rafael Santos Borré',          seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 20, codigo: 'COL-15', equipo: 'Colombia', jugador: 'Falcao García',                seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 21, codigo: 'COL-16', equipo: 'Colombia', jugador: 'Cuadro Equipo A',              seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 22, codigo: 'COL-17', equipo: 'Colombia', jugador: 'Cuadro Equipo B',              seccion: 'CONMEBOL - Colombia', es_especial: false },
  { numero: 23, codigo: 'COL-18', equipo: 'Colombia', jugador: 'Néstor Lorenzo (DT)',          seccion: 'CONMEBOL - Colombia', es_especial: false },

  // ─── BRASIL ───────────────────────────────────────────────────────────────
  { numero: 24, codigo: 'BRA-1',  equipo: 'Brasil',   jugador: 'Escudo Brasil',                seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 25, codigo: 'BRA-2',  equipo: 'Brasil',   jugador: 'Alisson Becker',               seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 26, codigo: 'BRA-3',  equipo: 'Brasil',   jugador: 'Danilo',                       seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 27, codigo: 'BRA-4',  equipo: 'Brasil',   jugador: 'Marquinhos',                   seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 28, codigo: 'BRA-5',  equipo: 'Brasil',   jugador: 'Gabriel Magalhães',            seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 29, codigo: 'BRA-6',  equipo: 'Brasil',   jugador: 'Guilherme Arana',              seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 30, codigo: 'BRA-7',  equipo: 'Brasil',   jugador: 'Casemiro',                     seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 31, codigo: 'BRA-8',  equipo: 'Brasil',   jugador: 'Bruno Guimarães',              seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 32, codigo: 'BRA-9',  equipo: 'Brasil',   jugador: 'Lucas Paquetá',                seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 33, codigo: 'BRA-10', equipo: 'Brasil',   jugador: 'Raphinha',                     seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 34, codigo: 'BRA-11', equipo: 'Brasil',   jugador: 'Vinícius Jr.',                 seccion: 'CONMEBOL - Brasil', es_especial: true  },
  { numero: 35, codigo: 'BRA-12', equipo: 'Brasil',   jugador: 'Rodrygo',                      seccion: 'CONMEBOL - Brasil', es_especial: true  },
  { numero: 36, codigo: 'BRA-13', equipo: 'Brasil',   jugador: 'Gabriel Martinelli',           seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 37, codigo: 'BRA-14', equipo: 'Brasil',   jugador: 'Endrick',                      seccion: 'CONMEBOL - Brasil', es_especial: true  },
  { numero: 38, codigo: 'BRA-15', equipo: 'Brasil',   jugador: 'Gabriel Jesus',                seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 39, codigo: 'BRA-16', equipo: 'Brasil',   jugador: 'Cuadro Equipo A',              seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 40, codigo: 'BRA-17', equipo: 'Brasil',   jugador: 'Cuadro Equipo B',              seccion: 'CONMEBOL - Brasil', es_especial: false },
  { numero: 41, codigo: 'BRA-18', equipo: 'Brasil',   jugador: 'DT Brasil',                    seccion: 'CONMEBOL - Brasil', es_especial: false },

  // ─── ARGENTINA ────────────────────────────────────────────────────────────
  { numero: 42, codigo: 'ARG-1',  equipo: 'Argentina', jugador: 'Escudo Argentina',            seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 43, codigo: 'ARG-2',  equipo: 'Argentina', jugador: 'Emiliano Martínez',           seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 44, codigo: 'ARG-3',  equipo: 'Argentina', jugador: 'Nahuel Molina',               seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 45, codigo: 'ARG-4',  equipo: 'Argentina', jugador: 'Cristian Romero',             seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 46, codigo: 'ARG-5',  equipo: 'Argentina', jugador: 'Lisandro Martínez',           seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 47, codigo: 'ARG-6',  equipo: 'Argentina', jugador: 'Nicolás Tagliafico',          seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 48, codigo: 'ARG-7',  equipo: 'Argentina', jugador: 'Rodrigo De Paul',             seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 49, codigo: 'ARG-8',  equipo: 'Argentina', jugador: 'Enzo Fernández',              seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 50, codigo: 'ARG-9',  equipo: 'Argentina', jugador: 'Alexis Mac Allister',         seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 51, codigo: 'ARG-10', equipo: 'Argentina', jugador: 'Ángel Di María',              seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 52, codigo: 'ARG-11', equipo: 'Argentina', jugador: 'Lionel Messi',                seccion: 'CONMEBOL - Argentina', es_especial: true  },
  { numero: 53, codigo: 'ARG-12', equipo: 'Argentina', jugador: 'Julián Álvarez',              seccion: 'CONMEBOL - Argentina', es_especial: true  },
  { numero: 54, codigo: 'ARG-13', equipo: 'Argentina', jugador: 'Lautaro Martínez',            seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 55, codigo: 'ARG-14', equipo: 'Argentina', jugador: 'Paulo Dybala',                seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 56, codigo: 'ARG-15', equipo: 'Argentina', jugador: 'Thiago Almada',               seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 57, codigo: 'ARG-16', equipo: 'Argentina', jugador: 'Cuadro Equipo A',             seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 58, codigo: 'ARG-17', equipo: 'Argentina', jugador: 'Cuadro Equipo B',             seccion: 'CONMEBOL - Argentina', es_especial: false },
  { numero: 59, codigo: 'ARG-18', equipo: 'Argentina', jugador: 'Lionel Scaloni (DT)',         seccion: 'CONMEBOL - Argentina', es_especial: false },

  // ─── MÉXICO ───────────────────────────────────────────────────────────────
  { numero: 60, codigo: 'MEX-1',  equipo: 'México',   jugador: 'Escudo México',                seccion: 'CONCACAF - México', es_especial: false },
  { numero: 61, codigo: 'MEX-2',  equipo: 'México',   jugador: 'Guillermo Ochoa',              seccion: 'CONCACAF - México', es_especial: false },
  { numero: 62, codigo: 'MEX-3',  equipo: 'México',   jugador: 'Hirving Lozano',               seccion: 'CONCACAF - México', es_especial: false },
  { numero: 63, codigo: 'MEX-4',  equipo: 'México',   jugador: 'Santiago Giménez',             seccion: 'CONCACAF - México', es_especial: true  },
]

export const EQUIPOS = [...new Set(STICKERS.map(s => s.equipo))]
export const SECCIONES = [...new Set(STICKERS.map(s => s.seccion))]
