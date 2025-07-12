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
header('Access-Control-Allow-Origin: *'); // Allow all origins for development
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

// Validate email format
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Add error logging at the top of the script
function logError($message) {
    error_log('[UPDATE PROFILE] ' . $message);
}

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendErrorResponse('Only POST method is allowed', 405);
    }

    // Get raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Validate token with more robust checking
    $token = $data['token'] ?? '';
    if (empty($token)) {
        // Log additional details about the request
        error_log('Token Validation Failure: ' . json_encode([
            'input_data' => $data,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI']
        ]));
        sendErrorResponse('Token is required', 400);
    }

    // Sanitize inputs with more comprehensive validation
    $first_name = sanitizeInput($data['first_name'] ?? '');
    $middle_name = sanitizeInput($data['middle_name'] ?? '');
    $last_name = sanitizeInput($data['last_name'] ?? '');
    $profile_image = sanitizeInput($data['profile_image'] ?? '');

    // More comprehensive validation
    if (empty($first_name)) {
        // If first name is empty, use a default
        $first_name = 'User';
    }

    // Database connection
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
        error_log('Database Connection Error in Update Profile: ' . json_encode($connectionErrorDetails));
        
        // Detailed logging of connection parameters
        logError('Connection Attempt Details: ' . json_encode([
            'host' => 'localhost',
            'dbname' => 'devhive',
            'user' => 'root',
            'password_provided' => strlen("") > 0
        ]));
        
        sendErrorResponse('Database connection failed', 500);
    }

    // Log the update attempt
    error_log('Profile Update Attempt: ' . json_encode([
        'token' => $token,
        'first_name' => $first_name,
        'middle_name' => $middle_name,
        'last_name' => $last_name,
        'profile_image' => $profile_image
    ]));

    // Prepare update statement with more detailed error handling
    $stmt = $database->prepare(
        "UPDATE users 
         SET first_name = :first_name, 
             middle_name = :middle_name, 
             last_name = :last_name, 
             profile_image = :profile_image 
         WHERE token = :token AND is_active = 1"
    );

    try {
        $result = $stmt->execute([
            ':first_name' => $first_name,
            ':middle_name' => $middle_name,
            ':last_name' => $last_name,
            ':profile_image' => $profile_image,
            ':token' => $token
        ]);

        // Log the execution result
        error_log('Profile Update Execution Result: ' . json_encode([
            'result' => $result,
            'error_info' => $stmt->errorInfo()
        ]));

        if (!$result) {
            // Log detailed error information
            error_log('Profile Update Failed: ' . json_encode([
                'error_info' => $stmt->errorInfo(),
                'token' => $token,
                'first_name' => $first_name
            ]));
            sendErrorResponse('Failed to update profile', 500);
        }

        // Retrieve the updated user data to confirm
        $retrieveStmt = $database->prepare(
            "SELECT 
                username, 
                first_name, 
                middle_name, 
                last_name, 
                email, 
                profile_image 
            FROM users 
            WHERE token = :token AND is_active = 1"
        );
        $retrieveStmt->execute([':token' => $token]);
        $user = $retrieveStmt->fetch(PDO::FETCH_ASSOC);

        // Log retrieved user data
        error_log('Retrieved User Data After Update: ' . json_encode($user));

        // Return success response with updated user data
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => [
                'username' => $user['username'] ?? '', 
                'first_name' => $user['first_name'],
                'middle_name' => $user['middle_name'] ?? '',
                'last_name' => $user['last_name'] ?? '',
                'email' => $user['email'] ?? '', 
                'profile_image' => $user['profile_image'] || 'default_profile.png'
            ]
        ]);

    } catch (PDOException $e) {
        // Log the actual error server-side
        error_log('Profile Update PDO Error: ' . json_encode([
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'token' => $token
        ]));
        
        sendErrorResponse('Database error during profile update', 500);
    } catch (Exception $e) {
        // Log unexpected errors with full details
        $errorDetails = [
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ];
        error_log('Unexpected Error in Update Profile: ' . json_encode($errorDetails));
        
        // Log input data for debugging
        logError('Input Data: ' . json_encode($data));
        
        sendErrorResponse('An unexpected error occurred', 500);
    }

} catch (PDOException $e) {
    // Log the actual error server-side
    error_log('Profile Update PDO Error: ' . json_encode([
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'token' => $token
    ]));
    
    sendErrorResponse('Database error during profile update', 500);
} catch (Exception $e) {
    // Log unexpected errors with full details
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Unexpected Error in Update Profile: ' . json_encode($errorDetails));
    
    // Log input data for debugging
    logError('Input Data: ' . json_encode($data));
    
    sendErrorResponse('An unexpected error occurred', 500);
}
?> 