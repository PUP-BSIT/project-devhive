<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, PATCH');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/session_config.php';
initializeSession();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "error" => "Not logged in"]);
    exit;
}

require_once '../../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
        throw new Exception('Only PUT and PATCH methods are allowed');
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['post_id'])) {
        throw new Exception('Post ID is required');
    }

    $postId = (int)$data['post_id'];

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

    // Start transaction
    $conn->begin_transaction();

    try {
        $updateFields = [];
        $types = "";
        $params = [];

        // Update content if provided
        if (isset($data['content']) && !empty(trim($data['content']))) {
            $updateFields[] = "content = ?";
            $types .= "s";
            $params[] = trim($data['content']);
        }

        // Update user_id if provided
        if (isset($data['user_id'])) {
            $updateFields[] = "user_id = ?";
            $types .= "i";
            $params[] = (int)$data['user_id'];
        }

        // Always update updated_at timestamp
        $updateFields[] = "updated_at = CURRENT_TIMESTAMP";

        // Update post if there are fields to update
        if (!empty($updateFields)) {
            $query = "UPDATE post SET " . implode(", ", $updateFields) . " WHERE post_id = ?";
            $types .= "i";
            $params[] = $postId;

            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }

            // Dynamically bind parameters
            $stmt->bind_param($types, ...$params);
            
            if (!$stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }

            $stmt->close();
        }

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Post updated successfully',
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
