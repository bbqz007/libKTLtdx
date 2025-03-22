/// Z#20250315
var $$_; 	/// js console await2, res => $$_;
var $$a;	/// js console exec command, res => $$a;
var $$json;	/// for input redirect to json command;
var $$awaiter; /// when the $$_, $$a last update, $$awaiter would update too.
				/// for js console await or await2 command whitout any arguments.
var $$auto_await = true; 	/// swith, if auto await2 to that a command return a Promise
							/// to get more controls, set it to false, every things by hand then.

var con = new SimpleConsole({
	handleCommand: handle_command,
	placeholder: "Enter JavaScript, or ASCII emoticons :)",
	storageID: "simple-console demo"
});
/**
document.body.appendChild(con.element);

con.logHTML(
	"<h1>Welcome to <a href='https://github.com/1j01/simple-console'>Simple Console!</a></h1>" +
	"<p>Try entering <code>5 + 5</code> below. Or some faces (ASCII emoticons like <code>:-P</code>).</p>" +
	(location.pathname.match(/tilde|backtick|quake/i) ? "" : "<p>Also check out the <a href='tilde" + (location.hostname.match(/github/) ? "" : ".html") +"'>Quake-style dropdown console example</a>.</p>")
);
*/

function handle_command(command){
	// Conversational trivialities
	var log_emoticon = function(face, rotate_direction){
		// top notch emotional mirroring (*basically* artificial general intelligence :P)
		var span = document.createElement("span");
		span.style.display = "inline-block";
		span.style.transform = "rotate(" + (rotate_direction / 4) + "turn)";
		span.style.cursor = "vertical-text";
		span.style.fontSize = "1.3em";
		span.innerText = face.replace(">", "〉").replace("<", "〈");
		con.log(span);
	};
	if(command.match(/^((Well|So|Um|Uh),? )?(Hi|Hello|Hey|Greetings|Hola)/i)){
		con.log((command.match(/^[A-Z]/) ? "Hello" : "hello") + (command.match(/\.|!/) ? "." : ""));
	}else if(command.match(/^((Well|So|Um|Uh),? )?(What'?s up|Sup)/i)){
		con.log((command.match(/^[A-Z]/) ? "Not much" : "not much") + (command.match(/\?|!/) ? "." : ""));
	}else if(command.match(/^(>?[:;8X][-o ]?[O03PCDS\\/|()[\]{}])$/i)){
		log_emoticon(command, +1);
	}else if(command.match(/^([O03PCDS\\/|()[\]{}][-o ]?[:;8X]<?)$/i)){
		log_emoticon(command, -1);
	}else if(command.match(/^<3$/i)){
		con.log("❤");
	// Unhelp
	}else if(command.match(/^(!*\?+!*|(please |plz )?(((I )?(want|need)[sz]?|display|show( me)?|view) )?(the |some )?help|^(gimme|give me|lend me) ((the |some )?)help| a hand( here)?)/i)){ // overly comprehensive, much?
		con.log("I could definitely help you if I wanted to.");
	}else{
		var err;
		try{
			var result = eval(command);
		}catch(error){
			err = error;
		}
		if(err){
			con.error(err);
		}else{
			con.log(result).classList.add("result");
		}
	}
};

/// Z#2023
var pycon = new SimpleConsole({
	handleCommand: handle_pycommand,
	placeholder: "Enter Java Script",
	storageID: "simple-console KTLjs"
});
pycon.element.align = "left";
document.body.appendChild(pycon.element);

var g_pycon_showtips = true;
pycon.input.addEventListener('keydown', function (e) {
	if (e.keyCode === 9) { // TAb
			var command = pycon.input.value;
			e.preventDefault();
			var cursorPosition = e.target.selectionStart;
			if (command.length == 0)
			{
				g_pycon_showtips = !g_pycon_showtips;
				var tips = pycon.getLastEntry().parentNode.getElementsByClassName('entry tips');
				for (const i in tips)
				{
					tips[i].hidden = !g_pycon_showtips;
				}
				if (g_pycon_showtips && undefined != pycon.getLastEntry().parentNode.scroll_to_bottom)
				{
					pycon.getLastEntry().parentNode.scroll_to_bottom();
				}
				return;
			}
			handle_pycommand(command + '\t', e.keyCode, cursorPosition);
			g_pycon_showtips = true;
		} 
});

var g_cnt_handle_pycommand = 0;
var g_init_pycommand = 0;
var g_has_KTLqry = false;

function pycon_info_detail(res) {
	if (res instanceof ArrayBuffer)
	{
		let detail = ktl.struct.hex(res.slice(0, 64));
		if (res.byteLength > 64)
			detail += '...';
		pycon.info(detail);
		return;
	}
	$$json = res;
	handle_pycommand('json $$json', 13);
}

function handle_pycommand(command, keyCode, startAt){ 
	if (keyCode == undefined)
		keyCode=13;
	if (startAt == undefined)
		startAt = command.length;
	if (!g_init_pycommand)
	{
		
	}
	
	function findCommonPrefix(strings) {
		if (!strings || strings.length === 0) {
		return '';
		}

		let prefix = strings[0];
		for (let i = 1; i < strings.length; i++) {
			while (!strings[i].startsWith(prefix)) {
			  prefix = prefix.slice(0, -1);
			  if (prefix === '') {
				return '';
			  }
			}
		}

		return prefix;
	}
	
	/// Z#20230802 bug	
	///   the function can not define with arguments with default values, 
	///   otherwise, the devtools crack when trigger this function
	
	// Conversational trivialities
	var cnt_handle_pycommand = ++g_cnt_handle_pycommand;
	var err;
	
	/// Z#20230803
	if (9 == keyCode
		&& (command.match(/^(await) /i)
			|| command.match(/^(json) /i)
			|| !command.match(/^(KTLcmd) /i)
			|| ((command.match(/^(KTLcmd) /i)) /**&& g_has_KTLqry*/)))
	{
		var _command = command;
		/// Z#20230804 carefull!!
		///   '\t' added to command by me,
		///   so the length should be startAt + 1
		if (startAt != 0 && command.length > startAt + 1)
			_command = command.substring(0, startAt) + '\t';
		if (command.length > 1 && command.endsWith('\t'))
		{
			var pos = _command.search(/([A-Za-z_\$]{1}[A-Za-z0-9_$]*|[A-Za-z_\$]{1}[A-Za-z0-9_\$]*\.[A-Za-z_\$]{1}[A-Za-z0-9_\$]*|[A-Za-z_\$]{1}[A-Za-z0-9_\$]*\.)[(]{0,1}\t+$/);
			if (-1 == pos)
				return;
			if (pos > 0 && command[pos - 1] >= '0' && command[pos - 1] <= '9')
				return;
			var wantProto = _command[_command.length-2] == '(';
			
			var match = _command.substring(pos);
			match = match.substring(0, match.length - 1);
			var hasOwner = match.lastIndexOf('.');
			var splitAt = hasOwner;
			var owner = undefined;
			var attr = match;
			if (match.search('.') != -1)
			{
				/// Z#20230804
				///   maybe more . in front
				var cur = pos;
				if (cur > 0)
				{
					--cur;
					if (_command[cur] == '.' && cur > 0 && _command[cur-1] != '.')
					{
						var subcmd = _command.substring(0, cur + 1);
						cur = subcmd.search(/([A-Za-z_\$]{1}[A-Za-z0-9_\$]*\.)+$/)
						/// unlike rlcompleter
						/// can not update pos to cur
						/// but 
						splitAt += pos - cur;
						match = subcmd.substring(cur) + match;
					}
				}
			}
			if (hasOwner != -1)
			{
				owner = match.substring(0, splitAt);
				attr = match.substring(splitAt + 1);
				owner = eval(owner);
			}
			
			if (0 && wantProto)
			{
				
						
				return;
			}
			var founds = new Array();
			if (hasOwner == -1)
			{
				owner = window;
			}
			pos = pos + hasOwner + 1;	// +0 if hasOwner is -1
			if (owner != undefined)
			{
				for (const property in owner)
				{
					if (property.startsWith(attr))
					{
						founds.push(property);
					}
				}
				if (hasOwner != -1)
				{
					var proto = owner;
					while (proto != undefined)
					{
						founds.push(...Object.getOwnPropertyNames(proto).filter((el)=>{return el.startsWith(attr);}));
						proto = proto.__proto__;
					};
				}
				founds = [...new Set(founds)].filter((el)=>{ return !el.startsWith('__') && !el.endsWith('__');});
				
				/// update input
				/// Z#20230804 carefull!!
				///   '\t' added to command by me,
				///   so the length should be startAt + 1
				if (command.length > startAt + 1)
				{
					/// need auto-complete where not in the end
					/// only allow owner (.) or function '(' to change
					if (command[startAt].search(/[ (.]/) == -1)
					{
						return;
					}
					if (founds.length == 1)
					{
						pycon.input.value = command.substring(0, pos) + founds[0];
						var newpos = pycon.input.value.length;
						pycon.input.value += command.substring(startAt, command.length-1);
						pycon.input.selectionStart = newpos;
						pycon.input.selectionEnd = newpos;
					}
					else if (founds.length > 1)
					{
						var common = findCommonPrefix(founds);
						if (common.length > 0)
						{
							pycon.input.value = command.substring(0, pos) + common;
							var newpos = pycon.input.value.length;
							pycon.input.value += command.substring(startAt, command.length-1);
							pycon.input.selectionStart = newpos;
							pycon.input.selectionEnd = newpos;
						}
						var text = '';
						text += '<pre style="white-space: pre-wrap;word-wrap: break-word;">';
						for (var i in founds)
						{
							text += founds[i];
							text += '\t'
						}
						text += '</pre>';
						pycon.logHTML(text);
						pycon.getLastEntry().classList.add("tips");
					}
				}
				else
				{
					if (founds.length == 1)
					{
						pycon.input.value = command.substring(0, pos) + founds[0];
					}
					else if (founds.length > 1)
					{
						var common = findCommonPrefix(founds);
						if (common.length > 0)
							pycon.input.value = command.substring(0, pos) + common;
						var text = '';
						text += '<pre style="white-space: pre-wrap;word-wrap: break-word;">';
						for (var i in founds)
						{
							text += founds[i];
							text += '\t'
						}
						text += '</pre>';
						pycon.logHTML(text);
						pycon.getLastEntry().classList.add("tips");
					}
				}
			}
		}
		return;
	}
	
	if(command == 'clear') {
		pycon.clear();
	}
	else if (command.match(/^(KTLcmd) /i)) {
		if (13 != keyCode)
			return;
		var cmd = command.substring(7).trimLeft();
		var json_renderer_id = 'json-renderer-' + cnt_handle_pycommand;
		if (!window.XHRJsonWithJsonAndCompletion || typeof window.XHRJsonWithJsonAndCompletion != 'function')
		{
			alert('not support KTLcmd');
			return;
		}
		cmd = cmd.trimLeft();
		var ctx = new Array();
		/// Z#20250316, try support new feat.
		if (cmd.search(':') != -1)
		{
			if (cmd[0] != '{' && cmd[0] != '[')
			{
				cmd = '{' + cmd + '}';
			}
		}
		try {
			var json = eval(cmd);
			if (typeof json == object)
				cmd = JSON.stringify(json);
		} catch (e) {
		}
		
		window.XHRJsonWithJsonAndCompletion(
			cmd, 
			ctx, 
			function(resjson, ctx) {
				pycon.logHTML('<pre id="' + json_renderer_id  + '" class="json-document"></pre>')
				$('#' + json_renderer_id).jsonViewer(resjson);
				$('#' + json_renderer_id)[0].classList.add('info');
		});
	}
	else if (command.match(/^(Json) /i)) {
		if (13 != keyCode)
			return;
		var js = command.substring(5).trimLeft();
		var json_renderer_id = 'json-renderer-' + cnt_handle_pycommand;
		if (js.length < 1)
			return;
		var cmd = js;
		if (js.search(',') != -1)
		{
			if (js[0] != '{' && js[0] != '[')
			{
				cmd = '[' + js +']';
			}
		}
		if (js.search(':') != -1)
		{
			if (js[0] != '{' && js[0] != '[')
			{
				cmd = '{' + js + '}';
			}
		}
		
		var ok = false;
		try {
			var json = eval('eval(' + cmd + ')');
			
			/// Z#20250315, bug
			/**
			if (typeof(json) == 'object' && ([].__proto__ != json.__proto__ && ({}).__proto__ != json.__proto__))
					throw "unknown object type";
				*/
			if (json == undefined || json == null)
			{
				pycon.error('undefined or null');
				return;
			}
			if (typeof(json) == 'object' && Object.getPrototypeOf(json).toString() != '[object Object]')
					pycon.warn(Object.getPrototypeOf(json).toString());
			pycon.logHTML('<pre id="' + json_renderer_id  + '" class="json-document"></pre>')
			$('#' + json_renderer_id).jsonViewer(json);
			$('#' + json_renderer_id)[0].classList.add('info');
			
			/// Z#20231003 rightclick to copy node
			entry = pycon.getLastEntry()
			entry.oncontextmenu = function (e) {
				if (e.target && e.target.nodeName != "DIV" && e.target.nodeName != "PRE")
				{
					if (confirm(e.target.innerText))
					{
						function copyToClipboard(text) {
							// Create a new textarea element
							var textarea = document.createElement("textarea");
							// Set the text content to be copied to the clipboard
							textarea.value = text;
							// Append the textarea to the DOM
							document.body.appendChild(textarea);
							// Select the text in the textarea
							textarea.select();
							// Copy the selected text to the clipboard
							document.execCommand("copy");
							// Remove the textarea from the DOM
							document.body.removeChild(textarea);
						} ;
						copyToClipboard(e.target.innerText);
					}
					e.preventDefault();
				}
			}
			ok = true;
		} catch(e) {
			pycon.warn(e.message);
		}
		if (!ok && cmd.length != js.length)
		{
			cmd = js;
			try {
				var json = eval('eval(' + cmd + ')');
				
				pycon.logHTML('<pre id="' + json_renderer_id  + '" class="json-document"></pre>')
				$('#' + json_renderer_id).jsonViewer(json);
				$('#' + json_renderer_id)[0].classList.add('info');
				ok = true;
			} catch(e) {
				pycon.warn(e.message);
			}
		}
	}
	else if(command.match(/^(await) /i)) {
		if (13 != keyCode)
			return;
		try{
			var result = "";
			result = eval(command.substring(6));
		}catch(error){
			err = error;
		}
		if(err){
			pycon.warn(err.message);
		} else if (result instanceof Promise){
			pycon.warn("async Promise");
			result.then(res=>{ 
				pycon.warn("$$_ updated.");
				$$_=res; if ($$_ instanceof Promise || $$_ instanceof Response) $$awaiter=$$_; pycon.info(res);
				if (res instanceof Object && !res instanceof Window)
					pycon_info_detail(res);//pycon.info(JSON.stringify(res)); 
			}, err=>{ pycon.warn(err.message); });
		} else {
			pycon.warn("not a Promise");
		}
	}
	else if(command.match(/^(await2) /i)) {
		if (13 != keyCode)
			return;
		try{
			var result = "";
			result = eval(command.substring(7));
		} catch(error) {
			err = error;
		}
		if(err){
			pycon.warn(err.message);
		} else if (result instanceof Promise){
			pycon.warn("async Promise");
			/**
			/// Z#20250316, 
			///   cast it to IIFE
			///   comment this code block
			result.then(res=>{ 
				pycon.warn("$$_ updated.");
				$$_=res; 
				if (res instanceof Promise)
				{
					pycon.warn("async Promise");
					res.then(res=>{ pycon.warn("$$_ updated.");$$_=res; pycon.info(res); }, err=>{ pycon.warn(err.message); });
					return;
				}
				else if (res instanceof Response)
				{
					pycon.warn("async Response.text()");
					res.text().then(res=>{ pycon.warn("$$_ updated.");$$_=res; pycon.info(res); }, err=>{ pycon.warn(err.message); });
					return;
				}
				pycon.info(res); 
				
				}, err=>{ pycon.warn(err.message); });
			*/
			/// IIFE（立即执行的异步函数）
			(async () => {
				try {
					let res = await result;
					pycon.warn("$$_ updated.");
					$$_ = res;
					if ($$_ instanceof Promise || $$_ instanceof Response)
						$$awaiter = $$_;

					if (res instanceof Promise) {
						pycon.warn("async Promise");
						res = await res;
						pycon.warn("$$_ updated.");
						$$_ = res;
						if ($$_ instanceof Promise || $$_ instanceof Response)
							$$awaiter = $$_;
						pycon.info(res);
						if (res instanceof Object && !(res instanceof Window))
							pycon_info_detail(res);//pycon.info(JSON.stringify(res));
					} else if (res instanceof Response) {
						pycon.warn("async Response.text()");
						res = await res.text();
						pycon.warn("$$_ updated.");
						$$_ = res;
						if ($$_ instanceof Promise || $$_ instanceof Response)
							$$awaiter = $$_;
						pycon.info(res);
					} else {
						pycon.info(res);
						if (res instanceof Object && !(res instanceof Window))
							pycon_info_detail(res);//pycon.info(JSON.stringify(res));
					}
				} catch (err) {
					pycon.warn(err.message);
				}
			})();
		} else if (result instanceof Response){
			pycon.warn("async Response.text()");
			result.text().then(res=>{ pycon.warn("$$_ updated.");$$_=res; if ($$_ instanceof Promise || $$_ instanceof Response) $$awaiter=$$_; pycon.info(res); }, err=>{ pycon.warn(err.message); });
			return;
		}
	} else if (command.match(/^(await|await2)[ \t]*$/i)) {
		command = command.trim();
		if (command.trim() === 'await') {
			if ($$awaiter instanceof Response)
				handle_pycommand('await2 $$awaiter');
			else 
				handle_pycommand('await $$awaiter');
		}
		else {
			handle_pycommand('await2 $$awaiter');
		}
	} else /** normal javascript */ {
		if (13 != keyCode)
			return;
		command = command.trim();
		if (command.startsWith('{') && command.endsWith('}'))
			command = '$$a = ' + command;
		try{
			var result = "";
			result = eval(command);
		}catch(error){
			err = error;
		}
		if(err){
			pycon.warn(err.message);
		}else{
			if (result != undefined)
			{
				$$a = result;
				if ($$a instanceof Promise || $$_ instanceof Response)
					$$awaiter = $$a;
			}
			pycon.info(result); // con.log(result).classList.add("info");
			if ($$auto_await === true)
			{
				if (result instanceof Promise || result instanceof Response)
				{
					handle_pycommand('await2 $$a');
				}
			}
		}
	}
};

pycon.ori_clear = pycon.clear;
pycon.clear = function () {
	pycon.ori_clear();
	pycon.logHTML(
		"<h1>Welcome to KTL javascript!</a></h1>"
	);
};

pycon.logHTML(
	"<h1>Welcome to KTL javascript!</a></h1>"
);
