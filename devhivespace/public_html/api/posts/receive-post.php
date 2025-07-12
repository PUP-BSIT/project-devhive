<?php 
require_once 'configuration.php';
ini_set('error_log', __DIR__ . '/../../../receiver.log');

error_log('==================RECEIVE-POST.PHP======================================');

// Log the raw input before decoding
$raw_input = file_get_contents("php://input");
error_log('========= RAW INPUT ===============');
error_log($raw_input);

// Decode JSON input
$input = json_decode($raw_input, true);

error_log('========= JSON DECODED ===============');
error_log(print_r($input, true));

// ADD THIS CHECK:
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing JSON input.']);
    error_log('ERROR: Invalid or missing JSON input.');
    exit;
}

$incoming_token = $input['token'] ?? '';
$provider = $input['provider'] ?? '';
$shared_post_id = $input['shared_post_id'] ?? null;
$media_url = $input['media_url'] ?? null;
$content = $input['shared_content'] ?? '';

if (empty($incoming_token) || empty($provider)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields (token or provider).']);
    error_log('ERROR: Missing required fields (token or provider).');
    exit;
}

switch (strtolower($provider)) {
    case 'devhive':
        $image_url = $input['image_url'];
        $video_url = $input['video_url'];
        $content = $input['content'];
        
        // Token verification for DevHive
        $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ?");
        $stmt->bind_param("s", $incoming_token);
        $stmt->execute();
        $stmt->bind_result($local_user_id);
        $stmt->fetch();
        $stmt->close();

        if (!$local_user_id) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or unauthorized token for DevHive.']);
            exit;
        }

        // DevHive: Save post
        $stmt = $conn->prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)");
        $stmt->bind_param("is", $local_user_id, $content);
        $stmt->execute();
        $new_post_id = $stmt->insert_id;
        $stmt->close();

        if (!empty($media_url)) {
            $extension = pathinfo($media_url, PATHINFO_EXTENSION);
            $media_type = in_array(strtolower($extension), ['mp4', 'mov', 'avi']) ? 'video' : 'image';

            $media_stmt = $conn->prepare("INSERT INTO post_media (post_id, file_path, media_type) VALUES (?, ?, ?)");
            $media_stmt->bind_param("iss", $new_post_id, $media_url, $media_type);
            $media_stmt->execute();
            $media_stmt->close();
        }

        break;

    case 'hershive':
default:
    $media_url = $input['media_url'] ?? '';
    $content = $input['shared_content'];

    // Token verification for Hershive
    $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ?");
    $stmt->bind_param("s", $incoming_token);
    $stmt->execute();
    $stmt->bind_result($local_user_id);
    $stmt->fetch();
    $stmt->close();

    if (!$local_user_id) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or unauthorized token for Hershive.']);
        exit;
    }

    // Save post
    $stmt = $conn->prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)");
    $stmt->bind_param("is", $local_user_id, $content);
    $stmt->execute();
    $new_post_id = $stmt->insert_id;
    $stmt->close();

    if (!empty($media_url)) {
        $video_exts = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
        $image_exts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

        $extension = strtolower(pathinfo($media_url, PATHINFO_EXTENSION));

        // Determine type
        if (in_array($extension, $video_exts)) {
            $media_type = 'video';
        } elseif (in_array($extension, $image_exts)) {
            $media_type = 'image';
        } else {
            echo json_encode(['error' => 'Unsupported media type.']);
            exit;
        }

        // Save to uploads/
        $uploads_dir = 'uploads/';
        $filename = uniqid('media_', true) . '.' . $extension;
        $local_path = $uploads_dir . $filename; // full new file name with directory

        $file_contents = @file_get_contents($media_url); //https://cuteee.png
        if ($file_contents === false) {
            echo json_encode(['error' => 'Failed to download media.']);
            exit;
        }

        file_put_contents($local_path, $file_contents);

        // Save local file path
        $media_stmt = $conn->prepare("INSERT INTO post_media (post_id, file_path, media_type) VALUES (?, ?, ?)");
        $media_stmt->bind_param("iss", $new_post_id, $local_path, $media_type);
        $media_stmt->execute();
        $media_stmt->close();
    }

    break;
}

http_response_code(200);
echo json_encode(['message' => 'Post received and saved successfully.']);

error_log(print_r($input, true));
error_log('========= FINAL INPUT STATE ===============');
error_log(print_r($input, true));
?>

