<?php
$host = "srv607.hstgr.io";
$db_name = "u798703225_devhivespace";
$username = "u798703225_devhivespace";
$password = "Pupt2026";

// For PDO
$dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
$db_user = $username;
$db_pass = $password;

$conn = new mysqli($host, $username, $password, $db_name);

if ($conn->connect_error) {
    error_log("Database Connection Error: " . $conn->connect_error);

    session_start();
    session_unset();
    session_destroy();
    
    header("Location: /login/index.html");
    exit;
}
?>