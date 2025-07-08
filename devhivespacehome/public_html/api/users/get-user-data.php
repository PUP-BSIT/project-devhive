<?php
ini_set('error_log', __DIR__ . '/../../../get-user.log');

// CORS and security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';

initializeSession();

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
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendErrorResponse('Only GET method is allowed', 405);
    }

    $token = $_GET['token'] ?? '';
    if (!$token) {
        sendErrorResponse('Missing token', 400);
    }

    $stmt = $conn->prepare(
        "SELECT user_id
         FROM oauth_tokens
         WHERE token = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if (!($row = $result->fetch_assoc())) {
        sendErrorResponse('Invalid or expired token', 401);
    }

    $user_id = $row['user_id'];
    $provider = $_GET['provider'] ?? 'devhive';

    switch ($provider) {
        case 'heybleepi':
            $query = "
                SELECT user_id, username AS user_name, first_name, middle_name,
                last_name, email, birthday AS birthdate
                FROM users
                WHERE user_id = ?
            ";
            break;


        case 'devhive':
            $query = "
                SELECT user_id, username, first_name, middle_name, last_name, 
                email, birthday
                FROM user
                WHERE user_id = ?
            ";
            break;


        case 'hershive':
            $query = "
                SELECT user_id, username, first_name, middle_name, last_name, 
                email, birthday
                FROM user
                WHERE user_id = ?
            ";
            break;


        default:
            sendErrorResponse('Invalid platform', 400);
    }


    $userStmt = $conn->prepare($query);
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();


    if ($user = $userResult->fetch_assoc()) {
        // Get total likes made by the user
        $likeStmt = $conn->prepare("SELECT COUNT(*) as total_likes FROM reaction 
             WHERE user_id = ? AND reaction_type = 'like'");
        $likeStmt->bind_param("i", $user_id);
        $likeStmt->execute();
        $likeResult = $likeStmt->get_result();
        $likeCount = $likeResult->fetch_assoc()['total_likes'];
        $likeStmt->close();

        // Get total comments made by the user
        $commentStmt = $conn->prepare("SELECT COUNT(*) as total_comments                                                
          FROM comment WHERE user_id = ?");
        $commentStmt->bind_param("i", $user_id);
        $commentStmt->execute();
        $commentResult = $commentStmt->get_result();
        $commentCount = $commentResult->fetch_assoc()['total_comments'];
        $commentStmt->close();

        $user = [
            'user_id' => $user['user_id'],
            'username' => $user['username'] ?? $user['user_name'] ?? null,
            'first_name' => $user['first_name'],
            'middle_name' => $user['middle_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'birthday' => $user['birthday'] ?? $user['birthdate'],
            'total_likes' => $likeCount,
            'total_comments' => $commentCount,
        ];

        if (empty($user['user_id']) || empty($user['username'])) {
            sendErrorResponse('User data incomplete', 500);
        }

        echo json_encode($user);
    } else {
        sendErrorResponse('User not found', 404);
    }
    $userStmt->close();
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