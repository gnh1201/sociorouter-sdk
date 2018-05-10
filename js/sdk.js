/*
 * @file sdk.js
 * @description SocioRouter code snippet for customer
 * @author Go Namhyeon <gnh1201@gmail.com>
 * @date 2018-02-21
 * @license GPLv3
 */

var sociorouter_accesstoken = "";
var sociorouter_logged_in = false;
var sociorouter_base_url = "http://sociopost.net/";
var sociorouter_retry_interval = 300;
var sociorouter_content_el;
var sociorouter_content_name;
var sociorouter_iframe_object;
var sociorouter_site_url = "";
var sociorouter_site_type = "";
var sociorouter_plugin_url = "";
var sociorouter_remote_id = "";
var sociorouter_is_default_prevented = true;
var sociorouter_is_publisher = true;

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

function sociorouter_is_function(fn_name) {
	var fn;
	var ck_fn = [];
	var is_fn = false;

	if(fn_name in window) {
		fn = window[fn_name];

		ck_fn.push(typeof(fn) === "function");
		ck_fn.push(fn instanceof Function);
		ck_fn.push(fn.constructor === Function);
		ck_fn.push(!!(fn && fn.constructor && fn.call && fn.apply));
		ck_fn.push(fn && {}.toString.call(fn) === "[object Function]");

		for(i in ck_fn) {
			is_fn = is_fn || ck_fn[i];
		}
	}

	return is_fn;
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

		// redirect to sociorouter
		sociorouter_redirect();
	}
}

function sociorouter_get_current_domain() {
	return document.location.hostname;
}

function sociorouter_is_empty(str) {
    return (str.length === 0 || !str.trim());
}

function sociorouter_remotelogout() {
	var remotelogout_uri = sociorouter_base_url + "?route=remotelogout";
	sociorouter_jsonp(remotelogout_uri, "sociorouter_remotelogout_complete");
 }

function sociorouter_remotelogout_complete(value) {
	// nothing
}

function sociorouter_set_is_publisher(value) {
	sociorouter_is_publisher = value;
}

function sociorouter_build_query_string(obj) {
	var qstr = "";
	for(key in obj) {
		qstr += "&";
		qstr += key;
		qstr += "=";
		qstr += obj[key];
	}
	return (qstr.length > 0) ? qstr.substring(1) : qstr;
}

function sociorouter_remotelogin(username, data) {
	var remotelogin_uri = sociorouter_base_url;
	var remotelogin_accesstoken = sociorouter_get_accesstoken();
	var remotelogin_username = username;
	var remotelogin_domain = sociorouter_get_current_domain();
	var remotelogin_role = (typeof(data) !== "undefined") ? data.role : "";
	var remotelogin_email = (typeof(data) !== "undefined") ? data.email : "";
	var remotelogin_params = {
		"route": "remotelogin",
		"accesstoken": remotelogin_accesstoken,
		"user_name": remotelogin_username,
		"site_domain": remotelogin_domain,
		"role": remotelogin_role,
		"email": remotelogin_email
	};

	var remorelogin_exec = function() {
		if(sociorouter_is_empty(remotelogin_accesstoken)) {
			sociorouter_request_accesstoken();
			setTimeout(function() {
				sociorouter_remotelogin(remotelogin_username, data);
			}, sociorouter_retry_interval);

			return;
		} else {
			remotelogin_uri += "?" + sociorouter_build_query_string(remotelogin_params);
			sociorouter_jsonp(remotelogin_uri, "sociorouter_remotelogin_complete");
		}
	};

	// check blank username
	if(!sociorouter_is_empty(username)) {
		remorelogin_exec();
	} else {
		sociorouter_wp_login_redirect();
	}

	// set remote id
	sociorouter_remote_id = username;
}

function sociorouter_redirect() {
	var current_uri = window.location.href;
	var redirect_uri = encodeURI("http://" + sociorouter_get_current_domain());
	if(current_uri.indexOf("/sociorouter") > -1) {
		//window.location.href = sociorouter_base_url + "?_from=" + sociorouter_get_current_domain();
		sociorouter_go_to(sociorouter_base_url + "?_from=" + redirect_uri);
	}
}

