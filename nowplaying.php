<!DOCTYPE html>
<html>
<body>
 
<?php
header('Content-Type: application/json');

// Live365 "Now Playing" API URL for Wildstyle Radio
$url = 'https://public.api.live365.com/station/a50378/now';

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // skip SSL checks if needed

// Execute request
$response = curl_exec($ch);

// Handle cURL errors
if (curl_errno($ch)) {
    echo json_encode(["error" => curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Output response
echo $response;
?>


</body>
</html>
