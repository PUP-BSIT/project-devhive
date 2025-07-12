<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '/copy/config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Handle image file upload
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileError = $file['error'];
        $fileSize = $file['size'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Validate file
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($fileExt, $allowedExtensions)) {
            throw new Exception('Invalid file type. Only JPG, JPEG, PNG & GIF files are allowed.');
        }

        // Check file size (5MB max)
        if ($fileSize > 5000000) {
            throw new Exception('File is too large. Maximum size is 5MB.');
        }

        if ($fileError !== 0) {
            throw new Exception('Error uploading file.');
        }

        // Create uploads directory if it doesn't exist
        $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/images/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Generate unique filename
        $uniqueFileName = uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $fileExt;
        $uploadPath = $uploadDir . $uniqueFileName;
        $imageUrl = '/uploads/images/' . $uniqueFileName;

        // Move uploaded file
        if (!move_uploaded_file($fileTmpName, $uploadPath)) {
            throw new Exception('Failed to move uploaded file.');
        }

        // Get post_id if provided
        $postId = isset($_POST['post_id']) ? (int)$_POST['post_id'] : null;

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert into post_image table if post_id is provided
            if ($postId) {
                $query = "INSERT INTO post_image (post_id, image_url) VALUES (?, ?)";
                $stmt = $conn->prepare($query);
                
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }

                $stmt->bind_param("is", $postId, $imageUrl);
                
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }

                $imageId = $conn->insert_id;
                $stmt->close();
            }

            // Commit transaction
            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Image uploaded successfully',
                'data' => [
                    'url' => $imageUrl,
                    'filename' => $uniqueFileName,
                    'image_id' => $imageId ?? null
                ]
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    } 
    // Handle image association with post (when only post_id and image_url are provided)
    else if (isset($_POST['post_id']) && isset($_POST['image_url'])) {
        $postId = (int)$_POST['post_id'];
        $imageUrl = $_POST['image_url'];

        $query = "INSERT INTO post_image (post_id, image_url) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("is", $postId, $imageUrl);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $imageId = $conn->insert_id;
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Image associated with post successfully',
            'data' => [
                'image_id' => $imageId,
                'url' => $imageUrl
            ]
        ]);
    } else {
        throw new Exception('No image file or image data provided');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} 