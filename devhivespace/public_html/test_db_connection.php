<?php
require_once __DIR__ . '/../config/database.php';

if ($conn && !$conn->connect_error) {
    echo "Database connection successful!";
} else {
    echo "Database connection failed!";
}
?>