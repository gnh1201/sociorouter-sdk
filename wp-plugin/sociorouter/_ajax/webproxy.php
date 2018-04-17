<?php
include_once("../_config/config.php");
include_once("../_inc/webpagetool.php");

$url = $_REQUEST['url'];

if(!empty($url)) {
	$response = get_web_page($url);
	echo $response['content'];
}
