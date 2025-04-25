var g = {}; /// global tmp values.
var g_LastRes; /// 

var DEBUG = false;

function showAgentVersion()
{
	alert(navigator.userAgent.toLowerCase());
}

/// Z#20230616
function OnLoad()
{
	XHRJsonWithJsonAndCompletion(
		'GetApp',
		null,
		function (res, ctx) {
			var App = res["result"];
			if (App)
			{
				g_App = App;
			}
		},
		false /**not display the result**/);
}

/// Z#20230623
function OpenNewWindowWithContent(content)
{
	//var win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top="+(screen.height-400)+",left="+(screen.width-840));
	//win.document.body.innerHTML = content;
}

/// Z#20230724
function KTLcmdJsonRemap(json)
{
	var map = {
		'-c':'c',
		'-a':'a',
		'-A':'A',
		'-m':'m',
		'-p':'p',
		'-v':'v',
		'-moff':'moff',
		'-eoff':'eoff'
	};
	for (var i in map)
	{
		if (!(i in json) && map[i] in json)
		{
			json[i] = json[map[i]];
			delete json[map[i]];
		}
	}
	return json;			/// KTLcmdJsonRemap(json) === json
	/// Z#20250311, doc
	///  you need to JSON.stringify(json) when pass to xhr
}

/// Z#20250310
///  to disable display result, set precomp to any, ie. false.
///  or trace all xhrs, set precomp to a function to call $('#json-renderer').jsonViewer(resjson, {collapsed:1});
function XHRJsonWithJsonAndCompletion(jsontxt, ctx, comp, precomp)
{
	/// Z#20230724
	if (1)
	{
		jsontxt = jsontxt.trimLeft();
		if (jsontxt.length > 2 && jsontxt[0] == '{')
		{
			try {
				var o = eval('eval(' + jsontxt + ')');
				KTLcmdJsonRemap(o);
				jsontxt = JSON.stringify(o);
			} catch (e) {
				alert('maybe not a json\n' + e.message);
			}
		}
	}
	
	var url = "http://ktl/cmd/?cmd=12";
	if (comp == null)
		url = "http://ktl/cmd/?cmd=11";
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if (DEBUG)
				alert(xhttp.responseText);
			var res = xhttp.responseText;
			var resjson = {};
			try{
				resjson = JSON.parse(res);
			} catch(e){
				resjson = JSON.parse('{"result":"'+ res +'"}');
			}
			//alert(resjson);
			//alert(ctx);
			if (comp == null)
				return;
			
			g_LastRes = resjson;
			
			if (comp.toString().search("XHRJsonWithJsonAndCompletion") == -1
				&& precomp == undefined)
			{
				//alert(resjson);
				$('#json-renderer').jsonViewer(resjson, {collapsed:1});
				if (undefined != document.querySelector('#json-renderer'))
					OpenNewWindowWithContent(document.querySelector('#json-renderer').innerHTML);
			}
			
			if (typeof precomp == 'function')
				precomp(resjson, ctx);
			
			comp(resjson, ctx);
		}
	};
	xhttp.open("POST", url, true);
	xhttp.send(jsontxt);
}

const ktl = {}
ktl.async_caller = {}
ktl.async_caller.winapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'std', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};
ktl.async_caller.capi = function(mod, pfn) {
	return async function() {
		cmd = {c:'cdecl', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};
ktl.async_caller.thisapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'this', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};
ktl.async_caller.fastapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'fast', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};
ktl.async_caller.vwinapi = function(slot) {
	return async function() {
		let obj = 0;
		let args = Array.from(arguments);
		if (args.length)
			obj = args[0];
		cmd = {c:'std', p:0, v:[obj, slot*4], a: args};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};

ktl.async_caller.vthisapi = function(slot) {
	return async function() {
		let obj = 0;
		let args = Array.from(arguments);
		if (args.length)
			obj = args[0];
		cmd = {c:'this', p:0, v:[obj, slot*4], a: args};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd))});
	};
};
	
/// Z#20250315, doc
///  helper for await (await fetch()).text()
///  finally parse result to JSON
/// you need to await to get the result.
ktl.async_caller.await2 = async function(promise) {
	let res = await (await promise).text();
	return JSON.parse(res);
};

ktl.async_caller.await_winapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller.winapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller.await_capi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller.capi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller.await_fastapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller.fastapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller.await_thisapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller.thisapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller.await_vwinapi = function(slot) {
	return async function() {
		this.api = ktl.async_caller.vwinapi(slot);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller.await_vthisapi = function(slot) {
	return async function() {
		this.api = ktl.async_caller.vthisapi(slot);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller2 = {}
ktl.async_caller2.winapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'std', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
	};
};
ktl.async_caller2.capi = function(mod, pfn) {
	return async function() {
		cmd = {c:'cdecl', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
	};
};
ktl.async_caller2.thisapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'this', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
	};
};
ktl.async_caller2.fastapi = function(mod, pfn) {
	return async function() {
		cmd = {c:'fast', p:pfn, a: Array.from(arguments)};
		if (typeof mod == 'string')
			cmd.m = mod;
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
	};
};
ktl.async_caller2.cmd = function(cmd) {
	return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
};

ktl.async_caller2.await2 = ktl.async_caller.await2;
ktl.async_caller2.await_winapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller2.winapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller2.await_capi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller2.capi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller2.await_fastapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller2.fastapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller2.await_thisapi = function(mod, pfn) {
	return async function() {
		this.api = ktl.async_caller2.thisapi(mod, pfn);
		return ktl.async_caller.await2(this.api(...arguments));
	};
}

ktl.async_caller2.await_cmd = async function(cmd) {
	return ktl.async_caller.await2(ktl.async_caller2.cmd(cmd));
}


function hexStringToByteArray(hexString) {
    // 移除可能存在的空格或其他非十六进制字符
    hexString = hexString.replace(/\s+/g, '');

    // 创建一个新的Uint8Array，长度为hexString的长度的一半
    const byteArray = new Uint8Array(hexString.length / 2);

    // 遍历hexString并将每两个字符转换为一个字节
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }

    return byteArray;
}

