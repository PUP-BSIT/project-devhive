<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('error_log', __DIR__ . '/../../../get-user.log');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';

initializeSession();

$user_id = null;
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
}
if (!$user_id && isset($_GET['token'])) {
    $token = $_GET['token'];
    $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ? AND expires_at > NOW() AND is_revoked = 0 AND is_authorized = 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $user_id = $row['user_id'];
        $_SESSION['user_id'] = $user_id;
    }
}
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}
$stmt = $conn->prepare("SELECT first_name, last_name, username, profile_image_id FROM user WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
if ($user = $result->fetch_assoc()) {
    $profile_image_url = null;
    if (!empty($user['profile_image_id'])) {
        $stmt2 = $conn->prepare("SELECT filename FROM media_files WHERE id = ?");
        $stmt2->bind_param("i", $user['profile_image_id']);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        if ($media = $result2->fetch_assoc()) {
            $profile_image_url = '/uploads/avatars/' . $media['filename'];
            $profile_image_url = str_replace('\\', '/', $profile_image_url);
        }
        $stmt2->close();
    }
    if (!$profile_image_url) {
        $profile_image_url = '../assets/human.png';
    }
    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'username' => $user['username'],
        'profile_image_url' => $profile_image_url
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'User not found']);
}
?>