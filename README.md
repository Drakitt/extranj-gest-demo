# Servicios Demo

Demo local para empresas de servicios. Cubre el inicio de sesión, los roles Administrador y Comercial, y el recorrido de cliente, servicio, presupuesto y seguimiento simulado.

Los datos son ficticios. La marca es provisional. Esta aplicación no es un producto multitenant y no contacta servicios externos. Las contraseñas y los secretos se definen solo en un archivo `.env` local, que Git no versiona.

## Requisitos

- Node.js 20
- Docker, para el PostgreSQL local de la demo

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env`.
3. Sustituye cada `CHANGE_ME` por un valor elegido por ti. El mismo valor debe aparecer en `POSTGRES_PASSWORD` y en la contraseña de `DATABASE_URL`.
4. `docker compose up -d`
5. `npm run db:prepare`
6. `npm run dev`

La aplicación queda en `http://localhost:3010`.

`npm run dev`, `npm run build` y `npm start` no aplican migraciones ni crean datos. La única entrada de base es `npm run db:prepare`. Solo acepta PostgreSQL en `127.0.0.1` o `localhost`, puerto `5436`, usuario `crm_servicios_demo` y base `crm_servicios_demo`. Rechaza marcadores `CHANGE_ME`, contraseñas vacías y valores triviales como `password` o `secret`.

| Recurso | Valor local |
|---|---|
| Aplicación | `http://localhost:3010` |
| Contenedor | `crm-servicios-demo-db` |
| Puerto de PostgreSQL | `5436` |
| Base y usuario | `crm_servicios_demo` |
| Volumen | `crm_servicios_demo_data` |

## Variables

`.env.example` es una plantilla. Solo contiene marcadores. El archivo `.env` queda fuera del repositorio.

| Variable | Qué debes poner |
|---|---|
| `DATABASE_URL` | URL local del contenedor de esta demo. La contraseña de la URL tiene que coincidir con `POSTGRES_PASSWORD`. |
| `POSTGRES_PASSWORD` | Contraseña del contenedor. Sustituye el marcador. |
| `JWT_SECRET` | Secreto de sesión de al menos 24 caracteres. Sustituye el marcador. |
| `SEED_PASSWORD` | Contraseña de las cuentas de demostración, de al menos 8 caracteres. Sustituye el marcador. |

Genera esos valores en tu máquina y consérvalos solo en `.env`. No los copies a incidencias, commits ni a este archivo.

## Cuentas de demostración

La semilla crea estas cuentas ficticias. Las dos usan el valor de `SEED_PASSWORD`:

| Correo | Rol |
|---|---|
| `admin@demo.local` | Administrador |
| `comercial@demo.local` | Comercial |

También crea dos clientes y tres servicios, con correos en `demo.local`. No crea presupuestos: ese recorrido se hace en la aplicación.

El comercial consulta el catálogo y puede crear clientes, presupuestos y seguimientos. El administrador además mantiene los servicios y puede borrar. El precio del servicio es sin impuesto. El total de cada línea se calcula en la aplicación. El seguimiento guarda fecha prevista, nota y estado. No envía comunicaciones.

Los correos de cliente solo se aceptan en los dominios ficticios `demo.local` y `example.com`.

## Comprobación

`npm run check` ejecuta el tipado y las pruebas de importes, permisos, numeración, seguimiento y aislamiento. No abre una base de datos.

## Qué queda fuera del repositorio

Git ignora `.env`, `.env.local` y el resto de variantes de entorno, salvo `.env.example`. También ignora `node_modules`, `.next`, registros y cobertura. No subas volcados de base ni secretos.

## Licencia

Este repositorio no incluye un archivo `LICENSE` y no asigna una licencia al código de la demo. Las dependencias de terceros conservan las licencias que declaran sus propios paquetes.
