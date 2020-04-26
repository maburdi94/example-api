
DROP DATABASE IF EXISTS Virun_Inventory;
CREATE DATABASE Virun_Inventory;

USE Virun_Inventory;


CREATE TABLE RawMaterial (
    rm INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(24),
    threshold DOUBLE DEFAULT 1000.0,
    PRIMARY KEY (rm)
);

CREATE TABLE Supplier (
    id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(50),
    PRIMARY KEY (id)
);

CREATE TABLE Inventory (
    lot VARCHAR(20) NOT NULL,
    rm INT NOT NULL,
    mfr VARCHAR(20) NOT NULL,
    supplier INT NOT NULL,
    qty DOUBLE NOT NULL,
    rack VARCHAR(6) NOT NULL,
    arrived DATETIME NOT NULL,
    PRIMARY KEY (lot),
    FOREIGN KEY (rm) REFERENCES RawMaterial(rm),
    FOREIGN KEY (supplier) REFERENCES Supplier(id)
);


CREATE TABLE TrackInventoryChanges (
    id INT NOT NULL AUTO_INCREMENT,
    jdoc JSON NOT NULL,
    PRIMARY KEY (id)
);


CREATE TABLE Product (
    id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    serving_size DOUBLE DEFAULT 1000.0, -- Default: 1 kg (ratio = qty / serving_size)
    PRIMARY KEY (id)
);

CREATE TABLE ProductFormula (
    product_id INT NOT NULL,
    rm INT NOT NULL,
    qty DOUBLE NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Product(id),
    FOREIGN KEY (rm) REFERENCES RawMaterial(rm),
    PRIMARY KEY (product_id, rm)
);


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
    id INT NOT NULL,
    rm INT NOT NULL,
    qty DOUBLE NOT NULL,
    supplier INT NOT NULL,
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
    supplier INT NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES PurchaseInventory(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE BatchRecord (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  batch_size INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE BatchRecordIngredient (
  batch_id INT NOT NULL,
  ingredient_rm INT NOT NULL,
  ingredient_lot VARCHAR(20) NOT NULL,
  equipment INT NOT NULL,
  ingredient_actual INT NOT NULL
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
