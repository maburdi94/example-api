
let url = require('url');

let {getPostData, getTokenPayload} = require('../utils/http');

let adjustments = require('./adjustments.sse');

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


        let innerSelect = `SELECT * FROM (SELECT
         LPAD(rm, 6, '0') as rm,
         lot,
         RM.name as name,
         mfr,
         qty,
         type,
         S.name as supplier,
         DATE_FORMAT(arrived, '%Y-%m-%d %h:%i %p') as arrived,
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

    let user = getTokenPayload(request, response);

    let connection = await mysql.getConnection();
    let totalAffected = 0;

    try {

        connection.query('START TRANSACTION');

        for (let lot of lots) {

            await connection.query(`
                SELECT * FROM Inventory WHERE lot = \'${lot}\'; 
                DELETE FROM Inventory WHERE lot = \'${lot}\';`)
                .then(function ([[[item], {affectedRows}]]) {
                    if (params['tracking']) {
                        connection.query(`
                            INSERT INTO TrackInventoryChanges 
                            VALUES (default, \'${lot}\', \'DELETE\', \'${JSON.stringify(item)}\', null, ${user.id}, default);`)
                            .then(function (results) {
                                let [{insertId}] = results;
                                connection.query(`
                                    SELECT 
                                        TrackInventoryChanges.*, 
                                        UserInv.username, 
                                        UserInv.role, 
                                        UserInv.name,
                                        UserInv.image
                                    FROM TrackInventoryChanges, UserInv 
                                    WHERE user_id = UserInv.id 
                                    AND TrackInventoryChanges.id = ${insertId}`)
                                    .then(function ([[data]]) {
                                        adjustments.emit(data);
                                    });
                            })
                    }
                });

        }

        connection.query('COMMIT');
        response.statusCode = 200;

    } catch (e) {
        console.error(e);

        await connection.query('ROLLBACK');
        response.statusCode = 500;

    }

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({totalAffected}, null, 2));
};

module.exports.addInventory = async function(request, response) {

    let item = await getPostData(request);

    let {query: params} = url.parse(request.url, true);

    let user = getTokenPayload(request, response);

    let {
        rm,
        lot,
        mfr,
        supplier,
        qty,
        arrived,
        rack,
    } = item;


    arrived = new Date(arrived).toISOString().replace(/[TZ]/g, ' ');

    try {

        mysql.query(`
            INSERT INTO Inventory 
            VALUES (\'${lot}\',${rm},\'${mfr}\',${supplier},${qty},\'${rack}\',\'${arrived}\')`)
            .then(function (err, results) {
                if (params['tracking']) {
                    mysql.query(`
                        INSERT INTO TrackInventoryChanges 
                        VALUES (default,\'${lot}\',\'ADD\',\'${JSON.stringify(item)}\',null,${user.id},default);`)
                        .then(function (results) {
                            let [{insertId}] = results;
                            mysql.query(`
                                SELECT 
                                    TrackInventoryChanges.*, 
                                    UserInv.username, 
                                    UserInv.role, 
                                    UserInv.name,
                                    UserInv.image 
                                FROM TrackInventoryChanges, UserInv 
                                WHERE user_id = UserInv.id 
                               AND TrackInventoryChanges.id = ${insertId}`)
                                .then(function ([[data]]) {
                                    adjustments.emit(data);
                                });
                        });
                }
            });


        response.statusCode = 200;
    } catch (e) {
        console.error(e);
        response.statusCode = 400;
    }

    response.end();
};

module.exports.updateInventory = async function (request, response) {

    let {data: item, changes} = await getPostData(request);

    let {query: params} = url.parse(request.url, true);

    let user = getTokenPayload(request, response);

    let {lot} = item;

    try {

        mysql.query(`
            UPDATE Inventory 
            SET ${Object.entries(changes).map(([key, [_, newValue]]) => key + ' = ' + newValue).join(',\n')}
            WHERE lot = \'${lot}\';`)
            .then(function (results) {
                if (params['tracking']) {
                    mysql.query(`
                        INSERT INTO TrackInventoryChanges 
                        VALUES (default,\'${lot}\',\'UPDATE\',\'${JSON.stringify(item)}\',\'${JSON.stringify(changes)}\',${user.id},default);`)
                        .then(function (results) {
                            let [{insertId}] = results;
                            mysql.query(`
                                SELECT 
                                    TrackInventoryChanges.*, 
                                    UserInv.username, 
                                    UserInv.role, 
                                    UserInv.name,
                                    UserInv.image 
                                FROM TrackInventoryChanges, UserInv 
                                WHERE user_id = UserInv.id 
                                AND TrackInventoryChanges.id = ${insertId}`)
                                .then(function ([[data]]) {
                                    console.log(data);
                                    adjustments.emit(data);
                                });
                        });
                }
            });


        response.statusCode = 200;

    } catch (e) {
        console.log(e);
        response.statusCode = 500;
    }


    response.end();
};


module.exports.getTracking = async function(request, response) {

    let [results] = await mysql.query(`
        SELECT 
            TrackInventoryChanges.*, 
            UserInv.username, 
            UserInv.role, 
            UserInv.name,
            UserInv.image 
        FROM TrackInventoryChanges, UserInv 
        WHERE user_id = UserInv.id
        ORDER BY changed_on DESC;`);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(results, null, 2));
};



module.exports.getSuppliers =  async function (request, response) {

    let [results] = await mysql.query(`SELECT DISTINCT id as value, name as title FROM Supplier ORDER BY name;`);

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
