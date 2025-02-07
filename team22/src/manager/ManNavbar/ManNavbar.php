<?php
header('Content-Type: application/json');

$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$userID = (int) $data['userID']; // Ensure userID is an integer

if (!isset($data['action'])) {
    echo json_encode(["success" => false, "message" => "Invalid request."]);
    exit;
}

// Verify Current Password
if ($data['action'] == 'verifyPassword') {
    $currentPassword = $data['currentPassword'];

    $query = "SELECT password FROM users WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userID);
    $stmt->execute();
    $stmt->bind_result($storedPassword);
    $stmt->fetch();
    $stmt->close();

    if ($currentPassword === $storedPassword) { // Direct match, no encryption
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Incorrect password."]);
    }
    exit;
}

// Change Password
elseif ($data['action'] == 'changePassword') {
    $newPassword = $data['newPassword'];

    // Ensure password meets criteria (8+ characters, 1 special character)
    if (strlen($newPassword) < 8 || !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
        echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long and include 1 special character."]);
        exit;
    }

    $query = "UPDATE users SET password = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $newPassword, $userID);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Password changed successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update password."]);
    }

    $stmt->close();
    exit;
}

// Close database connection
$conn->close();
?>
