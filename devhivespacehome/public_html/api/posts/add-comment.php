<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Get and decode the JSON data
    $jsonData = file_get_contents('php://input');
    if (!$jsonData) {
        throw new Exception('No data received');
    }

    $data = json_decode($jsonData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }

    // Validate required fields
    if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['content'])) {
        throw new Exception('post_id, user_id, and content are required');
    }

    $postId = (int)$data['post_id'];
    $userId = (int)$data['user_id'];
    $content = trim($data['content']);

    if (empty($content)) {
        throw new Exception('Comment content cannot be empty');
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert comment
        $query = "INSERT INTO comment (post_id, user_id, content) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("iis", $postId, $userId, $content);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $commentId = $conn->insert_id;
        $stmt->close();

        // Get comment count
        $countQuery = "SELECT COUNT(*) as count FROM comment WHERE post_id = ?";
        $countStmt = $conn->prepare($countQuery);
        if (!$countStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $countStmt->bind_param("i", $postId);
        
        if (!$countStmt->execute()) {
            throw new Exception("Execute failed: " . $countStmt->error);
        }

        $countResult = $countStmt->get_result();
        $commentCount = $countResult->fetch_assoc()['count'];
        $countStmt->close();

        // Get the newly created comment with user info
        $commentQuery = "SELECT c.*, u.username 
                        FROM comment c 
                        LEFT JOIN user u ON c.user_id = u.user_id 
                        WHERE c.comment_id = ?";
        $commentStmt = $conn->prepare($commentQuery);
        if (!$commentStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $commentStmt->bind_param("i", $commentId);
        
        if (!$commentStmt->execute()) {
            throw new Exception("Execute failed: " . $commentStmt->error);
        }

        $commentResult = $commentStmt->get_result();
        $comment = $commentResult->fetch_assoc();
        $commentStmt->close();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Comment added successfully',
            'data' => [
                'comment' => $comment,
                'comment_count' => $commentCount
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} 