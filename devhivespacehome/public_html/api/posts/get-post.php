<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Only GET method is allowed');
    }

    $postId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $query = "
        SELECT 
            p.post_id, p.user_id, u.username as author_username, p.content, p.created_at, p.updated_at,
            GROUP_CONCAT(DISTINCT pi.image_url) as images,
            GROUP_CONCAT(DISTINCT CONCAT(pv.video_url, ':::', COALESCE(pv.thumbnail_url, ''), ':::', COALESCE(pv.duration, ''))) as videos,
            p.shares,
            (SELECT COUNT(*) FROM reaction r WHERE r.post_id = p.post_id AND r.reaction_type = 'like') as likes,
            (SELECT COUNT(*) FROM comment WHERE post_id = p.post_id) as comment_count,
            NULL as share_id,
            NULL as shared_by,
            NULL as shared_at,
            NULL as shared_by_username,
            NULL as share_caption,
            NULL as target_type
        FROM post p
        LEFT JOIN user u ON p.user_id = u.user_id
        LEFT JOIN post_image pi ON p.post_id = pi.post_id
        LEFT JOIN post_video pv ON p.post_id = pv.post_id
        GROUP BY p.post_id

        UNION ALL

        SELECT 
            p.post_id, p.user_id, u.username as author_username, p.content, p.created_at, p.updated_at,
            GROUP_CONCAT(DISTINCT pi.image_url) as images,
            GROUP_CONCAT(DISTINCT CONCAT(pv.video_url, ':::', COALESCE(pv.thumbnail_url, ''), ':::', COALESCE(pv.duration, ''))) as videos,
            s.shares,
            (SELECT COUNT(*) FROM reaction r WHERE r.post_id = p.post_id AND r.reaction_type = 'like') as likes,
            (SELECT COUNT(*) FROM comment WHERE post_id = p.post_id) as comment_count,
            s.share_id,
            s.user_id as shared_by,
            s.shared_at,
            su.username as shared_by_username,
            s.caption as share_caption,
            s.target_type
        FROM share s
        JOIN post p ON s.post_id = p.post_id
        LEFT JOIN user u ON p.user_id = u.user_id
        LEFT JOIN user su ON s.user_id = su.user_id
        LEFT JOIN post_image pi ON p.post_id = pi.post_id
        LEFT JOIN post_video pv ON p.post_id = pv.post_id
        GROUP BY s.share_id

        ORDER BY COALESCE(shared_at, created_at) DESC
        LIMIT ?, ?
    ";

    error_log("SQL Query: " . $query);

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("ii", $offset, $limit);

    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $posts = $result->fetch_all(MYSQLI_ASSOC);

    error_log("Query results: " . json_encode($posts));

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