<?php
/**
 * Plugin Name: SocioRouter
 * Plugin URI: https://exts.kr/go/home
 * Description: SocioRouter Social Network Integration and Management Solution
 * Version: 1.0.0
 * Author: Go Namhyeon <gnh1201@gmail.com>
 * Author URI: https://exts.kr/go/home
 * License: EULA
 */

if ( !function_exists( 'add_action' ) ) {
	echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
	exit;
}

function sociorouter_tracker($atts = [], $content = null, $tag = '') {
	$html = "";

	$my_script_url = "aHR0cHM6Ly9teWhvc3QvM3JkcGFydHkvc29jaW9yb3V0ZXIvZGFzaGJvYXJkL2Fzc2V0cy9qcy9zZGsuanM=";
	$my_current_user = wp_get_current_user();
	$my_user_name = "";
	if(is_user_logged_in()) {
		$my_user_email = $my_current_user->user_email;
		if(empty($my_user_email)) {
			$my_user_name = md5($my_current_user->user_login);
		} else {
			$my_user_name = md5($my_current_user->user_email);
		}
	}
	$my_script_url = base64_decode($my_script_url);

	if(!empty($my_user_name)) {
		$html .= "<script type='text/javascript' src='{$my_script_url}'></script>\n";
		$html .= "<script type='text/javascript'>sociorouter_remotelogin('{$my_user_name}');</script>\n";
	}

	return $html;
}

function sociorouter_form_plugin($atts = [], $content = null, $tag = '') {
	$html = "";

	$data = array_key_exists("data", $atts) ? $atts['data'] : "";

	if(empty($appendto)) {
		$appendto = "sociorouter_form_plugin";
		$html .= "<div id='sociorouter_loading'></div>";
		$html .= "<div id='sociorouter_form_plugin'></div>";
	}

	$html .= "<script type='text/javascript'>sociorouter_plugin('form_plugin', '{$data}');</script>\n";
	//$html .= '<iframe style="margin: 0; padding: 0; border: 0; width: 450px; height: 150px;" src="https://myhost/3rdparty/sociorouter/dashboard/?route=sdk&action=connect" width="450" height="150"></iframe>';

	return $html;
}

add_shortcode('sociorouter_tracker', 'sociorouter_tracker');
add_shortcode('sociorouter_form_plugin', 'sociorouter_form_plugin');
