<?php
$host = "localhost";
$db_name = "u798703225_devhivespace";
$username = "u798703225_devhivespace";
$password = "Pupt2026";

// Create connection
$conn = new mysqli($host, $username, $password, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>