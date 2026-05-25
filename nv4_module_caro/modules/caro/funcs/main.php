<?php
if (!defined('NV_IS_MOD_CARO')) {
    exit('Stop!!!');
}

$page_title = $lang_module['main_title'];
$key_words = 'cờ caro, gomoku, tic tac toe';

// Base URL for API
$api_url = NV_BASE_SITEURL . 'index.php?' . NV_LANG_VARIABLE . '=' . NV_LANG_DATA . '&' . NV_NAME_VARIABLE . '=' . $module_name . '&' . NV_OP_VARIABLE . '=api';

// Create XTemplate instance
$xtpl = new XTemplate('main.tpl', NV_ROOTDIR . '/themes/' . $module_info['template'] . '/modules/' . $module_info['module_theme']);
$xtpl->assign('LANG', $lang_module);
$xtpl->assign('MODULE_URL', NV_BASE_SITEURL . 'modules/' . $module_name);
$xtpl->assign('API_URL', $api_url);

$xtpl->parse('main');
$contents = $xtpl->text('main');

include NV_ROOTDIR . '/includes/header.php';
echo nv_site_theme($contents);
include NV_ROOTDIR . '/includes/footer.php';