function viewIterator(iterator) {
	if (!(iterator instanceof Iterator))
		throw new Error('not a Iterator');
	return [...iterator];
}


function genImage(arr, width, height)
{
	grayByteArray = arr;

	// 创建画布
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;
	
	var length = width*height;
	length = (grayByteArray.length > length) ? length : grayByteArray.length;

	// 将灰度值填充到图像数据中
	for (let i = 0; i < length; i++) {
		const grayValue = grayByteArray[i];
		const index = i * 4; // 每个像素有4个值（RGBA）
		data[index] = grayValue;     // 红色通道
		data[index + 1] = grayValue; // 绿色通道
		data[index + 2] = grayValue; // 蓝色通道
		data[index + 3] = 255;       // 不透明度
	}

	// 将图像数据放回画布
	ctx.putImageData(imageData, 0, 0);

	// 在HTML中显示图像
	const img = new Image();
	img.src = canvas.toDataURL();
	var win = window.open('aboutblank')
	setTimeout(function(){
		if (win.document.body != undefined)
			win.document.body.appendChild(img);
	}, 100);
	
	return [win, img]
}


function calcsize(fmt) {
    if (fmt.length === 0) return 0;

    let index = 0;
    let alignment = 2; // 默认自然对齐（4 字节）

    // 解析对齐方式
    if (fmt[0] === '=') {
        alignment = 1; // 关闭对齐
        index++;
    }

    let totalSize = 0;
    let lastSize = 0;

    // 定义格式字符对应的长度
    const typeSize = {
        'x': 1, // pad byte
        'c': 1, // char
        'b': 1, // signed char
        'B': 1, // unsigned char
        '?': 1, // bool
        'h': 2, // short
        'H': 2, // unsigned short
        'i': 4, // int
        'I': 4, // unsigned int
        'l': 4, // long
        'L': 4, // unsigned long
        'q': 8, // long long
        'Q': 8, // unsigned long long
        'f': 4, // float
        'd': 8, // double
        's': 1  // char[]，需要和数字组合处理
    };

    // 正则表达式匹配（可选的重复次数 + 格式字符）
    const regex = /(\d*)([xcbBhHiIlLqQfdsp])/g;

    let match;
    
    // 遍历 fmt 字符串
    while ((match = regex.exec(fmt.slice(index))) !== null) {
        let [_, repeatStr, type] = match;
        let repeat = repeatStr === '' ? 1 : parseInt(repeatStr, 10); // 默认为 1
        
        if (!(type in typeSize)) {
            throw new Error(`Unsupported format character: ${type}`);
        }

        //let size = type === 's' ? repeat : typeSize[type]; // 's' 特殊处理
		let size = typeSize[type];

        // 如果长度变化，进行对齐（按 alignment 规则）
        if (lastSize !== 0 && lastSize !== size) {
			/// Z#20250317, bug
			if (size > alignment)
				totalSize = Math.ceil(totalSize / size) * size;
			else
				totalSize = Math.ceil(totalSize / alignment) * alignment;
        }

        totalSize += size * repeat; //(type === 's' ? 1 : repeat);

        lastSize = size;
    }

    // 最终整体按对齐调整
    //totalSize = Math.ceil(totalSize / alignment) * alignment;

    return totalSize;
}


function unpack(fmt, buffer) {
    if (fmt.length === 0) return [];

    let index = 0;
    let alignment = 2; // 默认自然对齐（4 字节）

    // 解析对齐方式
    if (fmt[0] === '=') {
        alignment = 1; // 关闭对齐
        index++;
    }

    // 定义格式字符对应的长度
    const typeSize = {
        'x': 1, // pad byte
        'c': 1, // char
        'b': 1, // signed char
        'B': 1, // unsigned char
        '?': 1, // bool
        'h': 2, // short
        'H': 2, // unsigned short
        'i': 4, // int
        'I': 4, // unsigned int
        'l': 4, // long
        'L': 4, // unsigned long
        'q': 8, // long long
        'Q': 8, // unsigned long long
        'f': 4, // float
        'd': 8, // double
        's': 1  // char[]，需要和数字组合处理
    };

    const regex = /(\d*)([xcbBhHiIlLqQfdsp])/g;
    let match;
    let offset = 0;
    let result = [];
    let lastSize = 0;

    const view = new DataView(buffer);

    while ((match = regex.exec(fmt.slice(index))) !== null) {
        let [_, repeatStr, type] = match;
        let repeat = repeatStr === '' ? 1 : parseInt(repeatStr, 10);
        
        if (!(type in typeSize)) {
            throw new Error(`Unsupported format character: ${type}`);
        }

        //let size = type === 's' ? repeat : typeSize[type];
		let size = typeSize[type];

        // 按对齐调整偏移量
        if (lastSize !== 0 && lastSize !== size) {
			/// Z#20250317, bug
			if (size > alignment)
				offset = Math.ceil(offset / size) * size;
			else
				offset = Math.ceil(offset / alignment) * alignment;
        }

        for (let i = 0; i < repeat; i++) {
            switch (type) {
                case 'x': // pad byte
                    offset += size;
                    break;
                case 'c': // char
                    result.push(String.fromCharCode(view.getUint8(offset)));
                    offset += size;
                    break;
                case 'b': // signed char
                    result.push(view.getInt8(offset));
                    offset += size;
                    break;
                case 'B': // unsigned char
                    result.push(view.getUint8(offset));
                    offset += size;
                    break;
                case '?': // bool
                    result.push(view.getUint8(offset) !== 0);
                    offset += size;
                    break;
                case 'h': // short
                    result.push(view.getInt16(offset, true));
                    offset += size;
                    break;
                case 'H': // unsigned short
                    result.push(view.getUint16(offset, true));
                    offset += size;
                    break;
                case 'i': // int
                    result.push(view.getInt32(offset, true));
                    offset += size;
                    break;
                case 'I': // unsigned int
                    result.push(view.getUint32(offset, true));
                    offset += size;
                    break;
                case 'l': // long (和 int 同样大小)
                    result.push(view.getInt32(offset, true));
                    offset += size;
                    break;
                case 'L': // unsigned long
                    result.push(view.getUint32(offset, true));
                    offset += size;
                    break;
                case 'q': // long long
                    result.push(Number(view.getBigInt64(offset, true)));
                    offset += size;
                    break;
                case 'Q': // unsigned long long
                    result.push(Number(view.getBigUint64(offset, true)));
                    offset += size;
                    break;
                case 'f': // float
                    result.push(view.getFloat32(offset, true));
                    offset += size;
                    break;
                case 'd': // double
                    result.push(view.getFloat64(offset, true));
                    offset += size;
                    break;
                case 's': // char[]
                    let chars = new Uint8Array(buffer, offset, repeat);
                    //result.push(String.fromCharCode(...chars));
					/// Z#20250313, change string to arraybuffer
					result.push(buffer.slice(offset, offset + repeat));
                    offset += repeat;
					/// Z#20250313, bug
					///  s, consume repeat bytes
					///  i needs to step repeat
					i += repeat;
                    break;
            }
        }

        lastSize = size;
    }

    return result;
}

