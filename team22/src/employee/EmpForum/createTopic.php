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

$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$technical = $_POST['technical'] ?? '0';
$created_by = $_POST['user_id'] ?? '1'; // Default to 1 if not provided, but ideally always provided by frontend

$stmt = $mysqli->prepare("INSERT INTO Forum_Topics (title, description, created_by, technical) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssii", $title, $description, $created_by, $technical);
if ($stmt->execute()) {
    echo json_encode(["success" => true, "topic_id" => $stmt->insert_id]);
} else {
    echo json_encode(["error" => "Unable to create topic."]);
}