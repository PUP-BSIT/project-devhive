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

    // Handle video file upload
    if (isset($_FILES['video'])) {
        $file = $_FILES['video'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileError = $file['error'];
        $fileSize = $file['size'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Validate file
        $allowedExtensions = ['mp4', 'webm', 'mov', 'avi'];
        if (!in_array($fileExt, $allowedExtensions)) {
            throw new Exception('Invalid file type. Only MP4, WEBM, MOV & AVI files are allowed.');
        }

        // Check file size (50MB max)
        if ($fileSize > 50000000) {
            throw new Exception('File is too large. Maximum size is 50MB.');
        }

        if ($fileError !== 0) {
            throw new Exception('Error uploading file.');
        }

        // Create uploads directory if it doesn't exist
        $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/videos/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Generate unique filename
        $uniqueFileName = uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $fileExt;
        $uploadPath = $uploadDir . $uniqueFileName;
        $videoUrl = '/uploads/videos/' . $uniqueFileName;

        // Generate thumbnail path
        $thumbnailFileName = uniqid() . '_thumb.jpg';
        $thumbnailPath = $uploadDir . $thumbnailFileName;
        $thumbnailUrl = '/uploads/videos/' . $thumbnailFileName;

        // Move uploaded file
        if (!move_uploaded_file($fileTmpName, $uploadPath)) {
            throw new Exception('Failed to move uploaded file.');
        }

        // Generate thumbnail and get duration using FFmpeg if available
        $duration = null;
        $hasThumbnail = false;

        if (function_exists('exec')) {
            // Get video duration
            $durationCmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($uploadPath);
            exec($durationCmd, $durationOutput, $durationReturnVar);
            
            if ($durationReturnVar === 0 && !empty($durationOutput)) {
                $duration = (int)floatval($durationOutput[0]);
            }

            // Generate thumbnail
            $thumbnailCmd = "ffmpeg -i " . escapeshellarg($uploadPath) . " -ss 00:00:01.000 -vframes 1 " . escapeshellarg($thumbnailPath);
            exec($thumbnailCmd, $output, $returnVar);
            
            $hasThumbnail = ($returnVar === 0 && file_exists($thumbnailPath));
        }

        // Get post_id if provided
        $postId = isset($_POST['post_id']) ? (int)$_POST['post_id'] : null;

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert into post_video table if post_id is provided
            if ($postId) {
                $query = "INSERT INTO post_video (post_id, video_url, thumbnail_url, duration) VALUES (?, ?, ?, ?)";
                $stmt = $conn->prepare($query);
                
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }

                $thumbnailUrlOrNull = $hasThumbnail ? $thumbnailUrl : null;
                $stmt->bind_param("issi", $postId, $videoUrl, $thumbnailUrlOrNull, $duration);
                
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }

                $videoId = $conn->insert_id;
                $stmt->close();
            }

            // Commit transaction
            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Video uploaded successfully',
                'data' => [
                    'url' => $videoUrl,
                    'filename' => $uniqueFileName,
                    'video_id' => $videoId ?? null,
                    'thumbnail_url' => $hasThumbnail ? $thumbnailUrl : null,
                    'duration' => $duration
                ]
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            // Clean up uploaded files if database operation fails
            if (file_exists($uploadPath)) {
                unlink($uploadPath);
            }
            if ($hasThumbnail && file_exists($thumbnailPath)) {
                unlink($thumbnailPath);
            }
            throw $e;
        }
    } 
    // Handle video association with post (when only post_id and video_url are provided)
    else if (isset($_POST['post_id']) && isset($_POST['video_url'])) {
        $postId = (int)$_POST['post_id'];
        $videoUrl = $_POST['video_url'];
        $thumbnailUrl = isset($_POST['thumbnail_url']) ? $_POST['thumbnail_url'] : null;
        $duration = isset($_POST['duration']) ? (int)$_POST['duration'] : null;

        $query = "INSERT INTO post_video (post_id, video_url, thumbnail_url, duration) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("issi", $postId, $videoUrl, $thumbnailUrl, $duration);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $videoId = $conn->insert_id;
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Video associated with post successfully',
            'data' => [
                'video_id' => $videoId,
                'url' => $videoUrl,
                'thumbnail_url' => $thumbnailUrl,
                'duration' => $duration
            ]
        ]);
    } else {
        throw new Exception('No video file or video data provided');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} 