// --- Imports de librerías externas ---
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const mysql = require('mysql2');
const { chromium } = require('playwright');

// --- Imports de módulos internos ---
const {
    interpretarMensaje,
    generarRespuesta,
    insentivarCompra,
    enlaceWhatsapp,
    interpretarSatisfaccion,
    productoEsTico,
    guiadeCompra,
    interpretarIntencion
} = require('./gemini');
require('dotenv').config();

// --- Variables de entorno y constantes ---
const MYSQL_DB_HOST = process.env.MYSQL_DB_HOST;
const MYSQL_DB_USER = process.env.MYSQL_DB_USER;
const MYSQL_DB_PASSWORD = process.env.MYSQL_DB_PASSWORD;
const MYSQL_DB_NAME = process.env.MYSQL_DB_NAME;
const MYSQL_DB_PORT = process.env.MYSQL_DB_PORT || '3306';
const NumVendor = '51945852553'; // Número de WhatsApp del vendedor


let productoGlobal = '';


// --- Flujos del bot ---

// Flujo final para manejar inactividad
const flujoFinal = addKeyword(EVENTS.ACTION)
    .addAnswer(
        'Se canceló por inactividad. Si necesitas ayuda, por favor escribe "Hola" para empezar de nuevo.',
        { capture: true },
        async (ctx, { gotoFlow }) => {
            return gotoFlow(flowPrincipal);
        }
    );

// Flujo para calificación
const flowCalificacion = addKeyword('calificacion')
    .addAnswer('Gracias, recuerda que puedes empezar de nuevo escribiendo "Hola". 🤖')
    .addAnswer(
        'Por favor califica nuestro servicio de 1 a 5 estrellas. 🌟',
        { capture: true },
        async (ctx, { flowDynamic, fallBack }) => {
            const calificacion = parseInt(ctx.body);
            if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
                return fallBack();
            } else {
                const numero = ctx.from;
                // ...registro en base de datos...
                const sql = 'INSERT INTO calificaciones (numero, calificacion) VALUES (?, ?)';
                const values = [numero, calificacion];
                const connection = mysql.createConnection({
                    host: MYSQL_DB_HOST,
                    user: MYSQL_DB_USER,
                    password: MYSQL_DB_PASSWORD,
                    database: MYSQL_DB_NAME,
                    port: MYSQL_DB_PORT,
                });
                connection.query(sql, values, (err, results) => {
                    if (err) {
                        console.error('Error al insertar calificación: ' + err.stack);
                        return;
                    }
                    console.log('Calificación insertada con id: ' + results.insertId);
                });
                connection.end();
                await flowDynamic('¡Gracias por tu calificación! 🌟');
            }
        }
    );

// Flujo de satisfacción
const flowSatisfaccion = addKeyword('satisfaccion')
    .addAnswer(
        '¿Dentro de los enlaces proporcionados encontró lo que está buscando?',
        { capture: true, idle: 300000 },
        async (ctx, { flowDynamic, gotoFlow }) => {
            if (ctx?.idleFallBack) {
                return gotoFlow(flujoFinal);
            }
            const url = `https://api.whatsapp.com/send?phone=${NumVendor}`;
            const respuesta = ctx.body;
            const mensaje = await interpretarSatisfaccion(respuesta);
            
                const mensajeguia = await guiadeCompra(mensaje, url);
                await flowDynamic(mensajeguia);
                await flowDynamic([
                    {
                        body: 'Video de guía de compra',
                        media: 'https://drive.google.com/uc?export=download&id=1WaA8tIMa2vyqsu8G-En65HsaJgT_lpLR',
                        delay: 1000
                    }
                ]);
                console.log("Respuesta de satisfacción interpretada:", respuesta);
                console.log('Mensaje de guia de compra:', mensajeguia);
        }
    );
 

    

