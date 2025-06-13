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
    if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['reaction_type'])) {
        throw new Exception('post_id, user_id, and reaction_type are required');
    }

    $postId = (int)$data['post_id'];
    $userId = (int)$data['user_id'];
    $reactionType = $data['reaction_type'];

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check if reaction already exists
        $checkQuery = "SELECT reaction_id FROM reaction WHERE post_id = ? AND user_id = ?";
        $checkStmt = $conn->prepare($checkQuery);
        if (!$checkStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $checkStmt->bind_param("ii", $postId, $userId);
        
        if (!$checkStmt->execute()) {
            throw new Exception("Execute failed: " . $checkStmt->error);
        }

        $result = $checkStmt->get_result();
        $existingReaction = $result->fetch_assoc();
        $checkStmt->close();

        if ($existingReaction) {
            // Update existing reaction
            $query = "UPDATE reaction SET reaction_type = ? WHERE post_id = ? AND user_id = ?";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }

            $stmt->bind_param("sii", $reactionType, $postId, $userId);
        } else {
            // Insert new reaction
            $query = "INSERT INTO reaction (post_id, user_id, reaction_type) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }

            $stmt->bind_param("iis", $postId, $userId, $reactionType);
        }

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $stmt->close();

        // Get updated reaction count
        $countQuery = "SELECT COUNT(*) as count FROM reaction WHERE post_id = ?";
        $countStmt = $conn->prepare($countQuery);
        if (!$countStmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $countStmt->bind_param("i", $postId);
        
        if (!$countStmt->execute()) {
            throw new Exception("Execute failed: " . $countStmt->error);
        }

        $countResult = $countStmt->get_result();
        $reactionCount = $countResult->fetch_assoc()['count'];
        $countStmt->close();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Reaction added successfully',
            'data' => [
                'post_id' => $postId,
                'reaction_count' => $reactionCount
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