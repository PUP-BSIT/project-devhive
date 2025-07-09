<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $stmt = $pdo->prepare('SELECT post_id, user_id, content, created_at, updated_at FROM post ORDER BY created_at DESC LIMIT 10');
    $stmt->execute();
    $posts = $stmt->fetchAll();

    echo json_encode(['posts' => $posts]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
} 