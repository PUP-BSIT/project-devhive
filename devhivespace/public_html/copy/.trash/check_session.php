<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../../private/database.php';

session_start();

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => true,
        'is_logged_in' => true,
        'user' => [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'email' => $_SESSION['email']
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'is_logged_in' => false
    ]);
}
?> 