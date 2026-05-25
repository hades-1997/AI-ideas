<?php
if (!defined('NV_MAINFILE')) {
    die('Stop!!!');
}

$module_version = [
    'name' => 'Caro',
    'modfuncs' => 'main,api',
    'change_alias' => 'main',
    'submenu' => 'main',
    'is_sysmod' => 0,
    'virtual' => 1,
    'version' => '1.0.00',
    'date' => 'Saturday, May 23, 2026 at 4:00:00 PM GMT+07:00',
    'author' => 'AI Assistant',
    'note' => 'Caro (Gomoku) game module',
    'uploads_dir' => [
        $module_name
    ]
];