function sociorouter_wp_login_redirect() {
	var remotelogin_domain = sociorouter_get_current_domain();
	var current_uri = window.location.href;
	var redirect_uri = encodeURI(current_uri);
	if(current_uri.indexOf("/sociorouter") > -1) {
		//window.location.href = "http://" + remotelogin_domain + "/wp-login.php?redirect_to=" + encodeURI(current_uri);
		sociorouter_go_to("http://" + remotelogin_domain + "/wp-login.php?redirect_to=" + redirect_uri);
	}
}

function sociorouter_go_to(url) {
	var a = document.createElement("a");
	if(!a.click) { //for IE
		window.location = url;
		return;
	}
	a.setAttribute("href", url);
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
}

function sociorouter_plugin(plugin_name, data) {
	switch(plugin_name) {
		case "form_plugin":
			sociorouter_form_plugin(data);
			break;
		case "group_plugin":
			sociorouter_group_plugin(data);
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
				sociorouter_set_content_el(js_type, js_value);
			}, sociorouter_retry_interval);
		}
	}
}

function sociorouter_get_content_el() {
	return sociorouter_content_el;
}

function sociorouter_set_site_url(site_url) {
	sociorouter_site_url = site_url;
}

function sociorouter_get_site_url() {
	return sociorouter_site_url;
}

function sociorouter_set_wp_url(wp_url) {
	sociorouter_set_site_url(wp_url);
	sociorouter_site_type = "wordpress";
}

function sociorouter_get_iframe_object(src, width, height) {
	var iframe_src = src;
	var iframe_obj = document.createElement("iframe");
	var iframe_width = width, iframe_height = height;

	iframe_obj.name = "sociorouter_object";
	iframe_obj.src = iframe_src;
	iframe_obj.width = iframe_width + "px";
	iframe_obj.height = iframe_height + "px";
	iframe_obj.style.margin = "0";
	iframe_obj.style.padding = "0";
	iframe_obj.style.border = "0";
	iframe_obj.style.width = iframe_width + "px";
	iframe_obj.style.height = iframe_height + "px";
	
	return iframe_obj;
}

function sociorouter_show_loading() {
	// access loading image box
	var loading_el = document.getElementById("sociorouter_loading");

	// show loading image
	if(!loading_el.firstChild) {
		var img_obj = document.createElement("img");
		img_obj.src = sociorouter_base_url + "assets/img/loading.gif";
		img_obj.alt = "loading";
		loading_el.appendChild(img_obj);
	}
	
	return loading_el;
}

function sociorouter_hide_loading() {
	// access loading image box
	var loading_el = document.getElementById("sociorouter_loading");
	loading_el.style.display = "none";

	return loading_el;
}

function sociorouter_parse_data(data) {
	var dataobj = {};
	var datalines = data.split(',');

	for(k in datalines) {
		// IE 11 is not supported str.startsWith
		if(datalines[k].indexOf("@") == 0) {
			datakey = datalines[k].substring(1, datalines[k].indexOf(':'));
			datavalue = datalines[k].substring(datalines[k].indexOf(':') + 1);
			dataobj[datakey] = datavalue;
		}
	}
	
	return dataobj;
}

function sociorouter_form_validate(form_el) {
	var fn_name = "";
	var fn_data = "";
	var fn = function(data) {
		console.log("validation data: " + data);
		return true;
	};

	if(sociorouter_site_type == "wordpress") {
		fn_name = "check_form_submittable";
		fn_data = form_el.id;
	}

	if(fn_name != "") {
		if(sociorouter_is_function(fn_name)) {
			fn = window[fn_name];
		}
	}

	return fn(fn_data);
}

