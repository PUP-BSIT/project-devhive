<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/session_config.php';
initializeSession();

if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

echo json_encode([
    'success' => true,
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username']
]);
exit; 