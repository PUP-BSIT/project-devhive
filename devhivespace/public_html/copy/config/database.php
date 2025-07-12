<?php
$host = "srv607.hstgr.io";
$db_name = "u798703225_copy_devhive";
$username = "u798703225_copy_devhive";
$password = "Copy_devhive123";

// Create connection
$conn = new mysqli($host, $username, $password, $db_name);

// Check connection
if ($conn->connect_error) {
    // Log the error
    error_log("Database Connection Error: " . $conn->connect_error);
    
    // Destroy session and redirect to login
    session_start();
    session_unset();
    session_destroy();
    
    // Redirect to login page
    header("Location: /copy/pages/login/index.html");
    exit;
}
?>