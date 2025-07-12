<?php
require_once __DIR__ . 'copy/config/database.php';

function respond($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function redirectWithMessage($message, $success = false) {
    $redirectUrl = "/devhivespace/public_html/copy/pages/login/index.html";
    $param = $success ? "success" : "error";
    header("Location: $redirectUrl?$param=" . urlencode($message));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // AJAX/JS verification
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? '';
    if (empty($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        respond(false, "Invalid or missing verification token.");
    }
    $stmt = $conn->prepare("SELECT user_id, email_verified, verification_token_expires FROM user WHERE verification_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        respond(false, "Invalid or expired verification token.");
    }
    $user = $result->fetch_assoc();
    if ($user['email_verified']) {
        respond(false, "Account already verified. Please log in.");
    }
    if (strtotime($user['verification_token_expires']) < time()) {
        respond(false, "Verification token has expired. Please register again.");
    }
    $stmt2 = $conn->prepare("UPDATE user SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE user_id = ?");
    $stmt2->bind_param("i", $user['user_id']);
    $stmt2->execute();
    $stmt2->close();
    respond(true, "Email verified successfully! You can now log in.");
} else {
    // Email link (GET)
    if (empty($_GET['token']) || !preg_match('/^[a-f0-9]{64}$/', $_GET['token'])) {
        redirectWithMessage("Invalid or missing verification token.");
    }
    $token = $_GET['token'];
    $stmt = $conn->prepare("SELECT user_id, email_verified, verification_token_expires FROM user WHERE verification_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        redirectWithMessage("Invalid or expired verification token.");
    }
    $user = $result->fetch_assoc();
    if ($user['email_verified']) {
        redirectWithMessage("Account already verified. Please log in.", true);
    }
    if (strtotime($user['verification_token_expires']) < time()) {
        redirectWithMessage("Verification token has expired. Please register again.");
    }
    $stmt2 = $conn->prepare("UPDATE user SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE user_id = ?");
    $stmt2->bind_param("i", $user['user_id']);
    $stmt2->execute();
    $stmt2->close();
    header("Location: /devhivespace/public_html/copy/pages/signup/verified.html");
    exit;
}
?>