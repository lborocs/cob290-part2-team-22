<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'];
$password = $data['password'];

$sql = "SELECT * FROM Users WHERE username = ? AND password = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    echo json_encode(['success' => true, 'user' => ['name' => $user['name'], 'role' => $user['role']]]);
} else {
    echo json_encode(['success' => false, 'message' => '
    ']);
}

$stmt->close();
$conn->close();
?>
