CREATE USER IF NOT EXISTS 'archemy'@'%' IDENTIFIED WITH mysql_native_password BY 'oracle123';
GRANT ALL PRIVILEGES ON archemy.* TO 'archemy'@'%';
FLUSH PRIVILEGES;
