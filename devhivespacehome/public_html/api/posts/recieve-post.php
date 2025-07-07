<?php 
require_once 'database.php';

// Parse the json
$input = json_decode(file_get_contents("php://input"), true);
$incoming_token = $input['token'];
$shared_post_id = $input['shared_post_id'];
$content = $input['content'];

// Verifies the token
$stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ?");
$stmt->bind_param("s", $incoming_token);
$stmt->execute();
$stmt->bind_result($local_user_id);
$stmt->fetch();
$stmt->close();

//  Verify if the user from the client exists
if (!$local_user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or unauthorized token.']);
    exit;
}

// Save to their own DB
$stmt = $conn->prepare("INSERT INTO share (user_id, caption VALUES (?, ?))");
$stmt->bind_param("is", $local_user_id, $content);
$stmt->execute();
?>