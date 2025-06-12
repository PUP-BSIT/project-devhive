<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); // Change to 1 for debugging
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
header('Access-Control-Allow-Methods: GET');
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

function logError($message) {
    error_log('[GET USER DATA] ' . $message);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendErrorResponse('Only GET method is allowed', 405);
    }

    $token = $_GET['token'] ?? '';
    if (empty($token)) {
        logError('Token Validation Failure: ' . json_encode([
            'get_params' => $_GET,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'query_string' => $_SERVER['QUERY_STRING']
        ]));
        sendErrorResponse('Token is required', 400);
    }

    $token = sanitizeInput($token);

    logError('Received Token: ' . $token);

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
        error_log('Database Connection Error: ' . json_encode($connectionErrorDetails));

        logError('Connection Attempt Details: ' . json_encode([
            'host' => 'localhost',
            'dbname' => 'devhive',
            'user' => 'root',
            'password_provided' => strlen("") > 0
        ]));
        
        sendErrorResponse('Database connection failed', 500);
    }

    $stmt = $database->prepare(
        "SELECT 
            username, 
            first_name, 
            middle_name, 
            last_name, 
            email, 
            birthday 
         FROM users 
        WHERE token = :token AND is_active = 1"
    );
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendErrorResponse('Unauthorized or inactive user', 401);
    }

    echo json_encode([
        'success' => true,
        'user' => [
        'username' => $user['username'],
        'first_name' => $user['first_name'],
        'middle_name' => $user['middle_name'] ?? '',
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'birthday' => $user['birthday']
        ]
    ]);

} catch (PDOException $e) {
    $errorDetails = [
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('Database Error in Get User Data: ' . json_encode($errorDetails));
    
    logError('PDO Connection Details: ' . json_encode([
        'host' => 'localhost',
        'dbname' => 'devhive',
        'user' => 'root',
        'token_provided' => isset($_GET['token']),
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
    error_log('Unexpected Error in Get User Data: ' . json_encode($errorDetails));
    
    sendErrorResponse('An unexpected error occurred', 500);
}
?> 