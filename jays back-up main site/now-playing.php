<!DOCTYPE html>
<html>
<body>

<?php
header('Content-Type: application/json');
echo file_get_contents('https://public.api.live365.com/station/a50378/now');
?> 

</body>
</html>
