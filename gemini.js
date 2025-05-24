// 1. Importaciones y configuración de entorno
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 2. Inicialización de la API
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// 3. Definición de funciones

// Función: Enlace de WhatsApp
async function enlaceWhatsapp(url, producto) {
    try {
        const productoEncoded = encodeURIComponent(producto);
        const enlace = `https://api.whatsapp.com/send?phone=50688888888&text=Hola%20me%20interesa%20el%20producto%20${productoEncoded}`;
        const prompt = `No hubo resultado del producto que estás buscando en nuestra página web, pero puedes contactar a nuestro agente de ventas en el siguiente enlace: "${enlace}". 
        Genera un mensaje persuasivo que incluya este enlace, con un llamado a la acción para contactar al agente de ventas. Si puedes, incluye emojis para hacerlo más atractivo. Que sea un mensaje corto y directo. Humaniza el mensaje, pero no lo hagas tan largo.
        Devuelve solo el mensaje completo, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en enlaceWhatsapp:", error);
        return "Lo siento, ocurrió un error al generar el enlace de WhatsApp.";
    }
}

// Función: Generar información de la tienda
async function generarInformacionTienda() {
    try {
        const prompt = `Genera un mensaje que contenga la información de la tienda, incluyendo el nombre, la ubicación, el horario de atención, el teléfono, el correo electrónico y el giro de la tienda.
        Devuelve solo el texto del mensaje, sin etiquetas de código ni formato adicional.`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```/g, "").replace(/\n/g, "").trim();
        return text;
    }
    catch (error) {
        console.error("Error en generarInformacionTienda:", error);
        return "Lo siento, ocurrió un error al generar la información de la tienda.";
    }
}

// Función: Guía de compra
async function guiadeCompra(respuesta, url) {
    try {
        const prompt = `Según la respuesta del cliente: "${respuesta}", genera un mensaje claro y humano que lo guíe en el proceso de compra.

        Si la respuesta es "Sí", explica de forma sencilla cómo comprar el producto en nuestra página web, utilizando una lista numerada con **saltos de línea reales** (usa el carácter de nueva línea, no texto "\\n"). Incluye estos pasos:

        1. Haz clic en el enlace proporcionado anteriormente.
        2. Selecciona la cantidad deseada.
        3. Haz clic en "Añadir al carrito".
        4. Haz clic en "Finalizar compra".
        5. Ingresa tus datos de envío y pago.
        6. Haz clic en "Confirmar compra".

        Menciona que, si aún no tiene una cuenta, puede crearla durante el proceso de compra. Usa emojis para hacerlo más atractivo. El mensaje debe ser breve, fácil de leer y motivador.

        Si la respuesta es "No", ofrece ayuda adicional o una disculpa, e invita al cliente a contactar a un agente de ventas usando este enlace: ${url}. Usa emojis y mantén el mensaje corto y directo.

        Devuelve solo el texto del mensaje, con saltos de línea visibles entre cada paso. No incluyas etiquetas de código ni comillas ni ningún formato adicional.`;


        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en guiadeCompra:", error);
        return "Lo siento, ocurrió un error al generar la guía de compra.";
    }
}

// Función: Incentivar compra
async function insentivarCompra(producto) {
    try {
        const prompt = `Genera un mensaje que incentive al cliente a comprar el siguiente producto: "${producto}" por nuestra página web, ingresando al link que se proporcionaron
        en los mensajes anteriores. Que el mensaje no sea muy largo, pero que sea persuasivo y atractivo.
        Incluye emojis para hacerlo más atractivo. 
        Devuelve solo el texto del mensaje, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en insentivarCompra:", error);
        return "Lo siento, ocurrió un error al generar el mensaje de incentivo.";
    }
}

// Función: Interpretar intención
async function interpretarIntencion(mensaje) {
    try {
        const prompt = `Analiza el siguiente mensaje: "${mensaje}". 
        Devuelve un JSON con la clave "intencion" que indique la intención del cliente (por ejemplo: "humano", "comprar").
        Si el mensaje no contiene suficiente información para identificar la intención, devuelve "indefinido".
        Si no puedes determinar la intención, devuelve "indefinido".
        Devuelve solo el JSON, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```json|```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en interpretarIntencion:", error);
        return "indefinido";
    }
}

