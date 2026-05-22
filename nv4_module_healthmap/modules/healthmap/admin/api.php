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

header('Content-Type: application/json; charset=utf-8');

require_once NV_ROOTDIR . '/modules/' . $module_file . '/inc/image.php';

$action = $nv_Request->get_string('action', 'post', '');
$table_name = $db_config['prefix'] . "_" . NV_LANG_DATA . "_" . $module_data . "_stations";

if ($action == 'upload_image') {
    if (!isset($_FILES['image']) or !is_uploaded_file($_FILES['image']['tmp_name'])) {
        echo json_encode(['status' => 'error', 'msg' => 'Vui lòng chọn file ảnh']);
        exit;
    }

    $upload_dir = NV_UPLOADS_REAL_DIR . '/' . $module_upload;
    if (!is_dir($upload_dir)) {
        nv_mkdir(NV_UPLOADS_REAL_DIR, $module_upload);
    }

    $upload = new NukeViet\Files\Upload(['images'], $global_config['forbid_extensions'], $global_config['forbid_mimes'], NV_UPLOAD_MAX_FILESIZE, NV_MAX_WIDTH, NV_MAX_HEIGHT);
    $upload->setLanguage($lang_global);
    $upload_info = $upload->save_file($_FILES['image'], $upload_dir, false);
    @unlink($_FILES['image']['tmp_name']);

    if (!empty($upload_info['error'])) {
        echo json_encode(['status' => 'error', 'msg' => $upload_info['error']]);
        exit;
    }

    @chmod($upload_info['name'], 0644);
    $path = $upload_info['basename'];

    echo json_encode([
        'status' => 'success',
        'path' => $path,
        'url' => healthmap_image_src($path)
    ]);
    exit;
}

if ($action == 'get_all') {
    $sql = "SELECT * FROM " . $table_name . " ORDER BY weight ASC, id DESC";
    $result = $db->query($sql);
    $stations = array();
    while ($row = $result->fetch()) {
        $row['lat'] = (float)$row['lat'];
        $row['lng'] = (float)$row['lng'];
        $row['isCenter'] = (bool)$row['isCenter'];
        $row['rating'] = (float)$row['rating'];
        $row['reviews'] = (int)$row['reviews'];
        $row['image_src'] = healthmap_image_src($row['image']);
        $stations[] = $row;
    }
    echo json_encode($stations);
    exit;
}

if ($action == 'add' || $action == 'update') {
    $id = $nv_Request->get_int('id', 'post', 0);
    $name = $nv_Request->get_string('name', 'post', '');
    $address = $nv_Request->get_string('address', 'post', '');
    $phone = $nv_Request->get_string('phone', 'post', '');
    $lat = $nv_Request->get_float('lat', 'post', 0);
    $lng = $nv_Request->get_float('lng', 'post', 0);
    $image = healthmap_normalize_image_save($nv_Request->get_string('image', 'post', ''));
    $rating = $nv_Request->get_float('rating', 'post', 4.0);
    $reviews = $nv_Request->get_int('reviews', 'post', 0);
    $isCenter = $nv_Request->get_int('isCenter', 'post', 0);

    if (empty($name) || empty($address) || empty($lat) || empty($lng)) {
        echo json_encode(['status' => 'error', 'msg' => 'Vui lòng nhập đủ thông tin']);
        exit;
    }

    if ($action == 'add') {
        $sql = "INSERT INTO " . $table_name . " (name, address, phone, lat, lng, image, rating, reviews, isCenter, status) 
                VALUES (:name, :address, :phone, :lat, :lng, :image, :rating, :reviews, :isCenter, 1)";
        $sth = $db->prepare($sql);
    } else {
        $sql = "UPDATE " . $table_name . " SET name=:name, address=:address, phone=:phone, lat=:lat, lng=:lng, 
                image=:image, rating=:rating, reviews=:reviews, isCenter=:isCenter WHERE id=:id";
        $sth = $db->prepare($sql);
        $sth->bindParam(':id', $id, PDO::PARAM_INT);
    }

    $sth->bindParam(':name', $name, PDO::PARAM_STR);
    $sth->bindParam(':address', $address, PDO::PARAM_STR);
    $sth->bindParam(':phone', $phone, PDO::PARAM_STR);
    $sth->bindParam(':lat', $lat);
    $sth->bindParam(':lng', $lng);
    $sth->bindParam(':image', $image, PDO::PARAM_STR);
    $sth->bindParam(':rating', $rating);
    $sth->bindParam(':reviews', $reviews, PDO::PARAM_INT);
    $sth->bindParam(':isCenter', $isCenter, PDO::PARAM_INT);

    if ($sth->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'msg' => 'Lỗi lưu CSDL']);
    }
    exit;
}

if ($action == 'delete') {
    $id = $nv_Request->get_int('id', 'post', 0);
    if ($id > 0) {
        $sql = "DELETE FROM " . $table_name . " WHERE id=" . $id;
        if ($db->query($sql)) {
            echo json_encode(['status' => 'success']);
            exit;
        }
    }
    echo json_encode(['status' => 'error', 'msg' => 'Không thể xóa']);
    exit;
}

if ($action == 'clear_all') {
    $sql = "TRUNCATE TABLE " . $table_name;
    if ($db->query($sql)) {
        echo json_encode(['status' => 'success']);
        exit;
    }
    echo json_encode(['status' => 'error']);
    exit;
}

echo json_encode(['status' => 'error', 'msg' => 'Invalid action']);
exit;
