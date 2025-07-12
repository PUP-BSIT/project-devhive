<?php
// Strict error reporting and security headers
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Prevent direct script access
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
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Require necessary configurations
require_once __DIR__ . '/copy/config/session_config.php';
require_once __DIR__ . '/copy/config/database.php';

// Initialize session
initializeSession();

// Error response function
function sendResponse($success, $message, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
}

// Validate and sanitize input
function sanitizeInput($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Only POST method is allowed', 405);
    }

    // Check if user is authenticated
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Not authenticated', 401);
    }

    // Get token from POST data
    $token = $_POST['token'] ?? '';
    if (empty($token)) {
        sendResponse(false, 'Token is required', 400);
    }

    // Sanitize inputs
    $displayName = sanitizeInput($_POST['display_name'] ?? '');
    
    // Validate display name
    if (strlen($displayName) < 3) {
        sendResponse(false, 'Display name must be at least 3 characters long', 400);
    }

    // Database connection
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

    // Handle profile image upload
    $profileImagePath = null;
    if (isset($_FILES['profile_image'])) {
        $uploadDir = __DIR__ . '/../../uploads/profile_images/';
        
        // Ensure upload directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $fileExtension = pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION);
        $uniqueFilename = uniqid('profile_', true) . '.' . $fileExtension;
        $uploadPath = $uploadDir . $uniqueFilename;

        // Move uploaded file
        if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $uploadPath)) {
            $profileImagePath = $uniqueFilename;
        } else {
            sendResponse(false, 'Failed to upload profile image', 500);
        }
    }

    // Prepare update statement
    $updateFields = ['first_name' => $displayName];
    if ($profileImagePath) {
        $updateFields['profile_image'] = $profileImagePath;
    }

    $setClauses = [];
    $params = [];
    foreach ($updateFields as $field => $value) {
        $setClauses[] = "$field = :$field";
        $params[":$field"] = $value;
    }
    $params[':token'] = $token;

    $stmt = $database->prepare(
        "UPDATE users 
        SET " . implode(', ', $setClauses) . "
        WHERE token = :token"
    );
    
    // Execute update
    $result = $stmt->execute($params);

    if ($result) {
        sendResponse(true, 'Profile updated successfully');
    } else {
        sendResponse(false, 'Failed to update profile', 500);
    }

} catch (PDOException $e) {
    // Log the actual error server-side, return generic message
    error_log('Profile Update Error: ' . $e->getMessage());
    sendResponse(false, 'Database error occurred', 500);
} catch (Exception $e) {
    // Log unexpected errors
    error_log('Unexpected Profile Update Error: ' . $e->getMessage());
    sendResponse(false, 'An unexpected error occurred', 500);
}
?> 