// Flujo principal
const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer(
        'Hola soy Dayana, ¿en qué puedo ayudarte o qué producto deseas comprar? 🛍️',
        { capture: true, idle: 300000 },
        async (ctx, { flowDynamic, gotoFlow, provider}) => {
            if (ctx?.idleFallBack) {
                return gotoFlow(flujoFinal);
            }
            const mensaje = ctx.body;
            const respuesta = await interpretarMensaje(mensaje);
            console.log("Intención interpretada:", respuesta);


            if (respuesta !== 'indefinido') {

 // ENVÍA MENSAJE AUTOMÁTICO AL NÚMERO ????
                     const numeroDestino = '51945852553@s.whatsapp.net'; // Formato internacional + @s.whatsapp.net
                        const mensajeAuto = `🚨 Nuevo cliente interesado\nWhatsApp: ${ctx.from}\nProducto: ${respuesta}\nEs una prueba`;
                        if (typeof provider?.sendText === 'function') {
                            try {
                                const resultadoEnvio = await provider.sendText(numeroDestino, mensajeAuto);
                                if (resultadoEnvio && resultadoEnvio.status === 'OK') {
                                    console.log('Mensaje enviado con éxito:', mensajeAuto);
                                } else {
                                    console.log('No se pudo enviar el mensaje. Respuesta:', resultadoEnvio);
                                }
                            } catch (error) {
                                console.error('Error al enviar el mensaje:', error);
                            }
                        } else {
                            console.log('La función sendText no está disponible en el provider.');
                        }
                // Fin del envío automático

                const verificarTico = await productoEsTico(respuesta);
                console.log("Verificación de producto:", verificarTico);              
                if (verificarTico === 'indefinido') {
                    const NomProd = respuesta;
                    console.log("Producto interpretado:", NomProd);
                    productoGlobal = NomProd;
                    function generarEnlaceDeBusqueda(palabraClave) {
                        const enlaceBusqueda = `https://daytonaautopartes.com/busqueda?s=${encodeURIComponent(palabraClave)}`;
                        console.log("Enlace de búsqueda:", enlaceBusqueda);
                        return enlaceBusqueda;
                    }
                    
                    await flowDynamic('Procesando tu solicitud...⏳');
                    const palabra = NomProd;
                    const enlaceCliente = generarEnlaceDeBusqueda(palabra);

                    const browser = await chromium.launch({ headless: true });
                    const page = await browser.newPage();
                    await page.goto(enlaceCliente);

                    const productos = await page.$$eval('article.product-miniature', (results) => results.map((el) => {
                        const title = el.querySelector('h3.product-title a').innerText;
                        if (!title) return null;
                        const image = el.querySelector('img').src;
                        const price = el.querySelector('span.price').innerText;
                        const link = el.querySelector('h3.product-title a').href;
                        return { title, image, price, link };
                    }));

                    await browser.close();
                    await flowDynamic('🚨*PARA COMPRAR EL PRODUCTO INGRESA AL LINK*');
                    if (productos.length > 0) {
                        for (const producto of productos) {
                            if (producto) {
                                const mensaje = `🚗 *Producto:* ${producto.title}\n💲 *Precio:* ${producto.price}\n 🛒*Comprar:* ${producto.link}`;
                                await flowDynamic(mensaje, { media: producto.image });
                            }
                        }
                        await flowDynamic('Ingresa aquí para más resultados: ' + enlaceCliente);
                        const mensaje = await insentivarCompra(NomProd);
                        await flowDynamic(mensaje);
                        return gotoFlow(flowSatisfaccion);
                    } else {
                        // Si no hay resultados, incentivar al cliente a contactar a un agente de ventas
                        const url = `https://api.whatsapp.com/send?phone=${NumVendor}`;
                        const insentivarMensaje = await enlaceWhatsapp(url, NomProd);
                        await flowDynamic(insentivarMensaje);         
                        // Fin del envío automático
                    }
                } else {
                    // Si el producto no es válido, enviar un mensaje de error
                    const url = `https://api.whatsapp.com/send?phone=${NumVendor}`;
                    const insentivarMensaje = await enlaceWhatsapp(url, respuesta);
                    await flowDynamic(insentivarMensaje);
                }
            } else {
                const respuestaGenerada = await generarRespuesta(mensaje, 'no es un producto, que intención tiene el cliente');
                console.log("Respuesta generada:", respuestaGenerada);
                await flowDynamic(respuestaGenerada, { capture: true }, { idle: 300000 }, async (ctx, { gotoFlow, endFlow}) => {
                    if (ctx?.idleFallBack) {
                        return gotoFlow(flujoFinal);
                    }
                    const respuesta = ctx.body;
                    const mensaje = await interpretarIntencion(respuesta);
                    console.log("Intención interpretada:", mensaje);
                    if (mensaje === 'comprar') {
                        return gotoFlow(flowPrincipal);
                    } else if (mensaje === 'humano') {
                        const url = `https://api.whatsapp.com/send?phone=${NumVendor}`;
                        const insentivarMensaje = await enlaceWhatsapp(url, respuesta);
                        await flowDynamic(insentivarMensaje);
                    }
                    else {
                       const mensaje = 'Lo siento, no entendí tu mensaje. intentalo de nuevo.';
                        return endFlow(mensaje);
                    }
                });
            }
        }
    );

// --- Función principal ---
const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowCalificacion, flujoFinal, flowSatisfaccion]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb({ port: 3001 });
};

main();
