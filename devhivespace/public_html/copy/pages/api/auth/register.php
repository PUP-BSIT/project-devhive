<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/copy/config/database.php';
require_once __DIR__ . '/copy/config/session_config.php';

// Helper: Send JSON response and exit
function respond($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$required = ['username', 'email', 'password', 'first_name', 'last_name', 'birthday'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        respond(false, "Missing required field: $field");
    }
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respond(false, "Invalid email format.");
}

if (strlen($data['password']) < 8) {
    respond(false, "Password must be at least 8 characters.");
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $data['username'])) {
    respond(false, "Username must be alphanumeric (letters, numbers, underscores only).");
}

$stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $data['username'], $data['email']);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    respond(false, "Username or email already exists.");
}
$stmt->close();

// Hash password
$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

// Generate verification token
$verification_token = bin2hex(random_bytes(32));

// Insert user
$stmt = $conn->prepare("INSERT INTO user (username, email, password_hash, first_name, last_name, birthday, email_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, 0, ?)");
$stmt->bind_param(
    "sssssss",
    $data['username'],
    $data['email'],
    $password_hash,
    $data['first_name'],
    $data['last_name'],
    $data['birthday'],
    $verification_token
);

if (!$stmt->execute()) {
    respond(false, "Database error: " . $stmt->error);
}
$stmt->close();

// Email template
$verify_url = "https://devhivespace.com/copy/api/auth/verify_email.php?token=$verification_token";
    $to = $data['email'];
    $subject = "Verify your email for DevHive Space";
    $htmlMessage = "
    <html>
      <body style='font-family: Arial, sans-serif;'>
        <div style='max-width:600px;margin:auto;padding:20px;border:1px solid #eee;'>
          <h2 style='color:#2d3748;'>DevHive Space Email Verification</h2>
          <p>Hello {$data['first_name']},</p>
          <p>Thank you for registering at <b>DevHive Space</b>!</p>
          <p>Please verify your email by clicking the button below:</p>
          <p style='text-align:center;'>
            <a href='$verify_url' style='background:#4F46E5;color:#fff;
            padding:12px 24px;text-decoration:none;border-radius:5px;'>Verify Email</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your 
          browser:</p>
          <p><a href='$verify_url'>$verify_url</a></p>
          <hr>
          <p style='font-size:12px;color:#888;'>If you did not sign up, please 
          ignore this email.</p>
          <p style='font-size:12px;color:#888;'>Best regards,<br>DevHive Space
           Team</p>
        </div>
      </body>
    </html>
    ";
    $plainMessage = "Hello {$data['first_name']},\n\nThank you for registering
     at DevHive Space!\nPlease verify your email by visiting this 
     link:\n$verify_url\n\nIf you did not sign up, please ignore this email.
     \n\nBest regards,\nDevHive Space Team";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: DevHive Space <no-reply@devhivespace.com>\r\n";
    
    // Send HTML and plain text (Hostinger mail() supports this)
    mail($to, $subject, $htmlMessage, $headers);
    
    respond(true, "Registration successful! Please check your email for verification.");

initializeSession();
if (!isSessionActive()) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Session expired or invalid. Please log in again."
    ]);
    exit;
}
    ?>