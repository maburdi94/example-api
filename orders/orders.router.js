
const {submitOrder, getOrders} = require("./orders.controller");

// Handle requests
async function onRequest(request, response, url) {

    let {method} = request;

    try {
        let re = /^\/api\/orders\/?$/;
        let [_, route] = re.exec(url.pathname);

        // if (route === undefined) {
            if (method === 'GET') return getOrders(request, response, url);
            if (method === 'POST') return submitOrder(request, response);
        // }
    } catch (e) {

        console.error(e);

        response.statusCode = 404;
        response.end('Resource not found');
    }

    // if(request.method === 'PUT') {
    //     if (/cancel/.test(url.pathname)) {
    //         return cancelOrder(request, response);
    //     }
    //     else if (/updateOrderStatus/.test(url.pathname)) {
    //         return updateOrderStatus(request, response);
    //     }
    // }

}


module.exports = onRequest;





