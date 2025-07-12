<?php
ob_clean();
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../../config/session_config.php';
    initializeSession();

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $provider = isset($_SESSION['provider']) ? $_SESSION['provider'] : null;

    require_once __DIR__ . '/../../../config/database.php';
    $profileImageUrl = '/assets/human.png'; // Default
    $first_name = $middle_name = $last_name = $db_username = null;
    $profile_image_id = $profile_picture = null;

    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) throw new Exception('DB connection failed');
    $stmt = $conn->prepare('SELECT profile_image_id, profile_picture, first_name, middle_name, last_name, username FROM user WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->bind_result($profile_image_id, $profile_picture, $first_name, $middle_name, $last_name, $db_username);
    if ($stmt->fetch()) {
        // All values are now in variables
    }
    $stmt->close();

    // Now, safely run a new statement if needed
    if ($profile_image_id) {
        $stmt2 = $conn->prepare('SELECT filename FROM media_files WHERE id = ?');
        $stmt2->bind_param('i', $profile_image_id);
        $stmt2->execute();
        $stmt2->bind_result($filename);
        if ($stmt2->fetch() && $filename) {
            $profileImageUrl = '/uploads/avatars/' . $filename;
        }
        $stmt2->close();
    } elseif ($profile_picture) {
        if (strpos($profile_picture, 'http') === 0) {
            $profileImageUrl = $profile_picture;
        } else {
            $profileImageUrl = '/uploads/avatars/' . $profile_picture;
        }
    }

    $conn->close();

    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'username' => $db_username,
        'provider' => $provider,
        'profile_image_url' => $profileImageUrl,
        'first_name' => $first_name,
        'middle_name' => $middle_name,
        'last_name' => $last_name
    ]);
    exit;
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Fatal error: ' . $e->getMessage()]);
    exit;
}