function pack(fmt, ...args) {
    if (fmt.length === 0) return new ArrayBuffer(0);

    let index = 0;
    let alignment = 2; // 默认自然对齐（4 字节）

    // 解析对齐方式
    if (fmt[0] === '=') {
        alignment = 1; // 关闭对齐
        index++;
    }

    // 定义格式字符对应的长度
    const typeSize = {
        'x': 1, // pad byte
        'c': 1, // char
        'b': 1, // signed char
        'B': 1, // unsigned char
        '?': 1, // bool
        'h': 2, // short
        'H': 2, // unsigned short
        'i': 4, // int
        'I': 4, // unsigned int
        'l': 4, // long
        'L': 4, // unsigned long
        'q': 8, // long long
        'Q': 8, // unsigned long long
        'f': 4, // float
        'd': 8, // double
        's': 1  // char[]，需要和数字组合处理
    };

    const regex = /(\d*)([xcbBhHiIlLqQfdsp])/g;
    let match;
    let offset = 0;
    let lastSize = 0;
    let argIndex = 0;
    let estimatedSize = calcsize(fmt);

    const buffer = new ArrayBuffer(estimatedSize);
    const view = new DataView(buffer);

    regex.lastIndex = 0;
    offset = 0;
    lastSize = 0;

    while ((match = regex.exec(fmt.slice(index))) !== null) {
        let [_, repeatStr, type] = match;
        let repeat = repeatStr === '' ? 1 : parseInt(repeatStr, 10);
        //let size = type === 's' ? repeat : typeSize[type];
		let size = typeSize[type];

        if (!(type in typeSize)) {
            throw new Error(`Unsupported format character: ${type}`);
        }

        if (lastSize !== 0 && lastSize !== size) {
			/// Z#20250317, bug
			if (size > alignment)
				offset = Math.ceil(offset / size) * size;
			else
				offset = Math.ceil(offset / alignment) * alignment;
        }

        for (let i = 0; i < repeat; i++) {
            let value = args[argIndex++];

            switch (type) {
                case 'x': // pad byte
                    offset += size;
                    break;
                case 'c': // char
                    view.setUint8(offset, value.charCodeAt(0));
                    offset += size;
                    break;
                case 'b': // signed char
                    view.setInt8(offset, value);
                    offset += size;
                    break;
                case 'B': // unsigned char
                    view.setUint8(offset, value);
                    offset += size;
                    break;
                case '?': // bool
                    view.setUint8(offset, value ? 1 : 0);
                    offset += size;
                    break;
                case 'h': // short
                    view.setInt16(offset, value, true);
                    offset += size;
                    break;
                case 'H': // unsigned short
                    view.setUint16(offset, value, true);
                    offset += size;
                    break;
                case 'i': // int
                    view.setInt32(offset, value, true);
                    offset += size;
                    break;
                case 'I': // unsigned int
                    view.setUint32(offset, value, true);
                    offset += size;
                    break;
                case 'l': // long (和 int 同样大小)
                    view.setInt32(offset, value, true);
                    offset += size;
                    break;
                case 'L': // unsigned long
                    view.setUint32(offset, value, true);
                    offset += size;
                    break;
                case 'q': // long long
                    view.setBigInt64(offset, BigInt(value), true);
                    offset += size;
                    break;
                case 'Q': // unsigned long long
                    view.setBigUint64(offset, BigInt(value), true);
                    offset += size;
                    break;
                case 'f': // float
                    view.setFloat32(offset, value, true);
                    offset += size;
                    break;
                case 'd': // double
                    view.setFloat64(offset, value, true);
                    offset += size;
                    break;
                case 's': // char[]
                    if (!(value instanceof ArrayBuffer)) {
                        throw new Error(`Expected ArrayBuffer for format "s", but got ${typeof value}`);
                    }
                    let uint8Array = new Uint8Array(value);
                    new Uint8Array(buffer, offset, repeat).set(uint8Array.slice(0, repeat));
                    offset += repeat;
                    i += repeat - 1;
                    break;
            }
        }

        lastSize = size;
    }

    return buffer;
}

function hexStringToArrayBuffer(hex) {
    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }

    const buffer = new ArrayBuffer(hex.length / 2);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < hex.length; i += 2) {
        view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    return buffer;
}

