# Catálogo de vehículos

Aplicación React + TypeScript para el catálogo público y la administración de vehículos de una única concesionaria.

## Desarrollo local

```sh
npm install
npm run dev
```

`npm run build` ejecuta la comprobación de TypeScript y genera el build de producción. `npm run lint` ejecuta ESLint.

## Supabase

La aplicación requiere Supabase para el catálogo, la configuración, la autenticación y la persistencia de vehículos. Sin las variables, las operaciones muestran un error de configuración en lugar de simular persistencia.

1. Copia `.env.example` a `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos del proyecto.
3. Confirma que el proyecto tenga las tablas y políticas RLS descritas en `supabase/schema.sql`, y que exista el bucket público `vehicle-images` con políticas de lectura pública y escritura limitada al administrador.
4. Para habilitar el catálogo de marcas/modelos/versiones, revisa y ejecuta manualmente `supabase/migrations/20261101_vehicle_catalog.sql` en Supabase. No se aplica automáticamente.
5. Crea el usuario administrador desde Supabase Auth y registra su perfil con rol `admin` desde un entorno confiable.
6. Si todavía no existe una fila en `dealership_settings`, inicia sesión como administrador: la aplicación crea la fila inicial con `ON CONFLICT DO NOTHING`, sin sobrescribir una configuración existente.

La clave `VITE_SUPABASE_ANON_KEY` admite la clave anon heredada o una clave publishable `sb_publishable_...`. No agregues nunca una clave `service_role` a variables `VITE_*` ni al frontend.

Las fotografías nuevas se suben a `vehicle-images` y sus metadatos se guardan en `vehicle_images`. La eliminación de vehículos también intenta limpiar sus archivos de Storage.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y usa el preset **Vite**, el comando `npm run build` y el directorio de salida `dist`.
2. En las variables de entorno de producción agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Vite las incorpora al frontend durante el build; no pongas una clave `service_role` en ninguna variable `VITE_*`.
3. En Supabase, configura la URL de producción como **Site URL** y agrégala a las URLs permitidas de redirección de Auth. La recuperación de contraseña usa la ruta `/login`.
4. Antes de publicar, confirma que aplicaste el esquema/políticas RLS, el bucket y el perfil administrador indicados arriba.

`vercel.json` reescribe las rutas de la aplicación a `index.html`, para que las rutas de React Router también funcionen al abrirlas directamente o recargar la página.
