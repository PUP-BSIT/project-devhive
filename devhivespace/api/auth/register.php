<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../config/database.php';

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('No data received');
    }

    // Validate required fields
    $required_fields = ['email', 'username', 'first_name', 'last_name', 'password', 'confirm_password'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check if passwords match
    if ($data['password'] !== $data['confirm_password']) {
        throw new Exception('Passwords do not match');
    }

    // Check if email already exists
    $stmt = execute_query($conn, "SELECT user_id FROM user WHERE email = ?", [$data['email']]);
    if (fetch_one($stmt)) {
        throw new Exception('Email already registered');
    }

    // Check if username already exists
    $stmt = execute_query($conn, "SELECT user_id FROM user WHERE username = ?", [$data['username']]);
    if (fetch_one($stmt)) {
        throw new Exception('Username already taken');
    }

    // Hash password
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Start transaction
    begin_transaction($conn);

    // Insert user
    $stmt = execute_query($conn, 
        "INSERT INTO user (
            email, username, password_hash, first_name, middle_name, 
            last_name, birthday, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())",
        [
            $data['email'],
            $data['username'],
            $password_hash,
            $data['first_name'],
            $data['middle_name'] ?? null,
            $data['last_name'],
            $data['birthday'] ?? null
        ]
    );

    $user_id = last_insert_id($conn);

    // Generate verification token
    $verification_token = bin2hex(random_bytes(32));
    
    // Store token
    execute_query($conn, 
        "INSERT INTO auth_token (user_id, token, app_name, created_at, expires_at)
        VALUES (?, ?, 'email_verification', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR))",
        [$user_id, $verification_token]
    );

    // Commit transaction
    commit_transaction($conn);

    // Return success response
    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'verification_token' => $verification_token,
        'message' => 'Registration successful'
    ]);

} catch (Exception $e) {
    // Rollback transaction if active
    if (isset($conn) && $conn->inTransaction()) {
        rollback_transaction($conn);
    }

    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 