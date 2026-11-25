# Servicios Demo

Demo local de gestión comercial para una empresa de servicios. En una sola pantalla se recorre el trabajo que va de la ficha del cliente al presupuesto numerado y a su seguimiento. Los datos son ficticios, la marca es provisional y todo ocurre en la máquina local.

Sirve para mostrar ese ciclo de principio a fin: quién puede hacer cada cosa, cómo se calcula un importe y cómo queda constancia de lo que pasa con un presupuesto.

## El recorrido

La aplicación tiene tres secciones.

**Clientes.** Alta y edición de la ficha: nombre, persona de contacto, teléfono, notas y correo. El correo solo se acepta en los dominios ficticios `demo.local` y `example.com`.

**Servicios.** Catálogo con descripción, precio de base e impuesto. Un servicio se puede dejar inactivo para que deje de entrar en presupuestos nuevos. La semilla incluye uno en ese estado, el informe técnico.

**Presupuestos.** Cada presupuesto recibe un número correlativo (`PRE-00001`) y se compone de líneas tomadas del catálogo. El importe de cada línea, y el total del presupuesto, se calculan en la aplicación a partir de la cantidad, el precio, el descuento y el tipo impositivo.

El borrador se puede corregir. A partir de ahí el estado avanza por transiciones fijas:

1. Borrador, que puede enviarse o cancelarse.
2. Enviado, que puede pasar a seguimiento, aceptarse, rechazarse o cancelarse.
3. En seguimiento, que puede aceptarse, rechazarse o cancelarse.
4. Aceptado, rechazado y cancelado quedan cerrados.

Cuando el presupuesto ya se ha enviado, se anota el seguimiento con una fecha prevista, una nota y un estado: pendiente, hecho o cancelado. Cada cambio queda en el historial del propio presupuesto. Ese registro vive en la aplicación.

## Roles

Hay dos papeles. El comercial lleva el día a día del presupuesto. El administrador, además, mantiene el catálogo y puede borrar.

| | Administrador | Comercial |
|---|---|---|
| Clientes | Consulta, crea, edita y borra | Consulta, crea y edita |
| Servicios | Mantiene el catálogo, incluido el borrado | Solo consulta |
| Presupuestos | Crea, edita borradores, cambia el estado y borra | Crea, edita borradores y cambia el estado |
| Seguimiento | Registra y actualiza | Registra y actualiza |

La sesión es un JWT de ocho horas. El navegador lo guarda en `sessionStorage` y lo envía como `Bearer` en cada petición a `/api/v1`.

## Stack

- Next.js 15 y React 19, con TypeScript
- API propia bajo `/api/v1`
- PostgreSQL 15, con Prisma
- Contraseñas con scrypt y sesión firmada con JWT (HS256)
- Docker Compose para la base local

## Puesta en marcha

Hacen falta Node.js 20 y Docker.

1. `npm install`
2. Copia `.env.example` a `.env`.
3. Sustituye cada `CHANGE_ME` por un valor elegido en tu máquina. La contraseña tiene que ser la misma en `POSTGRES_PASSWORD` y dentro de `DATABASE_URL`.
4. `docker compose up -d`
5. `npm run db:prepare`
6. `npm run dev`

La aplicación queda en `http://localhost:3010`.

`dev`, `build` y `start` no tocan la base. La única entrada es `npm run db:prepare`. Solo acepta PostgreSQL en `127.0.0.1` o `localhost`, en el puerto `5436`, con el usuario y la base `crm_servicios_demo`. Rechaza marcadores `CHANGE_ME`, contraseñas vacías y valores triviales como `password` o `secret`.

| Recurso | Valor local |
|---|---|
| Aplicación | `http://localhost:3010` |
| Contenedor | `crm-servicios-demo-db` |
| Puerto de PostgreSQL | `5436` |
| Base y usuario | `crm_servicios_demo` |
| Volumen | `crm_servicios_demo_data` |

## Variables

`.env.example` es una plantilla con marcadores. El archivo `.env` queda fuera del repositorio. Genera los valores en tu máquina y consérvalos solo ahí: no los copies a incidencias, commits ni a este archivo.

| Variable | Qué debes poner |
|---|---|
| `DATABASE_URL` | URL local del contenedor de esta demo. La contraseña de la URL tiene que coincidir con `POSTGRES_PASSWORD`. |
| `POSTGRES_PASSWORD` | Contraseña del contenedor. Sustituye el marcador. |
| `JWT_SECRET` | Secreto de sesión, de al menos 24 caracteres. Sustituye el marcador. |
| `SEED_PASSWORD` | Contraseña de las cuentas de demostración, de al menos 8 caracteres. Sustituye el marcador. |

## Cuentas de demostración

La semilla crea dos cuentas ficticias. Las dos usan el valor de `SEED_PASSWORD`.

| Correo | Nombre | Rol |
|---|---|---|
| `admin@demo.local` | Administración Demo | Administrador |
| `comercial@demo.local` | Comercial Demo | Comercial |

También deja dos clientes, Taller Norte Demo y Estudio Lumina Demo, y tres servicios: visita de diagnóstico, mantenimiento mensual y un informe técnico inactivo. Los presupuestos no vienen creados. Ese recorrido se hace en la aplicación, para ver cómo se numera, se totaliza y se sigue un presupuesto desde cero.

## Comprobación

`npm run check` ejecuta el tipado y las pruebas de importes, permisos, numeración, seguimiento y aislamiento de la base. No abre una base de datos.

## Qué queda fuera del repositorio

Git ignora `.env`, `.env.local` y el resto de variantes de entorno, salvo `.env.example`. También ignora `node_modules`, `.next`, registros y cobertura. Los volcados de base y los secretos no forman parte del código de la demo.

## Licencia

Este repositorio no incluye un archivo `LICENSE` y no asigna una licencia al código de la demo. Las dependencias de terceros conservan las licencias que declaran sus propios paquetes.
