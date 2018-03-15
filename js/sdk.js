/*
 * @file sdk.js
 * @description SocioRouter code snippet for customer
 * @author Go Namhyeon <gnh1201@gmail.com>
 * @date 2018-02-21
 * @license GPLv3
 */

var sociorouter_accesstoken = "";
var sociorouter_logged_in = false;
var sociorouter_base_url = "https://example.org/";
var sociorouter_retry_interval = 300;
var sociorouter_content_el;
var sociorouter_content_name;
var sociorouter_iframe_object;
var sociorouter_site_url = "";
var sociorouter_site_type = "";
var sociorouter_wp_plugin_url = "";
var sociorouter_remote_id = "";
var sociorouter_is_default_prevented = true;

// load jquery
function load_jquery() {
	if(!("jQuery" in window)) {
		var obj_head = document.getElementsByTagName("head")[0];
		var obj_script = document.createElement("script");
		obj_script.type = "text/javascript";
		obj_script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
		obj_head.appendChild(obj_script);

		setTimeout(function() {
			load_jquery();
		}, sociorouter_retry_interval);
	}
}

function sociorouter_make_id(len) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < len; i++)
	text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};

function sociorouter_set_accesstoken(token) {
	sociorouter_accesstoken = token;
}

function sociorouter_get_accesstoken(token) {
	return sociorouter_accesstoken;
}

function sociorouter_jsonp(uri, w_callback_name) {
	var callback_name = "callback_" + sociorouter_make_id(10);
	var obj_head = document.getElementsByTagName("head")[0];
	var obj_script = document.createElement("script");

	if(w_callback_name in window) {
		delete window[w_callback_name];
	}

	obj_script.type = "text/javascript";
	obj_script.src = uri + "&callback=" + callback_name;
	obj_script.onload = function() {
		window[w_callback_name](window[callback_name]());
	};
	obj_head.appendChild(obj_script);
}
 
function sociorouter_request_accesstoken() {
	var callback_name = "callback_" + sociorouter_make_id(10);	
	var accesstoken_uri = sociorouter_base_url + "?route=accesstoken";

	sociorouter_jsonp(accesstoken_uri, "sociorouter_set_accesstoken");
}

function sociorouter_remotelogin_complete(value) {
	if(value != "success") {
		sociorouter_request_accesstoken();
		setTimeout(sociorouter_remotelogin, sociorouter_retry_interval);
	} else {
		sociorouter_logged_in = true;
	}

	// redirect to sociorouter
	sociorouter_redirect();
}

function sociorouter_get_current_domain() {
	return document.location.hostname;
}

function sociorouter_is_empty(str) {
    return (str.length === 0 || !str.trim());
};

function sociorouter_remotelogin(username) {
	var remotelogin_uri = sociorouter_base_url + "?route=remotelogin";
	var remotelogin_accesstoken = sociorouter_get_accesstoken();
	var remotelogin_username = username;
	var remotelogin_domain = sociorouter_get_current_domain();
	var remotelogin_params = {
		"accesstoken": remotelogin_accesstoken,
		"user_name": remotelogin_username,
		"site_domain": remotelogin_domain
	};
	var remorelogin_exec = function() {
		if(sociorouter_is_empty(remotelogin_accesstoken)) {
			sociorouter_request_accesstoken();
			setTimeout(function() {
				sociorouter_remotelogin(remotelogin_username);
			}, sociorouter_retry_interval);

			return;
		} else {
			for(var key in remotelogin_params) {
				remotelogin_uri += ("&" + key + "=" + remotelogin_params[key]);
			}

			sociorouter_jsonp(remotelogin_uri, "sociorouter_remotelogin_complete");
		}
	};

	// check blank username
	if(!sociorouter_is_empty(username)) {
		remorelogin_exec();
	} else {
		sociorouter_wp_login_rediret();
	}

	// set remote id
	sociorouter_remote_id = username;
}

