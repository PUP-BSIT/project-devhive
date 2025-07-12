<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();

ini_set('error_log', __DIR__ . '/../../../error.log');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Not logged in"]);
    exit;
}

require_once __DIR__ . '/../../../config/database.php';

error_log("delete-post.php called, input: " . file_get_contents('php://input'));

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    throw new Exception('Only POST method is allowed');
}

    // Get post ID from URL parameter
    $input = json_decode(file_get_contents('php://input'), true);
$postId = isset($input['post_id']) ? (int)$input['post_id'] : null;

    if (!$postId) {
        throw new Exception('Post ID is required');
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check if post exists
        $checkQuery = "SELECT post_id FROM post WHERE post_id = ?";
        $checkStmt = $conn->prepare($checkQuery);
        if (!$checkStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $checkStmt->bind_param("i", $postId);
        
        if (!$checkStmt->execute()) {
            throw new Exception("Execute failed: " . $checkStmt->error);
        }

        $result = $checkStmt->get_result();
        if (!$result->fetch_assoc()) {
            throw new Exception('Post not found');
        }
        $checkStmt->close();

        // Delete the post
        $deleteQuery = "DELETE FROM post WHERE post_id = ?";
        $deleteStmt = $conn->prepare($deleteQuery);
        if (!$deleteStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $deleteStmt->bind_param("i", $postId);
        
        if (!$deleteStmt->execute()) {
            throw new Exception("Execute failed: " . $deleteStmt->error);
        }

        $deleteStmt->close();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Post deleted successfully',
            'data' => ['post_id' => $postId]
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
