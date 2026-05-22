<?php

/**
 * @Project NukeViet
 * @Author NukeViet
 * @Copyright (C) 2026 NukeViet. All rights reserved
 * @License: Not free read more http://nukeviet.vn/vi/store/modules/nvtools/
 * @Createdate Fri, 22 May 2026 11:00:00 GMT
 */

if (!defined('NV_IS_MOD_HEALTHMAP')) {
    die('Stop!!!');
}

header('Content-Type: application/json; charset=utf-8');

require_once NV_ROOTDIR . '/modules/' . $module_file . '/inc/image.php';

$table_name = $db_config['prefix'] . "_" . NV_LANG_DATA . "_" . $module_data . "_stations";
$sql = "SELECT * FROM " . $table_name . " WHERE status=1 ORDER BY weight ASC, id DESC";
$result = $db->query($sql);
$stations = array();

while ($row = $result->fetch()) {
    $row['lat'] = (float)$row['lat'];
    $row['lng'] = (float)$row['lng'];
    $row['isCenter'] = (bool)$row['isCenter'];
    $row['rating'] = (float)$row['rating'];
    $row['reviews'] = (int)$row['reviews'];
    $row['image'] = healthmap_image_src($row['image']);
    $stations[] = $row;
}

echo json_encode($stations);
exit;
