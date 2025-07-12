<?php
session_start();
require_once '/copy/config/database.php';
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
$user_id = $_SESSION['user_id'];

// Validate input
if (!$post_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid post ID']);
    exit;
}

try {
    // Get total reaction count
    $count_stmt = $conn->prepare("
        SELECT COUNT(*) as total_reactions
        FROM reaction 
        WHERE post_id = ?
    ");
    $count_stmt->bind_param("i", $post_id);
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $reaction_count = $count_result->fetch_assoc()['total_reactions'];
    
    // Check if current user has reacted
    $user_reaction_stmt = $conn->prepare("
        SELECT reaction_id 
        FROM reaction 
        WHERE post_id = ? AND user_id = ?
    ");
    $user_reaction_stmt->bind_param("ii", $post_id, $user_id);
    $user_reaction_stmt->execute();
    $user_reaction_result = $user_reaction_stmt->get_result();
    $has_reacted = $user_reaction_result->num_rows > 0;
    
    echo json_encode([
        'success' => true,
        'reaction_count' => $reaction_count,
        'has_user_reacted' => $has_reacted
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