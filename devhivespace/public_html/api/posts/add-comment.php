<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../../../config/session_config.php';
initializeSession();
require_once '../../../config/database.php';

header('Content-Type: application/json');

// Function to send error response
function sendErrorResponse($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}

// Accept token as alternative authentication
$token = $_POST['token'] ?? $_GET['token'] ?? '';
if (!isset($_SESSION['user_id']) && $token) {
    // Validate token and set session user_id if valid
    require_once '../../../config/database.php';
    $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ? AND expires_at > NOW() AND is_revoked = 0");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $_SESSION['user_id'] = $row['user_id'];
        $user_id = $row['user_id'];
    } else {
        sendErrorResponse('Invalid or expired token', 401);
    }
    $stmt->close();
}
if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('User not logged in. Please log in to comment.', 401);
}
$user_id = $_SESSION['user_id'];

// Validate input
if (
    (!isset($_POST['post_id']) || trim($_POST['post_id']) === '') &&
    (!isset($_POST['share_id']) || trim($_POST['share_id']) === '')
) {
    sendErrorResponse("Missing post_id or share_id", 400);
}

// Only one of post_id or share_id should be set
if (
    (isset($_POST['post_id']) && trim($_POST['post_id']) !== '') &&
    (isset($_POST['share_id']) && trim($_POST['share_id']) !== '')
) {
    sendErrorResponse("Provide only one of post_id or share_id", 400);
}

$content = trim($_POST['content']);

// Validate comment length
if (strlen($content) > 500) {
    sendErrorResponse('Comment too long. Maximum 500 characters.', 400);
}

// Check if user exists
$user_check = $conn->prepare("SELECT user_id, username, profile_picture FROM user WHERE user_id = ?");
$user_check->bind_param("i", $user_id);
$user_check->execute();
$user_result = $user_check->get_result();
if ($user_result->num_rows === 0) {
    sendErrorResponse('User does not exist.', 400);
}
$user = $user_result->fetch_assoc();

// Check if post or share exists
if (isset($_POST['post_id']) && trim($_POST['post_id']) !== '') {
    $post_id = intval($_POST['post_id']);
    $share_id = null;
    $post_check = $conn->prepare("SELECT post_id FROM post WHERE post_id = ?");
    $post_check->bind_param("i", $post_id);
    $post_check->execute();
    $post_result = $post_check->get_result();
    if ($post_result->num_rows === 0) {
        sendErrorResponse('Post does not exist.', 400);
    }
} else {
    $post_id = null;
    $share_id = intval($_POST['share_id']);
    $share_check = $conn->prepare("SELECT share_id FROM share WHERE share_id = ?");
    $share_check->bind_param("i", $share_id);
    $share_check->execute();
    $share_result = $share_check->get_result();
    if ($share_result->num_rows === 0) {
        sendErrorResponse('Shared post does not exist.', 400);
    }
}

try {
    $stmt = $conn->prepare("INSERT INTO `comment` (post_id, share_id, user_id, content) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiis", $post_id, $share_id, $user_id, $content);

    if ($stmt->execute()) {
        $comment_id = $stmt->insert_id;
        $response = [
            'status' => 'success',
            'data' => [
                'comment_id' => $comment_id,
                'user_id' => $user_id,
                'username' => $user['username'] ?? 'Anonymous',
                'profile_picture' => $user['profile_picture'] ?? '../assets/human.png',
                'content' => $content,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ];
        echo json_encode($response);
    } else {
        sendErrorResponse('Failed to add comment: ' . $stmt->error, 500);
    }
    $stmt->close();
} catch (Exception $e) {
    sendErrorResponse('Database error: ' . $e->getMessage(), 500);
}
?> 