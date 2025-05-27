<?php
session_start();
header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (isset($_SESSION['pending_user'])) {
    // For form sign-up, verify token
    if ($_SESSION['pending_user']['auth_provider'] === 'form') {
        $token = $data['token'] ?? '';
        $storedToken = $_SESSION['verification_token'] ?? '';
        
        if (empty($token) || $token !== $storedToken) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid verification token'
            ]);
            exit();
        }
        
        unset($_SESSION['verification_token']);
    }
    
    $_SESSION['pending_user']['verified_email'] = true;
    $_SESSION['user'] = $_SESSION['pending_user'];
    unset($_SESSION['pending_user']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Email verified successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No pending verification found'
    ]);
}
?> 