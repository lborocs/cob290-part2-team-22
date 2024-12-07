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

// Query topics along with creator name
$sql = "SELECT t.topic_id, t.title, t.description, t.technical, t.created_by,
               u.name AS creator_name
        FROM Forum_Topics t
        JOIN Users u ON t.created_by = u.user_id";

$result = $mysqli->query($sql);
$topics = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $topics[] = $row;
    }
}

echo json_encode($topics);
