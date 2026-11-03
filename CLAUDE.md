# Aitxorapp — contexto del proyecto

App personal (PWA) de rendimiento y organización, en español. Usuario: Aitor (Oviedo, iPhone + ordenador, no técnico; explicar en llano, paso a paso).
Publicada en GitHub Pages: https://augusto280905-beep.github.io/mi-dia/ (rama main, raíz). Cada push a main la actualiza.

## Estructura
- `index.html`: TODA la app (HTML+CSS+JS en un solo archivo, sin build). Es la única fuente.
- `sw.js`: service worker (red primero, sin caché HTTP). Al cambiar index.html, subir el nombre de la caché (`aitxorapp-vN`) y `VER` en index.html.
- `manifest.webmanifest`, `pulso-*.png`: iconos/manifiesto (el nombre de los PNG es antiguo; no renombrar sin motivo).
- `supabase/app_state.sql`: tabla `app_state` (user_id, data jsonb, rev) con RLS. Ya ejecutada en el proyecto Supabase `mjbsqkchyjfqncrgtfsv`.
- `supabase/push.sql` + `supabase/push-send.ts`: notificaciones push (tablas push_subs, reminders, push_config + cron cada minuto + Edge Function `push-send` con Verify JWT desactivado). La función genera sola las claves VAPID y las guarda en `push_config` (RLS sin políticas), así que no hay secretos que pegar.
- `tests/`: pruebas con jsdom. `npm install && npm test`.

## Secciones (v9)
Barra de 5 pestañas: **Hoy** (panel: próximo evento, accesos rápidos, resumen del equipo, preparación; «Más datos de rendimiento» desplegable con las tarjetas antiguas), **Equipo** (modo entrenador: Resumen/Asistencia/Plantilla/Entrenos/Ejercicios/Pizarra/Partidos), **Calendario**, **Notas**, **Mi fútbol** (Hoy/Registrar/Partidos/Salud/Físico/Temporada). Ajustes (engranaje de la cabecera, `data-main="ajustes"`): cuenta y sincronización, calendario externo, notificaciones, mis datos. Al abrir hay una animación de bienvenida (`#splash`, una vez por sesión, respeta reduced-motion).

## Equipo (entrenador de juveniles, fútbol 11)
`S.team={pl,att,ex,plan,bd,games,del,seed,seedEx}`. Plantilla inicial (24 jugadores) sembrada con ids deterministas `sp_<nombre>`; 16 ejercicios base `se_*` (plantillas editables). Asistencia: `att` = [{id:"a"+fecha,d,m:{jugador:"p|r|f|j|l|''"}}]; `""` = borrado (para que la fusión no lo resucite). Borrados con lápidas en `team.del`. Alertas (`teamAlerts`): ≥2 faltas seguidas o ≥4 sesiones con <70 % asistencia — criterio propio, sin validar. Pizarra: SVG con arrastre por pointer events, formaciones 4-3-3/4-4-2/4-2-3-1/3-5-2/4-1-4-1. Los entrenos y partidos aparecen en Calendario y generan avisos push (claves `q:` y `g:`). Los datos de menores viven solo en la cuenta privada de Supabase del usuario.

## Datos
Estado `S` en localStorage `midia:v3` = {notes,sess,well,mol,inj,prev,marks,next,sched,obj,ui}. `norm()` rellena valores por defecto.
Sueño: `S.well[fecha].sh` = horas de la noche anterior, introducidas a mano (sin importar de Apple Health).

## Sincronización (Supabase)
`SB` (URL + clave publishable, públicas por diseño) en index.html. Login con email + contraseña (Supabase Auth, fetch directo, sin librería). "Confirm email" desactivado en Supabase porque las plantillas no se pueden editar sin SMTP propio.
Un único documento por usuario (`app_state.data` = S). Concurrencia optimista con `rev`. Si ambos lados cambian: unión por id, gana el dispositivo local (los borrados pueden reaparecer). Estado de sync en localStorage `aitx:sync`.
NUNCA poner la secret/service_role key en el repo.

## Métodos del panel (fuentes reales; lo propio va marcado como no validado)
session-RPE (Foster), ACWR sin acoplar (Gabbett 2016), EWMA, CTL/ATL/TSB (Banister), monotonía/strain (Foster), índice de Hooper vs. línea base propia, necesidad de sueño individual (Walsh 2021). Propios y sin validar: puntuación de preparación, índice de energía, reglas de recomendación, umbrales de lesión. El usuario exige que todo análisis se base solo en fuentes de expertos reales y que lo propio se etiquete como tal.

## Notificaciones push
La app (`pnBuild`) calcula avisos de 14 días (tareas del día, cuestionario, entreno -1 h, registrar sesión +15 min, partidos) y los sube a `reminders` (solo diferencias). El cron llama a `push-send`, que reclama los vencidos y envía Web Push. Service worker: handlers `push` y `notificationclick` en sw.js. iOS: solo con la app en pantalla de inicio, permiso con un toque.

## Calendario externo (Google, solo lectura)
Tarjeta «Calendario externo» en el Panel. La dirección secreta iCal (`https://calendar.google.com/calendar/ical/…/private-…/basic.ics`) se guarda en `S.ui.ical` (sincronizada en la fila del usuario, protegida por RLS; NO va en la copia .json ni en el repo). El navegador no puede leer Google por CORS, así que la app llama a `POST /functions/v1/push-send/ical` con la sesión del usuario; la función valida el usuario y que la URL sea de calendar.google.com, descarga el .ics y lo recorta (sin descripciones ni invitados). El cliente lo interpreta (`icsEvents`: UTC, hora local/TZID, todo el día, RRULE diaria/semanal/mensual/anual, EXDATE, RECURRENCE-ID, cancelados) y lo guarda en localStorage `aitx:ical` (ventana −35/+120 días, refresco cada 15 min). Se muestra en Calendario, Panel (hoy/mañana) y genera avisos 30 min antes (clave `x:`). Limitación: las horas con TZID se tratan como hora local del dispositivo.

## Pendiente
1. Desplegar y probar push en el Supabase real (SQL + función) y en el iPhone.
2. Tras cada cambio: `npm test`, subir VER y caché del SW, commit y push.
