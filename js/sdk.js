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
var sociorouter_content_el; // for global
var sociorouter_content_name; // for global

// load jquery
function load_jquery() {
	var obj_head = document.getElementsByTagName("head")[0];
	var obj_script = document.createElement("script");
	
	if(!("jQuery" in window)) {
		obj_script.type = "text/javascript";
		obj_script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
		obj_head.appendChild(obj_script);

		setTimeout(function() {
			load_jquery();
		}, 3000);
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
		setTimeout(sociorouter_remotelogin, 300);
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
		if(remotelogin_accesstoken == "") {
			sociorouter_request_accesstoken();
			setTimeout(function() {
				sociorouter_remotelogin(remotelogin_username);
			}, 300);

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
}

function sociorouter_redirect() {
	var current_uri = window.location.href;
	if(current_uri.indexOf("/sociorouter") > -1) {
		window.location.href = "https://example.org/?from=" + sociorouter_get_current_domain();
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
			}, 300);
		}
	}
}

function sociorouter_get_content_el() {
	return sociorouter_content_el;
}

function sociorouter_form_plugin(data) {
	var dataobj = {};
	var datalines = data.split(',');

	var appendto_el;
	var loading_el;
	var form_el;
	var title_el;
	var content_el;
	var submit_el;

	loading_el = document.getElementById("sociorouter_loading");

	if(sociorouter_logged_in == false) {
		setTimeout(function() {
			sociorouter_form_plugin(data);
		}, 300);

		// show loading image
		if(!loading_el.firstChild) {
			var img_obj = document.createElement("img");
			img_obj.src = "https://example.org/assets/img/loading.gif";
			img_obj.alt = "loading";
			loading_el.appendChild(img_obj);
		}

		return;
	}

	// when complete hide loading image
	loading_el.style.display = "none";

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
				var iframe_obj = document.createElement("iframe");
				iframe_obj.src = "https://example.org/?route=sdk&action=connect";
				iframe_obj.width = "450px";
				iframe_obj.height = "150px";
				iframe_obj.style.margin = "0";
				iframe_obj.style.padding = "0";
				iframe_obj.style.border = "0";
				iframe_obj.style.width = "450px";
				iframe_obj.style.height = "150px";

				if(expr_type == "dom.id") {
					dom_id = (dom_id == "") ? "sociorouter_form_plugin" : dom_id;
					appendto_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					appendto_el = document.getElementsByClassName(dom_class)[0];
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
					title_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					title_el = document.getElementsByClassName(dom_class)[0];
				}

				break;
			case "submit":
				if(expr_type == "dom.id") {
					submit_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					submit_el = document.getElementsByClassName(dom_class)[0];
				}

				break;
		}
	}

	// process by got elements
	if("onsubmit" in window) {
		form_el.onsubmit = function() {
			var content_el = sociorouter_get_content_el();

			//alert("submitted");
			//alert(content_el.getContent());
		};
	}
}

// load jquery
load_jquery();
