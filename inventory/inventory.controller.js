
let url = require('url');

let {getPostData} = require('../utils/http');

let {query, beginTransaction} = require('../utils/sql');


module.exports.getFilterMeta = async function({url}, response) {
    let result = {};

    result.type = await query(`SELECT DISTINCT type FROM RawMaterial;`);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result, null, 2));
};


module.exports.getInventory = async function(request, response) {

    let {query: params} = url.parse(request.url, true);

    // This is where we will put the response payload
    let result = {};

    // Results
    let items = [],
        total = 1;

    try {

        // Paging
        let page = +params['page'] || 1,
            pageSize = +params['pageSize'] || null;

        // Searches
        let searches = Object.entries(params)
            .reduce((searches, [name, value]) => {
                let matches = /(\w+)_like/.exec(name);
                if (matches) {
                    searches.push(`${matches[1]} LIKE \'${value}%\'`);
                }
                return searches;
            }, []);

        // Sorting
        let sort = params['sort'] || null;
        let order = params['order'] || 'asc';

        // Filters
        let type = params['type'];

        let lots = (params['lot'] || []).map(lot => `\'${lot}\'`).join(',');


        let innerSelect = `SELECT * FROM (SELECT 
         rm,lot,RM.name as name,mfr, qty,type,S.name as supplier,S.id as s_id,arrived,threshold,rack
         FROM Inventory I
         LEFT JOIN RawMaterial RM USING (rm)
         LEFT JOIN Supplier S ON (id = supplier)) T
         WHERE 1=1
         ${lots ? ` AND lot IN (${lots})` : ''}
         ${type ? ` AND type = \"${type}\"` : ''}
         ${searches.length ? ` AND ${searches.join(' OR ')}` : ''}`;


        [items, [{total}]] = await query(`
        SELECT * FROM (${innerSelect}) T
             ${sort ? `ORDER BY ${sort} ${order}` : ''}
             ${pageSize ? `LIMIT ${(page - 1) * pageSize}, ${pageSize}` : ''};
         
         SELECT Count(*) as total FROM (${innerSelect}) T;`);

        result = {
            items,
            page,
            total,
        };

    } catch (e) {
        console.error(e);
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result, null, 2));
};


module.exports.addRawMaterial = async function(request, response){
    let items = await getPostData(request);
    // insert objects (items) into the Virun database using MySQL Insert
    // INSERT INTO [table] VALUES [obj.rm_name, obj.rm_number, obj.rm_type...]
    /*-------example---------------
        rm_name: 'test',
        rm_number: '10',
        rm_type: 'water'
    -----------------------------*/
    console.log(items);
    let rm_quantity = 0;
    console.log("test1");
    let rawMaterial = `INSERT INTO rawmaterial VALUES ("`+items.rm_number+`", "`+items.rm_name+`",  "`+items.rm_type+`");`;
    console.log("Test2");
    let inventory = `INSERT INTO inventory VALUES (null, "`+items.rm_number+`", "`+rm_quantity+`");`;
    console.log(typeof items.rm_number);
    try
    {
        query(rawMaterial);
        console.log("Test3");
        query(inventory);
        console.log("test4");
        response.statusCode = 200;
    } catch(e) {
        response.statusCode = 500;
    }
    response.end();
}


module.exports.addInventory = async function(request, response) {

    let items = await getPostData(request);
    // insert object (items) values into the Virun database using MySQL INSERT
    // INSERT INTO [table] VALUES [obj.name, obj.description, obj.rm-name...]
    /*-------example---------------
        product_number: '1',
        product_name: 'test',
        product_descripton: 'test',
        product_serving_size: '2',
        rm_name: 'Process Water',
        rm_serving_size: '2'
    -----------------------------*/
    console.log(items);
    let rm_quantity = 0;
    let rm_number = 0;
    let product = `INSERT INTO product VALUES ("`+items.product_number+`", "`+items.product_name+`", "`+items.product_description+`", "`+items.product_serving_size+`");`;
    let prodIngredient = `INSERT INTO productingredient VALUES ("`+items.product_number+`", "`+rm_number+`", "`+items.rm_serving_size+`");`;;
    let inventory = `INSERT INTO inventory VALUES ("`+items.product_number+`", "`+rm_number+`", "`+rm_quantity+`");`
    
    try
    {
        query(product);
        query(prodIngredient);
        query(inventory);
        response.statusCode = 200;
    } catch(e) {
        response.statusCode = 500;
    }
    response.end();
};


/**
 * Expects the payload to be an Array<Raw Material>.
 * If only one item is being updated, it should still be inside an Array as the single entry.
 * @param request
 * @param response
 * @param URL
 * @return {Promise<void>}
 */
module.exports.updateInventory = async function (request, response, {searchParams: params}) {

    let {url, method} = request;

    let {items} = await getPostData(request);

    if (!Array.isArray(items)) {
        throw new Error("Resource at " + method + " " + url + " expects an array.");
    }

    let transaction = await beginTransaction();

    try {
        for (let item of items) {
            transaction.query(`
                UPDATE Inventory 
                SET 
                    qty = ${item.qty}, 
                    rack = \'${item.rack}\'
                WHERE
                    lot = \'${item.lot}\';`);
        }
        transaction.commit(); // No errors. Commit changes.
        response.statusCode = 200;
    } catch (e) {
        transaction.rollback(); // Errors! Rollback transaction.
        response.statusCode = 500;
    }
    response.end();
};






module.exports.createPurchaseOrder = async function(request, response, {searchParams: params}) {

    let data = await getPostData(request);

    if (!Array.isArray(data)) {
        response.statusCode = 400;
        response.write("POST body expected to be an array.\n");
        response.end();
    } else {
        for (let item of data) {
            let sql = `INSERT INTO PurchaseInventory (${Object.keys(item).join(', ')}) 
                VALUES(${Object.values(item).join(', ')})`;
            console.log(sql);
            await query(sql);
        }
    }
};


module.exports.getPurchases = async function (request, response, {searchParams: params}) {
    // This is where we will put the response payload
    let result = {};

    // Results
    let items = [],
        pageCount = 1;

    try {

        // Paging
        let page = +params.get('page') || 1,
            pageSize = +params.get('pageSize') || null;

        // Sorting
        let sort = params.get('sort') && params.get('sort').split(':');

        // Filters
        let search = params.get('search');

        [items, [{pageCount}]] = await query(`SELECT * 
        FROM (
             SELECT 
                PO.id,
                rm,
                RM.name as name,
                qty,
                S.name as supplier,
                S.id as s_id,
                status,
                placed
             FROM PurchaseInventory PO
             LEFT JOIN RawMaterial RM USING (rm)
             LEFT JOIN Supplier S ON (S.id = PO.supplier)
             ${sort ? `ORDER BY ${sort[0]} ${sort[1]}` : ''}
             ${pageSize ? `LIMIT ${(page - 1) * pageSize}, ${pageSize}` : ''}) T
         WHERE 1=1
         ${search ?  ` AND name LIKE \'${search}%\' OR lot LIKE \'${search}%\'` : ''};
         SELECT ${pageSize ? `CEIL(Count(*) / ${pageSize})` : 1} as pageCount FROM PurchaseInventory;`);

        result = {
            items,
            page,
            pageCount
        };

    } catch (e) {
        console.error(e);
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result, null, 2));
};
