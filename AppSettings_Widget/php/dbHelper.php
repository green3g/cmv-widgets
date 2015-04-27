<?php

/**
 * a simple db helper for reading and setting new values
 * probably contains multiple security flaws
 * DO NOT USE IN PUBLIC PRODUCTION ENVIRONMENT
 */
class dbHelper {
    /**
     * default constructor
     * @param type $conn - connection to a database
     * @param type $table - the name of the table
     */
    function __construct($conn, $table) {
        $this->conn = $conn;
        $this->table = $table;
    }

    /**
     * checks to make sure the table exists and if not creates it
     */
    function checkTableExists() {
        $checkTableExistsSql = 
                "CREATE TABLE IF NOT EXISTS "
                . "`$this->table` ( "
                . "`ID` INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, "
                . "`Value` TEXT "
                . ");";
        $this->conn->query($checkTableExistsSql);
    }

    /**
     * queries the table for a matching record by id and returns the record
     * @param integer $id
     * @return object 
     */
    function getItemById($id) {
        $sql = "SELECT * "
                . "FROM `$this->table` "
                . "WHERE ID=? LIMIT 1;";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(array($id));
        return $stmt->fetch();
    }

    /**
     * selects the last id and returns the record
     * @return object
     */
    function getLastItem() {
        $sql = "SELECT *, MAX(ID) "
                . "FROM `$this->table`;";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * inserts a new item
     * @param string $value - the string to insert into the table
     */
    function insertItem($value) {
        $sql = "INSERT INTO `$this->table` (ID, Value) "
                . "VALUES (null, ?);";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(array($value));
    }

}
