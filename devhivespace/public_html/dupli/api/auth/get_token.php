<?php
session_start();

function generate_token($length = 40) {
    return bin2hex(random_bytes($length / 2));
}

// Validate required GET parameters
$redirect_url = isset($_GET['redirect_url']) ? $_GET['redirect_url'] : null;
$application_name = isset($_GET['application_name']) ? $_GET['application_name'] : null;

if (!$redirect_url || !$application_name) {
    $error_message = urlencode("Missing required parameters");

    if (!$redirect_url) {
        echo "Error: Missing required parameters.";
        exit;
    }
    header("Location: {$redirect_url}?error_message={$error_message}");
    exit;
}

// Check if user is authenticated (session variable set after login)
if (!isset($_SESSION['user_id'])) {

    $login_url = "/devhivespace/public_html/login/index.html";

    $params = http_build_query([
        'redirect_url' => $redirect_url,
        'application_name' => $application_name
    ]);
    echo "<h2>Login Required</h2>";
    echo "<p>Please <a href='{$login_url}?{$params}'>log in</a> to authorize <b>" . htmlspecialchars($application_name) . "</b> to access your data.</p>";
    echo "<script>setTimeout(function(){ window.location.href='{$login_url}?{$params}'; }, 2000);</script>";
    exit;
}

$authorization_token = generate_token();

$_SESSION['authorization_token'] = $authorization_token;

$redirect_with_token = $redirect_url . "?authorization_token=" . urlencode($authorization_token);
header("Location: $redirect_with_token");
exit;
?>