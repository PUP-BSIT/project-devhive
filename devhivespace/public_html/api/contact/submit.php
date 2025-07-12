<?php
// Enable maximum error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Ensure error log directory exists
$logDir = _DIR_ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Comprehensive error logging function
function detailedErrorLog($message, $context = [], $isError = false) {
    $logFile = _DIR_ . '/logs/' . ($isError ? 'error_' : 'debug_') . date('Y-m-d') . '.txt';
    $timestamp = date('Y-m-d H:i:s');
    
    // Capture full server and request details
    $serverInfo = [
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
        'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'N/A',
        'PHP_SAPI' => php_sapi_name(),
        'SERVER_PROTOCOL' => $_SERVER['SERVER_PROTOCOL'] ?? 'N/A',
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'] ?? 'N/A',
        'HTTP_USER_AGENT' => $_SERVER['HTTP_USER_AGENT'] ?? 'N/A',
        'ALL_HEADERS' => getallheaders(),
        'INPUT_STREAM_METADATA' => stream_get_meta_data('php://input')
    ];

    // Prepare log entry
    $logEntry = "[{$timestamp}] $message\n";
    $logEntry .= "Server Info:\n" . print_r($serverInfo, true) . "\n";
    
    if (!empty($context)) {
        $logEntry .= "Context:\n" . print_r($context, true) . "\n";
    }
    
    // Append to log file
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Catch any fatal errors
function handleFatalError() {
    $error = error_get_last();
    if ($error !== null) {
        detailedErrorLog('Fatal Error Occurred', [
            'type' => $error['type'],
            'message' => $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ], true);
        
        // Send error response
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Internal Server Error',
            'error_details' => 'A fatal error occurred during script execution'
        ]);
    }
}
register_shutdown_function('handleFatalError');

// Main script execution
try {
    // Detailed logging of script start
    detailedErrorLog('Contact Form Submission Attempt Started', [
        'all_server_vars' => $_SERVER,
        'all_headers' => getallheaders()
    ]);

    // Handle OPTIONS request for CORS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, *');
        http_response_code(200);
        exit;
    }

    // Ensure POST method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        detailedErrorLog('Invalid Request Method', [
            'method' => $_SERVER['REQUEST_METHOD']
        ], true);
        
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method Not Allowed',
            'details' => 'Only POST method is allowed'
        ]);
        exit;
    }

    // Multiple methods to read input
    $rawInput = '';
    $inputSources = [
        'php://input' => file_get_contents('php://input'),
        'POST' => file_get_contents('php://input'),
        'php://stdin' => file_get_contents('php://stdin'),
        '$_POST' => json_encode($_POST)
    ];

    // Log all input sources
    detailedErrorLog('Input Sources', [
        'input_sources' => array_map('strlen', $inputSources),
        'php_input_length' => strlen($inputSources['php://input']),
        'post_data_length' => strlen($inputSources['$_POST'])
    ]);

    // Find non-empty input
    foreach ($inputSources as $source => $content) {
        if (!empty(trim($content))) {
            $rawInput = $content;
            detailedErrorLog('Input Source Used', [
                'source' => $source,
                'input_length' => strlen($rawInput)
            ]);
            break;
        }
    }

    // Check if input is empty
    if (empty(trim($rawInput))) {
        detailedErrorLog('Empty Request Body', [
            'input_sources' => $inputSources
        ], true);
        
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Bad Request',
            'details' => 'Empty request body',
            'input_sources' => array_map('strlen', $inputSources)
        ]);
        exit;
    }

    // Decode JSON input with error handling
    $data = json_decode($rawInput, true);

    // Check for JSON decoding errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        detailedErrorLog('JSON Parsing Error', [
            'json_error' => json_last_error_msg(),
            'raw_input' => $rawInput
        ], true);
        
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON',
            'details' => json_last_error_msg(),
            'raw_input' => $rawInput
        ]);
        exit;
    }

    // Validate input
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $message = $data['message'] ?? '';

    // Log received data
    detailedErrorLog('Received Data', [
        'name' => $name,
        'email' => $email,
        'message_length' => strlen($message)
    ]);

    $errors = [];

    // Detailed Name validation
    if (empty($name)) {
        $errors['name'] = 'Name is required';
    } elseif (strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    } elseif (strlen($name) > 50) {
        $errors['name'] = 'Name must be less than 50 characters';
    }

    // Detailed Email validation
    if (empty($email)) {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Invalid email address format';
    }

    // Detailed Message validation
    if (empty($message)) {
        $errors['message'] = 'Message is required';
    } elseif (strlen($message) < 10) {
        $errors['message'] = 'Message must be at least 10 characters';
    } elseif (strlen($message) > 500) {
        $errors['message'] = 'Message must be less than 500 characters';
    }

    // If errors exist, return them
    if (!empty($errors)) {
        detailedErrorLog('Validation Errors', [
            'errors' => $errors,
            'input_data' => $data
        ], true);

        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'errors' => $errors
        ]);
        exit;
    }

    // Sanitize inputs
    $sanitizedName = htmlspecialchars(trim($name), ENT_QUOTES, 'UTF-8');
    $sanitizedEmail = htmlspecialchars(trim($email), ENT_QUOTES, 'UTF-8');
    $sanitizedMessage = htmlspecialchars(trim($message), ENT_QUOTES, 'UTF-8');

    // Simulate email sending (replace with actual email logic)
    $emailSent = true; // Placeholder for email sending logic

    if ($emailSent) {
        detailedErrorLog('Successful Submission', [
            'name' => $sanitizedName,
            'email' => $sanitizedEmail
        ]);

        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        echo json_encode([
            'success' => true,
            'message' => 'Your message has been sent successfully!'
        ]);
        exit;
    } else {
        throw new Exception('Email sending failed');
    }

} catch (Exception $e) {
    // Unexpected error handling
    detailedErrorLog('Critical Error', [
        'error_message' => $e->getMessage(),
        'error_trace' => $e->getTraceAsString()
    ], true);

    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred. Please try again later.',
        'error_details' => $e->getMessage()
    ]);
    exit;
}
?>