function arrayBufferToHexString(buffer) {
    const view = new Uint8Array(buffer);
    return Array.from(view)
        .map(byte => byte.toString(16).padStart(2, '0')) // 每个字节转为 16 进制，保持两位
        .join('');
}

function arrayBufferDecodeGBKToString(buffer) {
	return new TextDecoder('gbk').decode(buffer);
}

function arrayBufferDecodeUTF8ToString(buffer) {
	return new TextDecoder('utf8').decode(buffer);
}

function arrayBufferDecodeUnicodeToString(buffer) {
	return new TextDecoder('unicode').decode(buffer);
}

function stringEncodeUTF8(string) {
	return new TextEncoder().encode(string).buffer;
}

function stringEncodeUnicode(string) {
	var buffer = new ArrayBuffer(string.length*2);
	var u16v = new Uint16Array(buffer);
	for (let i = 0; i < string.length; i++) {
        u16v[i] = string.charCodeAt(i);
    }
	return buffer;
}

ktl.struct = {}
ktl.struct.pack = pack;
ktl.struct.unpack = unpack;
ktl.struct.calcsize = calcsize;
ktl.struct.tohex = arrayBufferToHexString;
ktl.struct.fromhex = hexStringToArrayBuffer;
ktl.struct.dec_gbk = arrayBufferDecodeGBKToString;
ktl.struct.dec_utf8 = arrayBufferDecodeUTF8ToString;
ktl.struct.dec_unicode = arrayBufferDecodeUnicodeToString;
ktl.struct.enc_utf8 = stringEncodeUTF8;
ktl.struct.enc_unicode = stringEncodeUnicode;
ktl.struct.hex = function(input) {
	let arglist = Array.from(arguments);
	if (arglist.length > 1)
		input = arglist;
	if (typeof input == 'number')
	{
		return (input).toString(16);
	}
	if (input instanceof Array)
	{
		let ret = [];
		input.forEach((el)=>{
			ret.push(ktl.struct.hex(el));
		});
		return ret;
	}
	if (input instanceof ArrayBuffer)
	{
		return arrayBufferToHexString(input);
	}
	if (input instanceof Object)
	{
		return ktl.struct.hex(Object.values(input));
	}
	return '';
};

/// Z#20250425
function guidToArrayBuffer(guidStr) {
	// 移除连字符
	const hex = guidStr.replace(/-/g, '');
	if (hex.length !== 32) throw new Error('Invalid GUID format');


	const buffer = ktl.struct.fromhex(hex);
	const view = new Uint8Array(buffer);

	const ret = 
	ktl.struct.pack('16B', view[3], view[2], view[1], view[0],
		view[5], view[4], view[7], view[6],
		view[8], view[9], view[10], view[11], 
		view[12], view[13], view[14], view[15]);

	return ret;
}

/// Z#20250425
function arrayBufferToGuid(buffer) {
	if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== 16)
		throw new Error('Invalid GUID buffer');

	const view = new Uint8Array(buffer);

	// 重新排列回原始 GUID 结构顺序（大小端转换）
	const reordered = [
		view[3], view[2], view[1], view[0],     // Data1
		view[5], view[4],                       // Data2
		view[7], view[6],                       // Data3
		view[8], view[9],                       // Data4[0-1]
		view[10], view[11], view[12], view[13], view[14], view[15] // Data4[2-7]
	];

	// 转成两位十六进制字符串
	const hexParts = reordered.map(b => b.toString(16).padStart(2, '0'));

	// 拼接为 GUID 字符串格式
	return [
		hexParts.slice(0, 4).join(''),
		hexParts.slice(4, 6).join(''),
		hexParts.slice(6, 8).join(''),
		hexParts.slice(8, 10).join(''),
		hexParts.slice(10, 16).join('')
	].join('-').toUpperCase();
}


ktl.async_access = {}
ktl.async_access.readbytes = async function(addr, count) {
	cmd = {c:'rmem', p:0, a: Array.from(arguments)};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
};
ktl.async_access.readhex = async function(addr, count) {
	cmd = {c:'rhex', p:0, a: Array.from(arguments)};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
};
ktl.async_access.writebytes = async function(addr, ...uchars) {
	cmd = {c:'whex', p:0, a: [addr, arrayBufferToHexString(new Uint8Array(uchars).buffer)]};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
};
ktl.async_access.writehex = async function(addr, hex) {
	cmd = {c:'whex', p:0, a: Array.from(arguments)};
		return fetch("http://ktl/cmd/?cmd=12", {method:'POST', body:JSON.stringify(KTLcmdJsonRemap(cmd)), headers:{uithread:'free'}});
};

ktl.async_access.readbuf = async function(addr, count) {
	let res = await (await ktl.async_access.readhex(addr, count)).text();
	res = JSON.parse(res);
	return hexStringToArrayBuffer(res.result);
};
ktl.async_access.writebuf = async function(addr, buf) {
	let hex = arrayBufferToHexString(buf);
	let res = await (await ktl.async_access.writehex(addr, hex)).text();
	res = JSON.parse(res);
	return res.result;
};

ktl.async_access.readfmt = async function(addr, fmt) {
	let res = await (await ktl.async_access.readhex(addr, ktl.struct.calcsize(fmt))).text();
	res = JSON.parse(res);
	let bytes = ktl.struct.fromhex(res.result);
	return ktl.struct.unpack(fmt, bytes);
};

ktl.async_access.custom = {}
ktl.async_access.custom.read_dos_header = async function(addr) {
	let res = await ktl.async_access.readfmt(addr, '30HI');
	return new (function(){
		[this.e_magic, this.e_cblp, this.e_cp, this.e_crlc, this.e_cparhdr, 
		this.e_minalloc, this.e_maxalloc, this.e_ss, this.e_sp, this.e_csum,
		this.e_ip, this.e_cs, this.e_lfarlc, this.e_ovno,
		,,,, //e_res[4]
		this.e_oemid, this.e_oeminfo,
		,,,,, ,,,,, //e_res2[10]
		this.e_lfanew] = res;
	})();
};

