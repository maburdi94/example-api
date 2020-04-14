

const {
    getInventory,
    addInventory,
    updateInventory,
    getFilterMeta,
    createPurchaseOrder,
    getPurchases
} = require("./inventory.controller");

// Handle requests
async function onRequest(request, response) {

    let method = request.method;
    let url = request.url || request.path;

    let re = /^\/api\/(inventory|purchases)(?:\/(filter|))?/;
    let [_, ...routes] = re.exec(url) || [];

    console.log(_, ...routes);

    if (routes[0] === 'purchases') {
        if (method === 'POST') return createPurchaseOrder(request, response);
        if (method === 'GET') return getPurchases(request, response);
    } else if (routes[0] === 'inventory') {
        if (routes[1] === 'filter') {
            return getFilterMeta(request, response);
        }
        else if (routes[1] === undefined) {
            if (method === 'GET') return getInventory(request, response);
            if (method === 'POST') return addInventory(request, response);
            if (method === 'PUT') return updateInventory(request, response);
        }
    }

    response.statusCode = 404;
    response.end('Resource not found');
}

module.exports = onRequest;