function sociorouter_form_plugin(data) {
	var dataobj = sociorouter_parse_data(data);
	var current_domain = sociorouter_get_current_domain();
	var appendto_el;
	var loading_el;
	var form_el;
	var title_el;
	var content_el;
	var submit_el;
	var content_dom;

	if(sociorouter_logged_in == false) {
		setTimeout(function() {
			sociorouter_form_plugin(data);
		}, sociorouter_retry_interval);

		// show loading image
		loading_el = sociorouter_show_loading();

		return;
	}

	// when complete hide loading image
	loading_el = sociorouter_hide_loading();

	// set wordpress plugin url
	if(sociorouter_site_type == "wordpress") {
		sociorouter_plugin_url = sociorouter_site_url + "/wp-content/plugins/sociorouter/";
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
				var iframe_params = {
					"route": "sdk",
					"action": "connect",
					"remote_id": sociorouter_remote_id
				};
				var iframe_src = sociorouter_base_url + "?" + sociorouter_build_query_string(iframe_params);
				var iframe_obj = sociorouter_get_iframe_object(iframe_src, 700, 300);

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
					content_dom = document.getElementById(dom_id);
					content_el = {
						"getContent": function() {
							return content_dom.value;
						},
						"value": content_dom.value
					};
				} else if(expr_type == "dom.class") {
					content_dom = document.getElementsByClassName(dom_class)[0];
					content_el = {
						"getContent": function() {
							return content_dom.value;
						},
						"value": content_dom.value
					};
				} else if(expr_type == "dom.name") {
					content_dom = document.getElementsByName(dom_name)[0];
					content_el = {
						"getContent": function() {
							return content_dom.value;
						},
						"value": content_dom.value
					};
				}

				// register getContent method
				if(expr_type.indexOf("dom.") == 0 && content_el != null) {
					sociorouter_content_el = content_el;
				}

				/*
				// register getContent method
				if(expr_type.indexOf("dom.") == 0 && content_el != null) {
					content_el.getContent = function() {
						return this.value;
					};
					sociorouter_content_el = content_el;
				}
				*/

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
		submit_el.onclick = function() {
			var send_available = false;
			var content_el = sociorouter_get_content_el();
			var sdk_iframe = sociorouter_iframe_object;
			var sdk_window, sdk_el_title, sdk_el_content;
			var ajax_base_url = sociorouter_plugin_url + "/_ajax/";
			var $jq = ("jQuery" in window) ? jQuery : {};
			var allow_ajax = ("ajax" in $jq);
			var allow_return = false;
			var allow_post = sociorouter_form_validate(form_el);
			var sdk_window_name = sociorouter_make_id(10);

			if(allow_post == false) {
				alert("작성된 내용을 확인하여 주세요.");
			} else {
				// submit to new window
				sdk_window = window.open(window.location.href, sdk_window_name);
				form_el.target = sdk_window_name;
				sdk_window.focus();

				// submit message on ajax
				if(allow_ajax == true) {
					$jq.ajax({
						type: "POST",
						url: ajax_base_url,
						dataType: "text",
						data: {
							"action": "send",
							"remote_id": sociorouter_remote_id,
							"domain": current_domain,
							"title": title_el.value,
							"content": content_el.getContent(),
							"site_type": sociorouter_site_type,
							"site_url": sociorouter_get_site_url()
						},
						success: function(req) {
							var doc = document;
							sdk_window.onload = function() {
								// close old window
								document.location.href = "about:blank";
								document.write("Close this window.");
								window.close();

								// focus new window
								sdk_window.alert("글이 정상적으로 게시되었습니다.");
								sdk_window.focus();
							};
						}
					});
				}
			}
		};
	}
}

function sociorouter_group_plugin(data) {
	var dataobj = sociorouter_parse_data(data);
	var loading_el;
	var current_domain = sociorouter_get_current_domain();

	if(sociorouter_logged_in == false) {
		setTimeout(function() {
			sociorouter_group_plugin(data);
		}, sociorouter_retry_interval);

		// show loading image
		loading_el = sociorouter_show_loading();

		return;
	}

	// hide loading image
	loading_el = sociorouter_hide_loading();

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
				var iframe_params = {
					"route": "sdk",
					"action": "group",
					"group_name": current_domain,
					"site_url": encodeURI(sociorouter_site_url)
				};
				var iframe_src = sociorouter_base_url + "?" + sociorouter_build_query_string(iframe_params);
				var iframe_obj = sociorouter_get_iframe_object(iframe_src, 700, 1000);

				// register social plugin object
				sociorouter_iframe_object = iframe_obj;

				// validate DOM elements
				if(expr_type == "dom.id") {
					dom_id = (dom_id == "") ? "sociorouter_group_plugin" : dom_id;
					appendto_el = document.getElementById(dom_id);
				} else if(expr_type == "dom.class") {
					appendto_el = document.getElementsByClassName(dom_class)[0];
				} else if(expr_type == "dom.name") {
					appendto_el = document.getElementsByName(dom_name)[0];
				}

				appendto_el.appendChild(iframe_obj);

				break;
		}
	}
}

// load jquery
load_jquery();
