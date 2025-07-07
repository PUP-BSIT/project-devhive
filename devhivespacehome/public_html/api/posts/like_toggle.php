<?php
session_start();
require_once '../../config/database.php';

header('Content-Type: application/json');

// Detailed error logging function
function sendErrorResponse($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false, 
        'message' => $message,
        'session_id' => session_id(),
        'user_logged_in' => isset($_SESSION['id']) ? 'Yes' : 'No'
    ]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['id'])) {
    sendErrorResponse('User not logged in', 401);
}

// Validate post ID
if (!isset($_POST['post_id'])) {
    sendErrorResponse('Invalid post ID', 400);
}

$user_id = $_SESSION['id'];
$post_id = intval($_POST['post_id']);
$reaction_type = 'like'; // Standardize like reaction

try {
    // Check if already liked
    $check_like = $conn->prepare("SELECT reaction_id FROM reaction WHERE user_id = ? AND post_id = ? AND reaction_type = 'like'");
    $check_like->bind_param("ii", $user_id, $post_id);
    $check_like->execute();
    $check_like->store_result();

    if ($check_like->num_rows > 0) {
        // Unlike: Remove the like
        $delete_like = $conn->prepare("DELETE FROM reaction WHERE user_id = ? AND post_id = ? AND reaction_type = 'like'");
        $delete_like->bind_param("ii", $user_id, $post_id);
        $delete_like->execute();
        $liked = false;
    } else {
        // Like: Add a new like
        $add_like = $conn->prepare("INSERT INTO reaction (user_id, post_id, reaction_type) VALUES (?, ?, 'like')");
        $add_like->bind_param("ii", $user_id, $post_id);
        $add_like->execute();
        $liked = true;
    }

    // Get updated like count
    $count_query = $conn->prepare("SELECT COUNT(*) AS total FROM reaction WHERE post_id = ? AND reaction_type = 'like'");
    $count_query->bind_param("i", $post_id);
    $count_query->execute();
    $result = $count_query->get_result();
    $like_count = $result->fetch_assoc()['total'];

    // Return success response
    echo json_encode([
        'success' => true,
        'liked' => $liked,
        'total' => $like_count,
        'user_id' => $user_id,
        'post_id' => $post_id
    ]);

} catch (Exception $e) {
    sendErrorResponse('Database error: ' . $e->getMessage(), 500);
}

// Close connections
$conn->close();
?> 