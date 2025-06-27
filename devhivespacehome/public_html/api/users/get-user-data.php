<?php
// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// Security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Configuration
require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';

initializeSession();

// Error response function
function sendErrorResponse($message, $status_code = 400) {
    http_response_code($status_code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendErrorResponse('Only GET method is allowed', 405);
    }

    // Validate token
    $token = $_GET['token'] ?? '';
    if (!$token) {
        sendErrorResponse('Missing token', 400);
    }

    // OAuth token validation
    $stmt = $conn->prepare(
        "SELECT user_id FROM oauth_tokens WHERE token = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!($row = $result->fetch_assoc())) {
        sendErrorResponse('Invalid or expired token', 401);
    }

    $user_id = $row['user_id'];
    $provider = $_GET['provider'] ?? 'devhive';

    // Choose query based on provider
    switch ($provider) {
        case 'heybleepi':
            $query = "SELECT username AS user_name, first_name, middle_name,
             last_name, email, birthday AS birthdate FROM users WHERE id = ?";
            break;
        case 'devhive':
            $query = "SELECT username, first_name, middle_name, last_name, 
            email, birthday FROM user WHERE user_id = ?";
            break;
        case 'hershive':
            $query = "SELECT username, first_name, middle_name, last_name,
             email, birthday FROM users WHERE user_id = ?";
            break;
        default:
            sendErrorResponse('Invalid platform', 400);
    }

    // Get user data
    $userStmt = $conn->prepare($query);
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();

    if ($user = $userResult->fetch_assoc()) {
        echo json_encode($user);
    } else {
        sendErrorResponse('User not found', 404);
    }
    
    $userStmt->close();

} catch (Exception $e) {
    error_log('Error in Get User Data: ' . $e->getMessage());
    sendErrorResponse('Internal server error', 500);
}
?>