function sociorouter_redirect() {
	var current_uri = window.location.href;
	if(current_uri.indexOf("/sociorouter") > -1) {
		window.location.href = sociorouter_base_url + "?from=" + sociorouter_get_current_domain();
	}
}

function sociorouter_wp_login_rediret() {
	var remotelogin_domain = sociorouter_get_current_domain();
	var current_uri = window.location.href;
	if(current_uri.indexOf("/sociorouter") > -1) {
		window.location.href = "http://" + remotelogin_domain + "/wp-login.php?redirect_to=" + encodeURI(current_uri);
	}
}

function sociorouter_plugin(plugin_name, data) {
	switch(plugin_name) {
		case "form_plugin":
			sociorouter_form_plugin(data);
			break;
		default:
			break; // nothing
	}
}

function sociorouter_set_content_el(js_type, js_value) {
	var editor_el = window[js_type];

	if(js_type == "tinymce") {
		if(editor_el.get(js_value) != null) {
			sociorouter_content_name = js_value;

			content_el = {
				"getContent": function() {
					return editor_el.get(sociorouter_content_name).getContent();
				},
				"innerHTML": editor_el.get(sociorouter_content_name).getContent()
			};
			sociorouter_content_el = content_el;
		} else {
			setTimeout(function() {
				sociorouter_set_content_el(js_type);
			}, sociorouter_retry_interval);
		}
	}
}

function sociorouter_get_content_el() {
	return sociorouter_content_el;
}

