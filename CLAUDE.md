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

## Secciones (v10)
Barra de 4 áreas: **Hoy** (siguiente, estado/disponibilidad, «Carga recomendada para hoy» = margen de UA para quedar en ACWR ≤1,3 menos lo ya acumulado, con recortes propios por estado/partido; tareas; energía; cuestionario; «Más datos» desplegable), **Agenda** (Calendario y Tareas con selector `.agseg`; `S.ui.main` cal/notas), **Salud** (`fut`: Hoy = «Plan de hoy» visual según partido/carga, Gimnasio, Registrar, Partidos + Liga SD Alsasua, Lesiones, Físico, Temporada), **Entrenador** (`eq`). Ajustes con el engranaje. Splash con la foto del usuario (base64 en index.html; iconos pulso-*.png son esa foto).

## v10: Liga, gimnasio, bajas
- Liga: constante `FIX` (BeSoccer, Preferente G1 2026-27, sin horarios), sembrada en `S.next` con ids `fx<jornada>`; resultados editables en `S.ui.fxr`. Para actualizar: volver a leer BeSoccer y editar `FIX`.
- Entrenos: `plan.bj` (bajas; lesionados por defecto), `plan.tm` equipos de posesión (reparto por líneas en serpentina), `tn`, `tgk`, `tg`.
- Gimnasio (p10b): catálogo `GX` con esquemas por cinemática inversa (`figPair`), `gymRec` (qué grupo toca: criterio propio), `buildGym`, sesión guardada como `k:"gym"` con `ms` (series por músculo) y `gx`. Fuentes citadas en la propia app; reglas de calendario propias y sin validar.

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

## v11: menús, pizarra animada, reloj, informe
- Salud y Entrenador abren en un **menú de tarjetas** (`S.ui.fv` / `S.ui.tv` = "hub"; al tocar la pestaña inferior vuelve al menú). Salud: Fútbol / Gimnasio / Cuerpo / Informe y guías (`renderFut`, p11d). Ya no hay «Registrar» como pestaña: tras el entreno (según `S.sched`) Hoy y Salud muestran la tarjeta `postCard` (30 s: duración, esfuerzo, energía, piernas, molestias; partido: resultado/goles). «Mis sesiones» separa fútbol y gimnasio.
- Entrenador: horario `S.team.sch` (por defecto mar/jue 18:45) → «Preparar entreno de hoy» (`planFor`, foco por días al partido: Douchet 2023, encuesta, el detalle es criterio propio). Convocatoria por partido (`tvCon`: —/suplente/titular, máx. 18, once, `g.xi`), estrategia con plantillas (córner, falta, banda, salida) en la pizarra.
- Pizarra: fotogramas `TBD.fr=[{p:{id:[x,y]},a:[flechas]}]`, reproducción con rAF (`bdPlay`).
- Gimnasio: figuras animadas (`figLive`, IntersectionObserver, respeta prefers-reduced-motion). Recomendaciones con fuentes en `REC` (p11d); varias fuentes no se pudieron abrir y verificar.
- Apple Watch: un PWA no lee HealthKit. `supabase/health.sql` + rutas `/health/register` y `/health?t=CODE` en `push-send`; el iPhone envía con Atajos o Health Auto Export; la app lee `health_in` (`hlPull`) y rellena `S.well[d].sh` (`shs:"w"`), `rhr`, `hrv`. Sin probar en el iPhone real. El código vive en `S.ui.hlk`; en la nube solo se guarda su sha256.
- Informe del día (`dayReport`, `inf:` push a las 21:30, pref `rep`): el aviso es genérico; el informe se calcula al abrir la app.
- Pruebas: `tests/v11.test.js`.

