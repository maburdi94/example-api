

const {
    getInventory,
    addInventory,
    updateInventory,
    deleteInventory,
    getPurchases,
    getChanges,
    getSuppliers,
    getRawMaterials
} = require("./inventory.controller");

// Handle requests
async function onRequest(request, response) {

    let method = request.method;
    let url = request.url || request.path;

    let path = [...url.matchAll(/\/([-\w]+)/)].map(arr => arr[1]);

    if (path[0] === 'inventory') {

        if (path[1] === undefined) {
            if (method === 'GET') return getInventory(request, response);
            if (method === 'POST') return addInventory(request, response);
            // if (method === 'PUT') return updateInventory(request, response);
            if (method === 'PATCH') return updateInventory(request, response);
            if (method === 'DELETE') return deleteInventory(request, response);
        } else if (path[1] === 'changes') {
            if (method === 'GET') return getChanges(request, response);
            // if (method === 'POST') return addInventory(request, response);
            // if (method === 'PUT') return updateInventory(request, response);
            // if (method === 'PATCH') return updateInventory(request, response);
            // if (method === 'DELETE') return deleteInventory(request, response);
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





