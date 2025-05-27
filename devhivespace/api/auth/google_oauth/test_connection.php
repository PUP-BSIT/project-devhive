<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!file_exists(__DIR__ . "/vendor/autoload.php")) {
    die("Please install required dependencies using composer");
}

require_once __DIR__ . "/vendor/autoload.php";

echo "<h1>Google OAuth Connection Test</h1>";

try {
    // Test SSL
    echo "<h2>Testing SSL Connection:</h2>";
    $ch = curl_init('https://accounts.google.com');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $result = curl_exec($ch);
    
    if ($result === false) {
        echo "❌ CURL Error: " . curl_error($ch);
    } else {
        echo "✅ SSL Connection successful<br>";
    }
    curl_close($ch);

    // Create HTTP client
    $httpClient = new GuzzleHttp\Client([
        'verify' => false,
        'timeout' => 60,
        'headers' => [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ]
    ]);

    // Test Google Client
    echo "<h2>Testing Google Client:</h2>";
    $client = new Google_Client();
    $client->setHttpClient($httpClient);
    
    // Configure client
    $client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
    $client->setClientSecret("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");
    $client->setRedirectUri("http://localhost/devhivespace/api/auth/google_oauth/callback.php");
    
    // Add required scopes
    $client->addScope("email");
    $client->addScope("profile");
    $client->setAccessType('offline');
    $client->setIncludeGrantedScopes(true);
    $client->setPrompt('select_account consent');
    
    echo "✅ Google Client configured successfully<br>";
    
    // Create authorization URL
    $authUrl = $client->createAuthUrl();
    echo "<br><div style='margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 5px;'>";
    echo "<h3 style='margin-top: 0;'>Test Google Sign-In</h3>";
    echo "<p>Click the button below to test the Google Sign-In flow:</p>";
    echo "<a href='{$authUrl}' style='display: inline-block; padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 5px;'>Sign in with Google</a>";
    echo "</div>";

    echo "<div style='margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 5px;'>";
    echo "<h3 style='margin-top: 0;'>What happens next?</h3>";
    echo "<ol style='margin-bottom: 0;'>";
    echo "<li>You'll be redirected to Google's sign-in page</li>";
    echo "<li>After signing in, you'll be redirected back to our callback URL</li>";
    echo "<li>If successful, you'll be redirected to the dashboard</li>";
    echo "<li>To verify your data was stored, visit: <a href='/devhivespace/test_db.php'>test_db.php</a></li>";
    echo "</ol>";
    echo "</div>";

} catch (Exception $e) {
    echo "<div style='margin: 20px 0; padding: 20px; background: #fee; border-radius: 5px; color: #c00;'>";
    echo "<h2 style='margin-top: 0; color: #c00;'>❌ Error:</h2>";
    echo "<pre style='margin-bottom: 10px;'>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo "<p style='margin-bottom: 0;'>Stack trace:</p>";
    echo "<pre style='margin-top: 5px; font-size: 0.9em;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    echo "</div>";
}
?> 