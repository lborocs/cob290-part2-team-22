<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

// Connect to database
$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

// Get JSON input
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Fetch user details
    if (isset($data['fetchUser']) && isset($data['userId'])) {
        $userId = $data['userId'];

        $stmt = $conn->prepare("SELECT username, password, role, name, job_title FROM Users WHERE user_id = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'username' => $user['username'],
                    'password' => $user['password'], 
                    'role' => $user['role'],
                    'name' => $user['name'], 
                    'job_title' => $user['job_title']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
        exit();
    }

    // Password Verification
    if (isset($data['userId']) && isset($data['currentPassword'])) {
        $userId = $data['userId'];
        $currentPassword = $data['currentPassword'];

        // Fetch current password from Users table
        $stmt = $conn->prepare("SELECT password FROM Users WHERE user_id = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if ($user && $currentPassword === $user['password']) {
            echo json_encode(['success' => true, 'message' => 'Password verified']);
            exit(); // Stop further execution after verification
        } else {
            echo json_encode(['success' => false, 'message' => 'Incorrect password']);
            exit(); // Stop execution if verification fails
        }
    }

    // Update Password
    if (isset($data['userId']) && isset($data['newPassword'])) {
        $userId = $data['userId'];
        $newPassword = $data['newPassword'];

        // Validate new password
        if (strlen($newPassword) < 8 || !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long and include one special character.']);
            exit();
        }

        // Update password in Users table
        $stmt = $conn->prepare("UPDATE Users SET password = ? WHERE user_id = ?");
        $stmt->bind_param("ss", $newPassword, $userId); //  Use "ss" (both values are strings)

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Password updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update password.", "error" => $stmt->error]); // Debugging info
        }

        $stmt->close();
        $conn->close();
        exit();
    }
}

// Invalid request
echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>