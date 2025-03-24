const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const mysql = require('mysql2');
const { chromium } = require('playwright');
const { interpretarMensaje } = require('./gemini'); 
const { getOrderStatus } = require('./prestashop'); 
require('dotenv').config();

const MYSQL_DB_HOST = process.env.MYSQL_DB_HOST;
const MYSQL_DB_USER = process.env.MYSQL_DB_USER;
const MYSQL_DB_PASSWORD = process.env.MYSQL_DB_PASSWORD;
const MYSQL_DB_NAME = process.env.MYSQL_DB_NAME;
const MYSQL_DB_PORT = process.env.MYSQL_DB_PORT || '3306';


const NumVendor = process.env.NUM_VENDOR;
let nombreGlobal = '';
let ciudad = '';


const flujoFinal = addKeyword(EVENTS.ACTION)
    .addAnswer('Se canceló por inactividad. Si necesitas ayuda, por favor escribe "Hola" para empezar de nuevo.', { capture: true }, async (ctx, { gotoFlow }) => {
        return gotoFlow(flowPrincipal);
    });


    const flowDatos = addKeyword('USUARIOS_NO_REGISTRADOS')
   .addAnswer('Estamos recolectando tus datos para poder ayudarte mejor. 📝')
    .addAnswer('Por favor, proporciona tu nombre completo:', { capture: true, idle: 300000 }, async (ctx, { fallBack, gotoFlow }) => {
        console.log("Capturando nombre...");
        
        if (ctx?.idleFallBack) {
            console.log("Flujo interrumpido por inactividad");
            return gotoFlow(flujoFinal);
        }
        
        if (!ctx.body || ctx.body.trim() === '') {
            console.log("Nombre no válido");
            return fallBack('Por favor ingresa un nombre válido.');
            return;
        }

        nombreGlobal = ctx.body.trim(); // Guardamos el nombre
        console.log("Nombre capturado:", nombreGlobal);
    })
    .addAnswer('Por favor, diganos de que ciudad es usted:', { capture: true, idle: 300000 }, async (ctx, { fallBack, gotoFlow }) => {
        console.log("Capturando ciudad...");
        if (ctx?.idleFallBack) {
            console.log("Flujo interrumpido por inactividad al capturar correo");
            return gotoFlow(flujoFinal);
        }
        ciudad = ctx.body.trim();
        console.log("Ciudad recibida:", ciudad);
        if (!ciudad || ciudad.trim() === '') {
            console.log("Ciudad no válida, solicitando de nuevo...");
            await flowDynamic('Por favor, ingresa una ciudad válida. 🏙️');
            return fallBack();
        }
    })


    .addAnswer('Por favor, proporciona tu correo electrónico:', { capture: true, idle: 300000 }, async (ctx, { fallBack, flowDynamic, gotoFlow }) => {
        console.log("Capturando correo...");
        
        if (ctx?.idleFallBack) {
            console.log("Flujo interrumpido por inactividad al capturar correo");
            return gotoFlow(flujoFinal);
        }

        const email = ctx.body?.trim();
        console.log("Correo recibido:", email);

        if (!email || !email.includes('@')) {
            console.log("Correo inválido, solicitando de nuevo...");
            await flowDynamic('Por favor, ingresa un correo electrónico válido. 📧');
            return fallBack();
        }

        const numero = ctx.from;
        console.log("Datos capturados: Nombre:", nombreGlobal, "| Correo:", email, "| Número:", numero, "| Ciudad:", ciudad);

        if (!nombreGlobal || nombreGlobal.trim() === '') {
            console.error('Error: nombreGlobal está vacío en la inserción SQL.');
            await flowDynamic('Hubo un error con tu nombre. Por favor, vuelve a intentarlo.');
            return fallBack();
        }

        // Conexión a la base de datos
        const connection = mysql.createConnection({
            host: MYSQL_DB_HOST,
            user: MYSQL_DB_USER,
            password: MYSQL_DB_PASSWORD,
            database: MYSQL_DB_NAME,
            port: MYSQL_DB_PORT,
        });

        console.log("Intentando insertar en la base de datos...");

        const sql = 'INSERT INTO clientes (nombre, email, numero, ciudad) VALUES (?, ?, ?, ?)';
        const values = [nombreGlobal, email, numero, ciudad];

        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error al insertar datos en la base de datos:', err.stack);
                return;
            }
            console.log('Cliente insertado con id:', results.insertId);
        });

        connection.end((err) => {
            if (err) {
                console.error("Error al cerrar la conexión a MySQL:", err.stack);
            } else {
                console.log("Conexión a MySQL cerrada correctamente.");
            }
        });

        await flowDynamic('¡Gracias! Tus datos han sido registrados exitosamente. ✅');
        await flowDynamic(`Hola ${nombreGlobal}. Que producto desea comprar?. 🚗🔧`);
    });

// Flujo principal
const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer('🛍️ Recuerda que puedes comprar fácil y seguro en nuestra página web.')
    .addAnswer('🔔 Crea una cuenta en nuestra página web para recibir ofertas exclusivas: https://daytonaautopartes.com/iniciar-sesion?create_account=1')
    .addAnswer([
        '👋 Hola, soy Dayana tu asistente virtual. ¿En qué puedo ayudarte hoy? 🤖',
    ], { capture: true, idle: 300000 }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {

        const numero = ctx.from;
        // Conexión a la base de datos
        const connection = mysql.createConnection({
            host: MYSQL_DB_HOST,
            user: MYSQL_DB_USER,
            password: MYSQL_DB_PASSWORD,
            database: MYSQL_DB_NAME,
            port: MYSQL_DB_PORT,
        });         
            const sqlCheck = 'SELECT * FROM clientes WHERE numero = ?';
            connection.query(sqlCheck, [numero], async (err, results) => {
                if (err) {
                    console.error('Error al verificar el número: ' + err.stack);
                    return;
                }
    
                if (results.length > 0) {
                    const nombreCliente = results[0].nombre;
                    clienteGlobal = nombreCliente;
                    console.log('Número existe. Nombre del cliente:', nombreCliente);
                    await flowDynamic(`Hola ${clienteGlobal}. Que producto desea comprar?. 🚗🔧`);
                } else {
                    console.log('Número no existe');
                    return gotoFlow(flowDatos);
                }
            });
            
        });



const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowDatos, flujoFinal]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
}

main();