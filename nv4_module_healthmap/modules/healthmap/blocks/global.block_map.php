<?php

/**
 * @Project FLAVOR Health Map
 * @Author NukeViet
 * @Copyright (C) 2026
 * @License GNU/GPL version 2 or any later version
 * @Createdate Thu, 22 May 2026
 */

if (!defined('NV_MAINFILE')) {
    exit('Stop!!!');
}

if (!nv_function_exists('nv_block_config_healthmap_map')) {

    /**
     * nv_block_config_healthmap_map()
     * Hiển thị form cấu hình block trong admin
     *
     * @param string $module
     * @param array  $data_block
     * @param array  $lang_block
     * @return string
     */
    function nv_block_config_healthmap_map($module, $data_block, $lang_block)
    {
        $html = '<div class="form-group">';
        $html .= '<label class="control-label col-sm-6">Chiều cao bản đồ (px):</label>';
        $html .= '<div class="col-sm-9">';
        $html .= '<input type="number" name="config_map_height" class="form-control" value="' . (int) $data_block['map_height'] . '" min="200" max="800" />';
        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * nv_block_config_healthmap_map_submit()
     * Xử lý lưu cấu hình block
     *
     * @param string $module
     * @param array  $lang_block
     * @return array
     */
    function nv_block_config_healthmap_map_submit($module, $lang_block)
    {
        global $nv_Request;

        $return = [];
        $return['error'] = [];
        $return['config'] = [];
        $return['config']['map_height'] = $nv_Request->get_int('config_map_height', 'post', 450);

        return $return;
    }

    /**
     * nv_healthmap_block_map()
     * Hàm chính render block
     *
     * @param array $block_config
     * @return string
     */
    function nv_healthmap_block_map($block_config)
    {
        global $global_config, $db, $db_config, $site_mods;

        $module = $block_config['module'];
        $mod_data = $site_mods[$module]['module_data'];

        // Xác định theme cho block template
        $block_theme = $global_config['module_theme'];
        if (!file_exists(NV_ROOTDIR . '/themes/' . $block_theme . '/modules/' . $module . '/block_map.tpl')) {
            $block_theme = 'default';
        }

        // Lấy danh sách trạm từ DB
        $table_name = $db_config['prefix'] . '_' . NV_LANG_DATA . '_' . $mod_data . '_stations';
        $sql = 'SELECT * FROM ' . $table_name . ' WHERE status=1 ORDER BY weight ASC, id DESC';
        $result = $db->query($sql);

        $stations = [];
        while ($row = $result->fetch()) {
            $row['lat'] = (float) $row['lat'];
            $row['lng'] = (float) $row['lng'];
            $row['rating'] = (float) $row['rating'];
            $row['reviews'] = (int) $row['reviews'];
            $row['isCenter'] = (bool) $row['isCenter'];

            // Xử lý đường dẫn ảnh
            if (!empty($row['image'])) {
                if (!preg_match('#^https?://#i', $row['image'])) {
                    if (strpos($row['image'], 'uploads/') === 0) {
                        $row['image'] = NV_BASE_SITEURL . $row['image'];
                    } elseif (strpos($row['image'], 'images/') === 0) {
                        $row['image'] = NV_BASE_SITEURL . 'modules/' . $module . '/' . $row['image'];
                    } else {
                        $row['image'] = NV_BASE_SITEURL . 'uploads/' . $module . '/' . $row['image'];
                    }
                }
            }

            $stations[] = $row;
        }

        // Tạo XTemplate
        $xtpl = new XTemplate('block_map.tpl', NV_ROOTDIR . '/themes/' . $block_theme . '/modules/' . $module);

        $xtpl->assign('BLOCK_ID', $block_config['bid']);
        $xtpl->assign('MAP_HEIGHT', (int) $block_config['map_height']);
        $xtpl->assign('NV_BASE_SITEURL', NV_BASE_SITEURL);
        $xtpl->assign('TEMPLATE', $block_theme);
        $xtpl->assign('MODULE_NAME', $module);
        $xtpl->assign('STATIONS_JSON', json_encode($stations, JSON_UNESCAPED_UNICODE));

        $xtpl->parse('main');

        return $xtpl->text('main');
    }
}

if (defined('NV_SYSTEM')) {
    global $site_mods;
    $module = $block_config['module'];
    if (isset($site_mods[$module])) {
        $content = nv_healthmap_block_map($block_config);
    }
}
