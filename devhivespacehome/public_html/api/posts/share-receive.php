<?php
require_once __DIR__ . '/../../../config/database.php';
ini_set('error_log', __DIR__ . '/../../../receiver.log');
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP ERROR [$errno] $errstr in $errfile on line $errline");
});
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error) {
        error_log("FATAL ERROR: " . print_r($error, true));
    }
});
error_log('==================RECEIVE-POST.PHP======================================');

$raw_input = file_get_contents("php://input");
error_log('========= RAW INPUT ===============');
error_log($raw_input);

$input = json_decode($raw_input, true);

error_log('========= JSON DECODED ===============');
error_log(print_r($input, true));

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing JSON input.']);
    error_log('ERROR: Invalid or missing JSON input.');
    exit;
}

$incoming_token = $input['token'] ?? '';
$provider = $input['provider'] ?? $input['client'] ?? '';
$shared_post_id = $input['shared_post_id'] ?? null;
$media_url = $input['media_url'] ?? null;
$content = $input['shared_content'] ?? $input['content'] ?? '';

if (empty($incoming_token) || empty($provider)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields (token or provider).']);
    error_log('ERROR: Missing required fields (token or provider).');
    exit;
}

// Token verification
$stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ?");
$stmt->bind_param("s", $incoming_token);
$stmt->execute();
$stmt->bind_result($local_user_id);
$stmt->fetch();
$stmt->close();

if (!$local_user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or unauthorized token.']);
    exit;
}

if (strtolower($provider) === 'heybleepi' && isset($input['posts'][0])) {
    $media_url = $input['posts'][0]['file_path'] ?? null;
    $content = $input['posts'][0]['content'] ?? '';
    $provider = $input['posts'][0]['provider'] ?? $provider; 
}

if (empty(trim($content)) && empty($media_url)) {
    http_response_code(400);
    echo json_encode(['error' => 'Post must contain content or media.']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO post (user_id, provider, content) VALUES (?, ?, ?)");
$stmt->bind_param("iss", $local_user_id, $provider, $content);
$stmt->execute();
$new_post_id = $stmt->insert_id;
$stmt->close();

$media_saved = false;
$media_type = null;
$media_local_path = null;

if (!empty($media_url)) {
    $parsed = parse_url($media_url);
    if (isset($parsed['path'])) {
        $path_parts = explode('/', $parsed['path']);
        $filename = array_pop($path_parts);
        // Only encode if not already encoded
        if ($filename !== rawurldecode($filename)) {
            // Already encoded, do not encode again
            $encoded_filename = $filename;
        } else {
            $encoded_filename = rawurlencode($filename);
        }
        $encoded_path = implode('/', $path_parts) . '/' . $encoded_filename;
        $media_url = $parsed['scheme'] . '://' . $parsed['host'] . $encoded_path;
        if (isset($parsed['query'])) {
            $media_url .= '?' . $parsed['query'];
        }
    }
    $video_exts = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    $image_exts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    $extension = strtolower(pathinfo($media_url, PATHINFO_EXTENSION));

    if (in_array($extension, $video_exts)) {
        $media_type = 'video';
        $uploads_dir = __DIR__ . '/../../assets/upload-share/video/';
        if (!is_dir($uploads_dir)) mkdir($uploads_dir, 0777, true);
        $filename = uniqid('media_', true) . '.' . $extension;
        $media_local_path = $uploads_dir . $filename;
        $file_contents = @file_get_contents($media_url);
        if ($file_contents === false) {
            error_log("Failed to download media from URL: " . $media_url);
            echo json_encode(['error' => 'Failed to download video.']);
            exit;
        }
        file_put_contents($media_local_path, $file_contents);

        $video_url = '/../../assets/upload-share/video/' . $filename;
        $stmt = $conn->prepare("INSERT INTO post_video (post_id, video_url) VALUES (?, ?)");
        $stmt->bind_param("is", $new_post_id, $video_url);
        $stmt->execute();
        $stmt->close();
        $media_saved = true;
    } elseif (in_array($extension, $image_exts)) {
        $media_type = 'image';
        $uploads_dir = __DIR__ . '/../../assets/upload-share/images/';
        if (!is_dir($uploads_dir)) mkdir($uploads_dir, 0777, true);
        $filename = uniqid('media_', true) . '.' . $extension;
        $media_local_path = $uploads_dir . $filename;
        $file_contents = @file_get_contents($media_url);
        if ($file_contents === false) {
            error_log("Failed to download media from URL: " . $media_url);
            echo json_encode(['error' => 'Failed to download image.']);
            exit;
        }
        file_put_contents($media_local_path, $file_contents);

        $image_url = '/../../assets/upload-share/images/' . $filename;
        $stmt = $conn->prepare("INSERT INTO post_image (post_id, image_url) VALUES (?, ?)");
        $stmt->bind_param("is", $new_post_id, $image_url);
        $stmt->execute();
        $stmt->close();
        $media_saved = true;
    } else {
        echo json_encode(['error' => 'Unsupported media type.']);
        exit;
    }
}

$conn->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'post_id' => $new_post_id,
    'media_saved' => $media_saved,
    'media_type' => $media_type,
    'message' => 'Post received and saved successfully.'
]);

error_log('========= FINAL INPUT STATE ===============');
error_log(print_r($input, true));
?>