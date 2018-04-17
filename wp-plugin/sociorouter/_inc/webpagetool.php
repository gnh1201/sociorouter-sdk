<?php
/**
 * @file webpagetool.php
 * @date 2018-02-26
 * @author Go Namhyeon <gnh1201@gmail.com>
 * @brief WebPageTool helper for Wordpress
 */

if(!function_exists("get_web_legacy")) {
	function get_web_legacy($url) {
		return (ini_get("allow_url_fopen") ? file_get_contents($url) : false);
	}
}

if(!function_exists("get_web_cmd")) {
	function get_web_cmd($url, $method="get", $data=array(), $proxy="", $ua="", $ct_out=45, $t_out=45) {
		$output = "";
		$cmd_fin = "";
		$cmd = "";

		if($method == "get") {
			$cmd = "curl -A '%s' -k %s";
			$cmd_fin = sprintf($cmd, addslashes($ua), addslashes($url));
			$output = shell_exec($cmd_fin);
		}

		if($method == "post") {
			$cmd = "curl -X POST -A '%s' -k %s %s";
			$params_cmd = "";
			foreach($data as $k=>$v) {
				$params_cmd .= "-d '" . addslashes($k) ."=" . addslashes($v) . "' ";
			}
			$cmd_fin = sprintf($cmd, addslashes($ua), addslashes($url), $params_cmd);
			$output = shell_exec($cmd_fin);
		}

		return $output;
	}
}

if(!function_exists("get_web_page")) {
	function get_web_page($url, $method="get", $data=array(), $proxy="", $ua="", $ct_out=45, $t_out=45) {
		if(!in_array("curl", get_loaded_extensions())) {
			return "cURL extension needs to be installed.";
		}

		$options = array(
			CURLOPT_PROXY          => $proxy,   // set proxy server
			CURLOPT_RETURNTRANSFER => true,     // return web page
			CURLOPT_HEADER         => false,    // don't return headers
			CURLOPT_FOLLOWLOCATION => true,     // follow redirects
			CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects
			CURLOPT_ENCODING       => "",       // handle compressed
			CURLOPT_USERAGENT      => $ua,      // name of client
			CURLOPT_AUTOREFERER    => true,     // set referrer on redirect
			CURLOPT_CONNECTTIMEOUT => $ct_out,  // time-out on connect
			CURLOPT_TIMEOUT        => $t_out,   // time-out on response
			CURLOPT_FAILONERROR    => true,     // get error code
			CURLOPT_SSL_VERIFYHOST => false,    // ignore ssl host verification
			CURLOPT_SSL_VERIFYPEER => false,    // ignore ssl peer verification
		);

		if(empty($options[CURLOPT_USERAGENT])) {
			$ua = "2018 ReasonableFramework;https://github.com/gnh1201/reasonableframework";
			$options[CURLOPT_USERAGENT] = $ua;
		}
		
		if(!empty($proxy)) {
			$options[CURLOPT_PROXY] = $proxy;
		}

		if($method == "post" && count($data) > 0) {
			$options[CURLOPT_POST] = 1;
			$options[CURLOPT_POSTFIELDS] = $data;
		}

		if($method == "get" && count($data) > 0) {
			$pos = strpos($url, '?');
			if ($pos === false) {
				$url = $url . '?' . http_build_query($data);
			} else {
				$url = $url . '&' . http_build_query($data);
			}
		}

		$ch = curl_init($url);
		curl_setopt_array($ch, $options);

		$content = curl_exec($ch);

		// if content is not string
		$status = "-1";
		$resno = "-1";
		$errno = "-1";

		if($content === true || $content === false) {
			$content = get_web_cmd($url, $method, $data, $proxy, $ua, $ct_out, $t_out);
		} else {
			$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
			$resno = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
			$errno = curl_errno($ch);
		}

		curl_close($ch);
		
		$content_size = strlen($content);

		$response = array(
			"content" => $content,
			"size"    => $content_size,
			"status"  => $status,
			"resno"   => $resno,
			"errno"   => $errno,
		);

		return $response;
	}
}