ktl.struct.custom = {}
ktl.struct.custom.unpack__MEMORY_BASIC_INFORMATION32 = function(bytes) {
	let fmt = '3II3I';
	let size = ktl.struct.calcsize(fmt);
	if (bytes == undefined)
		bytes = new ArrayBuffer(size);
	return new (function(){
		[this.BaseAddress, this.AllocationBase, this.AllocationProtect, this.RegionSize, 
		this.State, this.Protect, this.Type
		] = ktl.struct.unpack(fmt, bytes);
		this.__proto__.__size__ = size;
	})();
}
ktl.debug = {}
ktl.debug.info = {}
ktl.debug.info.addr = async function(addr){
	let mbi = ktl.struct.custom.unpack__MEMORY_BASIC_INFORMATION32();
	let pmbi = await ktl.async_caller2.await_capi('msvcrt.dll', 'malloc')(mbi.__proto__.__size__ + 2*260);
	pmbi = pmbi.result;
	let pbuf = pmbi + mbi.__proto__.__size__;
	let need_throw = null;
	/// Z#20250314
	/// get some help! js object has no destroy event or __dtor__
	let scope_free = [];	
	scope_free.push(pmbi);	
	let ret = null;
	try {
		/// do not return earlier.
		await ktl.async_caller2.await_winapi('kernel32.dll', 'VirtualQuery')(addr, pmbi, mbi.__proto__.__size__);
		let hex = await ktl.async_caller.await2(ktl.async_access.readhex(pmbi, mbi.__proto__.__size__));
		hex = hex.result;
		ret = ktl.struct.custom.unpack__MEMORY_BASIC_INFORMATION32(
			ktl.struct.fromhex(hex));
		ret = {mbi:ret};
		if (ret.mbi.AllocationBase != 0 && ret.mbi.Type == 0x1000000) {
			let res = await ktl.async_caller2.await_winapi('kernel32.dll', 'GetModuleFileNameW')(ret.mbi.AllocationBase, pbuf, 260);
			if (res.result) {
				ret.name = ktl.struct.dec_unicode(await ktl.async_access.readbuf(pbuf, res.result*2));
			}
		}
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.capi('msvcrt.dll', 'free')(p);
	});
	if (need_throw)
		throw need_throw;
	return ret;
}

ktl.debug.info.process = async function(){
	let ret = {}
	let scope_free = [];
	let need_throw = null;
	try {
		await
		(async function() {
			let pwbuf = await ktl.async_caller2.await_cmd({c:'zalloc',a:[260*2]});
			pwbuf = pwbuf.result;
			scope_free.push(pwbuf);
			let res = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleFileNameW')(0, pwbuf, 260);
			if (res.result)
				ret.exe = ktl.struct.dec_unicode(await ktl.async_access.readbuf(pwbuf, 260*2));
			res = await ktl.async_caller2.await_winapi('kernel32', 'GetCurrentProcessId')();
			if (res.result)
				ret.pid = res.result;
			let uitid = await ktl.async_caller2.await_cmd({c:'MainThreadId'});
			if (uitid.result)
				ret.ui_tid = uitid.result;
		})();
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.await_cmd({c:'free',a:[p]});
	});
	if (need_throw)
		throw need_throw;
	return ret;
}

ktl.debug.lm_by_js_and_bad_perf = async function() {
	// fmt: '8I256s260s'
	// [dwSize, th32ModuleID,th32ProcessID,GlblcntUsage,ProccntUsage,modBaseAddr,modBaseSize,hModule,szModule,szExePath]
	let api = {
		create: ktl.async_caller2.await_winapi('kernel32', 'CreateToolhelp32Snapshot'),
		first: ktl.async_caller2.await_winapi('kernel32', 'Module32First'),
		next: ktl.async_caller2.await_winapi('kernel32', 'Module32Next'),
		pid: ktl.async_caller2.await_winapi('kernel32', 'GetCurrentProcessId'),
		close: ktl.async_caller2.await_winapi('kernel32', 'CloseHandle')
	};
	let pid = await api.pid();
	pid = pid.result;
	let hshot = await api.create(0x8, pid);
	hshot = hshot.result;
	let proot = await ktl.async_caller.await2(ktl.async_caller.capi('msvcrt.dll', 'malloc')(ktl.struct.calcsize('8I256s260s')));
	proot = proot.result;
	let go = await api.first(hshot, proot);
	go = go.result;
	ret = {}
	while (go) {
		[dwSize, th32ModuleID,th32ProcessID,GlblcntUsage,ProccntUsage,modBaseAddr,modBaseSize,hModule,szModule,szExePath]
			= await ktl.async_access.readfmt(proot, '8I256s260s');
		let key = ktl.struct.dec_utf8(szModule);
		key = key.substring(0, key.search('\0'));
		ret[key] = [ktl.struct.hex(hModule), ktl.struct.hex(hModule+modBaseSize)];
		go = await api.next(hshot, proot);
		go = go.result;
	}
	api.close(hshot);
	ktl.async_caller.capi('msvcrt.dll', 'free')(proot);
	return ret;
};

ktl.debug.lm = async function() {
	let ret = await ktl.async_caller2.await_cmd({c:'lm'});
	ret = ret.result;
	return Object.fromEntries(
	  Object.entries(ret).map(([key, values]) => [
		key,
		values.map(v => '0x' + v.toString(16))
	  ])
	);
};

