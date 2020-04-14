
const {getPostData} = require('../utils/http');
const {query, getConnection} = require('../utils/sql');


function getOrders({search} = {}) {
    let sql = `SELECT 
         order_id AS _id,
         order_company AS company, 
         order_description AS description, 
         order_status AS status, 
         order_date AS date
     FROM PurchaseOrders
     ${search ? `WHERE 
        order_description LIKE \'${search}%\'` : ''};`;
    return query(sql);
}


// module.exports.batchRecords = async function batchRecords(request, response, path) {
//     var segment_array = path.split('/');
//     var order_id = segment_array.pop();
//
//     let sql = `SELECT
//          lot_number,
//          product_number,
//          product_quantity,
//          batch_size
//      FROM BatchRecord
//         WHERE order_id = ${order_id}`;
//
//     let batchrecords = await query(sql);
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(batchrecords));
//
// }


// module.exports.cancelOrder = async function cancelOrder(request, response) {
//
//     let req = await getPostData(request);
//
//     let order_id = req.order_id;
//     let batch_record_details = req.batch_record_details;
//     let batch_records = req.batch_records;
//
//     let connection = await getConnection();
//
//     try {
//         let sql = '';
//
//         // Perform batch updates
//         connection.beginTransaction();
//
//         // Each batch record
//         for(let i = 0; i < batch_records.length; i++) {
//             let cur_qty_ordered = batch_record_details[i].product_quantity;
//             let cur_recipe = batch_records[i].recipe;
//
//             // Each ingredient type
//             for (let [category, ingredients] of Object.entries(cur_recipe)) {
//
//                 // Each ingredient
//                 for(let ingredient of ingredients) {
//                     let addBackToInventory = cur_qty_ordered * ingredient.rm_serving_size;
//                     sql += `UPDATE Inventory
//                             SET rm_quantity =  rm_quantity + ${addBackToInventory}
//                             WHERE rm_number = ${ingredient.rm_number};`
//
//                 }
//             }
//         }
//
//         // Finally, update order status
//         sql += `UPDATE PurchaseOrders
//             SET order_status = 'CANC'
//             WHERE order_id = ${order_id};`;
//
//         // Execute transaction statements
//         connection.query(sql);
//
//         // Once committed, the transaction succeeds and cannot be rolled back.
//         connection.commit();
//
//         response.statusCode = 200;
//
//     } catch (e) {
//
//         // MySQL transaction can be rolled back if they failed.
//         connection.rollback();
//
//         response.statusCode = 500;
//     }
//
//     response.setHeader('Content-Type', 'application/json');
//     response.end();
// };
//
//
// module.exports.updateOrderStatus = async function(request, response) {
//
//     let req = await getPostData(request);
//     let order_id = req.order_id;
//
//     try{
//         await query(`UPDATE PurchaseOrders
//                 SET order_status =  'DONE'
//                 WHERE order_id = ${order_id};`);
//     }
//     catch (e) {
//         response.statusCode = 500;
//     }
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end();
// }


// TODO: This endpoint is very complex
// module.exports.validatePO = async function(request, response) {
//
//     let search = request.url.slice(request.url.indexOf('?'));
//     let params = new URLSearchParams(search);
//     const ingredientTotals = new Map();
//
//     //get totals of all products and save in ingredientTotals map
//     for(let [product_number, product_qty] of params) {
//         let q = `
//         SELECT rm_number, rm_serving_size
//         FROM ProductIngredient
//         WHERE product_number = \'${product_number}\';`;
//
//         let product_ingredients = await query(q);
//
//         product_ingredients.forEach(function({rm_number, rm_serving_size}){
//             let totalQtyNeeded = rm_serving_size * product_qty;
//             let currentValue = ingredientTotals.get(rm_number);
//             ingredientTotals.set(rm_number, (currentValue || 0) + totalQtyNeeded);
//         });
//     }
//
//     //for each rm in ingredientTotals map, check db if sufficient inventory available
//     let responseObj = {
//         canFulfillOrder: true,
//         ingredientInfo: []
//     };
//
//
//     for(let [rm_number, required_material] of ingredientTotals) {
//         let q = `
//         SELECT rm_quantity
//         FROM Inventory
//         WHERE rm_number = \'${rm_number}\';
//         SELECT rm_name
//         FROM RawMaterial
//         WHERE rm_number = \'${rm_number}\'; `;
//
//         let [[cur_inventory], [rm_name]] = await query(q);
//
//         if(required_material > cur_inventory.rm_quantity) {
//             responseObj.canFulfillOrder = false;
//
//             let currentItem = {
//                 rm_number: rm_number,
//                 rm_name: rm_name.rm_name,
//                 qty_required_by_order: required_material,
//                 qty_on_hand: cur_inventory.rm_quantity
//             }
//             //console.log(currentItem);
//             responseObj.ingredientInfo.push(currentItem);
//         }
//     }
//
//     //if canFulfillOrder var true =>
//     //  means that we can just return true and allow ability to submit order on client-side
//     if(responseObj.canFulfillOrder) {
//         responseObj = {
//             canFulfillOrder: true
//         };
//     }
//
//     //otherwise it will send on responseObject with a list of raw materials w/attributes:
//     //  -rm_number, rm_name, qty_req_by_order, and cur_inventory_qty
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(responseObj));
// }


