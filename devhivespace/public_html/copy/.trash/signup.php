<?php
// Start output buffering
ob_start();

// Prevent caching
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json');

// Enable error logging with all details
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Set error handler to catch all errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    $response = [
        'success' => false,
        'message' => 'Internal server error occurred',
        'debug' => "Error [$errno]: $errstr in $errfile on line $errline"
    ];
    
    // Clean any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode($response);
    exit(1);
});

// Log request details
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log("Raw POST data: " . file_get_contents('php://input'));

try {
    // Get and log raw input
    $raw_input = file_get_contents('php://input');
    error_log("Raw Input: " . $raw_input);
    
    // Parse JSON input
    $data = json_decode($raw_input, true);
    
    // Check for JSON parsing errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON: " . json_last_error_msg() . ". Raw input: " . substr($raw_input, 0, 1000));
    }
    
    error_log("Decoded Data: " . print_r($data, true));

    // Validate required fields
    $required = ['username', 'email', 'password', 'confirm_password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Validate password match
    if ($data['password'] !== $data['confirm_password']) {
        throw new Exception("Passwords do not match");
    }

    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Connect to database
    error_log("Attempting database connection");
    $conn = new mysqli('localhost', 'u798703225_devhivespace', 'Pupt2026', 'u798703225_devhivespace');
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    error_log("Database connection successful");

    // Check if username exists
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ? LIMIT 1");
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param("s", $data['username']);
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        throw new Exception("Database error: " . $stmt->error);
    }
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        throw new Exception("Username already exists");
    }
    $stmt->close();

    // Check if email exists
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE email = ? LIMIT 1");
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param("s", $data['email']);
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        throw new Exception("Database error: " . $stmt->error);
    }
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        throw new Exception("Email already registered");
    }
    $stmt->close();

    // Insert new user
    error_log("Attempting to insert new user");
    $stmt = $conn->prepare("INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)");
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        throw new Exception("Database error: " . $conn->error);
    }
    
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt->bind_param("sss", $data['username'], $data['email'], $password_hash);
    
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        throw new Exception("Failed to create user: " . $stmt->error);
    }

    $user_id = $stmt->insert_id;
    error_log("New user created with ID: " . $user_id);
    $stmt->close();

    // Start session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $data['username'];
    error_log("Session started for user: " . $user_id);

    // Clean output buffer before sending response
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Return success response
    $response = [
        'success' => true,
        'message' => 'Registration successful',
        'user' => [
            'user_id' => $user_id,
            'username' => $data['username'],
            'email' => $data['email']
        ]
    ];
    error_log("Sending success response: " . json_encode($response));
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in signup process: " . $e->getMessage());
    
    // Clean output buffer before sending error response
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    $error_response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    error_log("Sending error response: " . json_encode($error_response));
    http_response_code(400);
    echo json_encode($error_response);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 