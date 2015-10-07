<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
require("dbHelper.php");

$table = "Values";
$filename = "data.sqlite3";
$conn = new PDO(
        "sqlite:$filename", null, null, array(PDO::ATTR_PERSISTENT => true)
);

function getRequestData($key) {
    if (isset($_POST[$key])) {
        return $_POST[$key];
    } else if (isset($_GET[$key])) {
        return $_GET[$key];
    }
    return null;
}

$action = getRequestData('action');
$id = getRequestData('id');
$value = getRequestData('value');

$db = new dbHelper($conn, $table);
$db->checkTableExists();

if ($action === 'get') {
    if ($id) {
        echo json_encode($db->getItemById($id));
    } else {
        echo json_encode(array(
            "error" => "id is required"
        ));
    }
} else if ($action === 'set') {
    if ($value) {
        $db->insertItem($value);
        echo json_encode($db->getLastItem('ID'));
    } else {
        echo json_encode(array(
            "error" => "value is required"
        ));
    }
} else {
    echo json_encode(array(
        "error" => "action is required and options are 'get' or 'set'"
    ));
}
?>