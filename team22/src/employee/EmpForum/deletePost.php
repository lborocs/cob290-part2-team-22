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

$post_id = $_POST['post_id'] ?? 0;
$user_id = $_POST['user_id'] ?? 0;

// Optionally verify ownership here as well
//
// $check = $mysqli->prepare("SELECT user_id FROM Forum_Posts WHERE post_id = ?");
// $check->bind_param("i", $post_id);
// $check->execute();
// $res = $check->get_result();
// $owner = $res->fetch_assoc()['user_id'] ?? null;
// if ($owner != $user_id) {
//   echo json_encode(["error" => "Not authorized"]);
//   exit();
// }

$stmt = $mysqli->prepare("DELETE FROM Forum_Posts WHERE post_id = ?");
$stmt->bind_param("i", $post_id);
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Unable to delete post."]);
}
