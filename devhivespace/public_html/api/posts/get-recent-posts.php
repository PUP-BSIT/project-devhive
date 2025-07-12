<?php
// Returns the 10 most recent posts if the user is logged in
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $stmt = $pdo->prepare('
        SELECT 
            p.post_id, p.user_id, p.content, p.created_at, p.updated_at, 
            u.username, u.first_name, u.last_name, u.profile_image_id,
            (
                SELECT COUNT(*) FROM reaction r WHERE r.post_id = p.post_id AND r.reaction_type = "like"
            ) AS like_count,
            (
                SELECT COUNT(*) FROM comment c WHERE c.post_id = p.post_id
            ) AS comment_count,
            (
                SELECT COUNT(*) FROM share s WHERE s.post_id = p.post_id
            ) AS share_count,
            GROUP_CONCAT(DISTINCT pi.image_url) AS images,
            GROUP_CONCAT(DISTINCT pv.video_url) AS videos
        FROM post p 
        LEFT JOIN user u ON p.user_id = u.user_id 
        LEFT JOIN post_image pi ON p.post_id = pi.post_id
        LEFT JOIN post_video pv ON p.post_id = pv.post_id
        GROUP BY p.post_id
        ORDER BY p.created_at DESC 
        LIMIT 10
    ');
    $stmt->execute();
    $posts = $stmt->fetchAll();
    // Parse images and videos as arrays
    foreach ($posts as &$post) {
        $post['images'] = !empty($post['images']) ? array_filter(explode(',', $post['images'])) : [];
        $post['videos'] = !empty($post['videos']) ? array_filter(explode(',', $post['videos'])) : [];
    }

    // Optionally, fetch profile image filename if profile_image_id is set
    foreach ($posts as &$post) {
        $post['profile_image_url'] = null;
        if (!empty($post['profile_image_id'])) {
            $imgStmt = $pdo->prepare('SELECT filename FROM media_files WHERE id = ?');
            $imgStmt->execute([$post['profile_image_id']]);
            $img = $imgStmt->fetch();
            if ($img && !empty($img['filename'])) {
                $post['profile_image_url'] = '/uploads/avatars/' . $img['filename'];
            } else {
                $post['profile_image_url'] = '../assets/human.png';
            }
        } else {
            $post['profile_image_url'] = '../assets/human.png';
        }
    }

    echo json_encode(['posts' => $posts]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
} 