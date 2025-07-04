<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    $post_id = isset($data['post_id']) ? (int)$data['post_id'] : null;
    $user_id = isset($data['user_id']) ? (int)$data['user_id'] : null;
    $platform = isset($data['platform']) ? $data['platform'] : 'devhive';
    $caption = isset($data['caption']) ? $data['caption'] : null;

    if (!$post_id || !$user_id) {
        throw new Exception('post_id and user_id are required');
    }

    if (isset($data['share_id'])) {
        $target_id = (int)$data['share_id'];
        $target_type = 'share';
    } else {

        $target_id = (int)$data['post_id'];
        $target_type = 'post';
    }

    $stmt = $conn->prepare("INSERT INTO share (post_id, user_id, platform, caption, target_id, target_type) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("iissss", $post_id, $user_id, $platform, $caption, $target_id, $target_type);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    if ($target_type === 'post') {
        $conn->query("UPDATE post SET shares = shares + 1 WHERE post_id = $target_id");
    } else if ($target_type === 'share') {
        $conn->query("UPDATE share SET shares = shares + 1 WHERE share_id = $target_id");
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Post shared successfully',
        'share_id' => $stmt->insert_id
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}