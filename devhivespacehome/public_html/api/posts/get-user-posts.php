<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();
header('Content-Type: application/json');

$user_id = null;
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
}
if (!$user_id && isset($_GET['token'])) {
    $token = $_GET['token'];
    $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $user_id = $row['user_id'];
    }
}
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}
try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $stmt = $pdo->prepare('SELECT post_id, content, created_at FROM post WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user_id]);
    $posts = $stmt->fetchAll();
    echo json_encode(['success' => true, 'posts' => $posts]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
} 