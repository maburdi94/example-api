
-- create a local development user "localusr" with all priviliges to work with db
DROP USER IF EXISTS 'localusr'@'localhost';
CREATE USER 'localusr'@'localhost' IDENTIFIED BY 'viruninv';
GRANT ALL PRIVILEGES ON Virun_Inventory.* TO 'localusr'@'localhost';
ALTER USER 'localusr'@'localhost' IDENTIFIED WITH mysql_native_password BY 'viruninv';
flush privileges;

-- GRANT ALL PRIVILEGES ON * . * TO 'localusr'@ 'localhost' IDENTIFIED BY 'viruninv';
