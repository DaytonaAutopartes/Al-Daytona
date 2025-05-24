const { chromium } = require('playwright');

/**
 * Busca productos en daytonaautopartes.com usando scraping.
 * @param {string} producto - Nombre del producto a buscar.
 * @param {string} modelo - Modelo del auto (opcional).
 * @returns {Promise<{productos: Array, url: string}>}
 */
async function buscarProductos(producto, modelo) {
    const query = encodeURIComponent([producto, modelo].filter(Boolean).join(" "));
    const url = `https://daytonaautopartes.com/busqueda?s=${query}`;
    let browser, productos = [];
    try {
        browser = await chromium.launch({ headless: true, timeout: 15000 });
        const page = await browser.newPage();
        await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
        productos = await page.$$eval('article.product-miniature', results => results.map(el => ({
            title: el.querySelector('h3.product-title a')?.innerText || '',
            image: el.querySelector('img')?.src || '',
            price: el.querySelector('span.price')?.innerText || '',
            link: el.querySelector('h3.product-title a')?.href || ''
        })));
    } catch (error) {
        console.error("Error en scraping:", error);
    } finally {
        if (browser) await browser.close();
    }
    return { productos, url };
}

module.exports = { buscarProductos };