ktl.debug.vprot = async function(addr, size, prot){
	let ret = await ktl.debug.info.addr(addr);
	if (size == -1)
		size = ret.mbi.RegionSize;
	else
		size += addr - ret.mbi.BaseAddress;
	if (size > ret.mbi.RegionSize)
		throw "size cross two region";
	addr = ret.mbi.BaseAddress;
	let proot = await ktl.async_caller.await2(ktl.async_caller.capi('msvcrt.dll', 'malloc')(4+4+4));
	proot = proot.result;
	let scope_free = [];	
	scope_free.push(proot);
	let need_throw = null;
	let pva = proot;
	let pvs = proot+4;
	let pold = proot+8;
	try {
		await ktl.async_access.writebuf(proot, ktl.struct.pack('2I', addr, size));
		let res = await ktl.async_caller.await2(ktl.async_caller.capi('ntdll.dll', 'NtProtectVirtualMemory')(-1, pva, pvs, prot, pold));
		res = res.result;
		let old = 0;
		[addr, size, old] = await ktl.async_access.readfmt(proot, '3I');
		ret.target = {addr:addr, size:size, old:old, res:res};
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller.capi('msvcrt.dll', 'free')(p);
	});
	if (need_throw)
		throw need_throw;
	return ret;
};

ktl.debug.openAssembler = function() {
	open("https://shell-storm.org/online/Online-Assembler-and-Disassembler");
};

ktl.debug.assemble = async function(as, addr) {
	if (typeof as != 'string')
		throw new Error('as is not string');
	if (undefined == addr || typeof addr != 'number')
		addr = 0;
	await ktl.debug.dlopen("stone\\keystone.dll");
	let dlks = {
		open:ktl.async_caller2.await_capi('keystone', 'ks_open'),
		close:ktl.async_caller2.await_capi('keystone', 'ks_close'),
		asm:ktl.async_caller2.await_capi('keystone', 'ks_asm'),
		free:ktl.async_caller2.await_capi('keystone', 'ks_free'),
	};
	KS_ARCH_X86 = 4;
	KS_MODE_32 = 4;
	KS_ERR_OK = 0;
	let pmemroot = await ktl.async_caller2.await2(ktl.async_caller.capi('msvcrt.dll', 'malloc')(4+4+4+4));
	pmemroot = pmemroot.result;
	let pksh = pmemroot;
	let ppout = pmemroot + 4;
	let poutsize = pmemroot + 8;
	let pstat_count = pmemroot + 12;
	let status = await dlks.open(KS_ARCH_X86, KS_MODE_32, pksh);
	if (status.result != KS_ERR_OK)
		throw new Error('failed to open ks');
	let [ksh] = await ktl.async_access.readfmt(pksh, 'I');
	
	/// arg fmt IIQIII
	status = await dlks.asm(ksh, as, addr, 0, ppout, poutsize, pstat_count);
	if (status.result != 0)
		throw new Error('failed to asm');
	let [pout, outsize, stat_count] = await ktl.async_access.readfmt(ppout, '3I');
	
	let bytes = await ktl.async_access.readbuf(pout, outsize);
	await dlks.free(pout);
	await dlks.close(ksh);
	ktl.async_caller.capi('msvcrt.dll', 'free')(pmemroot);
	return bytes;
};

	
/// fmt: 'IQH24s32s160sI'
/// [id, address, size, bytes, mnemonic, op_str, detail]

ktl.debug.disassemble = async function(as, count, addr) {
	if (typeof as === 'number')
	{
		if (undefined == count)
			count = 4;
		addr = as;
		as = await ktl.async_access.readbuf(as, count*4);
	}
	if (! as instanceof ArrayBuffer)
		throw new Error('as is not arraybuffer');
	if (undefined == count || typeof count != 'number')
		count = 4;
	if (undefined == addr || typeof addr != 'number')
		addr = 0;
	await ktl.debug.dlopen("stone\\capstone.dll");
	let dlcs = {
		open:ktl.async_caller2.await_capi('capstone', 'cs_open'),
		close:ktl.async_caller2.await_capi('capstone', 'cs_close'),
		disasm:ktl.async_caller2.await_capi('capstone', 'cs_disasm'),
		free:ktl.async_caller2.await_capi('capstone', 'cs_free'),
	};
	
	CS_ARCH_X86 = 3;
	CS_MODE_32 = 4;
	CS_ERR_OK = 0;
	let pmemroot = await ktl.async_caller2.await2(ktl.async_caller.capi('msvcrt.dll', 'malloc')(4+4+4+4));
	pmemroot = pmemroot.result;
	let pcsh = pmemroot;
	let ppout = pmemroot + 4;
	let poutsize = pmemroot + 8;
	let pstat_count = pmemroot + 12;
	let status = await dlcs.open(CS_ARCH_X86, CS_MODE_32, pcsh);
	if (status.result != CS_ERR_OK)
		throw new Error('failed to open ks');
	let [csh] = await ktl.async_access.readfmt(pcsh, 'I');
	
	let ptmp = await ktl.async_caller2.await2(ktl.async_caller.capi('msvcrt.dll', 'malloc')(as.byteLength));
	ptmp = ptmp.result;
	
	await ktl.async_access.writebuf(ptmp, as);
	
	/// arg fmt IIIQII
	status = await dlcs.disasm(csh, ptmp, as.byteLength, addr, 0, count, ppout);
	if (status.result <= 0)
		throw new Error('failed to disasm');
	let [pout] = await ktl.async_access.readfmt(ppout, 'I');
	
	let elsize = 240;
	let code = '';
	for (let i = 0; i < status.result; ++i)
	{
		let [id, address, size, bytes, mnemonic, op_str, detail]
			= await ktl.async_access.readfmt(pout+i*elsize, 'IQH24s32s160sI');
		code += `0x${ktl.struct.hex(address)}: ${ktl.struct.dec_utf8(mnemonic).split('\0', 1)} ${ktl.struct.dec_utf8(op_str).split('\0', 1)}\n`;
		if ((i > 0) & (i % 500 == 0))
		{
			if (pycon)
				pycon.warn(`progress: ${i/status.result*100}%`);
		}
	}
	
	await dlcs.free(pout, status.result);
	await dlcs.close(pcsh);			// careful, cs_close(_csh*);
	ktl.async_caller.capi('msvcrt.dll', 'free')(pmemroot);
	ktl.async_caller.capi('msvcrt.dll', 'free')(ptmp);
	return code;
};

