<?php
// Strict error reporting and security headers
error_reporting(E_ALL);
ini_set('display_errors', 1); // Change to 1 for debugging
ini_set('display_startup_errors', 1);

// Prevent direct script access with more flexible check
if (defined('APP_RUNNING') === false && php_sapi_name() !== 'cli') {
    // Allow API testing from Postman or CLI, block direct file access
    if (isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], 'PostmanRuntime') === false) {
        http_response_code(403);
        die('Forbidden');
    }
}

// Enhanced CORS and security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: https://devhivespace.com'); // Replace with your frontend domain
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Require secure session configuration
require_once __DIR__ . '/copy/config/session_config.php';
require_once __DIR__ . '/copy/config/database.php';

// Enhanced session and authentication check
initializeSession();

if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('Not authenticated', 401);
}

// Error response function
function sendErrorResponse($message, $status_code = 400) {
    http_response_code($status_code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

// Validate and sanitize input
function sanitizeInput($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

// Validate and sanitize file upload
function validateFileUpload($file) {
    // Allowed image types
    $allowedTypes = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp']
    ];

    // Maximum file size (5MB)
    $maxFileSize = 5 * 1024 * 1024;

    // Check if file was uploaded successfully
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred');
    }

    // Validate file type
    if (!array_key_exists($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
    }

    // Validate file size
    if ($file['size'] > $maxFileSize) {
        throw new Exception('File size must be less than 5MB');
    }

    // Additional security: validate file extension
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($fileExtension, $allowedTypes[$file['type']])) {
        throw new Exception('File extension does not match file type');
    }

    return $fileExtension;
}

// Add error logging at the top of the script
function logError($message) {
    error_log('[UPLOAD AVATAR] ' . $message);
}

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendErrorResponse('Only POST method is allowed', 405);
    }

    // Validate token
    $token = $_POST['token'] ?? '';
    if (empty($token)) {
        sendErrorResponse('Token is required', 400);
    }

    $token = sanitizeInput($token);

    // Database connection with error handling
    $database = getDatabaseConnection();

    // Validate token first
    $stmt = $database->prepare("SELECT user_id FROM users WHERE token = :token AND is_active = 1");
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendErrorResponse('Unauthorized or inactive user', 401);
    }

    // Validate and process file upload
    $fileExtension = validateFileUpload($_FILES['avatar']);

    // Create upload directory if it doesn't exist
    $uploadDir = '../uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename with additional entropy
    $newFilename = $user['user_id'] . '_avatar_' . bin2hex(random_bytes(8)) . '.' . $fileExtension;
    $uploadPath = $uploadDir . $newFilename;

    // Move uploaded file with additional security checks
    if (!is_uploaded_file($_FILES['avatar']['tmp_name'])) {
        throw new Exception('Invalid file upload');
    }

    // Use more secure file moving method
    if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // Set correct permissions
    chmod($uploadPath, 0644);

    // Update user's avatar in database
    $avatarUrl = 'uploads/avatars/' . $newFilename;
    $stmt = $database->prepare("UPDATE users SET avatar_url = :avatar_url WHERE user_id = :user_id");
    $stmt->execute([
        ':avatar_url' => $avatarUrl,
        ':user_id' => $user['user_id']
    ]);

    // Log successful avatar upload
    error_log("Avatar uploaded for user ID: {$user['user_id']}");

    // Successful upload
    echo json_encode([
        'success' => true,
        'message' => 'Avatar uploaded successfully',
        'avatar_url' => $avatarUrl
    ]);

} catch (PDOException $e) {
    // Log the actual error server-side, return generic message
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Database Error in Avatar Upload: ' . json_encode($errorDetails));
    
    // Log additional context
    logError('PDO Connection Details: ' . json_encode([
        'host' => 'localhost',
        'dbname' => 'devhive',
        'user' => 'root',
        'file_upload_status' => isset($_FILES['avatar']) ? 'File received' : 'No file',
        'session_user_id' => $_SESSION['user_id'] ?? 'Not set'
    ]));
    
    sendErrorResponse('Internal server error', 500);
} catch (Exception $e) {
    // Log unexpected errors with full details
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Unexpected Error in Avatar Upload: ' . json_encode($errorDetails));
    
    // Log file upload details for debugging
    logError('File Upload Details: ' . json_encode([
        'file_exists' => isset($_FILES['avatar']),
        'file_error' => isset($_FILES['avatar']) ? $_FILES['avatar']['error'] : 'N/A',
        'file_name' => isset($_FILES['avatar']) ? $_FILES['avatar']['name'] : 'N/A',
        'file_size' => isset($_FILES['avatar']) ? $_FILES['avatar']['size'] : 'N/A'
    ]));
    
    sendErrorResponse('An unexpected error occurred', 500);
}

// Explicit database connection with detailed error handling
try {
    $database = new PDO(
        "mysql:host=localhost;dbname=devhive;charset=utf8mb4", 
        "root", 
        "", 
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
} catch (PDOException $connectionError) {
    // Log detailed connection error
    $connectionErrorDetails = [
        'message' => $connectionError->getMessage(),
        'code' => $connectionError->getCode(),
        'file' => $connectionError->getFile(),
        'line' => $connectionError->getLine()
    ];
    error_log('Database Connection Error in Avatar Upload: ' . json_encode($connectionErrorDetails));
    
    // Detailed logging of connection parameters
    logError('Connection Attempt Details: ' . json_encode([
        'host' => 'localhost',
        'dbname' => 'devhive',
        'user' => 'root',
        'password_provided' => strlen("") > 0
    ]));
    
    sendErrorResponse('Database connection failed', 500);
}
?>