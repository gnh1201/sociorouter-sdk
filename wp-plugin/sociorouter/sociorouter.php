<?php
/**
 * Plugin Name: SocioRouter
 * Plugin URI: https://exts.kr/go/sociorouter
 * Description: SocioRouter Social Network Integration and Management Solution
 * Version: 1.0.180416
 * Author: Go Namhyeon <gnh1201@gmail.com>
 * Author URI: https://exts.kr/go/sociorouter
 * License: GPLv3
 */

$plugin_dir = plugin_dir_path( __FILE__ );
include_once($plugin_dir . "/_config/config.php");

if ( !function_exists( 'add_action' ) ) {
	echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
	exit;
}

function sociorouter_get_user_role($user = null) {
	$user = $user ? new WP_User($user) : wp_get_current_user();
	return $user->roles ? $user->roles[0] : false;
}

function sociorouter_tracker($atts = [], $content = null, $tag = '') {
	global $sociorouter_base_url;

	$html = "";

	$my_script_url = "/wp-content/plugins/sociorouter/_ajax/webproxy.php?url=" . urlencode($sociorouter_base_url . "assets/js/sdk.js");
	$my_current_user = wp_get_current_user();
	$my_user_email = "";
	$my_user_name = "";
	if(is_user_logged_in()) {
		$my_user_email = $my_current_user->user_email;
		if(empty($my_user_email)) {
			$my_user_name = md5($my_current_user->user_login);
		} else {
			$my_user_name = md5($my_current_user->user_email);
		}
	}

	// get site url
	$my_site_url = get_site_url();

	if(!empty($my_user_name)) {
		$html .= "<script type='text/javascript' src='{$my_script_url}'></script>\n";
		$html .= "<script type='text/javascript'>//<!--<![CDATA[\n";
		$html .= "sociorouter_remotelogout();\n";
		$html .= "sociorouter_set_wp_url('" . $my_site_url . "');\n";
		$html .= "sociorouter_remotelogin('" . $my_user_name . "', {role: \"" . sociorouter_get_user_role() . "\", email: \"" . $my_user_email . "\"});\n";
		$html .= "//]]>--></script>";
	}

	return $html;
}

function sociorouter_form_plugin($atts = [], $content = null, $tag = '') {
	$html = "";
	$data = array_key_exists("data", $atts) ? $atts['data'] : "";
	
	$html .= "<div id='sociorouter_loading'></div>";
	$html .= "<div id='sociorouter_form_plugin'></div>";

	if(empty($data)) {
		//$data = "@appendto:dom.id.sociorouter_form_plugin";
	}

	$html .= "<script type='text/javascript'>sociorouter_plugin('form_plugin', '{$data}');</script>\n";

	return $html;
}

function sociorouter_group_plugin($atts = [], $content = null, $tag = '') {
	$html = "";
	$data = array_key_exists("data", $atts) ? $atts['data'] : "";
	
	$html .= "<div id='sociorouter_loading'></div>";
	$html .= "<div id='sociorouter_group_plugin'></div>";

	if(empty($data)) {
		$data = "@appendto:dom.id.sociorouter_group_plugin";
	}

	$html .= "<script type='text/javascript'>sociorouter_plugin('group_plugin', '{$data}');</script>\n";

	return $html;
}

if(!function_exists("auto_redirect_after_logout")) {
	function auto_redirect_after_logout(){
		wp_redirect( home_url() );
		exit();
	}
}

add_shortcode('sociorouter_tracker', 'sociorouter_tracker');
add_shortcode('sociorouter_form_plugin', 'sociorouter_form_plugin');
add_shortcode('sociorouter_group_plugin', 'sociorouter_group_plugin');
add_action('wp_logout', 'auto_redirect_after_logout');
