
const mysql = require('mysql');
const fs = require('fs');

const RandExp = require('randexp');

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'localusr',
    password : 'viruninv',
    database : 'Virun_Inventory'
});

const INGREDIENTS = loadIngredients();
const SUPPLIERS = loadSuppliers();
const PRODUCTS = loadProducts();

const RAND_LOT = new RandExp(/L(18|19|20)[0-9]{4}/);
const RAND_MFR = new RandExp(/([SLZ])-[A-Z]{2}[0-9]{3}/);
const RAND_RACK = new RandExp(/([ABC]-[0-9])/);
const RAND_PHONE = new RandExp(/\([1-9]{3}\)[1-9]{3}-[0-9]{4}/);


async function insertProducts() {

    for (let product_name of PRODUCTS) {
        let pSql = `INSERT INTO Product (name) VALUES (\'${product_name}\');`;

        connection.query(pSql, async function (err, results) {

            if (err) {
                console.error(err);
                return;
            }

           console.log(results);

            let {insertId: productId} = results;

            let count = Math.floor(Math.random() * INGREDIENTS.length);
            let ingredients = await getRandomIngredient(count);
            let amountAvailable = 1000.0; // default serving_size

            try {
                for (let ing of ingredients) {

                    let qty = Number.parseFloat(Math.max((Math.random() * amountAvailable), 0) + 0.01).toFixed(3);

                    let iSql = `INSERT INTO ProductFormula VALUES (
                ${productId},
                ${ing.rm},
                ${qty});`;

                    amountAvailable -= qty;

                    connection.query(iSql);
                }
            } catch (e) {
                console.log(e);
            }
        });

    }
}


function insertIngredients() {
    console.log('INSERTING INGREDIENTS')
    for (let name of INGREDIENTS) {
        let sql = `INSERT INTO RawMaterial (name, type, threshold) 
        VALUES(\'${name}\',\'\', ${~~(Math.random()*2) ? 'NULL' : 1500});`;
        connection.query(sql, function (err, results) {
            console.log(err, results)
        });
    }
}


async function insertInventory(count = 100) {

    for (let i = 0; i < count; i++) {

        let [{rm, name}] = await getRandomIngredient();
        let [{id: supplier}] = await getRandomSupplier();

        let lot = RAND_LOT.gen();
        let mfr = RAND_MFR.gen();

        let qty = (Math.random()*2000).toFixed(3);

        let rack = RAND_RACK.gen();

        let year = parseInt('20' + lot.slice(1, 3), 10);

        let date = getRandomDate(new Date(year, 0), new Date(year, 11)).toISOString().replace(/[TZ]/g, ' ');

        let sql = `INSERT INTO Inventory VALUES(
            \'${lot}\',
            \'${rm}\',
            \'${mfr}\',
            ${supplier},
            ${qty},
            \'${rack}\',
            \'${date}\'
        );`;

        connection.query(sql);
    }
}


function insertSuppliers() {
    for (let name of SUPPLIERS) {

        let email = name.replace(/\s+/, '');
        email = email.slice(0,1).toLowerCase() + email.slice(1);
        email = 'supply@' + email + '.com';

        let phone = RAND_PHONE.gen();

        let sql = `INSERT INTO Supplier (name, phone, email) VALUES(
            \'${name}\',
            \'${phone}\',
            \'${email}\'
        );`;

        connection.query(sql);
    }
}




function loadIngredients() {
    let ingredients = fs.readFileSync(__dirname + '/ingredients.txt', {encoding: 'utf-8'});
    return ingredients.trim().split('\n');
}

function loadSuppliers() {
    let suppliers = fs.readFileSync(__dirname + '/suppliers.txt', {encoding: 'utf-8'});
    return suppliers.trim().split('\n');
}

function loadProducts() {
    let products = fs.readFileSync(__dirname + '/products.txt', {encoding: 'utf-8'});
    return products.trim().split('\n');
}



function getRandomIngredient(count = 1) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM RawMaterial ORDER BY RAND() LIMIT ${count};`;
        connection.query(sql, function (err, results) {
            resolve(results);
        });
    });
}

function getRandomSupplier(count = 1) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM Supplier ORDER BY RAND() LIMIT ${count};`;
        connection.query(sql, function (err, results) {
            resolve(results);
        });
    });
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}






insertIngredients();
insertSuppliers();
insertInventory();
insertProducts();
