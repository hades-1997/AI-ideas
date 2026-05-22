<?php

/**
 * @Project NukeViet
 * @Author NukeViet
 * @Copyright (C) 2026 NukeViet. All rights reserved
 * @License: Not free read more http://nukeviet.vn/vi/store/modules/nvtools/
 * @Createdate Fri, 22 May 2026 11:00:00 GMT
 */

if (!defined('NV_MAINFILE')) {
    die('Stop!!!');
}

$module_version = array(
    'name' => 'Healthmap',
    'modfuncs' => 'main,api',
    'change_alias' => 'main,api',
    'submenu' => 'main',
    'is_sysmod' => 0,
    'virtual' => 1,
    'version' => '1.0.00',
    'date' => 'Fri, 22 May 2026 11:00:00 GMT',
    'author' => 'AI Builder',
    'uploads_dir' => array(
        $module_name
    ),
    'note' => 'Bản đồ trạm y tế'
);
