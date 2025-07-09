<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
ini_set('display_startup_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: https://devhivespace.com'); 
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';

initializeSession();

if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('Not authenticated', 401);
}
$user_id = $_SESSION['user_id'];

function sendErrorResponse($message, $status_code = 400) {
    http_response_code($status_code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

function sanitizeInput($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

function validateFileUpload($file) {
    $allowedTypes = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp']
    ];

    $maxFileSize = 5 * 1024 * 1024;

    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred');
    }

    if (!array_key_exists($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
    }

    if ($file['size'] > $maxFileSize) {
        throw new Exception('File size must be less than 5MB');
    }

    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($fileExtension, $allowedTypes[$file['type']])) {
        throw new Exception('File extension does not match file type');
    }

    return $fileExtension;
}

function logError($message) {
    error_log('[UPLOAD AVATAR] ' . $message);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendErrorResponse('Only POST method is allowed', 405);
    }

    $database = new PDO(
        $dsn,
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );

    $stmt = $database->prepare("SELECT user_id FROM user WHERE user_id = :user_id");
    $stmt->execute([':user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendErrorResponse('Unauthorized or inactive user', 401);
    }

    $fileExtension = validateFileUpload($_FILES['avatar']);

    $uploadDir = realpath(__DIR__ . '/../../uploads/avatars/');
    if ($uploadDir === false) {
        throw new Exception('Upload directory does not exist or is not accessible: ' . __DIR__ . '/../../uploads/avatars/');
    }
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $newFilename = $user['user_id'] . '_avatar_' . bin2hex(random_bytes(8)) . '.' . $fileExtension;
    $uploadPath = $uploadDir . '/' . $newFilename;

    if (!is_uploaded_file($_FILES['avatar']['tmp_name'])) {
        throw new Exception('Invalid file upload');
    }
    if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadPath)) {
        $error = error_get_last();
        throw new Exception('Failed to save uploaded file. Error: ' . print_r($error, true) . ' | TMP: ' . $_FILES['avatar']['tmp_name'] . ' | DEST: ' . $uploadPath);
    }
    chmod($uploadPath, 0644);

    $fileData = file_get_contents($uploadPath);
    $fileSize = filesize($uploadPath);
    $mimeType = mime_content_type($uploadPath);

    $stmt = $database->prepare("INSERT INTO media_files (filename, file_type, file_data, file_size, mime_type, user_id, is_public) VALUES (?, 'image', ?, ?, ?, ?, 0)");
    $stmt->bindParam(1, $newFilename);
    $stmt->bindParam(2, $fileData, PDO::PARAM_LOB);
    $stmt->bindParam(3, $fileSize, PDO::PARAM_INT);
    $stmt->bindParam(4, $mimeType);
    $stmt->bindParam(5, $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $mediaId = $database->lastInsertId();

    $stmt = $database->prepare("UPDATE user SET profile_image_id = :media_id WHERE user_id = :user_id");
    $stmt->execute([
        ':media_id' => $mediaId,
        ':user_id' => $user_id
    ]);

    $avatarUrl = '/uploads/avatars/' . $newFilename;
    echo json_encode([
        'success' => true,
        'message' => 'Avatar uploaded successfully',
        'media_id' => $mediaId,
        'avatar_url' => $avatarUrl
    ]);

} catch (PDOException $e) {
    sendErrorResponse($e->getMessage(), 500);
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
?>