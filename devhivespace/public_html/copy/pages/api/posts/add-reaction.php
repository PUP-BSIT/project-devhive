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
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$post_id = isset($input['post_id']) ? (int)$input['post_id'] : 0;
$reaction_type = isset($input['reaction_type']) ? $input['reaction_type'] : '';
$user_id = $_SESSION['user_id'];

// Validate input
if (!$post_id || !in_array($reaction_type, ['like'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

try {
    // Check if user already reacted to this post
    $check_stmt = $conn->prepare("SELECT reaction_id FROM reaction WHERE user_id = ? AND post_id = ?");
    $check_stmt->bind_param("ii", $user_id, $post_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows > 0) {
        // User already reacted - remove the reaction
        $delete_stmt = $conn->prepare("DELETE FROM reaction WHERE user_id = ? AND post_id = ?");
        $delete_stmt->bind_param("ii", $user_id, $post_id);
        $delete_stmt->execute();
        
        echo json_encode([
            'success' => true,
            'action' => 'removed',
            'message' => 'Reaction removed successfully'
        ]);
    } else {
        // Add new reaction
        $insert_stmt = $conn->prepare("INSERT INTO reaction (post_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, NOW())");
        $insert_stmt->bind_param("iis", $post_id, $user_id, $reaction_type);
        $insert_stmt->execute();
        
        echo json_encode([
            'success' => true,
            'action' => 'added',
            'message' => 'Reaction added successfully'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
}

$conn->close();
?> 