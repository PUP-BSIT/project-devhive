<?php
require_once '../../config/database.php';

$stmt = execute_query($conn, "SELECT * FROM user ORDER BY user_id DESC LIMIT 1");
$latest_user = fetch_one($stmt);

if ($latest_user) {
    echo "<h2>Latest Registered User:</h2>";
    echo "<pre>";
    unset($latest_user['password_hash']);
    print_r($latest_user);
    echo "</pre>";
} else {
    echo "No users found in the database.";
}
?> 