// TODO: Implement and simplify this endpoint
// module.exports.submitOrder = async function(request, response) {
//     let req = await getPostData(request);
//
//     let order_information = req.order_information;
//     let order_items = req.order_items;
//
//     //console.log(order_information.description);
//     //console.log(order_information.company);
//
//     //FIRST CHECK IF BATCH RECORDS ALREADY EXIST BEFORE TRYING TO INSERT ANYTHING
//     for(let order_item of order_items) {
//         let q = `SELECT * FROM BatchRecord
//                     WHERE lot_number = \'${order_item.lot_number}\' AND
//                     product_number = ${order_item.product_number};`
//         let result = await query(q);
//         if(result.length > 0){
//             response.statusCode = 409;
//             response.setHeader('Content-Type', 'application/json');
//             response.end();
//             return;
//         }
//     }
//
//     // 1. Add order to PurchaseOrders
//     try{
//         await query(`INSERT INTO PurchaseOrders(order_description, order_company)
//         VALUES(\'${order_information.description}\', \'${order_information.company}\');`);
//     }
//     catch (e) {
//         response.statusCode = 500;
//         response.setHeader('Content-Type', 'application/json');
//         response.end();
//     }
//
//     // 2. Add each order item to new BatchRecord && subtract each order_item's ingredients from inventory
//     for(let order_item of order_items) {
//         let ingredients = await query(
//             `SELECT rm_number, rm_serving_size
//                 FROM ProductIngredient
//                 WHERE product_number = ${order_item.product_number}`);
//
//         for(let ing of ingredients) {
//             let qty_to_subtract = ing.rm_serving_size * order_item.qty_ordered;
//             let [rm_quantity] = await query(`SELECT rm_quantity FROM Inventory
//                         WHERE rm_number = ${ing.rm_number};`);
//             try{
//                 await query(`UPDATE Inventory
//                         SET rm_quantity =  rm_quantity - ${qty_to_subtract}
//                         WHERE rm_number = ${ing.rm_number};`);
//             }
//             catch (e) {
//                 response.statusCode = 500;
//             }
//         }
//
//         try{
//             await query(`INSERT INTO BatchRecord(lot_number, product_number, product_quantity, batch_size, order_id)
//             VALUES(\'${order_item.lot_number}\',
//                 ${order_item.product_number},
//                 ${order_item.qty_ordered},
//                 ${order_item.batch_size},
//                 LAST_INSERT_ID());`);
//         }
//         catch (e) {
//             response.statusCode = 500;
//             response.setHeader('Content-Type', 'application/json');
//             response.end();
//         }
//     }
//
//     // response.statusCode = 500;
//     // response.setHeader('Content-Type', 'application/json');
//     // response.end();
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end();
// }


// function groupBy(xs, key) {
//     return xs.reduce((rv, x) => {
//         (rv[x[key]] = rv[x[key]] || []).push(x);
//         return rv;
//     }, {});
// }

// module.exports.showBatch = async function(request, response, {product_number}) {
//     let sql = `
//     SELECT * FROM Product WHERE product_number = ${product_number};
//     SELECT *
//         FROM ProductIngredient
//         INNER JOIN RawMaterial USING (rm_number)
//         WHERE product_number = ${product_number};`;
//
//     let [[product], ingredients] = await query(sql);
//
//     if (product) {
//         let recipe = groupBy(ingredients, 'rm_type');
//         response.statusCode = 200;
//         response.setHeader('Content-Type', 'application/json');
//         response.end(JSON.stringify({
//             ...product,
//             recipe
//         }));
//         return;
//     }
// }


function compare(a, b) {
    return a > b ? 1 : a === b ? 0 : -1
}
function sortItems(list, property, asc = true) {
    if (asc) {
        list.sort((a, b) => compare(a[property], b[property]));
    } else {
        list.sort((a, b) => compare(b[property], a[property]));
    }
}


// module.exports.getProducts = async function(request, response) {
//
//     let q = `
//         SELECT product_number, product_name
//         FROM Product`;
//
//     let products = await query(q);
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(products));
// };
//
//
// module.exports.getIngredients = async function(request, response, {product_number}) {
//
//     let q = `
//         SELECT rm_number, rm_serving_size
//         FROM ProductIngredient
//         WHERE product_number = \'${product_number}\';`;
//
//     let product_ingredients = await query(q);
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(product_ingredients));
// };
//
//
// module.exports.getServingSize = async function(request, response, {cur_product_number}) {
//
//     let q = `
//         SELECT product_serving_size
//         FROM Product
//         WHERE product_number = \'${cur_product_number}\';`;
//
//     let [product_serving_size] = await query(q);
//
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(product_serving_size));
// };
//
//
// module.exports.getInventoryAmount = async function(request, response, {rm_number}) {
//
//     let q = `
//         SELECT rm_quantity
//         FROM Inventory
//         WHERE rm_number = \'${rm_number}\'`;
//
//     let inventory_qty = await query(q);
//     response.statusCode = 200;
//     response.setHeader('Content-Type', 'application/json');
//     response.end(JSON.stringify(inventory_qty));
// };


module.exports.getOrders = async function(request, response, {searchParams: params}) {

    // Paging
    let page = params.get('page') || 1,
        pageSize = params.get('pageSize') || 10,
        pageStart = (page - 1) * pageSize,
        pageEnd = pageStart + pageSize;

    // Sorting
    let sort = params.get('sort') && params.get('sort').split(':');

    // Filters
    let like = params.get('search');

    // Results
    let items = [],
        pages = 0;

    try {

        items = await getOrders({search: like});

        // Sort
        if (sort) sortItems(items, sort[0], sort[1] === 'asc');

        pages = Math.ceil(items.length / pageSize);

        // Limit / Offset
        items = items.slice(pageStart, pageEnd);

    } catch (e) {
        console.error(e);
    }

    let result = {
        items,
        pages
    };

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result, null, 2));
};

