<?php
session_start();
require_once '../../config/database.php';
header('Content-Type: application/json');

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$post_id = isset($input['post_id']) ? (int)$input['post_id'] : 0;
$content = isset($input['content']) ? trim($input['content']) : '';
$user_id = $_SESSION['user_id'];

// Validate input
if (!$post_id || empty($content)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

try {
    // Add new comment
    $stmt = $conn->prepare("INSERT INTO comment (post_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->bind_param("iis", $post_id, $user_id, $content);
    $stmt->execute();
    
    // Get the inserted comment details
    $comment_id = $stmt->insert_id;
    
    // Fetch user details for the response
    $select_stmt = $conn->prepare("
        SELECT c.*, u.username 
        FROM comment c 
        JOIN user u ON c.user_id = u.user_id 
        WHERE c.comment_id = ?
    ");
    $select_stmt->bind_param("i", $comment_id);
    $select_stmt->execute();
    $result = $select_stmt->get_result();
    $comment = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Comment added successfully',
        'comment' => [
            'comment_id' => $comment['comment_id'],
            'content' => $comment['content'],
            'user_id' => $comment['user_id'],
            'username' => $comment['username'],
            'created_at' => $comment['created_at'],
            'updated_at' => $comment['updated_at']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
}

$conn->close();
?> 