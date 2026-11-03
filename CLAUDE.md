# Aitxorapp — contexto del proyecto

App personal (PWA) de rendimiento y organización, en español. Usuario: Aitor (Oviedo, iPhone + ordenador, no técnico; explicar en llano, paso a paso).
Publicada en GitHub Pages: https://augusto280905-beep.github.io/mi-dia/ (rama main, raíz). Cada push a main la actualiza.

## Estructura
- `index.html`: TODA la app (HTML+CSS+JS en un solo archivo, sin build). Es la única fuente.
- `sw.js`: service worker (red primero, sin caché HTTP). Al cambiar index.html, subir el nombre de la caché (`aitxorapp-vN`) y `VER` en index.html.
- `manifest.webmanifest`, `pulso-*.png`: iconos/manifiesto (el nombre de los PNG es antiguo; no renombrar sin motivo).
- `supabase.sql`: tabla `app_state` (user_id, data jsonb, rev) con RLS. Ya ejecutada en el proyecto Supabase `mjbsqkchyjfqncrgtfsv`.
- `tests/`: pruebas con jsdom. `npm install && npm test`.

## Secciones
Panel (dashboard), Notas (tareas/notas rápidas), Calendario, Fútbol (Hoy/Registrar/Partidos/Salud/Físico/Temporada).

## Datos
Estado `S` en localStorage `midia:v3` = {notes,sess,well,mol,inj,prev,marks,next,sched,obj,ui}. `norm()` rellena valores por defecto.
Sueño: `S.well[fecha].sh` = horas de la noche anterior, introducidas a mano (sin importar de Apple Health).

## Sincronización (Supabase)
`SB` (URL + clave publishable, públicas por diseño) en index.html. Login por código de email (OTP) con fetch directo, sin librería.
Un único documento por usuario (`app_state.data` = S). Concurrencia optimista con `rev`. Si ambos lados cambian: unión por id, gana el dispositivo local (los borrados pueden reaparecer). Estado de sync en localStorage `aitx:sync`.
NUNCA poner la secret/service_role key en el repo.

## Métodos del panel (fuentes reales; lo propio va marcado como no validado)
session-RPE (Foster), ACWR sin acoplar (Gabbett 2016), EWMA, CTL/ATL/TSB (Banister), monotonía/strain (Foster), índice de Hooper vs. línea base propia, necesidad de sueño individual (Walsh 2021). Propios y sin validar: puntuación de preparación, índice de energía, reglas de recomendación, umbrales de lesión. El usuario exige que todo análisis se base solo en fuentes de expertos reales y que lo propio se etiquete como tal.

## Pendiente
1. Notificaciones push (iOS 16.4+, solo app en pantalla de inicio, permiso con gesto del usuario; VAPID + Edge Function + pg_cron en Supabase).
2. Vincular el Google Calendar de aitor.augusto@alumni.mondragon.edu (dirección secreta iCal si el administrador la permite; si no, OAuth).
3. Tras cada cambio: `npm test`, subir VER y caché del SW, commit y push.
