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

// Add debug logging
error_log("get-comments.php called with GET params: " . json_encode($_GET));

// Validate post ID or share ID
if (!isset($_GET['post_id']) && !isset($_GET['share_id'])) {
    sendErrorResponse('Missing post_id or share_id', 400);
}

if (isset($_GET['post_id'])) {
    $id_type = 'post_id';
    $id_value = intval($_GET['post_id']);
} else {
    $id_type = 'share_id';
    $id_value = intval($_GET['share_id']);
}

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

try {
    // Fetch comments with user details
    $stmt = $conn->prepare("
        SELECT 
            c.comment_id, 
            c.content, 
            c.created_at, 
            u.user_id, 
            u.username, 
            u.profile_picture
        FROM `comment` c
        JOIN `user` u ON c.user_id = u.user_id
        WHERE c." . $id_type . " = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("iii", $id_value, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $comments = [];
    while ($comment = $result->fetch_assoc()) {
        // Use default profile picture if none exists
        $comment['profile_picture'] = $comment['profile_picture'] 
            ?? '../assets/human.png';
        
        // Format timestamp
        $comment['formatted_time'] = formatTimeAgo($comment['created_at']);
        
        $comments[] = $comment;
    }

    // Get total comment count
    $count_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM `comment` WHERE " . $id_type . " = ?");
    $count_stmt->bind_param("i", $id_value);
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $total_comments = $count_result->fetch_assoc()['total'];

    echo json_encode([
        'status' => 'success',
        'data' => [
            'comments' => $comments,
            'total' => $total_comments,
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);

} catch (Exception $e) {
    sendErrorResponse('Database error: ' . $e->getMessage(), 500);
}

// Function to convert timestamp to human-readable format
function formatTimeAgo($timestamp) {
    $time = strtotime($timestamp);
    $now = time();
    $diff = $now - $time;

    if ($diff < 60) return 'just now';
    if ($diff < 3600) return floor($diff / 60) . ' mins ago';
    if ($diff < 86400) return floor($diff / 3600) . ' hours ago';
    if ($diff < 604800) return floor($diff / 86400) . ' days ago';
    return date('M d, Y', $time);
}

// $conn->close();
?> 