
const {getPostData} = require('../utils/http');
const {query, getConnection} = require('../utils/sql');

function groupBy(xs, key) {
    return xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

module.exports.getProducts = async function(request, response) {

    let q = `
        SELECT product_number, product_name 
        FROM Product`;

    let products = await query(q);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(products));
};

module.exports.getProduct = async function(product_number, request, response) {

    let q = `
        SELECT * FROM Product WHERE product_number = ${product_number};
        SELECT * 
            FROM ProductIngredient 
            INNER JOIN RawMaterial USING (rm_number)
            WHERE product_number = ${product_number};`;

    let [[product], ingredients] = await query(q);


    if (product) {
        let recipe = groupBy(ingredients, 'rm_type');

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({
            ...product,
            recipe
        }));
        return;
    }

    response.statusCode = 404;
    response.end(`No product with ID ${product_number}.`);
};
