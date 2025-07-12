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
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get post ID from query parameters
$post_id = isset($_GET['post_id']) ? (int)$_GET['post_id'] : 0;

// Validate input
if (!$post_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid post ID']);
    exit;
}

try {
    // Fetch comments with user information
    $stmt = $conn->prepare("
        SELECT c.*, u.username 
        FROM comment c 
        JOIN user u ON c.user_id = u.user_id 
        WHERE c.post_id = ? 
        ORDER BY c.created_at ASC
    ");
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = [
            'comment_id' => $row['comment_id'],
            'content' => $row['content'],
            'user_id' => $row['user_id'],
            'username' => $row['username'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'comments' => $comments
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