// Función: Interpretar mensaje (extrae producto y modelo)
async function interpretarMensaje(mensaje) {
    try {
        const prompt = `Del siguiente mensaje: "${mensaje}", identifica y extrae únicamente el nombre del repuesto (producto de auto) y el modelo de vehículo, si están presentes. 
        Devuelve solo un JSON con las claves "producto" y "modelo". Si solo se menciona el producto, incluye solo ese campo y deja "modelo" vacío. 
        Si el mensaje no corresponde a un producto o no contiene información relevante, devuelve "producto": "indefinido" y "modelo": "".
        No incluyas texto adicional ni etiquetas de código. No incluyas el año del vehículo.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Eliminamos posibles etiquetas de código y saltos de línea
        text = text.replace(/```json|```/g, "").replace(/\n/g, "").trim();

        // Parseamos la respuesta como JSON
        const data = JSON.parse(text);
        const producto = data.producto?.trim() || "";
        const modelo = data.modelo?.trim() || "";

        // Construimos el mensaje de búsqueda limpio
        const mensajeBusqueda = `${producto} ${modelo}`.trim();

        return mensajeBusqueda;
    } catch (error) {
        console.error("Error en interpretarMensaje:", error);
        return mensaje;
    }
}

// Función: Interpretar satisfacción
async function interpretarSatisfaccion(respuesta) {
    try {
        const prompt = `Basándote en la respuesta: "${respuesta}", interpreta si el cliente está diciendo "Sí" o "No". 
        Devuelve un JSON con la clave "respuesta" que contenga únicamente "si" o "no", según corresponda. 
        No incluyas etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```json|```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en interpretarSatisfaccion:", error);
        return "indefinido";
    }
}

// Función: Mensaje interpretado
async function mensajeInterpretado(mensaje) {
    try {
        const prompt = `Según el siguiente mensaje: "${mensaje}", genera un mensaje interpretado que resuma la intención del cliente.
        Devuelve una clave "mensaje" que contenga el mensaje interpretado.
        Devuelve solo el texto del mensaje. No incluyas etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en mensajeInterpretado:", error);
        return "Lo siento, ocurrió un error al generar el mensaje interpretado.";
    }
}

// Función: Mensaje de satisfacción
async function mensajeSatisfaccion(mensaje, url) {
    try {
        const prompt = `Genera un mensaje para el cliente, basado en la respuesta: "${mensaje}".
        Si la respuesta es "Si", genera un mensaje positivo y agradecido incentivando a que el cliente pueda adquirir su producto haciendo en la web, donde obtendrá descuentos, premios y que es totalmente seguro. 
        Si la respuesta es "No", genera un mensaje que ofrezca ayuda adicional o una disculpa e incentive a que pueda contactar a un agente de ventas mandando el siguiente enlace ${url}. 
        Agrega emojis para hacerlo más atractivo. Que sea un mensaje corto y directo. Humaniza el mensaje, pero no lo hagas tan largo.
        Devuelve solo el texto del mensaje, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en mensajeSatisfaccion:", error);
        return "Lo siento, ocurrió un error al generar el mensaje de satisfacción.";
    }
}

// Función: Producto es Tico
async function productoEsTico(mensaje) {
    try {
        const prompt = `Analiza cuidadosamente el siguiente mensaje: "${mensaje}". 
        Determina si el cliente está consultando por un repuesto o accesorio específico para un vehículo Daewoo Tico (también conocido solo como "Tico").
        Si el mensaje menciona explícitamente un producto para un Daewoo Tico, responde únicamente con el texto: estico.
        Si no se menciona ningún producto relacionado con un Daewoo Tico, responde únicamente con el texto: indefinido.
        No incluyas texto adicional, explicaciones ni etiquetas de código. Devuelve solo la palabra correspondiente.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```json|```/g, "").replace(/\n/g, "").trim();

        return text;
    }
    catch (error) {
        console.error("Error en productoEsTico:", error);
        return "indefinido";
    }
}

// Función: Generar respuesta
async function generarRespuesta(mensaje, contexto) {
    try {
        const prompt = `Basándote en el siguiente mensaje: "${mensaje}" y el contexto: "${contexto}", si no logras entender claramente lo que el cliente desea, genera una respuesta indicando que no se entendió la solicitud. Además, sugiere que si desea comprar escriba la palabra "comprar", o si prefiere hablar con un agente de ventas escriba la palabra "humano". Si el mensaje es claro y suficiente, responde normalmente. Devuelve solo el texto de la respuesta, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en generarRespuesta:", error);
        return "Lo siento, ocurrió un error al generar la respuesta. ¿Podrías proporcionar más detalles sobre el producto?";
    }
}

// Función: Respuesta por intención
async function respuestaIntencion(mensaje, intencion) {
    try {
        const prompt = `Basándote en el siguiente mensaje: "${mensaje}" y la intención: "${intencion}", genera una respuesta adecuada para el cliente.
        Devuelve solo el texto de la respuesta, sin etiquetas de código ni formato adicional.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```/g, "").replace(/\n/g, "").trim();

        return text;
    } catch (error) {
        console.error("Error en respuestaIntencion:", error);
        return "Lo siento, ocurrió un error al generar la respuesta. ¿Podrías proporcionar más detalles sobre el producto?";
    }
}

// 4. Exportación de funciones
module.exports = {
    interpretarMensaje,
    interpretarIntencion,
    respuestaIntencion,
    generarRespuesta,
    insentivarCompra,
    enlaceWhatsapp,
    interpretarSatisfaccion,
    mensajeSatisfaccion,
    mensajeInterpretado,
    productoEsTico,
    guiadeCompra
};
