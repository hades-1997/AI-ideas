<?php

/**
 * @Project NukeViet
 * @Author NukeViet
 * @Copyright (C) 2026 NukeViet. All rights reserved
 * @License: Not free read more http://nukeviet.vn/vi/store/modules/nvtools/
 * @Createdate Fri, 22 May 2026 11:00:00 GMT
 */

if (!defined('NV_ADMIN') or !defined('NV_MAINFILE') or !defined('NV_IS_MODADMIN')) {
    die('Stop!!!');
}

// Chức năng này hiển thị giao diện quản trị trạm y tế
$page_title = $lang_module['main_title'];

// Gọi template
$xtpl = new XTemplate('admin_main.tpl', NV_ROOTDIR . '/themes/' . $global_config['module_theme'] . '/modules/' . $module_file);
$xtpl->assign('LANG', $lang_module);
$xtpl->assign('MODULE_NAME', $module_name);
$xtpl->assign('TEMPLATE', $global_config['module_theme']);
$xtpl->assign('OP', $op);
$xtpl->assign('NV_BASE_ADMINURL', NV_BASE_ADMINURL);
$xtpl->assign('NV_BASE_SITEURL', NV_BASE_SITEURL);
$xtpl->assign('UPLOADS_URL', NV_BASE_SITEURL . NV_UPLOADS_DIR . '/' . $module_upload . '/');

// Parse and output
$xtpl->parse('main');
$contents = $xtpl->text('main');

include NV_ROOTDIR . '/includes/header.php';
echo nv_admin_theme($contents);
include NV_ROOTDIR . '/includes/footer.php';
