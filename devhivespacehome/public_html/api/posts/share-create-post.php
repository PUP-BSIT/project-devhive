<?php
require_once __DIR__ . '/../../../config/session_config.php';
initializeSession();
error_log("DEBUG: SESSION ID: " . session_id());
error_log("DEBUG: SESSION DATA: " . print_r($_SESSION, true));
error_log("DEBUG: COOKIES: " . print_r($_COOKIE, true));
error_log("DEBUG: POST DATA: " . print_r($_POST, true));
require_once '../../../config/database.php';
ini_set('error_log', __DIR__ . '/../../../error.log');
if (!isset($_SESSION['user_id'])) {
  header("Location: /global_wall/global_wall.html");
  exit;
}

$shared_post_id = isset($_POST['share_post_id']) ? intval($_POST['share_post_id']) : 0;

if ($shared_post_id <= 0) {
    error_log("Invalid or missing share_post_id: " . print_r($_POST, true));
    echo "<h1>Invalid post ID.</h1>";
    return;
}

$content = $_POST['content'] ?? '';
$user_id = $_SESSION['user_id'] ?? '';
$client = $_POST['share_to_other'] ?? '';
error_log("DEBUG: share_to_other (client): " . $client);
// for heybleepi receiver
$heybleepi_endpoint = "https://heybleepi.site/PROJECT-CLUB-404/heybleepi/codes/php/receive-post.php";
// for hershive receiver 
$hershive_endpoint ="https://hershive.com/project-hershell/Hershive/php/receive-post.php";

$stmt = $conn->prepare("SELECT
                          p.post_id,
                          p.user_id,
                          p.content,
                          p.created_at,
                          pi.image_url,
                          pv.video_url
                        FROM post p
                        LEFT JOIN post_image pi ON p.post_id = pi.post_id
                        LEFT JOIN post_video pv ON p.post_id = pv.post_id
                        WHERE p.post_id = ?;
                    ");
if (!$stmt) {
    error_log('Prepare failed: ' . $conn->error);
    die('Prepare failed: ' . $conn->error);
}

$stmt->bind_param("i", $shared_post_id);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($post_id, $user_id, $content, $created_at, $image_url, $video_url);

$posts = [];
while ($stmt->fetch()) {
    $posts[] =  $posts[] = [
        'id' => $post_id,
        'user_id' => $user_id,
        'content' => $content,
        'created_at' => $created_at,
        'image_url' => $image_url ? 'https://devhivespace.com' . str_replace(['../', './'], '', $image_url) : null,
        'video_url' => $video_url ? 'https://devhivespace.com' . str_replace(['../', './'], '', $video_url) : null,
        'client' => 'devhive',
    ];
}

$stmt->close();

if (empty($posts)) {
    error_log("No post found for post_id: $shared_post_id");
    echo "<h1>Post not found.</h1>";
    return;
}

switch ($client) {
  case 'heybleepi':
    $isAllowed = $_SESSION['isAllowed'] ?? '';
    if (!isset($_SESSION['oauth_token_' . $client])) {
        error_log("Heybleepi share: Missing oauth token for client: $client, user_id: " . ($_SESSION['user_id'] ?? 'unknown'));
        echo "Account not from devhive. (No token found)";
        return;
    }
    $user_token = $_SESSION['oauth_token_' . $client];

    $post = $posts[0];
    $data = [
        'token' => $user_token,
        'shared_post_id' => $post['id'],
        'content' => $content,
        'image_url' => $post['image_url'],
        'video_url' => $post['video_url'],
        'provider' => 'devhive'
    ];

    if ($isAllowed === 'allowed_to_share') {
        $ch = curl_init($heybleepi_endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $user_token
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) {
            $curlError = curl_error($ch);
            error_log("Heybleepi share: cURL error: $curlError, user_id: " . ($_SESSION['user_id'] ?? 'unknown'));
        }
        curl_close($ch);

        error_log("Heybleepi share: HTTP $httpCode, Response: $response, Data: " . json_encode($data));

        if ($httpCode === 200) {
            header("Location: https://devhivespace.com/global_wall/global_wall.html");
            exit;
        } else {
            header("HTTP/1.1 500 Internal Server Error");
            exit;
        }
        return;
    } else {
        error_log("Heybleepi share: User not allowed to share. user_id=" . ($_SESSION['user_id'] ?? 'unknown') . ", isAllowed=$isAllowed");
        echo '<h1>This account is not authorized to share.</h1>
            <p>Not Authorized or No account from DevHive</p>';
        return;
    }
    break;

  case 'hershive':
    $isAllowed = $_SESSION['isAllowed'] ?? '';

    $key = 'oauth_token_' . $client;
    error_log("DEBUG: Checking for session key: $key");
    if (!isset($_SESSION[$key])) {
        error_log("Hershive share: SESSION DUMP: " . print_r($_SESSION, true));
        echo "Account not from hershive. (No token found for key: $key)";
        return;
    }
    $user_token = $_SESSION[$key];

    $data = [
        'token' => $user_token,
        'posts' => $posts,
        'provider' => 'devhive',
        'content' => $content 
    ];

    if ($isAllowed === 'allowed_to_share') {
        $ch = curl_init($hershive_endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true); 
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data)); 
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $user_token 
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) {
            $curlError = curl_error($ch);
            error_log("Hershive share: cURL error: $curlError, user_id: " . ($_SESSION['user_id'] ?? 'unknown'));
        }
        curl_close($ch);

        error_log("Hershive share: HTTP $httpCode, Response: $response, Data: " . json_encode($data));

        if ($httpCode === 200) {
    header("Location: https://devhivespace.com/global_wall/global_wall.html");
    exit;
} else {
    header("HTTP/1.1 500 Internal Server Error");
    exit;
}
return;
    }
    break;

  default:
    echo '<h1>Invalid provider.</h1>';
    break;
}

$stmt->close();
?>