ktl.debug.dlsym = async function(mod, pfn) {
	let hmod = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleHandleA')(mod.toString());
	hmod = hmod.result;
	let addr = await ktl.async_caller2.await_winapi('kernel32', 'GetProcAddress')(hmod, pfn.toString());
	addr = addr.result;
	return addr;
};

ktl.debug.lswnd = async function() {
};

ktl.debug.dlopen = async function(path) {
	let tokens = path.split('\\');
	let basename = tokens[tokens.length-1];
	let ok = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleHandleA')(basename);
	if (ok.result)
		return ok.result;
	let pwbuf = await ktl.async_caller2.await_cmd({c:'zalloc',a:[260*2]});
	pwbuf = pwbuf.result;
	let ret = await (async function() {
		let abs = false;
		if (path.search(/^[a-zA-Z]:/) != -1)
		{
			abs = true;
			await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(path+'\0'));
			ok = await ktl.async_caller2.await_winapi('kernel32', 'LoadLibraryExW')(pwbuf, 0, 8);
		}
		else
		{
			await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(path+'\0'));
			ok = await ktl.async_caller2.await_winapi('kernel32', 'LoadLibraryW')(pwbuf);
		}
		if (ok.result)
			return ok.result;
		if (abs)
			return 0;
		
		ok = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleFileNameW')(0, pwbuf, 260);
		if (ok.result)
		{
			let apppath = await ktl.async_access.readbuf(pwbuf, ok.result*2);
			apppath = ktl.struct.dec_unicode(apppath);
			apppath = apppath.substring(0, apppath.lastIndexOf('\\'));
			await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(apppath+'\\'+path+'\0'));
			ok = await ktl.async_caller2.await_winapi('kernel32', 'LoadLibraryExW')(pwbuf, 0, 8);
			if (ok.result)
				return ok.result;
		}
		
		ok = await ktl.async_caller2.await_cmd({c:'hSelf'});
		if (ok.result)
		{
			ok = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleFileNameW')(ok.result, pwbuf, 260);
			if (ok.result)
			{
				let apppath = await ktl.async_access.readbuf(pwbuf, ok.result*2);
				apppath = ktl.struct.dec_unicode(apppath);
				apppath = apppath.substring(0, apppath.lastIndexOf('\\'));
				await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(apppath+'\\'+path+'\0'));
				ok = await ktl.async_caller2.await_winapi('kernel32', 'LoadLibraryExW')(pwbuf, 0, 8);
				if (ok.result)
					return ok.result;
			}
		}
	})();
	
	await ktl.async_caller2.await_cmd({c:'free',a:[pwbuf]});
	return ret;
};


//cdll.msvcrt.system(b'title tasklist & tasklist /FI "STATUS eq running" | findstr /i "wechat" && set /p __input__=')

ktl.debug.tasklist = async function(filter) {
	let ret = {}
	let scope_free = [];
	let need_throw = null;
	try {
		await
		(async function() {
			let wcmd = `title tasklist & tasklist /FI "STATUS eq running" | findstr /i ${filter} && set /p __input__=` + '\0';
			
			let pwbuf = await ktl.async_caller2.await_cmd({c:'zalloc',a:[wcmd.length*2]});
			pwbuf = pwbuf.result;
			scope_free.push(pwbuf);
			await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(wcmd));
			let res = await ktl.async_caller2.await_capi('msvcrt', '_wsystem')(pwbuf);
		})();
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.await_cmd({c:'free',a:[p]});
	});
	if (need_throw)
		throw need_throw;
	return ret;
};

ktl.debug.inject = async function(pid, dllName) {
	let log = console.log;
	if (pycon)
		log = pycon.warn;
	
	log("                  Beginning the DLL Injection Process ... ");
	log("------------------------------------------------------------------------------ ");
	
	let ret = {}
	let scope_free = [];
	let scope_dtor = [];
	let need_throw = null;
	try {
		await
		(async function() {
			let PROCESS_ALL_ACCESS = 2035711;
			let MEM_COMMIT = 0x1000;
			let MEM_RESERVE = 0x2000;
				
			let pLocalMem = await ktl.async_caller2.await_cmd({c:'zalloc',a:[260*2]});
			pLocalMem = pLocalMem.result;
			scope_free.push(pLocalMem);
			if (dllName == undefined)
			{
				let ok = await ktl.async_caller2.await_cmd({c:'hSelf'});
				if (ok.result)
				{
					ok = await ktl.async_caller2.await_winapi('kernel32', 'GetModuleFileNameW')(ok.result, pLocalMem, 260);
					if (ok.result)
					{
						let apppath = await ktl.async_access.readbuf(pLocalMem, ok.result*2);
						dllName = ktl.struct.dec_unicode(apppath);
					}
				}
			}
			await ktl.async_access.writebuf(pLocalMem, ktl.struct.enc_unicode(dllName + '\0'));
			log(`[+] Opening a handle to process with PID:${pid}`);
			let hProcess = await ktl.async_caller2.await_winapi('kernel32', 'OpenProcess')(PROCESS_ALL_ACCESS, 0, pid);
			hProcess = hProcess.result;
			scope_dtor.push(()=>{ ktl.async_caller2.winapi('kernel32', 'CloseHandle')(hProcess);});
			
			log(`[+] Handle ${hProcess} successfully opened`);
			log(`[+] Allocating space in the memory of process with PID:${pid}`)
			let pRemoteMem = await ktl.async_caller2.await_winapi('kernel32', 'VirtualAllocEx')(hProcess, 0, 260*2, MEM_COMMIT | MEM_RESERVE, 0x40);
			pRemoteMem = pRemoteMem.result;
			log(`[+] Space successfully allocated`);
			
			log(`[+] Writing to the process memory (${ktl.struct.hex(pRemoteMem)})`);
			let ok = await ktl.async_caller2.await_winapi('kernel32', 'WriteProcessMemory')(hProcess, pRemoteMem, pLocalMem, dllName.length*2, 0);
			
			if (ok.result)
			{
				log(`[+] Process memory successfully written ...`);
				log(`[+] Creating the remote thread ...`);
				let hThread = await ktl.async_caller2.await_winapi('kernel32', 'CreateRemoteThread')(
				hProcess, 0, 0, await ktl.debug.dlsym('kernel32', 'LoadLibraryW'), pRemoteMem, 0, 0);
				log(`[+] Remote thread successfully created`);
			}
		})();
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.await_cmd({c:'free',a:[p]});
	});
	scope_dtor.map(f=>{f()});
	if (need_throw)
		throw need_throw;
	return ret;
	
};

