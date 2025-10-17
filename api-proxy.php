<?php
/**
 * 🔌 API Proxy for CRM Backend
 * Forward requests จาก SiteGround Frontend ไปยัง Railway Backend
 * 
 * ใช้สำหรับแก้ปัญหา CORS และซ่อน Backend URL
 */

// Set headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://crm.o2odesign.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Backend URL (Railway) - แก้ไข URL ตามที่ได้จาก Railway
define('BACKEND_URL', 'https://crm-backend-production-xxxx.up.railway.app');

// Get request details
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Remove /api-proxy from path
$path = str_replace('/crm/api-proxy', '', $requestUri);
if (empty($path) || $path === '/') {
    $path = '/api';
}

// Get request body (for POST, PUT, PATCH requests)
$body = file_get_contents('php://input');

// Get all headers from the original request
$headers = [];
foreach (getallheaders() as $name => $value) {
    // Skip host header (will be set automatically by cURL)
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}

// Add User-Agent if not present
$headers[] = "User-Agent: CRM-API-Proxy/1.0";

// Initialize cURL
$ch = curl_init();

// cURL options
curl_setopt_array($ch, [
    CURLOPT_URL => BACKEND_URL . $path,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT => 'CRM-API-Proxy/1.0'
]);

// Add body for POST, PUT, PATCH requests
if (in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

// Check for cURL errors
if ($response === false) {
    $error = curl_error($ch);
    curl_close($ch);
    
    http_response_code(502);
    echo json_encode([
        'error' => 'Backend Gateway Error',
        'message' => 'Failed to connect to backend server',
        'details' => $error,
        'timestamp' => date('c')
    ]);
    exit();
}

curl_close($ch);

// Set response content type
if ($contentType) {
    header("Content-Type: $contentType");
}

// Return response with original status code
http_response_code($httpCode);
echo $response;

// Log request for debugging (optional - remove in production)
if (isset($_GET['debug']) && $_GET['debug'] === 'true') {
    error_log("API Proxy: $method $path - Status: $httpCode");
}
?>
