<?php
require_once '../../../config/session_config.php';
initializeSession();
require_once '../../../config/database.php';

header('Content-Type: application/json');

function sendErrorResponse($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('User not logged in.', 401);
}
$user_id = $_SESSION['user_id'];

if (!isset($_POST['comment_id'])) {
    sendErrorResponse('Missing comment_id', 400);
}
$comment_id = intval($_POST['comment_id']);

// Check if the comment exists and belongs to the user
$stmt = $conn->prepare('SELECT user_id FROM `comment` WHERE comment_id = ?');
$stmt->bind_param('i', $comment_id);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    sendErrorResponse('Comment not found.', 404);
}
$row = $result->fetch_assoc();
if ($row['user_id'] != $user_id) {
    sendErrorResponse('You can only delete your own comments.', 403);
}

// Delete the comment
$del_stmt = $conn->prepare('DELETE FROM `comment` WHERE comment_id = ?');
$del_stmt->bind_param('i', $comment_id);
if ($del_stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Comment deleted.']);
} else {
    sendErrorResponse('Failed to delete comment.', 500);
}
?> 