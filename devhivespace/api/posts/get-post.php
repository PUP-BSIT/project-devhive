<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Only GET method is allowed');
    }

    // Get query parameters
    $postId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    if ($postId) {
        // Get specific post
        $query = "SELECT p.post_id, p.user_id, p.content, p.created_at, p.updated_at,
                        GROUP_CONCAT(DISTINCT pi.image_url) as images,
                        GROUP_CONCAT(DISTINCT CONCAT(pv.video_url, ':::', COALESCE(pv.thumbnail_url, ''), ':::', COALESCE(pv.duration, ''))) as videos
                 FROM post p
                 LEFT JOIN post_image pi ON p.post_id = pi.post_id
                 LEFT JOIN post_video pv ON p.post_id = pv.post_id
                 WHERE p.post_id = ?
                 GROUP BY p.post_id";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("i", $postId);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $result = $stmt->get_result();
        $post = $result->fetch_assoc();

        if (!$post) {
            throw new Exception('Post not found');
        }

        $response = $post;
        $stmt->close();

    } else {
        // Get multiple posts
        $query = "SELECT post_id, user_id, content, created_at, updated_at
                 FROM post
                 ORDER BY created_at DESC
                 LIMIT ?, ?";
                 
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("ii", $offset, $limit);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $result = $stmt->get_result();
        $posts = $result->fetch_all(MYSQLI_ASSOC);
        
        // Get total count for pagination
        $countResult = $conn->query("SELECT COUNT(*) as total FROM post");
        if (!$countResult) {
            throw new Exception("Count query failed: " . $conn->error);
        }
        
        $totalPosts = $countResult->fetch_assoc()['total'];

        $response = [
            'posts' => $posts,
            'pagination' => [
                'total' => $totalPosts,
                'offset' => $offset,
                'limit' => $limit
            ]
        ];

        $stmt->close();
        $countResult->close();
    }

    echo json_encode([
        'status' => 'success',
        'data' => $response
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
