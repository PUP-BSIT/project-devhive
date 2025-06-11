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

    if (!isset($data['content']) || empty(trim($data['content']))) {
        throw new Exception('Content is required');
    }

    // Prepare the post data
    $content = trim($data['content']);
    $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert post
        $query = "INSERT INTO post (user_id, content) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("is", $userId, $content);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $postId = $conn->insert_id;
        
        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Post created successfully',
            'data' => [
                'post_id' => $postId,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw new Exception('Database error: ' . $e->getMessage());
    } finally {
        if (isset($stmt)) {
            $stmt->close();
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
