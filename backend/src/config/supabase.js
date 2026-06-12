// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

// Extraemos las credenciales protegidas desde el archivo .env
const urlSupabase = process.env.SUPABASE_URL;
const llaveSupabase = process.env.SUPABASE_KEY;

// Verificación preventiva de seguridad en el servidor
if (!urlSupabase || !llaveSupabase) {
    console.error("❌ Error Crítico: No se encontraron las credenciales de Supabase en las variables de entorno.");
}

// Creamos la conexión única para todo el proyecto
const supabase = createClient(urlSupabase, llaveSupabase);

// Exportamos el cliente listo para que lo use cualquier servicio o controlador
module.exports = supabase;