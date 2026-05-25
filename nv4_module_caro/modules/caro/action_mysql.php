<?php
if (!defined('NV_IS_FILE_MODULES')) {
    exit('Stop!!!');
}

$sql_drop_module = [];
$sql_drop_module[] = 'DROP TABLE IF EXISTS ' . $db_config['prefix'] . '_' . $lang . '_' . $module_data . '_config';

$sql_create_module = $sql_drop_module;

$sql_create_module[] = 'CREATE TABLE ' . $db_config['prefix'] . '_' . $lang . '_' . $module_data . "_config (
    config_name varchar(30) NOT NULL,
    config_value varchar(255) NOT NULL,
    UNIQUE KEY config_name (config_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
