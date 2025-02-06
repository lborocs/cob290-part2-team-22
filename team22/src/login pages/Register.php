<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database credentials 
$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

// Connect to database
$conn = new mysqli($servername, $db_username, $db_password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["username"]) || !isset($data["password"])) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit();
}

$username = trim($data["username"]);
$password = trim($data["password"]);

// **Validation Checks**
if (!str_ends_with($username, "@make-it-all.co.uk")) {
    echo json_encode(["success" => false, "message" => "Username must end with @make-it-all.co.uk"]);
    exit();
}

// **Updated Password Validation (Allows Any Special Character)**
if (!preg_match('/^(?=.*[^a-zA-Z0-9]).{8,}$/', $password)) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long and contain a special character"]);
    exit();
}

// **Check if username already exists**
$stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Username already taken"]);
    exit();
}

// **Hash the password**
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// **Insert into database**
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Registration successful"]);
} else {
    echo json_encode(["success" => false, "message" => "Error in registration"]);
}

$stmt->close();
$conn->close();
?>
