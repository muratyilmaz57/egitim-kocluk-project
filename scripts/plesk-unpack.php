<?php

$file = $_GET['file'] ?? null;

if (!$file || !preg_match('/^[A-Za-z0-9._-]+\.zip$/', $file)) {
    http_response_code(400);
    echo "invalid-file";
    exit;
}

$archive = __DIR__ . DIRECTORY_SEPARATOR . $file;

if (!is_file($archive)) {
    http_response_code(404);
    echo "missing-archive";
    exit;
}

$zip = new ZipArchive();
$result = $zip->open($archive);

if ($result !== true) {
    http_response_code(500);
    echo "open-failed:" . $result;
    exit;
}

if (!$zip->extractTo(__DIR__)) {
    $zip->close();
    http_response_code(500);
    echo "extract-failed";
    exit;
}

$zip->close();
echo "ok";
