
DROP DATABASE IF EXISTS Virun_Inventory;
CREATE DATABASE Virun_Inventory;

USE Virun_Inventory;


CREATE TABLE RawMaterial (
    rm INT(6) ZEROFILL NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(24) NOT NULL,
    threshold DOUBLE DEFAULT NULL,
    PRIMARY KEY (rm)
);

CREATE TABLE Supplier (
    id INT(4) ZEROFILL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Inventory (
    lot VARCHAR(20) NOT NULL,
    rm INT(6) ZEROFILL NOT NULL,
    mfr VARCHAR(20) NOT NULL,
    supplier INT(4) ZEROFILL NOT NULL,
    qty DOUBLE NOT NULL,
    rack VARCHAR(6) NOT NULL,
    arrived DATE NOT NULL,
    PRIMARY KEY (lot),
    FOREIGN KEY (rm) REFERENCES RawMaterial(rm),
    FOREIGN KEY (supplier) REFERENCES Supplier(id)
);


-- CREATE TABLE RawMaterialVendor (
--    vendor_id INT NOT NULL,
--    rm_number INT NOT NULL,
--    PRIMARY KEY (vendor_id, rm_number),
--    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id) ON DELETE CASCADE ON UPDATE CASCADE
-- );


CREATE TABLE Product (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    serving_size DOUBLE DEFAULT 1000.0, -- Default: 1 kg (ratio = qty / serving_size)
    PRIMARY KEY (id)
);

CREATE TABLE ProductFormula (
    product_id INT NOT NULL,
    rm INT(6) ZEROFILL NOT NULL,
    qty DOUBLE NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Product(id),
    FOREIGN KEY (rm) REFERENCES RawMaterial(rm),
    PRIMARY KEY (product_id, rm)
);

-- CREATE TABLE Inventory (
--    product_number INT DEFAULT NULL,
--    rm_number INT DEFAULT NULL,
--
--    -- mg for RM, mg for Products, and mg for RM and Products
--    rm_quantity DOUBLE(13,2) NOT NULL,
--
--    UNIQUE (product_number, rm_number),
--    FOREIGN KEY (rm_number) REFERENCES RawMaterial(rm_number) ON DELETE CASCADE ON UPDATE CASCADE,
--    FOREIGN KEY (product_number) REFERENCES Product(product_number) ON DELETE CASCADE ON UPDATE CASCADE
-- );


-- CREATE TABLE ProductIngredient (
--    product_number INT NOT NULL,
--    is_product BOOLEAN DEFAULT 0,
--    rm_number INT NOT NULL,
--    rm_serving_size DOUBLE(13,2) NOT NULL,
--    PRIMARY KEY (product_number, rm_number),
--    FOREIGN KEY (product_number) REFERENCES Product(product_number) ON DELETE CASCADE ON UPDATE CASCADE,
--    FOREIGN KEY (rm_number) REFERENCES RawMaterial(rm_number) ON DELETE CASCADE ON UPDATE CASCADE
-- );


CREATE TABLE UserInv (
    username VARCHAR(25) NOT NULL,
    password VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL,
    firstname VARCHAR(32) NOT NULL,
    lastname VARCHAR(32) NOT NULL,
    email VARCHAR(64) NOT NULL,
    image VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);


CREATE TABLE PurchaseInventory (
    id INT NOT NULL AUTO_INCREMENT,
    rm INT(6) ZEROFILL NOT NULL,
    qty DOUBLE NOT NULL,
    supplier INT(4) ZEROFILL,
    status ENUM ('INCOMPLETE', 'PENDING', 'RECEIVED') DEFAULT 'INCOMPLETE',
    placed DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (rm) REFERENCES RawMaterial(rm),
    FOREIGN KEY (supplier) REFERENCES Supplier(id)
);

CREATE TABLE PurchaseOrderProducts (
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    units   INT NOT NULL,
    supplier VARCHAR(50) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES PurchaseInventory(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- CREATE TABLE BatchRecord (
--    lot_number VARCHAR(20) NOT NULL,
--    product_number INT NOT NULL,
--    product_quantity INT NOT NULL,
--    batch_size DOUBLE(13,2) NOT NULL,
--    order_id INT NOT NULL,
--    PRIMARY KEY(lot_number, product_number),
--    FOREIGN KEY (product_number) REFERENCES Product(product_number) ON DELETE CASCADE ON UPDATE CASCADE,
--    FOREIGN KEY (order_id) REFERENCES PurchaseOrders(order_id) ON DELETE CASCADE ON UPDATE CASCADE
-- );


-- DELIMITER //
-- CREATE PROCEDURE select_inventory (
--    IN lots SET,
--    OUT total INT,
-- )
-- BEGIN
--  SELECT *
--  FROM Inventory I
--  LEFT JOIN RawMaterial RM USING (rm)
--  LEFT JOIN Supplier S ON (id = supplier)
--  WHERE 1=1
--  AND lot IN lots;
--
--  SELECT COUNT(*) INTO total FROM world.city
--  WHERE CountryCode = country;
--
-- END //
-- DELIMITER ;
