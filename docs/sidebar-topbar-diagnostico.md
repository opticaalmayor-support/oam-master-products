# Diagnostico de navegacion (Sidebar/Topbar)

Este archivo documenta las lineas revisadas, la funcion de cada bloque y el problema detectado.

- Archivo: `src/app/layout/sidebar/sidebar.html:22`
  - Funcion: define `data-collapse-toggle` y `aria-controls` para abrir/cerrar submenus.
  - Problema: el id se construia con reemplazo de espacios solamente; labels con simbolos (ej. `Offers & Winners`) generaban ids no confiables para selectores.

- Archivo: `src/app/layout/sidebar/sidebar.html:31`
  - Funcion: define el `id` del contenedor colapsable que debe coincidir con el toggle.
  - Problema: mismo riesgo de ids inconsistentes por caracteres especiales.

- Archivo: `src/app/layout/sidebar/sidebar.ts:21`
  - Funcion: provee la estructura de items y subitems de navegacion.
  - Problema: faltaba una funcion central para sanear ids de dropdown y garantizar coincidencia estable entre boton y panel.

- Archivo: `src/app/layout/shell/shell.ts:1`
  - Funcion: monta `Topbar + Sidebar + RouterOutlet` para rutas privadas.
  - Problema: no habia inicializacion/reinicializacion de componentes Flowbite (`data-*`) al cargar shell y al navegar entre rutas.

- Archivo: `src/app/layout/topbar/topbar.html:5`
  - Funcion: boton mobile para abrir/cerrar drawer del sidebar.
  - Problema: depende de Flowbite; sin init posterior al login/ruteo puede quedar inactivo.

- Archivo: `src/app/layout/topbar/topbar.html:17`
  - Funcion: boton para abrir/cerrar dropdown de usuario.
  - Problema: mismo patron dependiente de Flowbite; si no se inicializa, no responde.

- Archivo: `src/app/layout/topbar/topbar.html:11`
  - Funcion: enlace de marca principal en topbar.
  - Problema: usaba `href="/"`, causando recarga completa del navegador en vez de navegacion SPA.

## Estado despues del ajuste aplicado

- Se agrego saneamiento de ids para dropdowns en `Sidebar`.
- Se agrego inicializacion de Flowbite en `Shell` al montar y en `NavigationEnd`.
- Se cambio el enlace de marca a `routerLink` para mantener navegacion SPA.
