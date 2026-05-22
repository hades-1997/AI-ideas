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

$sql_drop_module = array();
$sql_drop_module[] = "DROP TABLE IF EXISTS `" . $db_config['prefix'] . "_" . $lang . "_" . $module_data . "_stations`";

$sql_create_module = $sql_drop_module;
$sql_create_module[] = "CREATE TABLE `" . $db_config['prefix'] . "_" . $lang . "_" . $module_data . "_stations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `rating` float DEFAULT 0,
  `reviews` int(11) DEFAULT 0,
  `isCenter` tinyint(1) DEFAULT 0,
  `weight` int(11) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// Seed data
$sql_create_module[] = "INSERT INTO `" . $db_config['prefix'] . "_" . $lang . "_" . $module_data . "_stations` (`name`, `address`, `phone`, `lat`, `lng`, `image`, `rating`, `reviews`, `isCenter`, `weight`, `status`) VALUES
('Trung Tâm Y Tế Thanh Sơn', '659H+FXQ, QL32, Thanh Sơn, Phú Thọ, Việt Nam', '1800.888.668', 21.20917, 105.18806, 'images/station3.png', 3.6, 46, 1, 1, 1),
('Điểm y tế Sơn Hùng', 'Khu Đồng Lão, xã Sơn Hùng, huyện Thanh Sơn, tỉnh Phú Thọ', '0966.093.368', 21.2155, 105.201, 'images/station1.png', 4, 12, 0, 2, 1),
('Điểm y tế Giáp Lai', 'Khu 5, xã Thanh Sơn, tỉnh Phú Thọ', '0936.937.147', 21.225, 105.1755, 'images/station2.png', 3.8, 8, 0, 3, 1),
('Điểm y tế Thạch Khoán', 'Khu Cầu, xã Thanh Sơn, tỉnh Phú Thọ', NULL, 21.234, 105.21, 'images/station4.png', 3.5, 5, 0, 4, 1),
('Điểm y tế Thục Luyện', 'Khu Đồng Lão, xã Thanh Sơn, tỉnh Phú Thọ', '0963.760.055', 21.196, 105.166, 'images/station5.png', 4.2, 15, 0, 5, 1)";