function sociorouter_form_plugin(data) {
	var dataobj = {};
	var datalines = data.split(',');
	var current_domain = sociorouter_get_current_domain();
	var appendto_el;
	var loading_el;
	var form_el;
	var title_el;
	var content_el;
	var submit_el;

	// access loading image box
	loading_el = document.getElementById("sociorouter_loading");

	if(sociorouter_logged_in == false) {
		setTimeout(function() {
			sociorouter_form_plugin(data);
		}, sociorouter_retry_interval);

		// show loading image
		if(!loading_el.firstChild) {
			var img_obj = document.createElement("img");
			img_obj.src = sociorouter_base_url + "assets/img/loading.gif";
			img_obj.alt = "loading";
			loading_el.appendChild(img_obj);
		}

		return;
	}

	// when complete hide loading image
	loading_el.style.display = "none";
	
	// set wordpress plugin url
	if(sociorouter_site_type == "wordpress") {
		sociorouter_wp_plugin_url = sociorouter_site_url + "/wp-content/plugins/sociorouter/";
	}

	for(k in datalines) {
		if(datalines[k].startsWith('@')) {
			datakey = datalines[k].substring(1, datalines[k].indexOf(':'));
			datavalue = datalines[k].substring(datalines[k].indexOf(':') + 1);
			dataobj[datakey] = datavalue;
		}
	}

	// get access from elements
	for(name in dataobj) {
		var exprs = dataobj[name].split('.');
		var expr_type = exprs[0] + '.' + exprs[1];
		var expr_value = exprs[2];
		
		var dom_id = (expr_type == "dom.id") ? expr_value : "";
		var dom_class = (expr_type == "dom.class") ? expr_value : "";
		var dom_name = (expr_type == "dom.name") ? expr_value : "";
		var js_window = (expr_type == "js.window") ? expr_value : "";

		switch(name) {
			case "appendto":
				var iframe_src = sociorouter_base_url + "?route=sdk&action=connect&remote_id=" + sociorouter_remote_id;
				var iframe_obj = document.createElement("iframe");
				var iframe_width = 450, iframe_height = 150;

				iframe_obj.name = "sociorouter_object";
				iframe_obj.src = iframe_src;
				iframe_obj.width = iframe_width + "px";
				iframe_obj.height = iframe_height + "px";
				iframe_obj.style.margin = "0";
				iframe_obj.style.padding = "0";
				iframe_obj.style.border = "0";
				iframe_obj.style.width = iframe_width + "px";
				iframe_obj.style.height = iframe_height + "px";

				// register social plugin object
				sociorouter_iframe_object = iframe_obj;

				// validate DOM elements
				if(expr_type == "dom.id") {
					dom_id = (dom_id == "") ? "sociorouter_form_plugin" : dom_id;
					appendto_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					appendto_el = document.getElementsByClassName(dom_class)[0];
				} else if(expr_type == "dom.name") {
					appendto_el = document.getElementsByName(dom_name)[0];
				}

				appendto_el.appendChild(iframe_obj);

				break;
			case "formid":
				form_el = document.getElementById(dom_id);
				break;
			case "title":
				if(expr_type == "dom.id") {
					title_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					title_el = document.getElementsByClassName(dom_class)[0];
				} else if(expr_type == "dom.name") {
					title_el = document.getElementsByName(dom_name)[0];
				}

				break;
			case "content":
				if(expr_type == "js.window") {
					var js_blocks = [];
					var js_type = "";
					var js_value = "";

					if(expr_value.indexOf('$') >= 0) {
						js_blocks = expr_value.split('$');
						js_type = js_blocks[0];
						js_value = js_blocks[1];
					}

					if(js_type != "" && js_type in window) {
						sociorouter_set_content_el(js_type, js_value);
					}
				} else if(expr_type == "dom.id") {
					content_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					content_el = document.getElementsByClassName(dom_class)[0];
				} else if(expr_type == "dom.name") {
					content_el = document.getElementsByName(dom_name)[0];
				}

				// register getContent method
				if(expr_type.startsWith("dom.") && content_el != null) {
					content_el.getContent = function() {
						return this.value;
					};
					sociorouter_content_el = content_el;
				}

				break;
			case "submit":
				if(expr_type == "dom.id") {
					submit_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					submit_el = document.getElementsByClassName(dom_class)[0];
				} else if(expr_type == "dom.name") {
					submit_el = document.getElementsByName(dom_class)[0];
				}

				break;
		}
	}

	// process by got elements
	if(form_el != null) {
		form_el.onsubmit = function(e) {
			var send_available = false;
			var content_el = sociorouter_get_content_el();
			var sdk_iframe = sociorouter_iframe_object;
			var sdk_window, sdk_el_title, sdk_el_content;
			var ajax_base_url = sociorouter_wp_plugin_url + "/_ajax/";
			var $jq = ("jQuery" in window) ? jQuery : {};
			var allow_ajax = ("ajax" in $jq);
			var allow_return = false;

			if(sociorouter_is_default_prevented == true) {
				if(allow_ajax == true) {
					// prevent default event
					e.preventDefault();

					// post by jQuery ajax
					$jq.ajax({
						type: "POST",
						url: ajax_base_url,
						dataType: "text",
						data: {
							"action": "send",
							"remote_id": sociorouter_remote_id,
							"domain": current_domain,
							"title": title_el.value,
							"content": content_el.getContent()
						},
						success: function(req) {
							alert("글이 정상적으로 게시되었습니다.");

							sociorouter_is_default_prevented = false;
							form_el.submit();
						}
					});
				} else {
					sociorouter_is_default_prevented = false;
					form_el.submit();
				}
			} else {
				if(sociorouter_site_type == "wordpress") {
					if("check_form_submittable" in window) {
						allow_return = check_form_submittable(form_el.id);
					} else {
						allow_return = true;
					}
				} else {
					allow_return = true;
				}
			}

			//alert("submitted");
			//alert("title: " + title_el.value);
			//alert("content: " + content_el.getContent());

			return allow_return;
		};
	}
}

function sociorouter_set_site_url(site_url) {
	sociorouter_site_url = site_url;
}

function sociorouter_set_wp_url(wp_url) {
	sociorouter_set_site_url(wp_url);
	sociorouter_site_type = "wordpress";
}

// load jquery
load_jquery();
