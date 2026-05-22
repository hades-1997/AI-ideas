<?php

/**
 * @Project NukeViet
 * @Copyright (C) 2026 NukeViet. All rights reserved
 */

if (!defined('NV_MAINFILE')) {
    die('Stop!!!');
}

/**
 * Ảnh mặc định khi không có hoặc file legacy không tồn tại
 */
function healthmap_default_image_src()
{
    global $module_upload, $module_file;

    $upload_logo = NV_ROOTDIR . '/' . NV_UPLOADS_DIR . '/' . $module_upload . '/logo.png';
    if (is_file($upload_logo)) {
        return NV_BASE_SITEURL . NV_UPLOADS_DIR . '/' . $module_upload . '/logo.png';
    }

    $placeholder = NV_ROOTDIR . '/modules/' . $module_file . '/images/placeholder.svg';
    if (is_file($placeholder)) {
        return NV_BASE_SITEURL . 'modules/' . $module_file . '/images/placeholder.svg';
    }

    return '';
}

/**
 * Chuẩn hóa đường dẫn ảnh lưu CSDL (relative uploads hoặc legacy images/...)
 */
function healthmap_normalize_image_save($image)
{
    global $module_upload;

    $image = trim((string) $image);
    if ($image === '') {
        return '';
    }

    $prefix = NV_BASE_SITEURL . NV_UPLOADS_DIR . '/' . $module_upload . '/';
    if (strpos($image, $prefix) === 0) {
        return substr($image, strlen($prefix));
    }

    $upload_prefix = NV_UPLOADS_DIR . '/' . $module_upload . '/';
    if (strpos($image, $upload_prefix) === 0) {
        return substr($image, strlen($upload_prefix));
    }

    return $image;
}

/**
 * URL đầy đủ để hiển thị ảnh
 */
function healthmap_image_src($image)
{
    global $module_upload, $module_file;

    $image = trim((string) $image);
    if ($image === '') {
        return healthmap_default_image_src();
    }

    if (nv_is_url($image)) {
        return $image;
    }

    if (strpos($image, NV_BASE_SITEURL) === 0) {
        return $image;
    }

    if (strpos($image, 'images/') === 0) {
        $legacy_file = NV_ROOTDIR . '/modules/' . $module_file . '/' . $image;
        if (is_file($legacy_file)) {
            return NV_BASE_SITEURL . 'modules/' . $module_file . '/' . $image;
        }

        return healthmap_default_image_src();
    }

    $upload_file = NV_ROOTDIR . '/' . NV_UPLOADS_DIR . '/' . $module_upload . '/' . $image;
    if (is_file($upload_file)) {
        return NV_BASE_SITEURL . NV_UPLOADS_DIR . '/' . $module_upload . '/' . $image;
    }

    // Vẫn trả URL uploads (file có thể vừa upload, is_file chưa khớp đường dẫn)
    if (preg_match('/^[a-zA-Z0-9._\-]+$/', basename($image))) {
        return NV_BASE_SITEURL . NV_UPLOADS_DIR . '/' . $module_upload . '/' . basename($image);
    }

    return healthmap_default_image_src();
}
