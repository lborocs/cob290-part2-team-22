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

$topic_id = isset($_GET['topic_id']) ? (int)$_GET['topic_id'] : 0;
if ($topic_id === 0) {
    echo json_encode(["error" => "Invalid topic_id"]);
    exit();
}

// Query posts along with user info
$sql = "SELECT p.post_id, p.content, p.user_id, u.name AS user_name
        FROM Forum_Posts p
        JOIN Users u ON p.user_id = u.user_id
        WHERE p.topic_id = $topic_id
        ORDER BY p.post_id ASC";

$result = $mysqli->query($sql);
$posts = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $posts[] = $row;
    }
}

echo json_encode($posts);
