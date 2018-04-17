<?php
include_once("../_config/config.php");
include_once("../_inc/webpagetool.php");

$context = array(
	"route" => "remotepost",
	"action" => $_POST['action'],
	"remote_id" => $_POST['remote_id'],
	"domain" => $_POST['domain'],
	"title" => rawurlencode(base64_encode($_POST['title'])),
	"content" => rawurlencode(base64_encode($_POST['content'])),
	"site_type" => $_POST['site_type'],
	"site_url" => $_POST['site_url'],
	"encoding" => "utf8,base64",
);
$response = get_web_page($sociorouter_base_url, "post", $context);

echo json_encode($response);
