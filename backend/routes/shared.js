// routes/shared.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Conexión segura a la Base de Datos
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ============================================================================
// VERIFICACIÓN GLOBAL DE TIEMPO DE GRACIA (Sirve para cualquier rol)
// ============================================================================
router.get('/excepcion/:periodoId/:codigoUsuario', async (req, res) => {
    try {
        const { periodoId, codigoUsuario } = req.params;

        const { data, error } = await supabase
            .from('excepciones_periodo')
            .select('*')
            .eq('id_periodo', periodoId)
            // Trae la excepción si eres el creador asignado o el autorizador designado
            .or(`codigo_empleado.eq.${codigoUsuario},codigo_autorizador.eq.${codigoUsuario}`);
            
        if (error) throw error;

        // MUY IMPORTANTE: Devolvemos 'data' para que haga match perfecto con 'res?.data' del frontend
        res.json({ success: true, data: data || [] }); 
    } catch (error) {
        console.error("Error en shared/excepcion:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;