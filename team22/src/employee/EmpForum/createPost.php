<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

$mysqli = new mysqli($host, $username, $password, $dbname);
if ($mysqli->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$topic_id = $_POST['topic_id'] ?? '';
$content = $_POST['content'] ?? '';
$user_id = $_POST['user_id'] ?? '1'; // Default to 1 if not provided

$stmt = $mysqli->prepare("INSERT INTO Forum_Posts (topic_id, user_id, content) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $topic_id, $user_id, $content);
if ($stmt->execute()) {
    echo json_encode(["success" => true, "post_id" => $stmt->insert_id]);
} else {
    echo json_encode(["error" => "Unable to create post."]);
}
