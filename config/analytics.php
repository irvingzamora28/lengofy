<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Nginx Log Path
    |--------------------------------------------------------------------------
    |
    | This value determines the path to the Nginx access log file that will be
    | used for analytics. Change this to match your server's log file location.
    |
    */
    'nginx_log_path' => env('NGINX_LOG_PATH', '/var/www/html/storage/logs/nginx/access.log'),
];
