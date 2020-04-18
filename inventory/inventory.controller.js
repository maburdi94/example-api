
let url = require('url');

let {getPostData} = require('../utils/http');

let mysql = require('../utils/sql');

module.exports.getInventory = async function(request, response) {

    let {query: params} = url.parse(request.url, true);

    // This is where we will put the response payload
    let result = {};

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
            }, []).join(' OR ');

        // Sorting
        let sort = params['sort'] || null;
        let order = params['order'] || 'asc';

        // Filters
        let type = params['type'];

        let lots = params['lot'] ? Array.isArray(params['lot']) ? params['lot'] : [params['lot']] : [];
        lots = lots.map(lot => `\'${lot}\'`).join(',');

        console.log(params['lot'], lots)

        let innerSelect = `SELECT * FROM (SELECT 
         rm,
         lot,
         RM.name as name,
         mfr, 
         qty,
         type,
         S.name as supplier,
         arrived,
         threshold,
         rack
         FROM Inventory I
         LEFT JOIN RawMaterial RM USING (rm)
         LEFT JOIN Supplier S ON (id = supplier)) T
         WHERE 1=1
         ${lots ? ` AND lot IN (${lots})` : ''}
         ${type ? ` AND type = \"${type}\"` : ''}
         ${searches ? ` AND ${searches}` : ''}`;


        let [[items, [{total}]]] = await mysql.query(`
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





module.exports.deleteInventory = async function(request, response) {

    let {query: params} = url.parse(request.url, true);

    let lots = Array.isArray(params['lot']) ? params['lot'] : [params['lot']];

    let connection = await mysql.getConnection();

    let totalAffected = 0;
    try {
        await connection.query('START TRANSACTION');

        for (let lot of lots) {
            let [results] = await mysql.query(`DELETE FROM Inventory WHERE lot = \'${lot}\';`);
            totalAffected += results.affectedRows;
        }

        await connection.query('COMMIT');
        response.statusCode = 200;

    } catch (e) {

        await connection.query('ROLLBACK');
        response.statusCode = 500;
    }

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({totalAffected}, null, 2));
};






module.exports.addInventory = async function(request, response) {

    let item = await getPostData(request);

    let {
        rm,
        type,
        name,
        lot,
        mfr,
        supplier,
        qty,
        arrived,
        rack,
    } = item,
        threshold;

    let result = {},
        errors = [];


    // Find if a Raw Material already exists for this RM #.
    let [results] = await mysql.query(`SELECT * FROM RawMaterial WHERE rm = ${rm}`);

    if (!(results.length)) {
        errors.push(`Invalid request. Could not find raw material with RM ${rm}`);
    }

    // if (!/L(18|19|20)[0-9]{4}/.test(lot)) {
    //     errors.push(`Invalid lot #: ${lot}. Must have form: L[2-digit year][####].`);
    // }

    try {
        new Date(arrived)
    } catch (e) {
        errors.push(new Error("Date arrived must be a valid date string."));
    }

    [results] = await mysql.query(`SELECT id FROM Supplier WHERE name = \'${supplier}\';`);

    if (!(results.length)) {
        let [results] = await mysql.query(`INSERT INTO Supplier (name) VALUES (\'${supplier}\');`);
        supplier = results.insertId;
    } else {
        supplier = results[0].id;
    }


    if (!errors.length) {

        let sql = `INSERT INTO Inventory (
            lot,
            rm,
            mfr,
            supplier,
            qty,
            rack,
            arrived
            ) VALUES (
                \'${lot}\',
                ${rm},
                \'${mfr}\',
                ${supplier},
                ${qty},
                \'${rack}\',
                \'${arrived}\'
            )`;

        console.log(sql);

        await mysql.query(sql);

        response.statusCode = 200;

    } else {

        response.statusCode = 400;
        result.errors = errors.join('\n');
    }


    response.write(JSON.stringify(result));



    response.end();
};



module.exports.getSuppliers =  async function (request, response) {

    let [results] = await mysql.query(`SELECT DISTINCT name, name as value FROM Supplier;`);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(results, null, 2));
};

module.exports.getRawMaterials =  async function (request, response) {

    let [results] = await mysql.query(`SELECT DISTINCT rm, name FROM RawMaterial;`);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(results, null, 2));
};


/**
 * Expects the payload to be an Array<Raw Material>.
 * If only one item is being updated, it should still be inside an Array as the single entry.
 * @param request
 * @param response
 * @return {Promise<void>}
 */
module.exports.updateInventory = async function (request, response) {

    let method = request.method;

    let data = await getPostData(request);

    if (method === 'PUT') {

        let items = Array.isArray(data) ? data : [data];

        let connection = await mysql.getConnection();

        try {
            await connection.query('START TRANSACTION');

            for (let item of items) {
                // await connection.query(`
                //     UPDATE Inventory
                //     SET
                //         qty = ${item.qty},
                //         rack = \'${item.rack}\'
                //     WHERE
                //         lot = \'${item.lot}\';`);
            }

            await connection.query('COMMIT');
            response.statusCode = 200;

        } catch (e) {

            await connection.query('ROLLBACK');
            response.statusCode = 500;
        }

    } else if (method === 'PATCH') {

        let {query: params} = url.parse(request.url, true);

        let {
            rm,
            type,
            name,
            lot,
            mfr,
            supplier,
            qty,
            arrived,
            rack,
        } = data;

        let sql = `UPDATE Inventory
            SET
                
        `;

        let fields = [];
        if (lot) fields.push(`lot = \'${lot}\'`);
        if (rm) fields.push(`rm = ${rm}`);
        // if (type) fields.push(`type = \'${rm}\'`);
        // if (name) fields.push(`name = \'${rm}\'`);
        if (mfr) fields.push(`mfr = \'${mfr}\'`);
        if (supplier) {

            let [results] = await mysql.query(`SELECT id FROM Supplier WHERE name = \'${supplier}\';`);

            if (!(results.length)) {
                [results] = await mysql.query(`INSERT INTO Supplier (name) VALUES (\'${supplier}\');`);
                supplier = results.insertId;
            } else {
                supplier = results[0].id;
            }

            fields.push(`supplier = ${supplier}`);
        }
        if (qty) fields.push(`qty = ${qty}`);
        if (arrived) {
            fields.push(`arrived = \'${new Date(arrived).toISOString().replace(/[TZ]/g, ' ')}\'`);
        }
        if (rack) fields.push(`rack = UPPER(\'${rack}\')`);

        sql += fields.join(',\n');

        sql += ` WHERE lot = \'${params.lot}\';`;

        try {
            await mysql.query(sql);
            response.statusCode = 200;
        } catch (e) {
            console.log(e);
            response.statusCode = 500;
        }

    }

    response.end();
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

        [items, [{pageCount}]] = await mysql.query(`SELECT * 
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
