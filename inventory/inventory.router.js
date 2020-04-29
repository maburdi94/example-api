

const {
    getInventory,
    addInventory,
    updateInventory,
    deleteInventory,
    getTracking,
    getSuppliers,
    getRawMaterials
} = require("./inventory.controller");


const adjustments = require('./adjustments.sse');


// Handle requests
async function onRequest(request, response) {

    let method = request.method;
    let url = request.url || request.path;

    let path = [...url.matchAll(/\/([-\w]+)/g)].map(arr => arr[1]);

    if (path[0] === 'inventory') {

        if (path[1] === undefined) {
            if (method === 'GET') return getInventory(request, response);
            if (method === 'POST') return addInventory(request, response);
            // if (method === 'PUT') return updateInventory(request, response);
            if (method === 'PATCH') return updateInventory(request, response);
            if (method === 'DELETE') return deleteInventory(request, response);
        } else if (path[1] === 'tracking') {
            if (method === 'GET') return getTracking(request, response);
            // if (method === 'POST') return addTracking(request, response);
            // if (method === 'PUT') return updateInventory(request, response);
            // if (method === 'PATCH') return updateInventory(request, response);
            // if (method === 'DELETE') return deleteInventory(request, response);
        } else if (path[1] === 'adjustments') {
            return adjustments.handleRequest(request, response);
        }

    } else if (path[0] === 'suppliers') {
        if (method === 'GET') return getSuppliers(request, response);
    } else if (path[0] === 'raw-materials') {
        if (method === 'GET') return getRawMaterials(request, response);
    }

    response.statusCode = 404;
    response.end('Resource not found');
}

module.exports = onRequest;





