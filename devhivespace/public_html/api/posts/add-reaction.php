<?php
// Enable error logging to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/add-reaction-error.log');

// Function to log messages with absolute path
function custom_log($message) {
    $logFile = __DIR__ . '/add-reaction-debug.log';
    $timestamp = date('Y-m-d H:i:s');
    // Ensure directory is writable
    if (!is_dir(dirname($logFile))) {
        mkdir(dirname($logFile), 0777, true);
    }
    // Append message with error handling
    error_log("[$timestamp] $message\n", 3, $logFile);
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../../config/database.php';

// Enable detailed error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Ensure error log is writable
$errorLogPath = __DIR__ . '/add-reaction-error.log';
if (!file_exists($errorLogPath)) {
    touch($errorLogPath);
    chmod($errorLogPath, 0666);
}
ini_set('error_log', $errorLogPath);

// Comprehensive error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    custom_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    return false; // Let PHP handle the error
}, E_ALL);

// Comprehensive exception handler
set_exception_handler(function($exception) {
    custom_log("Uncaught Exception: " . $exception->getMessage());
    custom_log("Exception Trace: " . $exception->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error: ' . $exception->getMessage(),
        'trace' => $exception->getTraceAsString()
    ]);
    exit;
});

try {
    // Log all server variables for debugging
    custom_log("SERVER VARIABLES: " . print_r($_SERVER, true));
    custom_log("REQUEST METHOD: " . $_SERVER['REQUEST_METHOD']);
    custom_log("CONTENT TYPE: " . $_SERVER['CONTENT_TYPE']);

    // Log all input methods
    custom_log("_POST data: " . print_r($_POST, true));
    custom_log("_GET data: " . print_r($_GET, true));
    custom_log("_REQUEST data: " . print_r($_REQUEST, true));

    // Log raw input with more details
    $rawInput = file_get_contents('php://input');
    custom_log("Raw input length: " . strlen($rawInput));
    custom_log("Raw input content: " . $rawInput);

    // Attempt to handle different content types
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
    custom_log("Content-Type: " . $contentType);

    // If JSON content type, use json_decode
    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode($rawInput, true);
        custom_log("JSON decoded data: " . print_r($data, true));
    } 
    // If form-urlencoded, parse manually
    else if (stripos($contentType, 'application/x-www-form-urlencoded') !== false) {
        parse_str($rawInput, $data);
        custom_log("Form-urlencoded parsed data: " . print_r($data, true));
    }
    // Fallback to $_POST
    else {
        $data = $_POST;
        custom_log("Fallback to _POST data: " . print_r($data, true));
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Validate required fields with more detailed logging
    $requiredFields = ['post_id', 'user_id', 'reaction_type'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            custom_log("Missing required field: $field");
            throw new Exception("$field is required");
        }
    }

    // Validate input data with extensive logging
    if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['reaction_type'])) {
        custom_log("VALIDATION ERROR: Missing required fields");
        custom_log("Received data: " . print_r($data, true));
        throw new Exception("Missing required fields: post_id, user_id, or reaction_type");
    }

    // Robust type conversion and validation
    $postId = filter_var($data['post_id'], FILTER_VALIDATE_INT);
    $userId = filter_var($data['user_id'], FILTER_VALIDATE_INT);

    if ($postId === false) {
        custom_log("VALIDATION ERROR: Invalid post_id");
        custom_log("Received post_id: " . $data['post_id']);
        throw new Exception("Invalid post_id: must be a numeric value");
    }

    if ($userId === false) {
        custom_log("VALIDATION ERROR: Invalid user_id");
        custom_log("Received user_id: " . $data['user_id']);
        throw new Exception("Invalid user_id: must be a numeric value");
    }

    $reactionType = $data['reaction_type'];

    // Log the parsed data
    custom_log("Parsed data - PostID: $postId, UserID: $userId, ReactionType: $reactionType");

    // Check database connection
    if (!$conn) {
        throw new Exception("Database connection failed: " . mysqli_connect_error());
    }

    // Log database connection details
    custom_log("Database Connection Details:");
    custom_log("Host: $host");
    custom_log("Database: $db_name");
    custom_log("Connection Status: " . ($conn ? "Successful" : "Failed"));
    if ($conn->connect_error) {
        custom_log("Connection Error: " . $conn->connect_error);
    }

    // Validate input data with extensive logging
    if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['reaction_type'])) {
        custom_log("VALIDATION ERROR: Missing required fields");
        custom_log("Received data: " . print_r($data, true));
        throw new Exception("Missing required fields: post_id, user_id, or reaction_type");
    }

    // Log input data for debugging
    custom_log("Input Data Validation:");
    custom_log("Post ID: " . $data['post_id']);
    custom_log("User ID: " . $data['user_id']);
    custom_log("Reaction Type: " . $data['reaction_type']);

    // Additional validation for data types
    if (!is_numeric($data['post_id']) || !is_numeric($data['user_id'])) {
        custom_log("VALIDATION ERROR: Invalid data types");
        throw new Exception("post_id and user_id must be numeric");
    }

    // Verify post existence before processing
    $postCheckQuery = "SELECT * FROM post WHERE post_id = ?";
    $postCheckStmt = $conn->prepare($postCheckQuery);
    if (!$postCheckStmt) {
        custom_log("PREPARE ERROR for post check: " . $conn->error);
        throw new Exception("Failed to prepare post check statement");
    }

    $postCheckStmt->bind_param("i", $postId);
    if (!$postCheckStmt->execute()) {
        custom_log("EXECUTE ERROR for post check: " . $postCheckStmt->error);
        throw new Exception("Failed to execute post check statement");
    }

    $postResult = $postCheckStmt->get_result();
    if ($postResult->num_rows === 0) {
        custom_log("VALIDATION ERROR: Post does not exist");
        throw new Exception("Post with ID $postId does not exist");
    }
    $postCheckStmt->close();

    // Validate user exists
    $userCheckQuery = "SELECT user_id FROM user WHERE user_id = ?";
    $userCheckStmt = $conn->prepare($userCheckQuery);
    if (!$userCheckStmt) {
        throw new Exception("Prepare failed for user check: " . $conn->error);
    }

    $userCheckStmt->bind_param("i", $userId);
    
    if (!$userCheckStmt->execute()) {
        throw new Exception("Execute failed for user check: " . $userCheckStmt->error);
    }

    $userResult = $userCheckStmt->get_result();
    if ($userResult->num_rows === 0) {
        throw new Exception("User with ID $userId does not exist");
    }
    $userCheckStmt->close();

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check if reaction already exists
        $checkQuery = "SELECT reaction_id FROM reaction WHERE post_id = ? AND user_id = ?";
        $checkStmt = $conn->prepare($checkQuery);
        if (!$checkStmt) {
            throw new Exception("Prepare failed for check query: " . $conn->error);
        }

        $checkStmt->bind_param("ii", $postId, $userId);
        
        if (!$checkStmt->execute()) {
            throw new Exception("Execute failed for check query: " . $checkStmt->error);
        }

        $result = $checkStmt->get_result();
        $existingReaction = $result->fetch_assoc();
        $checkStmt->close();

        if ($existingReaction) {
            // Update existing reaction
            $query = "UPDATE reaction SET reaction_type = ? WHERE post_id = ? AND user_id = ?";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed for update: " . $conn->error);
            }

            $stmt->bind_param("sii", $reactionType, $postId, $userId);  
        } else {
            // Insert new reaction
            $query = "INSERT INTO reaction (post_id, user_id, reaction_type) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed for insert: " . $conn->error);
            }

            $stmt->bind_param("iis", $postId, $userId, $reactionType);
        }

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $stmt->close();

        // Log the reaction type being added
        custom_log("Attempting to add reaction - Type: $reactionType");

        // Get the total reaction count for this post
        $countQuery = "SELECT COUNT(*) as reaction_count FROM reaction WHERE post_id = ? AND reaction_type = 'like'";
        $countStmt = $conn->prepare($countQuery);
        if (!$countStmt) {
            throw new Exception("Prepare failed for count query: " . $conn->error);
        }

        $countStmt->bind_param("i", $postId);
        
        if (!$countStmt->execute()) {
            throw new Exception("Execute failed for count query: " . $countStmt->error);
        }

        $countResult = $countStmt->get_result();
        $reactionCountRow = $countResult->fetch_assoc();
        $reactionCount = $reactionCountRow['reaction_count'];
        $countStmt->close();

        // Fetch the last reaction row for this post/user for debugging
        $debugReactionRow = null;
        $debugQuery = "SELECT * FROM reaction WHERE post_id = ? AND user_id = ? ORDER BY reaction_id DESC LIMIT 1";
        $debugStmt = $conn->prepare($debugQuery);
        if ($debugStmt) {
            $debugStmt->bind_param("ii", $postId, $userId);
            if ($debugStmt->execute()) {
                $debugResult = $debugStmt->get_result();
                $debugReactionRow = $debugResult->fetch_assoc();
            }
            $debugStmt->close();
        }

        // Commit transaction
        $conn->commit();

        // Log successful reaction
        custom_log("Reaction added successfully. Post ID: $postId, User ID: $userId, Reaction Type: $reactionType, Total Likes: $reactionCount");

        // Return success response with reaction count and debug info
        echo json_encode([
            'status' => 'success',
            'message' => 'Reaction processed successfully',
            'data' => [
                'reaction_count' => $reactionCount,
                'debug_reaction_row' => $debugReactionRow
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        custom_log("Transaction error: " . $e->getMessage());
        throw $e;
    }

} catch (Exception $e) {
    custom_log("Caught exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    // Close the database connection
    if (isset($conn)) {
        $conn->close();
    }
}
?> 