## v12: identidad nueva y tres áreas
- Pestañas: **Hoy**, **Organiza** (`cal`/`notas`: tareas, calendario, uni), **Deporte** (`fut`), **Entrenador** (`eq`). `render()` pone `body[data-area]` (home/org/dep/eq) y cada área tiene su color (azul / lima / coral, variables `--c-org/--c-dep/--c-eq`; `--ac` cambia con el área). Hero e inicio oscuros con anillos (Disponibilidad, Sueño, Carga 7 d vs techo ACWR 1,3). Tipografía Barlow Condensed + Inter.
- Inicio (p12a): `homeHero` (anillos), `homeTimeline` (hoy y mañana con color por área), `homeAreas` (3 tarjetas con acciones), cuestionario, y «Más datos» desplegable con todo el panel anterior.
- Deporte: el menú es «Mi semana» (`weekStrip`: entrenos del calendario `S.sched` y partidos; `!` = entreno por contar, abre `postCard` de ese día; `S.ui.pkd` = descartados), tarjeta «Entreno extra» (margen `loadMargin()`), Cuerpo (sueño, lesiones), Registro, Guías. Sin «Físico»/peso ni «Plan de hoy» en el menú (las vistas `hoy`/`fis` siguen en el código, sin enlace).
- Entreno extra: `loadWhy(plan)` explica cada carga con su fuente (Rønnestad 2011, ACSM 2009, Schoenfeld 2017/2016, Zourdos 2016, Gabbett 2016) o «criterio propio».

## v13: calendario del equipo, Salud «Cómo estás», convocatoria, informe 23:00
- `TFX` + `tfxSeed()` (p12b): calendario de SD Alsasua, Segunda Juvenil Grupo 5 (futnavarra.es, competición 22841486, grupo 22952004, temporada 2026-27) sembrado en `S.team.games` con ids `tf<jornada>` (campos `j` jornada, `v` campo, `src:"fn"`). No pisa ediciones ni resucita borrados. Resultados NO cargados: la web los ofusca (dígitos por CSS); se anotan a mano. Para actualizar horarios/campos: abrir futnavarra en el navegador integrado, leer cada partido y editar `TFX`.
- Convocatoria profesional: `cvPoster` (canvas 1080×1350), `cvTexto` (WhatsApp), datos en `g.cx={cit,cl,kit,nt}`; se comparte con `navigator.share` (archivo) o se descarga.
- Salud: `hmod()` (estado a partir de sesiones, molestias, sueño, partidos), `healthRecs()` (consejos con fuente o «criterio propio»), `healthDash()`. Inicio sin tarjetas de áreas: `homeMatches`, `homeWeek`, `homeRec`.
- Registro: «Mis sesiones» ahora muestra el formulario (antes `postopen` no pintaba nada ahí); esfuerzo sugerido por tipo, error visible, límite 4 sesiones/día.
- Informe: aviso `inf:` a las 23:00 (migra 21:30), texto = agenda de mañana (`repPush`, calculado al sincronizar; sin datos de salud).
- Pruebas: `tests/v13.test.js` (con canvas simulado).

- v13.1 (p12d): Deporte = pestañas **Resumen** (`healthDash` + Mi semana) / **Entrenos** (elegir: fuerza extra, prevención y core, soltar, registrar; historial). `S.ui.dv`. Fuerza editable: quitar (`gdelx`), series ±(`gsets`), añadir (`gaddo/gaddx`).

- v13.2 (p12e): inicio sin anillos: `homeHero` = estado (de `hmod`) con barra, «Lo siguiente», 3 indicadores (carga con marca del techo, sueño, cuerpo). El cuestionario de inicio es un chequeo dinámico de 4 preguntas una a una (`checkinHtml`, `CK`, acciones `ckset/ckskip/ckedit/cksh`); guarda lo mismo (`S.well[d].sl/fa/st/so`, Hooper 1–7) y las horas dormidas. La vista Sueño conserva el cuestionario clásico (`wellHtml`).

## Pendiente
1. Desplegar y probar push en el Supabase real (SQL + función) y en el iPhone.
2. Tras cada cambio: `npm test`, subir VER y caché del SW, commit y push.
