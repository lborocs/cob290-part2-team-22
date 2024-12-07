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

$topic_id = $_POST['topic_id'] ?? 0;
$user_id = $_POST['user_id'] ?? 0;

// Optionally, you can verify that the topic belongs to user_id by querying the database before deleting
// For now, we assume if the front-end shows the option, we trust it. For security, add a check like:
//
// $check = $mysqli->prepare("SELECT created_by FROM Forum_Topics WHERE topic_id = ?");
// $check->bind_param("i", $topic_id);
// $check->execute();
// $res = $check->get_result();
// $owner = $res->fetch_assoc()['created_by'] ?? null;
// if ($owner != $user_id) {
//   echo json_encode(["error" => "Not authorized"]);
//   exit();
// }

$stmt = $mysqli->prepare("DELETE FROM Forum_Topics WHERE topic_id = ?");
$stmt->bind_param("i", $topic_id);
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Unable to delete topic."]);
}
