<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); 
ini_set('display_startup_errors', 1);

if (defined('APP_RUNNING') === false && php_sapi_name() !== 'cli') {
    if (isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], 'PostmanRuntime') === false) {
        http_response_code(403);
        die('Forbidden');
    }
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: https://devhivespace.com');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../config/database.php';   

initializeSession();

if (!isset($_SESSION['user_id'])) {
    sendErrorResponse('Not authenticated', 401);
}

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

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function logError($message) {
    error_log('[UPDATE PROFILE] ' . $message);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendErrorResponse('Only POST method is allowed', 405);
    }

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendErrorResponse('Invalid JSON input', 400);
    }

    $token = $data['token'] ?? '';
    if (empty($token)) {
        sendErrorResponse('Token is required', 400);
    }

    $token = sanitizeInput($token);

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
        $connectionErrorDetails = [
            'message' => $connectionError->getMessage(),
            'code' => $connectionError->getCode(),
            'file' => $connectionError->getFile(),
            'line' => $connectionError->getLine()
        ];
        error_log('Database Connection Error in Update Profile: ' . json_encode($connectionErrorDetails));
        
        logError('Connection Attempt Details: ' . json_encode([
            'host' => 'localhost',
            'dbname' => 'devhive',
            'user' => 'root',
            'password_provided' => strlen("") > 0
        ]));
        
        sendErrorResponse('Database connection failed', 500);
    }

    $stmt = $database->prepare("SELECT user_id FROM users WHERE token = :token AND is_active = 1");
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendErrorResponse('Unauthorized or inactive user', 401);
    }

    $updateFields = [];
    $params = [':user_id' => $user['user_id']];

    $allowedFields = [
        'first_name' => function($value) { 
            return !empty(trim($value)) && strlen(trim($value)) <= 50; 
        },
        'middle_name' => function($value) { 
            return $value === null || (strlen(trim($value)) <= 50); 
        },
        'last_name' => function($value) { 
            return !empty(trim($value)) && strlen(trim($value)) <= 50; 
        },
        'email' => function($value) { 
            return !empty(trim($value)) && validateEmail($value); 
        },
        'birthday' => function($value) { 
            return !empty(trim($value)) && strtotime($value) !== false; 
        }
    ];

    foreach ($allowedFields as $field => $validator) {
        if (isset($data[$field])) {
            $value = trim($data[$field]);
            
            if ($value === '' && $field !== 'email') continue;

            if ($validator($value)) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $value;
            } else {
                sendErrorResponse("Invalid $field format", 400);
            }
        }
    }

    if (empty($updateFields)) {
        sendErrorResponse('No valid update fields provided', 400);
    }

    $updateQuery = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE user_id = :user_id";
    $stmt = $database->prepare($updateQuery);
    $stmt->execute($params);

    error_log("Profile updated for user ID: {$user['user_id']}");

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);

} catch (PDOException $e) {
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Database Error in Update Profile: ' . json_encode($errorDetails));

    logError('PDO Connection Details: ' . json_encode([
        'host' => 'localhost',
        'dbname' => 'devhive',
        'user' => 'root',
        'input_data' => array_keys($data),
        'session_user_id' => $_SESSION['user_id'] ?? 'Not set'
    ]));
    
    sendErrorResponse('Internal server error', 500);
} catch (Exception $e) {
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Unexpected Error in Update Profile: ' . json_encode($errorDetails));

    logError('Input Data: ' . json_encode($data));
    
    sendErrorResponse('An unexpected error occurred', 500);
}
?> 