
// Functions from orders.controller
const {getProducts, getProduct} = require("./products.controller");


// Handle requests
async function onRequest(request, response) {

    let {url, method} = request;

    let re = /\/api\/products(?:\/([0-9]+))?$/;
    let [_, id] = re.exec(url) || [];

    if (method === 'GET') {
        if (id) {
            return getProduct(id, request, response);
        } else {
            return getProducts(request, response);
        }
    }

    // else if (method === 'POST')
    //     return submitOrder(request, response);

    //returns all product names from db
    // TODO Add Products route for these routes
    // if (/getProducts/.test(url.pathname)) {
    //     return getProducts(request, response);
    // }
    //returns ingredients for a given product
    // if(/getIngredients/.test(url.pathname)) {
    //     return getIngredients(request, response, url.query);
    // }
    //returns ingredients for a given product
    // else if(/getServingSize/.test(url.pathname)) {
    //     return getServingSize(request, response, url.query);
    // }

    // TODO This should be using a inventory route
    //returns amount in inventory for a given item
    // else if(/getInventoryAmount/.test(url.pathname)) {
    //     return getInventoryAmount(request, response, url.query);
    // }

    response.statusCode = 404;
    response.end('Resource not found');
}


module.exports = onRequest;





