

const {
    getInventory,
    addInventory,
    updateInventory,
    deleteInventory,
    getPurchases,
    getSuppliers,
    getRawMaterials
} = require("./inventory.controller");

// Handle requests
async function onRequest(request, response) {

    let method = request.method;
    let url = request.url || request.path;

    let path = [...request.url.slice(4 /* remove /api */).matchAll(/\/([-\w]+)/)].map(arr => arr[1]);

    console.log(path);

    // if (path[0] === 'purchases') {
    //     if (method === 'POST') return createPurchaseOrder(request, response);
    //     if (method === 'GET') return getPurchases(request, response);
    // } else
    if (path[0] === 'inventory') {
        if (method === 'GET') return getInventory(request, response);
        if (method === 'POST') return addInventory(request, response);
        if (method === 'PUT') return updateInventory(request, response);
        if (method === 'PATCH') return updateInventory(request, response);
        if (method === 'DELETE') return deleteInventory(request, response);
    } else if (path[0] === 'suppliers') {
        if (method === 'GET') return getSuppliers(request, response);
    } else if (path[0] === 'raw-materials') {
        if (method === 'GET') return getRawMaterials(request, response);
    }

    response.statusCode = 404;
    response.end('Resource not found');
}

module.exports = onRequest;