ktl.file = {}
ktl.file.native = {}
ktl.file.native.read = async function(fullpath, pbuf, bufsize, offset, readsize) {
	let res = await ktl.async_caller2.await_cmd({c:'rfile', a:[fullpath, pbuf, bufsize, offset, readsize]});
	let [, readbytes] = res.result;
	return readbytes;
};

ktl.file.native.write = async function(fullpath, pbuf, bufsize, offset) {
	let res = await ktl.async_caller2.await_cmd({c:'wfile', a:[fullpath, pbuf, bufsize, offset]});
	return res.result;
};

ktl.file.readbuf = async function(fullpath, offset, size) {
	if (offset == undefined)
		offset = 0;
	if (size == undefined)
		size = 0;
	let res = await ktl.async_caller2.await_cmd({c:'rfile', a:[fullpath, 0, 0, offset, size]});
	if (res.result)
	{
		let [pbuf, readbytes] = res.result;
		if (!pbuf)
			throw new Error('failed to open file');
		let ret = await ktl.async_access.readbuf(pbuf, readbytes);
		ktl.async_caller2.await_cmd({c:'free', a:[pbuf]});
		return ret;
	}
	return new ArrayBuffer;
};

ktl.file.writebuf = async function(fullpath, arraybuffer, offset) {
	if (offset == undefined)
		offset = 0;
	let size = arraybuffer.byteLength;
	let ret = {}
	let scope_free = [];
	let scope_dtor = [];
	let need_throw = null;
	try {
		await
		(async function() {
			let pbuf = await ktl.async_caller2.await_cmd({c:'zalloc', a:[size]});
			pbuf = pbuf.result;
			scope_free.push(pbuf);
			await ktl.async_access.writebuf(pbuf, arraybuffer);
			let res = await ktl.async_caller2.await_cmd({c:'wfile', a:[fullpath, pbuf, size, offset]});
			if (res.result)
				ret = res;
		})();
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.await_cmd({c:'free',a:[p]});
	});
	scope_dtor.map(f=>{f()});
	if (need_throw)
		throw need_throw;
	return ret;		
};

ktl.os = {};
ktl.os.system = async function(/**string*/wcmd, /**string*/ title, /**bool*/ pause) {
	let ret = {}
	let scope_free = [];
	let need_throw = null;
	if (typeof title == 'string')
		wcmd = `title ${title} & ` + wcmd;
	if (pause != undefined && pause)
		wcmd += ' && set /p __input__ = ';
	try {
		await
		(async function() {
			wcmd += '\0';
			
			let pwbuf = await ktl.async_caller2.await_cmd({c:'zalloc',a:[wcmd.length*2]});
			pwbuf = pwbuf.result;
			scope_free.push(pwbuf);
			await ktl.async_access.writebuf(pwbuf, ktl.struct.enc_unicode(wcmd));
			let res = await ktl.async_caller2.await_capi('msvcrt', '_wsystem')(pwbuf);
		})();
	} catch (e) {
		need_throw = e;
	}
	scope_free.map(p=>{
		ktl.async_caller2.await_cmd({c:'free',a:[p]});
	});
	if (need_throw)
		throw need_throw;
	return ret;
};


ktl.asRaw = function(addr) {
	if (!Number.isInteger(addr) && addr < 0 || addr >0x80000000)
		throw new Error("bad address: 0x" + ktl.struct.hex(addr));
	return {
		_ptr : addr,
		/// Z#20250318, doc, careful
		///  ()=>{}, // this is not the outer object
		fmt : async function (format) {
			return ktl.async_access.readfmt(this._ptr, format);
		},
		where : async function () {
			let info = await ktl.debug.info.addr(this._ptr);
			const k = {
				0x1000: 'MEM_COMMIT',
				0x10000: 'MEM_FREE',
				0x2000: 'MEM_RESERVE',
				0x1000000: 'MEM_IMAGE',
				0x40000: 'MEM_MAPPED',
				0x20000: 'MEM_PRIVATE',
				0x1: 'NOACCESS',
				0x2: 'r',
				0x4: 'rw',
				0x8: 'wc',
				0x10 : 'x',
				0x20 : 'rx',
				0x40 : 'rwx',
				0x80 : 'wcx', 
			};
			let attr = [];
			if (info.mbi.Protect in k)
				attr.push(k[info.mbi.Protect]);
			if (info.mbi.State in k)
				attr.push(k[info.mbi.State]);
			if (info.mbi.Type in k)
				attr.push(k[info.mbi.Type]);
			info.attr = attr;
			return info;
		},
		offset : function(off) {
			if (!Number.isInteger(off))
				throw new Error("bad offset");
			return ktl.asRaw(this._ptr + off);
		},
	};
}

