<?php
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

// Only allow commenting if the user is actually logged in
if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('User not logged in. Please log in to comment.', 401);
}
$user_id = $_SESSION['user_id'];

// Validate input
$requiredFields = ['post_id', 'content'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
        sendErrorResponse("Missing or empty $field", 400);
    }
}
$post_id = intval($_POST['post_id']);
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

// Check if post exists
$post_check = $conn->prepare("SELECT post_id FROM post WHERE post_id = ?");
$post_check->bind_param("i", $post_id);
$post_check->execute();
$post_result = $post_check->get_result();
if ($post_result->num_rows === 0) {
    sendErrorResponse('Post does not exist.', 400);
}

try {
    $stmt = $conn->prepare("INSERT INTO `comment` (post_id, user_id, content) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $post_id, $user_id, $content);

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
$conn->close();
?> 