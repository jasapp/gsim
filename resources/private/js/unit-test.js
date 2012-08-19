var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__14284 = x == null ? null : x;
  if(p[goog.typeOf(x__14284)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__14285__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__14285 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14285__delegate.call(this, array, i, idxs)
    };
    G__14285.cljs$lang$maxFixedArity = 2;
    G__14285.cljs$lang$applyTo = function(arglist__14286) {
      var array = cljs.core.first(arglist__14286);
      var i = cljs.core.first(cljs.core.next(arglist__14286));
      var idxs = cljs.core.rest(cljs.core.next(arglist__14286));
      return G__14285__delegate(array, i, idxs)
    };
    G__14285.cljs$lang$arity$variadic = G__14285__delegate;
    return G__14285
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____14371 = this$;
      if(and__3822__auto____14371) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____14371
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2387__auto____14372 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14373 = cljs.core._invoke[goog.typeOf(x__2387__auto____14372)];
        if(or__3824__auto____14373) {
          return or__3824__auto____14373
        }else {
          var or__3824__auto____14374 = cljs.core._invoke["_"];
          if(or__3824__auto____14374) {
            return or__3824__auto____14374
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____14375 = this$;
      if(and__3822__auto____14375) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____14375
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2387__auto____14376 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14377 = cljs.core._invoke[goog.typeOf(x__2387__auto____14376)];
        if(or__3824__auto____14377) {
          return or__3824__auto____14377
        }else {
          var or__3824__auto____14378 = cljs.core._invoke["_"];
          if(or__3824__auto____14378) {
            return or__3824__auto____14378
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____14379 = this$;
      if(and__3822__auto____14379) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____14379
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2387__auto____14380 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14381 = cljs.core._invoke[goog.typeOf(x__2387__auto____14380)];
        if(or__3824__auto____14381) {
          return or__3824__auto____14381
        }else {
          var or__3824__auto____14382 = cljs.core._invoke["_"];
          if(or__3824__auto____14382) {
            return or__3824__auto____14382
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____14383 = this$;
      if(and__3822__auto____14383) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____14383
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2387__auto____14384 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14385 = cljs.core._invoke[goog.typeOf(x__2387__auto____14384)];
        if(or__3824__auto____14385) {
          return or__3824__auto____14385
        }else {
          var or__3824__auto____14386 = cljs.core._invoke["_"];
          if(or__3824__auto____14386) {
            return or__3824__auto____14386
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____14387 = this$;
      if(and__3822__auto____14387) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____14387
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2387__auto____14388 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14389 = cljs.core._invoke[goog.typeOf(x__2387__auto____14388)];
        if(or__3824__auto____14389) {
          return or__3824__auto____14389
        }else {
          var or__3824__auto____14390 = cljs.core._invoke["_"];
          if(or__3824__auto____14390) {
            return or__3824__auto____14390
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____14391 = this$;
      if(and__3822__auto____14391) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____14391
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2387__auto____14392 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14393 = cljs.core._invoke[goog.typeOf(x__2387__auto____14392)];
        if(or__3824__auto____14393) {
          return or__3824__auto____14393
        }else {
          var or__3824__auto____14394 = cljs.core._invoke["_"];
          if(or__3824__auto____14394) {
            return or__3824__auto____14394
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____14395 = this$;
      if(and__3822__auto____14395) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____14395
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2387__auto____14396 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14397 = cljs.core._invoke[goog.typeOf(x__2387__auto____14396)];
        if(or__3824__auto____14397) {
          return or__3824__auto____14397
        }else {
          var or__3824__auto____14398 = cljs.core._invoke["_"];
          if(or__3824__auto____14398) {
            return or__3824__auto____14398
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____14399 = this$;
      if(and__3822__auto____14399) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____14399
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2387__auto____14400 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14401 = cljs.core._invoke[goog.typeOf(x__2387__auto____14400)];
        if(or__3824__auto____14401) {
          return or__3824__auto____14401
        }else {
          var or__3824__auto____14402 = cljs.core._invoke["_"];
          if(or__3824__auto____14402) {
            return or__3824__auto____14402
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____14403 = this$;
      if(and__3822__auto____14403) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____14403
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2387__auto____14404 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14405 = cljs.core._invoke[goog.typeOf(x__2387__auto____14404)];
        if(or__3824__auto____14405) {
          return or__3824__auto____14405
        }else {
          var or__3824__auto____14406 = cljs.core._invoke["_"];
          if(or__3824__auto____14406) {
            return or__3824__auto____14406
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____14407 = this$;
      if(and__3822__auto____14407) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____14407
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2387__auto____14408 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14409 = cljs.core._invoke[goog.typeOf(x__2387__auto____14408)];
        if(or__3824__auto____14409) {
          return or__3824__auto____14409
        }else {
          var or__3824__auto____14410 = cljs.core._invoke["_"];
          if(or__3824__auto____14410) {
            return or__3824__auto____14410
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____14411 = this$;
      if(and__3822__auto____14411) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____14411
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2387__auto____14412 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14413 = cljs.core._invoke[goog.typeOf(x__2387__auto____14412)];
        if(or__3824__auto____14413) {
          return or__3824__auto____14413
        }else {
          var or__3824__auto____14414 = cljs.core._invoke["_"];
          if(or__3824__auto____14414) {
            return or__3824__auto____14414
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____14415 = this$;
      if(and__3822__auto____14415) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____14415
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2387__auto____14416 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14417 = cljs.core._invoke[goog.typeOf(x__2387__auto____14416)];
        if(or__3824__auto____14417) {
          return or__3824__auto____14417
        }else {
          var or__3824__auto____14418 = cljs.core._invoke["_"];
          if(or__3824__auto____14418) {
            return or__3824__auto____14418
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____14419 = this$;
      if(and__3822__auto____14419) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____14419
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2387__auto____14420 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14421 = cljs.core._invoke[goog.typeOf(x__2387__auto____14420)];
        if(or__3824__auto____14421) {
          return or__3824__auto____14421
        }else {
          var or__3824__auto____14422 = cljs.core._invoke["_"];
          if(or__3824__auto____14422) {
            return or__3824__auto____14422
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____14423 = this$;
      if(and__3822__auto____14423) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____14423
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2387__auto____14424 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14425 = cljs.core._invoke[goog.typeOf(x__2387__auto____14424)];
        if(or__3824__auto____14425) {
          return or__3824__auto____14425
        }else {
          var or__3824__auto____14426 = cljs.core._invoke["_"];
          if(or__3824__auto____14426) {
            return or__3824__auto____14426
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____14427 = this$;
      if(and__3822__auto____14427) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____14427
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2387__auto____14428 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14429 = cljs.core._invoke[goog.typeOf(x__2387__auto____14428)];
        if(or__3824__auto____14429) {
          return or__3824__auto____14429
        }else {
          var or__3824__auto____14430 = cljs.core._invoke["_"];
          if(or__3824__auto____14430) {
            return or__3824__auto____14430
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____14431 = this$;
      if(and__3822__auto____14431) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____14431
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2387__auto____14432 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14433 = cljs.core._invoke[goog.typeOf(x__2387__auto____14432)];
        if(or__3824__auto____14433) {
          return or__3824__auto____14433
        }else {
          var or__3824__auto____14434 = cljs.core._invoke["_"];
          if(or__3824__auto____14434) {
            return or__3824__auto____14434
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____14435 = this$;
      if(and__3822__auto____14435) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____14435
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2387__auto____14436 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14437 = cljs.core._invoke[goog.typeOf(x__2387__auto____14436)];
        if(or__3824__auto____14437) {
          return or__3824__auto____14437
        }else {
          var or__3824__auto____14438 = cljs.core._invoke["_"];
          if(or__3824__auto____14438) {
            return or__3824__auto____14438
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____14439 = this$;
      if(and__3822__auto____14439) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____14439
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2387__auto____14440 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14441 = cljs.core._invoke[goog.typeOf(x__2387__auto____14440)];
        if(or__3824__auto____14441) {
          return or__3824__auto____14441
        }else {
          var or__3824__auto____14442 = cljs.core._invoke["_"];
          if(or__3824__auto____14442) {
            return or__3824__auto____14442
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____14443 = this$;
      if(and__3822__auto____14443) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____14443
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2387__auto____14444 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14445 = cljs.core._invoke[goog.typeOf(x__2387__auto____14444)];
        if(or__3824__auto____14445) {
          return or__3824__auto____14445
        }else {
          var or__3824__auto____14446 = cljs.core._invoke["_"];
          if(or__3824__auto____14446) {
            return or__3824__auto____14446
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____14447 = this$;
      if(and__3822__auto____14447) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____14447
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2387__auto____14448 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14449 = cljs.core._invoke[goog.typeOf(x__2387__auto____14448)];
        if(or__3824__auto____14449) {
          return or__3824__auto____14449
        }else {
          var or__3824__auto____14450 = cljs.core._invoke["_"];
          if(or__3824__auto____14450) {
            return or__3824__auto____14450
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____14451 = this$;
      if(and__3822__auto____14451) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____14451
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2387__auto____14452 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____14453 = cljs.core._invoke[goog.typeOf(x__2387__auto____14452)];
        if(or__3824__auto____14453) {
          return or__3824__auto____14453
        }else {
          var or__3824__auto____14454 = cljs.core._invoke["_"];
          if(or__3824__auto____14454) {
            return or__3824__auto____14454
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____14459 = coll;
    if(and__3822__auto____14459) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____14459
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2387__auto____14460 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14461 = cljs.core._count[goog.typeOf(x__2387__auto____14460)];
      if(or__3824__auto____14461) {
        return or__3824__auto____14461
      }else {
        var or__3824__auto____14462 = cljs.core._count["_"];
        if(or__3824__auto____14462) {
          return or__3824__auto____14462
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____14467 = coll;
    if(and__3822__auto____14467) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____14467
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2387__auto____14468 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14469 = cljs.core._empty[goog.typeOf(x__2387__auto____14468)];
      if(or__3824__auto____14469) {
        return or__3824__auto____14469
      }else {
        var or__3824__auto____14470 = cljs.core._empty["_"];
        if(or__3824__auto____14470) {
          return or__3824__auto____14470
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____14475 = coll;
    if(and__3822__auto____14475) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____14475
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2387__auto____14476 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14477 = cljs.core._conj[goog.typeOf(x__2387__auto____14476)];
      if(or__3824__auto____14477) {
        return or__3824__auto____14477
      }else {
        var or__3824__auto____14478 = cljs.core._conj["_"];
        if(or__3824__auto____14478) {
          return or__3824__auto____14478
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____14487 = coll;
      if(and__3822__auto____14487) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____14487
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2387__auto____14488 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14489 = cljs.core._nth[goog.typeOf(x__2387__auto____14488)];
        if(or__3824__auto____14489) {
          return or__3824__auto____14489
        }else {
          var or__3824__auto____14490 = cljs.core._nth["_"];
          if(or__3824__auto____14490) {
            return or__3824__auto____14490
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____14491 = coll;
      if(and__3822__auto____14491) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____14491
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2387__auto____14492 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14493 = cljs.core._nth[goog.typeOf(x__2387__auto____14492)];
        if(or__3824__auto____14493) {
          return or__3824__auto____14493
        }else {
          var or__3824__auto____14494 = cljs.core._nth["_"];
          if(or__3824__auto____14494) {
            return or__3824__auto____14494
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____14499 = coll;
    if(and__3822__auto____14499) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____14499
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2387__auto____14500 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14501 = cljs.core._first[goog.typeOf(x__2387__auto____14500)];
      if(or__3824__auto____14501) {
        return or__3824__auto____14501
      }else {
        var or__3824__auto____14502 = cljs.core._first["_"];
        if(or__3824__auto____14502) {
          return or__3824__auto____14502
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____14507 = coll;
    if(and__3822__auto____14507) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____14507
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2387__auto____14508 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14509 = cljs.core._rest[goog.typeOf(x__2387__auto____14508)];
      if(or__3824__auto____14509) {
        return or__3824__auto____14509
      }else {
        var or__3824__auto____14510 = cljs.core._rest["_"];
        if(or__3824__auto____14510) {
          return or__3824__auto____14510
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____14515 = coll;
    if(and__3822__auto____14515) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____14515
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2387__auto____14516 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14517 = cljs.core._next[goog.typeOf(x__2387__auto____14516)];
      if(or__3824__auto____14517) {
        return or__3824__auto____14517
      }else {
        var or__3824__auto____14518 = cljs.core._next["_"];
        if(or__3824__auto____14518) {
          return or__3824__auto____14518
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____14527 = o;
      if(and__3822__auto____14527) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____14527
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2387__auto____14528 = o == null ? null : o;
      return function() {
        var or__3824__auto____14529 = cljs.core._lookup[goog.typeOf(x__2387__auto____14528)];
        if(or__3824__auto____14529) {
          return or__3824__auto____14529
        }else {
          var or__3824__auto____14530 = cljs.core._lookup["_"];
          if(or__3824__auto____14530) {
            return or__3824__auto____14530
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____14531 = o;
      if(and__3822__auto____14531) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____14531
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2387__auto____14532 = o == null ? null : o;
      return function() {
        var or__3824__auto____14533 = cljs.core._lookup[goog.typeOf(x__2387__auto____14532)];
        if(or__3824__auto____14533) {
          return or__3824__auto____14533
        }else {
          var or__3824__auto____14534 = cljs.core._lookup["_"];
          if(or__3824__auto____14534) {
            return or__3824__auto____14534
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____14539 = coll;
    if(and__3822__auto____14539) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____14539
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2387__auto____14540 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14541 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2387__auto____14540)];
      if(or__3824__auto____14541) {
        return or__3824__auto____14541
      }else {
        var or__3824__auto____14542 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____14542) {
          return or__3824__auto____14542
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____14547 = coll;
    if(and__3822__auto____14547) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____14547
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2387__auto____14548 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14549 = cljs.core._assoc[goog.typeOf(x__2387__auto____14548)];
      if(or__3824__auto____14549) {
        return or__3824__auto____14549
      }else {
        var or__3824__auto____14550 = cljs.core._assoc["_"];
        if(or__3824__auto____14550) {
          return or__3824__auto____14550
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____14555 = coll;
    if(and__3822__auto____14555) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____14555
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2387__auto____14556 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14557 = cljs.core._dissoc[goog.typeOf(x__2387__auto____14556)];
      if(or__3824__auto____14557) {
        return or__3824__auto____14557
      }else {
        var or__3824__auto____14558 = cljs.core._dissoc["_"];
        if(or__3824__auto____14558) {
          return or__3824__auto____14558
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____14563 = coll;
    if(and__3822__auto____14563) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____14563
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2387__auto____14564 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14565 = cljs.core._key[goog.typeOf(x__2387__auto____14564)];
      if(or__3824__auto____14565) {
        return or__3824__auto____14565
      }else {
        var or__3824__auto____14566 = cljs.core._key["_"];
        if(or__3824__auto____14566) {
          return or__3824__auto____14566
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____14571 = coll;
    if(and__3822__auto____14571) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____14571
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2387__auto____14572 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14573 = cljs.core._val[goog.typeOf(x__2387__auto____14572)];
      if(or__3824__auto____14573) {
        return or__3824__auto____14573
      }else {
        var or__3824__auto____14574 = cljs.core._val["_"];
        if(or__3824__auto____14574) {
          return or__3824__auto____14574
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____14579 = coll;
    if(and__3822__auto____14579) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____14579
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2387__auto____14580 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14581 = cljs.core._disjoin[goog.typeOf(x__2387__auto____14580)];
      if(or__3824__auto____14581) {
        return or__3824__auto____14581
      }else {
        var or__3824__auto____14582 = cljs.core._disjoin["_"];
        if(or__3824__auto____14582) {
          return or__3824__auto____14582
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____14587 = coll;
    if(and__3822__auto____14587) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____14587
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2387__auto____14588 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14589 = cljs.core._peek[goog.typeOf(x__2387__auto____14588)];
      if(or__3824__auto____14589) {
        return or__3824__auto____14589
      }else {
        var or__3824__auto____14590 = cljs.core._peek["_"];
        if(or__3824__auto____14590) {
          return or__3824__auto____14590
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____14595 = coll;
    if(and__3822__auto____14595) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____14595
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2387__auto____14596 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14597 = cljs.core._pop[goog.typeOf(x__2387__auto____14596)];
      if(or__3824__auto____14597) {
        return or__3824__auto____14597
      }else {
        var or__3824__auto____14598 = cljs.core._pop["_"];
        if(or__3824__auto____14598) {
          return or__3824__auto____14598
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____14603 = coll;
    if(and__3822__auto____14603) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____14603
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2387__auto____14604 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14605 = cljs.core._assoc_n[goog.typeOf(x__2387__auto____14604)];
      if(or__3824__auto____14605) {
        return or__3824__auto____14605
      }else {
        var or__3824__auto____14606 = cljs.core._assoc_n["_"];
        if(or__3824__auto____14606) {
          return or__3824__auto____14606
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____14611 = o;
    if(and__3822__auto____14611) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____14611
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2387__auto____14612 = o == null ? null : o;
    return function() {
      var or__3824__auto____14613 = cljs.core._deref[goog.typeOf(x__2387__auto____14612)];
      if(or__3824__auto____14613) {
        return or__3824__auto____14613
      }else {
        var or__3824__auto____14614 = cljs.core._deref["_"];
        if(or__3824__auto____14614) {
          return or__3824__auto____14614
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____14619 = o;
    if(and__3822__auto____14619) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____14619
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2387__auto____14620 = o == null ? null : o;
    return function() {
      var or__3824__auto____14621 = cljs.core._deref_with_timeout[goog.typeOf(x__2387__auto____14620)];
      if(or__3824__auto____14621) {
        return or__3824__auto____14621
      }else {
        var or__3824__auto____14622 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____14622) {
          return or__3824__auto____14622
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____14627 = o;
    if(and__3822__auto____14627) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____14627
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2387__auto____14628 = o == null ? null : o;
    return function() {
      var or__3824__auto____14629 = cljs.core._meta[goog.typeOf(x__2387__auto____14628)];
      if(or__3824__auto____14629) {
        return or__3824__auto____14629
      }else {
        var or__3824__auto____14630 = cljs.core._meta["_"];
        if(or__3824__auto____14630) {
          return or__3824__auto____14630
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____14635 = o;
    if(and__3822__auto____14635) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____14635
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2387__auto____14636 = o == null ? null : o;
    return function() {
      var or__3824__auto____14637 = cljs.core._with_meta[goog.typeOf(x__2387__auto____14636)];
      if(or__3824__auto____14637) {
        return or__3824__auto____14637
      }else {
        var or__3824__auto____14638 = cljs.core._with_meta["_"];
        if(or__3824__auto____14638) {
          return or__3824__auto____14638
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____14647 = coll;
      if(and__3822__auto____14647) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____14647
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2387__auto____14648 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14649 = cljs.core._reduce[goog.typeOf(x__2387__auto____14648)];
        if(or__3824__auto____14649) {
          return or__3824__auto____14649
        }else {
          var or__3824__auto____14650 = cljs.core._reduce["_"];
          if(or__3824__auto____14650) {
            return or__3824__auto____14650
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____14651 = coll;
      if(and__3822__auto____14651) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____14651
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2387__auto____14652 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14653 = cljs.core._reduce[goog.typeOf(x__2387__auto____14652)];
        if(or__3824__auto____14653) {
          return or__3824__auto____14653
        }else {
          var or__3824__auto____14654 = cljs.core._reduce["_"];
          if(or__3824__auto____14654) {
            return or__3824__auto____14654
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____14659 = coll;
    if(and__3822__auto____14659) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____14659
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2387__auto____14660 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14661 = cljs.core._kv_reduce[goog.typeOf(x__2387__auto____14660)];
      if(or__3824__auto____14661) {
        return or__3824__auto____14661
      }else {
        var or__3824__auto____14662 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____14662) {
          return or__3824__auto____14662
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____14667 = o;
    if(and__3822__auto____14667) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____14667
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2387__auto____14668 = o == null ? null : o;
    return function() {
      var or__3824__auto____14669 = cljs.core._equiv[goog.typeOf(x__2387__auto____14668)];
      if(or__3824__auto____14669) {
        return or__3824__auto____14669
      }else {
        var or__3824__auto____14670 = cljs.core._equiv["_"];
        if(or__3824__auto____14670) {
          return or__3824__auto____14670
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____14675 = o;
    if(and__3822__auto____14675) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____14675
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2387__auto____14676 = o == null ? null : o;
    return function() {
      var or__3824__auto____14677 = cljs.core._hash[goog.typeOf(x__2387__auto____14676)];
      if(or__3824__auto____14677) {
        return or__3824__auto____14677
      }else {
        var or__3824__auto____14678 = cljs.core._hash["_"];
        if(or__3824__auto____14678) {
          return or__3824__auto____14678
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____14683 = o;
    if(and__3822__auto____14683) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____14683
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2387__auto____14684 = o == null ? null : o;
    return function() {
      var or__3824__auto____14685 = cljs.core._seq[goog.typeOf(x__2387__auto____14684)];
      if(or__3824__auto____14685) {
        return or__3824__auto____14685
      }else {
        var or__3824__auto____14686 = cljs.core._seq["_"];
        if(or__3824__auto____14686) {
          return or__3824__auto____14686
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____14691 = coll;
    if(and__3822__auto____14691) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____14691
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2387__auto____14692 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14693 = cljs.core._rseq[goog.typeOf(x__2387__auto____14692)];
      if(or__3824__auto____14693) {
        return or__3824__auto____14693
      }else {
        var or__3824__auto____14694 = cljs.core._rseq["_"];
        if(or__3824__auto____14694) {
          return or__3824__auto____14694
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14699 = coll;
    if(and__3822__auto____14699) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____14699
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2387__auto____14700 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14701 = cljs.core._sorted_seq[goog.typeOf(x__2387__auto____14700)];
      if(or__3824__auto____14701) {
        return or__3824__auto____14701
      }else {
        var or__3824__auto____14702 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____14702) {
          return or__3824__auto____14702
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14707 = coll;
    if(and__3822__auto____14707) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____14707
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2387__auto____14708 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14709 = cljs.core._sorted_seq_from[goog.typeOf(x__2387__auto____14708)];
      if(or__3824__auto____14709) {
        return or__3824__auto____14709
      }else {
        var or__3824__auto____14710 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____14710) {
          return or__3824__auto____14710
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14715 = coll;
    if(and__3822__auto____14715) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14715
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2387__auto____14716 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14717 = cljs.core._entry_key[goog.typeOf(x__2387__auto____14716)];
      if(or__3824__auto____14717) {
        return or__3824__auto____14717
      }else {
        var or__3824__auto____14718 = cljs.core._entry_key["_"];
        if(or__3824__auto____14718) {
          return or__3824__auto____14718
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14723 = coll;
    if(and__3822__auto____14723) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14723
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2387__auto____14724 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14725 = cljs.core._comparator[goog.typeOf(x__2387__auto____14724)];
      if(or__3824__auto____14725) {
        return or__3824__auto____14725
      }else {
        var or__3824__auto____14726 = cljs.core._comparator["_"];
        if(or__3824__auto____14726) {
          return or__3824__auto____14726
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____14731 = o;
    if(and__3822__auto____14731) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14731
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2387__auto____14732 = o == null ? null : o;
    return function() {
      var or__3824__auto____14733 = cljs.core._pr_seq[goog.typeOf(x__2387__auto____14732)];
      if(or__3824__auto____14733) {
        return or__3824__auto____14733
      }else {
        var or__3824__auto____14734 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14734) {
          return or__3824__auto____14734
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____14739 = d;
    if(and__3822__auto____14739) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14739
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2387__auto____14740 = d == null ? null : d;
    return function() {
      var or__3824__auto____14741 = cljs.core._realized_QMARK_[goog.typeOf(x__2387__auto____14740)];
      if(or__3824__auto____14741) {
        return or__3824__auto____14741
      }else {
        var or__3824__auto____14742 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14742) {
          return or__3824__auto____14742
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____14747 = this$;
    if(and__3822__auto____14747) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14747
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2387__auto____14748 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14749 = cljs.core._notify_watches[goog.typeOf(x__2387__auto____14748)];
      if(or__3824__auto____14749) {
        return or__3824__auto____14749
      }else {
        var or__3824__auto____14750 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14750) {
          return or__3824__auto____14750
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14755 = this$;
    if(and__3822__auto____14755) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14755
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2387__auto____14756 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14757 = cljs.core._add_watch[goog.typeOf(x__2387__auto____14756)];
      if(or__3824__auto____14757) {
        return or__3824__auto____14757
      }else {
        var or__3824__auto____14758 = cljs.core._add_watch["_"];
        if(or__3824__auto____14758) {
          return or__3824__auto____14758
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14763 = this$;
    if(and__3822__auto____14763) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14763
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2387__auto____14764 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14765 = cljs.core._remove_watch[goog.typeOf(x__2387__auto____14764)];
      if(or__3824__auto____14765) {
        return or__3824__auto____14765
      }else {
        var or__3824__auto____14766 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14766) {
          return or__3824__auto____14766
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____14771 = coll;
    if(and__3822__auto____14771) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14771
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2387__auto____14772 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14773 = cljs.core._as_transient[goog.typeOf(x__2387__auto____14772)];
      if(or__3824__auto____14773) {
        return or__3824__auto____14773
      }else {
        var or__3824__auto____14774 = cljs.core._as_transient["_"];
        if(or__3824__auto____14774) {
          return or__3824__auto____14774
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____14779 = tcoll;
    if(and__3822__auto____14779) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14779
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2387__auto____14780 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14781 = cljs.core._conj_BANG_[goog.typeOf(x__2387__auto____14780)];
      if(or__3824__auto____14781) {
        return or__3824__auto____14781
      }else {
        var or__3824__auto____14782 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14782) {
          return or__3824__auto____14782
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14787 = tcoll;
    if(and__3822__auto____14787) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14787
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2387__auto____14788 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14789 = cljs.core._persistent_BANG_[goog.typeOf(x__2387__auto____14788)];
      if(or__3824__auto____14789) {
        return or__3824__auto____14789
      }else {
        var or__3824__auto____14790 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14790) {
          return or__3824__auto____14790
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____14795 = tcoll;
    if(and__3822__auto____14795) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14795
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2387__auto____14796 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14797 = cljs.core._assoc_BANG_[goog.typeOf(x__2387__auto____14796)];
      if(or__3824__auto____14797) {
        return or__3824__auto____14797
      }else {
        var or__3824__auto____14798 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14798) {
          return or__3824__auto____14798
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____14803 = tcoll;
    if(and__3822__auto____14803) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14803
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2387__auto____14804 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14805 = cljs.core._dissoc_BANG_[goog.typeOf(x__2387__auto____14804)];
      if(or__3824__auto____14805) {
        return or__3824__auto____14805
      }else {
        var or__3824__auto____14806 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14806) {
          return or__3824__auto____14806
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____14811 = tcoll;
    if(and__3822__auto____14811) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14811
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2387__auto____14812 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14813 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2387__auto____14812)];
      if(or__3824__auto____14813) {
        return or__3824__auto____14813
      }else {
        var or__3824__auto____14814 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14814) {
          return or__3824__auto____14814
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14819 = tcoll;
    if(and__3822__auto____14819) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14819
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2387__auto____14820 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14821 = cljs.core._pop_BANG_[goog.typeOf(x__2387__auto____14820)];
      if(or__3824__auto____14821) {
        return or__3824__auto____14821
      }else {
        var or__3824__auto____14822 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14822) {
          return or__3824__auto____14822
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____14827 = tcoll;
    if(and__3822__auto____14827) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14827
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2387__auto____14828 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14829 = cljs.core._disjoin_BANG_[goog.typeOf(x__2387__auto____14828)];
      if(or__3824__auto____14829) {
        return or__3824__auto____14829
      }else {
        var or__3824__auto____14830 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14830) {
          return or__3824__auto____14830
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____14835 = x;
    if(and__3822__auto____14835) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14835
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2387__auto____14836 = x == null ? null : x;
    return function() {
      var or__3824__auto____14837 = cljs.core._compare[goog.typeOf(x__2387__auto____14836)];
      if(or__3824__auto____14837) {
        return or__3824__auto____14837
      }else {
        var or__3824__auto____14838 = cljs.core._compare["_"];
        if(or__3824__auto____14838) {
          return or__3824__auto____14838
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____14843 = coll;
    if(and__3822__auto____14843) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14843
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2387__auto____14844 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14845 = cljs.core._drop_first[goog.typeOf(x__2387__auto____14844)];
      if(or__3824__auto____14845) {
        return or__3824__auto____14845
      }else {
        var or__3824__auto____14846 = cljs.core._drop_first["_"];
        if(or__3824__auto____14846) {
          return or__3824__auto____14846
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____14851 = coll;
    if(and__3822__auto____14851) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____14851
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2387__auto____14852 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14853 = cljs.core._chunked_first[goog.typeOf(x__2387__auto____14852)];
      if(or__3824__auto____14853) {
        return or__3824__auto____14853
      }else {
        var or__3824__auto____14854 = cljs.core._chunked_first["_"];
        if(or__3824__auto____14854) {
          return or__3824__auto____14854
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____14859 = coll;
    if(and__3822__auto____14859) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____14859
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2387__auto____14860 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14861 = cljs.core._chunked_rest[goog.typeOf(x__2387__auto____14860)];
      if(or__3824__auto____14861) {
        return or__3824__auto____14861
      }else {
        var or__3824__auto____14862 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____14862) {
          return or__3824__auto____14862
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____14867 = coll;
    if(and__3822__auto____14867) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____14867
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2387__auto____14868 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14869 = cljs.core._chunked_next[goog.typeOf(x__2387__auto____14868)];
      if(or__3824__auto____14869) {
        return or__3824__auto____14869
      }else {
        var or__3824__auto____14870 = cljs.core._chunked_next["_"];
        if(or__3824__auto____14870) {
          return or__3824__auto____14870
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____14872 = x === y;
    if(or__3824__auto____14872) {
      return or__3824__auto____14872
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__14873__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14874 = y;
            var G__14875 = cljs.core.first.call(null, more);
            var G__14876 = cljs.core.next.call(null, more);
            x = G__14874;
            y = G__14875;
            more = G__14876;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14873 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14873__delegate.call(this, x, y, more)
    };
    G__14873.cljs$lang$maxFixedArity = 2;
    G__14873.cljs$lang$applyTo = function(arglist__14877) {
      var x = cljs.core.first(arglist__14877);
      var y = cljs.core.first(cljs.core.next(arglist__14877));
      var more = cljs.core.rest(cljs.core.next(arglist__14877));
      return G__14873__delegate(x, y, more)
    };
    G__14873.cljs$lang$arity$variadic = G__14873__delegate;
    return G__14873
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__14878 = null;
  var G__14878__2 = function(o, k) {
    return null
  };
  var G__14878__3 = function(o, k, not_found) {
    return not_found
  };
  G__14878 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14878__2.call(this, o, k);
      case 3:
        return G__14878__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14878
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__14879 = null;
  var G__14879__2 = function(_, f) {
    return f.call(null)
  };
  var G__14879__3 = function(_, f, start) {
    return start
  };
  G__14879 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14879__2.call(this, _, f);
      case 3:
        return G__14879__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14879
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__14880 = null;
  var G__14880__2 = function(_, n) {
    return null
  };
  var G__14880__3 = function(_, n, not_found) {
    return not_found
  };
  G__14880 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14880__2.call(this, _, n);
      case 3:
        return G__14880__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14880
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____14881 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____14881) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____14881
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__14894 = cljs.core._count.call(null, cicoll);
    if(cnt__14894 === 0) {
      return f.call(null)
    }else {
      var val__14895 = cljs.core._nth.call(null, cicoll, 0);
      var n__14896 = 1;
      while(true) {
        if(n__14896 < cnt__14894) {
          var nval__14897 = f.call(null, val__14895, cljs.core._nth.call(null, cicoll, n__14896));
          if(cljs.core.reduced_QMARK_.call(null, nval__14897)) {
            return cljs.core.deref.call(null, nval__14897)
          }else {
            var G__14906 = nval__14897;
            var G__14907 = n__14896 + 1;
            val__14895 = G__14906;
            n__14896 = G__14907;
            continue
          }
        }else {
          return val__14895
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__14898 = cljs.core._count.call(null, cicoll);
    var val__14899 = val;
    var n__14900 = 0;
    while(true) {
      if(n__14900 < cnt__14898) {
        var nval__14901 = f.call(null, val__14899, cljs.core._nth.call(null, cicoll, n__14900));
        if(cljs.core.reduced_QMARK_.call(null, nval__14901)) {
          return cljs.core.deref.call(null, nval__14901)
        }else {
          var G__14908 = nval__14901;
          var G__14909 = n__14900 + 1;
          val__14899 = G__14908;
          n__14900 = G__14909;
          continue
        }
      }else {
        return val__14899
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__14902 = cljs.core._count.call(null, cicoll);
    var val__14903 = val;
    var n__14904 = idx;
    while(true) {
      if(n__14904 < cnt__14902) {
        var nval__14905 = f.call(null, val__14903, cljs.core._nth.call(null, cicoll, n__14904));
        if(cljs.core.reduced_QMARK_.call(null, nval__14905)) {
          return cljs.core.deref.call(null, nval__14905)
        }else {
          var G__14910 = nval__14905;
          var G__14911 = n__14904 + 1;
          val__14903 = G__14910;
          n__14904 = G__14911;
          continue
        }
      }else {
        return val__14903
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__14924 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__14925 = arr[0];
      var n__14926 = 1;
      while(true) {
        if(n__14926 < cnt__14924) {
          var nval__14927 = f.call(null, val__14925, arr[n__14926]);
          if(cljs.core.reduced_QMARK_.call(null, nval__14927)) {
            return cljs.core.deref.call(null, nval__14927)
          }else {
            var G__14936 = nval__14927;
            var G__14937 = n__14926 + 1;
            val__14925 = G__14936;
            n__14926 = G__14937;
            continue
          }
        }else {
          return val__14925
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__14928 = arr.length;
    var val__14929 = val;
    var n__14930 = 0;
    while(true) {
      if(n__14930 < cnt__14928) {
        var nval__14931 = f.call(null, val__14929, arr[n__14930]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14931)) {
          return cljs.core.deref.call(null, nval__14931)
        }else {
          var G__14938 = nval__14931;
          var G__14939 = n__14930 + 1;
          val__14929 = G__14938;
          n__14930 = G__14939;
          continue
        }
      }else {
        return val__14929
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__14932 = arr.length;
    var val__14933 = val;
    var n__14934 = idx;
    while(true) {
      if(n__14934 < cnt__14932) {
        var nval__14935 = f.call(null, val__14933, arr[n__14934]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14935)) {
          return cljs.core.deref.call(null, nval__14935)
        }else {
          var G__14940 = nval__14935;
          var G__14941 = n__14934 + 1;
          val__14933 = G__14940;
          n__14934 = G__14941;
          continue
        }
      }else {
        return val__14933
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14942 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__14943 = this;
  if(this__14943.i + 1 < this__14943.a.length) {
    return new cljs.core.IndexedSeq(this__14943.a, this__14943.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14944 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14945 = this;
  var c__14946 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__14946 > 0) {
    return new cljs.core.RSeq(coll, c__14946 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__14947 = this;
  var this__14948 = this;
  return cljs.core.pr_str.call(null, this__14948)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14949 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14949.a)) {
    return cljs.core.ci_reduce.call(null, this__14949.a, f, this__14949.a[this__14949.i], this__14949.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__14949.a[this__14949.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14950 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14950.a)) {
    return cljs.core.ci_reduce.call(null, this__14950.a, f, start, this__14950.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14951 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14952 = this;
  return this__14952.a.length - this__14952.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__14953 = this;
  return this__14953.a[this__14953.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__14954 = this;
  if(this__14954.i + 1 < this__14954.a.length) {
    return new cljs.core.IndexedSeq(this__14954.a, this__14954.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14955 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14956 = this;
  var i__14957 = n + this__14956.i;
  if(i__14957 < this__14956.a.length) {
    return this__14956.a[i__14957]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14958 = this;
  var i__14959 = n + this__14958.i;
  if(i__14959 < this__14958.a.length) {
    return this__14958.a[i__14959]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__14960 = null;
  var G__14960__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14960__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14960 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14960__2.call(this, array, f);
      case 3:
        return G__14960__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14960
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14961 = null;
  var G__14961__2 = function(array, k) {
    return array[k]
  };
  var G__14961__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14961 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14961__2.call(this, array, k);
      case 3:
        return G__14961__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14961
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14962 = null;
  var G__14962__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14962__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14962 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14962__2.call(this, array, n);
      case 3:
        return G__14962__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14962
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14963 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14964 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__14965 = this;
  var this__14966 = this;
  return cljs.core.pr_str.call(null, this__14966)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14967 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14968 = this;
  return this__14968.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14969 = this;
  return cljs.core._nth.call(null, this__14969.ci, this__14969.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14970 = this;
  if(this__14970.i > 0) {
    return new cljs.core.RSeq(this__14970.ci, this__14970.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14971 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__14972 = this;
  return new cljs.core.RSeq(this__14972.ci, this__14972.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14973 = this;
  return this__14973.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14977__14978 = coll;
      if(G__14977__14978) {
        if(function() {
          var or__3824__auto____14979 = G__14977__14978.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____14979) {
            return or__3824__auto____14979
          }else {
            return G__14977__14978.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__14977__14978.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14977__14978)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14977__14978)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14984__14985 = coll;
      if(G__14984__14985) {
        if(function() {
          var or__3824__auto____14986 = G__14984__14985.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14986) {
            return or__3824__auto____14986
          }else {
            return G__14984__14985.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14984__14985.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14984__14985)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14984__14985)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__14987 = cljs.core.seq.call(null, coll);
      if(s__14987 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__14987)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__14992__14993 = coll;
      if(G__14992__14993) {
        if(function() {
          var or__3824__auto____14994 = G__14992__14993.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14994) {
            return or__3824__auto____14994
          }else {
            return G__14992__14993.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14992__14993.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14992__14993)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14992__14993)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__14995 = cljs.core.seq.call(null, coll);
      if(!(s__14995 == null)) {
        return cljs.core._rest.call(null, s__14995)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14999__15000 = coll;
      if(G__14999__15000) {
        if(function() {
          var or__3824__auto____15001 = G__14999__15000.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____15001) {
            return or__3824__auto____15001
          }else {
            return G__14999__15000.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__14999__15000.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14999__15000)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14999__15000)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__15003 = cljs.core.next.call(null, s);
    if(!(sn__15003 == null)) {
      var G__15004 = sn__15003;
      s = G__15004;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__15005__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__15006 = conj.call(null, coll, x);
          var G__15007 = cljs.core.first.call(null, xs);
          var G__15008 = cljs.core.next.call(null, xs);
          coll = G__15006;
          x = G__15007;
          xs = G__15008;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__15005 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15005__delegate.call(this, coll, x, xs)
    };
    G__15005.cljs$lang$maxFixedArity = 2;
    G__15005.cljs$lang$applyTo = function(arglist__15009) {
      var coll = cljs.core.first(arglist__15009);
      var x = cljs.core.first(cljs.core.next(arglist__15009));
      var xs = cljs.core.rest(cljs.core.next(arglist__15009));
      return G__15005__delegate(coll, x, xs)
    };
    G__15005.cljs$lang$arity$variadic = G__15005__delegate;
    return G__15005
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__15012 = cljs.core.seq.call(null, coll);
  var acc__15013 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__15012)) {
      return acc__15013 + cljs.core._count.call(null, s__15012)
    }else {
      var G__15014 = cljs.core.next.call(null, s__15012);
      var G__15015 = acc__15013 + 1;
      s__15012 = G__15014;
      acc__15013 = G__15015;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__15022__15023 = coll;
        if(G__15022__15023) {
          if(function() {
            var or__3824__auto____15024 = G__15022__15023.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15024) {
              return or__3824__auto____15024
            }else {
              return G__15022__15023.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15022__15023.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15022__15023)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15022__15023)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__15025__15026 = coll;
        if(G__15025__15026) {
          if(function() {
            var or__3824__auto____15027 = G__15025__15026.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15027) {
              return or__3824__auto____15027
            }else {
              return G__15025__15026.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15025__15026.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15025__15026)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15025__15026)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__15030__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__15029 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__15031 = ret__15029;
          var G__15032 = cljs.core.first.call(null, kvs);
          var G__15033 = cljs.core.second.call(null, kvs);
          var G__15034 = cljs.core.nnext.call(null, kvs);
          coll = G__15031;
          k = G__15032;
          v = G__15033;
          kvs = G__15034;
          continue
        }else {
          return ret__15029
        }
        break
      }
    };
    var G__15030 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15030__delegate.call(this, coll, k, v, kvs)
    };
    G__15030.cljs$lang$maxFixedArity = 3;
    G__15030.cljs$lang$applyTo = function(arglist__15035) {
      var coll = cljs.core.first(arglist__15035);
      var k = cljs.core.first(cljs.core.next(arglist__15035));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15035)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15035)));
      return G__15030__delegate(coll, k, v, kvs)
    };
    G__15030.cljs$lang$arity$variadic = G__15030__delegate;
    return G__15030
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__15038__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15037 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15039 = ret__15037;
          var G__15040 = cljs.core.first.call(null, ks);
          var G__15041 = cljs.core.next.call(null, ks);
          coll = G__15039;
          k = G__15040;
          ks = G__15041;
          continue
        }else {
          return ret__15037
        }
        break
      }
    };
    var G__15038 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15038__delegate.call(this, coll, k, ks)
    };
    G__15038.cljs$lang$maxFixedArity = 2;
    G__15038.cljs$lang$applyTo = function(arglist__15042) {
      var coll = cljs.core.first(arglist__15042);
      var k = cljs.core.first(cljs.core.next(arglist__15042));
      var ks = cljs.core.rest(cljs.core.next(arglist__15042));
      return G__15038__delegate(coll, k, ks)
    };
    G__15038.cljs$lang$arity$variadic = G__15038__delegate;
    return G__15038
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__15046__15047 = o;
    if(G__15046__15047) {
      if(function() {
        var or__3824__auto____15048 = G__15046__15047.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____15048) {
          return or__3824__auto____15048
        }else {
          return G__15046__15047.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15046__15047.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15046__15047)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15046__15047)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__15051__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15050 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15052 = ret__15050;
          var G__15053 = cljs.core.first.call(null, ks);
          var G__15054 = cljs.core.next.call(null, ks);
          coll = G__15052;
          k = G__15053;
          ks = G__15054;
          continue
        }else {
          return ret__15050
        }
        break
      }
    };
    var G__15051 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15051__delegate.call(this, coll, k, ks)
    };
    G__15051.cljs$lang$maxFixedArity = 2;
    G__15051.cljs$lang$applyTo = function(arglist__15055) {
      var coll = cljs.core.first(arglist__15055);
      var k = cljs.core.first(cljs.core.next(arglist__15055));
      var ks = cljs.core.rest(cljs.core.next(arglist__15055));
      return G__15051__delegate(coll, k, ks)
    };
    G__15051.cljs$lang$arity$variadic = G__15051__delegate;
    return G__15051
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__15057 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__15057;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__15057
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__15059 = cljs.core.string_hash_cache[k];
  if(!(h__15059 == null)) {
    return h__15059
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____15061 = goog.isString(o);
      if(and__3822__auto____15061) {
        return check_cache
      }else {
        return and__3822__auto____15061
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15065__15066 = x;
    if(G__15065__15066) {
      if(function() {
        var or__3824__auto____15067 = G__15065__15066.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____15067) {
          return or__3824__auto____15067
        }else {
          return G__15065__15066.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__15065__15066.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15065__15066)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15065__15066)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15071__15072 = x;
    if(G__15071__15072) {
      if(function() {
        var or__3824__auto____15073 = G__15071__15072.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____15073) {
          return or__3824__auto____15073
        }else {
          return G__15071__15072.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__15071__15072.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15071__15072)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15071__15072)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__15077__15078 = x;
  if(G__15077__15078) {
    if(function() {
      var or__3824__auto____15079 = G__15077__15078.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____15079) {
        return or__3824__auto____15079
      }else {
        return G__15077__15078.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__15077__15078.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15077__15078)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__15077__15078)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__15083__15084 = x;
  if(G__15083__15084) {
    if(function() {
      var or__3824__auto____15085 = G__15083__15084.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____15085) {
        return or__3824__auto____15085
      }else {
        return G__15083__15084.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__15083__15084.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15083__15084)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__15083__15084)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__15089__15090 = x;
  if(G__15089__15090) {
    if(function() {
      var or__3824__auto____15091 = G__15089__15090.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____15091) {
        return or__3824__auto____15091
      }else {
        return G__15089__15090.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__15089__15090.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15089__15090)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__15089__15090)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__15095__15096 = x;
  if(G__15095__15096) {
    if(function() {
      var or__3824__auto____15097 = G__15095__15096.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____15097) {
        return or__3824__auto____15097
      }else {
        return G__15095__15096.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__15095__15096.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15095__15096)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15095__15096)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__15101__15102 = x;
  if(G__15101__15102) {
    if(function() {
      var or__3824__auto____15103 = G__15101__15102.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____15103) {
        return or__3824__auto____15103
      }else {
        return G__15101__15102.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__15101__15102.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15101__15102)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15101__15102)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15107__15108 = x;
    if(G__15107__15108) {
      if(function() {
        var or__3824__auto____15109 = G__15107__15108.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____15109) {
          return or__3824__auto____15109
        }else {
          return G__15107__15108.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__15107__15108.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__15107__15108)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__15107__15108)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__15113__15114 = x;
  if(G__15113__15114) {
    if(function() {
      var or__3824__auto____15115 = G__15113__15114.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____15115) {
        return or__3824__auto____15115
      }else {
        return G__15113__15114.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__15113__15114.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__15113__15114)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__15113__15114)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__15119__15120 = x;
  if(G__15119__15120) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____15121 = null;
      if(cljs.core.truth_(or__3824__auto____15121)) {
        return or__3824__auto____15121
      }else {
        return G__15119__15120.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__15119__15120.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__15119__15120)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__15119__15120)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__15122__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__15122 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15122__delegate.call(this, keyvals)
    };
    G__15122.cljs$lang$maxFixedArity = 0;
    G__15122.cljs$lang$applyTo = function(arglist__15123) {
      var keyvals = cljs.core.seq(arglist__15123);
      return G__15122__delegate(keyvals)
    };
    G__15122.cljs$lang$arity$variadic = G__15122__delegate;
    return G__15122
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__15125 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__15125.push(key)
  });
  return keys__15125
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__15129 = i;
  var j__15130 = j;
  var len__15131 = len;
  while(true) {
    if(len__15131 === 0) {
      return to
    }else {
      to[j__15130] = from[i__15129];
      var G__15132 = i__15129 + 1;
      var G__15133 = j__15130 + 1;
      var G__15134 = len__15131 - 1;
      i__15129 = G__15132;
      j__15130 = G__15133;
      len__15131 = G__15134;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__15138 = i + (len - 1);
  var j__15139 = j + (len - 1);
  var len__15140 = len;
  while(true) {
    if(len__15140 === 0) {
      return to
    }else {
      to[j__15139] = from[i__15138];
      var G__15141 = i__15138 - 1;
      var G__15142 = j__15139 - 1;
      var G__15143 = len__15140 - 1;
      i__15138 = G__15141;
      j__15139 = G__15142;
      len__15140 = G__15143;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__15147__15148 = s;
    if(G__15147__15148) {
      if(function() {
        var or__3824__auto____15149 = G__15147__15148.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____15149) {
          return or__3824__auto____15149
        }else {
          return G__15147__15148.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__15147__15148.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15147__15148)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15147__15148)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__15153__15154 = s;
  if(G__15153__15154) {
    if(function() {
      var or__3824__auto____15155 = G__15153__15154.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____15155) {
        return or__3824__auto____15155
      }else {
        return G__15153__15154.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__15153__15154.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__15153__15154)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__15153__15154)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____15158 = goog.isString(x);
  if(and__3822__auto____15158) {
    return!function() {
      var or__3824__auto____15159 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____15159) {
        return or__3824__auto____15159
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____15158
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____15161 = goog.isString(x);
  if(and__3822__auto____15161) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____15161
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____15163 = goog.isString(x);
  if(and__3822__auto____15163) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____15163
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____15168 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____15168) {
    return or__3824__auto____15168
  }else {
    var G__15169__15170 = f;
    if(G__15169__15170) {
      if(function() {
        var or__3824__auto____15171 = G__15169__15170.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____15171) {
          return or__3824__auto____15171
        }else {
          return G__15169__15170.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__15169__15170.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__15169__15170)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__15169__15170)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____15173 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____15173) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____15173
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____15176 = coll;
    if(cljs.core.truth_(and__3822__auto____15176)) {
      var and__3822__auto____15177 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____15177) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____15177
      }
    }else {
      return and__3822__auto____15176
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__15186__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__15182 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__15183 = more;
        while(true) {
          var x__15184 = cljs.core.first.call(null, xs__15183);
          var etc__15185 = cljs.core.next.call(null, xs__15183);
          if(cljs.core.truth_(xs__15183)) {
            if(cljs.core.contains_QMARK_.call(null, s__15182, x__15184)) {
              return false
            }else {
              var G__15187 = cljs.core.conj.call(null, s__15182, x__15184);
              var G__15188 = etc__15185;
              s__15182 = G__15187;
              xs__15183 = G__15188;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__15186 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15186__delegate.call(this, x, y, more)
    };
    G__15186.cljs$lang$maxFixedArity = 2;
    G__15186.cljs$lang$applyTo = function(arglist__15189) {
      var x = cljs.core.first(arglist__15189);
      var y = cljs.core.first(cljs.core.next(arglist__15189));
      var more = cljs.core.rest(cljs.core.next(arglist__15189));
      return G__15186__delegate(x, y, more)
    };
    G__15186.cljs$lang$arity$variadic = G__15186__delegate;
    return G__15186
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__15193__15194 = x;
            if(G__15193__15194) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____15195 = null;
                if(cljs.core.truth_(or__3824__auto____15195)) {
                  return or__3824__auto____15195
                }else {
                  return G__15193__15194.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__15193__15194.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__15193__15194)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__15193__15194)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__15200 = cljs.core.count.call(null, xs);
    var yl__15201 = cljs.core.count.call(null, ys);
    if(xl__15200 < yl__15201) {
      return-1
    }else {
      if(xl__15200 > yl__15201) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__15200, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__15202 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____15203 = d__15202 === 0;
        if(and__3822__auto____15203) {
          return n + 1 < len
        }else {
          return and__3822__auto____15203
        }
      }()) {
        var G__15204 = xs;
        var G__15205 = ys;
        var G__15206 = len;
        var G__15207 = n + 1;
        xs = G__15204;
        ys = G__15205;
        len = G__15206;
        n = G__15207;
        continue
      }else {
        return d__15202
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__15209 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__15209)) {
        return r__15209
      }else {
        if(cljs.core.truth_(r__15209)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__15211 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__15211, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__15211)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____15217 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____15217) {
      var s__15218 = temp__3971__auto____15217;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__15218), cljs.core.next.call(null, s__15218))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__15219 = val;
    var coll__15220 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__15220) {
        var nval__15221 = f.call(null, val__15219, cljs.core.first.call(null, coll__15220));
        if(cljs.core.reduced_QMARK_.call(null, nval__15221)) {
          return cljs.core.deref.call(null, nval__15221)
        }else {
          var G__15222 = nval__15221;
          var G__15223 = cljs.core.next.call(null, coll__15220);
          val__15219 = G__15222;
          coll__15220 = G__15223;
          continue
        }
      }else {
        return val__15219
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__15225 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__15225);
  return cljs.core.vec.call(null, a__15225)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__15232__15233 = coll;
      if(G__15232__15233) {
        if(function() {
          var or__3824__auto____15234 = G__15232__15233.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____15234) {
            return or__3824__auto____15234
          }else {
            return G__15232__15233.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__15232__15233.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15232__15233)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15232__15233)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__15235__15236 = coll;
      if(G__15235__15236) {
        if(function() {
          var or__3824__auto____15237 = G__15235__15236.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____15237) {
            return or__3824__auto____15237
          }else {
            return G__15235__15236.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__15235__15236.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15235__15236)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__15235__15236)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__15238 = this;
  return this__15238.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__15239__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__15239 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15239__delegate.call(this, x, y, more)
    };
    G__15239.cljs$lang$maxFixedArity = 2;
    G__15239.cljs$lang$applyTo = function(arglist__15240) {
      var x = cljs.core.first(arglist__15240);
      var y = cljs.core.first(cljs.core.next(arglist__15240));
      var more = cljs.core.rest(cljs.core.next(arglist__15240));
      return G__15239__delegate(x, y, more)
    };
    G__15239.cljs$lang$arity$variadic = G__15239__delegate;
    return G__15239
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__15241__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__15241 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15241__delegate.call(this, x, y, more)
    };
    G__15241.cljs$lang$maxFixedArity = 2;
    G__15241.cljs$lang$applyTo = function(arglist__15242) {
      var x = cljs.core.first(arglist__15242);
      var y = cljs.core.first(cljs.core.next(arglist__15242));
      var more = cljs.core.rest(cljs.core.next(arglist__15242));
      return G__15241__delegate(x, y, more)
    };
    G__15241.cljs$lang$arity$variadic = G__15241__delegate;
    return G__15241
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__15243__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__15243 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15243__delegate.call(this, x, y, more)
    };
    G__15243.cljs$lang$maxFixedArity = 2;
    G__15243.cljs$lang$applyTo = function(arglist__15244) {
      var x = cljs.core.first(arglist__15244);
      var y = cljs.core.first(cljs.core.next(arglist__15244));
      var more = cljs.core.rest(cljs.core.next(arglist__15244));
      return G__15243__delegate(x, y, more)
    };
    G__15243.cljs$lang$arity$variadic = G__15243__delegate;
    return G__15243
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__15245__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__15245 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15245__delegate.call(this, x, y, more)
    };
    G__15245.cljs$lang$maxFixedArity = 2;
    G__15245.cljs$lang$applyTo = function(arglist__15246) {
      var x = cljs.core.first(arglist__15246);
      var y = cljs.core.first(cljs.core.next(arglist__15246));
      var more = cljs.core.rest(cljs.core.next(arglist__15246));
      return G__15245__delegate(x, y, more)
    };
    G__15245.cljs$lang$arity$variadic = G__15245__delegate;
    return G__15245
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__15247__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__15248 = y;
            var G__15249 = cljs.core.first.call(null, more);
            var G__15250 = cljs.core.next.call(null, more);
            x = G__15248;
            y = G__15249;
            more = G__15250;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15247 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15247__delegate.call(this, x, y, more)
    };
    G__15247.cljs$lang$maxFixedArity = 2;
    G__15247.cljs$lang$applyTo = function(arglist__15251) {
      var x = cljs.core.first(arglist__15251);
      var y = cljs.core.first(cljs.core.next(arglist__15251));
      var more = cljs.core.rest(cljs.core.next(arglist__15251));
      return G__15247__delegate(x, y, more)
    };
    G__15247.cljs$lang$arity$variadic = G__15247__delegate;
    return G__15247
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__15252__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__15253 = y;
            var G__15254 = cljs.core.first.call(null, more);
            var G__15255 = cljs.core.next.call(null, more);
            x = G__15253;
            y = G__15254;
            more = G__15255;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15252 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15252__delegate.call(this, x, y, more)
    };
    G__15252.cljs$lang$maxFixedArity = 2;
    G__15252.cljs$lang$applyTo = function(arglist__15256) {
      var x = cljs.core.first(arglist__15256);
      var y = cljs.core.first(cljs.core.next(arglist__15256));
      var more = cljs.core.rest(cljs.core.next(arglist__15256));
      return G__15252__delegate(x, y, more)
    };
    G__15252.cljs$lang$arity$variadic = G__15252__delegate;
    return G__15252
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__15257__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__15258 = y;
            var G__15259 = cljs.core.first.call(null, more);
            var G__15260 = cljs.core.next.call(null, more);
            x = G__15258;
            y = G__15259;
            more = G__15260;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15257 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15257__delegate.call(this, x, y, more)
    };
    G__15257.cljs$lang$maxFixedArity = 2;
    G__15257.cljs$lang$applyTo = function(arglist__15261) {
      var x = cljs.core.first(arglist__15261);
      var y = cljs.core.first(cljs.core.next(arglist__15261));
      var more = cljs.core.rest(cljs.core.next(arglist__15261));
      return G__15257__delegate(x, y, more)
    };
    G__15257.cljs$lang$arity$variadic = G__15257__delegate;
    return G__15257
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__15262__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__15263 = y;
            var G__15264 = cljs.core.first.call(null, more);
            var G__15265 = cljs.core.next.call(null, more);
            x = G__15263;
            y = G__15264;
            more = G__15265;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15262 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15262__delegate.call(this, x, y, more)
    };
    G__15262.cljs$lang$maxFixedArity = 2;
    G__15262.cljs$lang$applyTo = function(arglist__15266) {
      var x = cljs.core.first(arglist__15266);
      var y = cljs.core.first(cljs.core.next(arglist__15266));
      var more = cljs.core.rest(cljs.core.next(arglist__15266));
      return G__15262__delegate(x, y, more)
    };
    G__15262.cljs$lang$arity$variadic = G__15262__delegate;
    return G__15262
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__15267__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__15267 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15267__delegate.call(this, x, y, more)
    };
    G__15267.cljs$lang$maxFixedArity = 2;
    G__15267.cljs$lang$applyTo = function(arglist__15268) {
      var x = cljs.core.first(arglist__15268);
      var y = cljs.core.first(cljs.core.next(arglist__15268));
      var more = cljs.core.rest(cljs.core.next(arglist__15268));
      return G__15267__delegate(x, y, more)
    };
    G__15267.cljs$lang$arity$variadic = G__15267__delegate;
    return G__15267
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__15269__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__15269 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15269__delegate.call(this, x, y, more)
    };
    G__15269.cljs$lang$maxFixedArity = 2;
    G__15269.cljs$lang$applyTo = function(arglist__15270) {
      var x = cljs.core.first(arglist__15270);
      var y = cljs.core.first(cljs.core.next(arglist__15270));
      var more = cljs.core.rest(cljs.core.next(arglist__15270));
      return G__15269__delegate(x, y, more)
    };
    G__15269.cljs$lang$arity$variadic = G__15269__delegate;
    return G__15269
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__15272 = n % d;
  return cljs.core.fix.call(null, (n - rem__15272) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__15274 = cljs.core.quot.call(null, n, d);
  return n - d * q__15274
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__15277 = v - (v >> 1 & 1431655765);
  var v__15278 = (v__15277 & 858993459) + (v__15277 >> 2 & 858993459);
  return(v__15278 + (v__15278 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__15279__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15280 = y;
            var G__15281 = cljs.core.first.call(null, more);
            var G__15282 = cljs.core.next.call(null, more);
            x = G__15280;
            y = G__15281;
            more = G__15282;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__15279 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15279__delegate.call(this, x, y, more)
    };
    G__15279.cljs$lang$maxFixedArity = 2;
    G__15279.cljs$lang$applyTo = function(arglist__15283) {
      var x = cljs.core.first(arglist__15283);
      var y = cljs.core.first(cljs.core.next(arglist__15283));
      var more = cljs.core.rest(cljs.core.next(arglist__15283));
      return G__15279__delegate(x, y, more)
    };
    G__15279.cljs$lang$arity$variadic = G__15279__delegate;
    return G__15279
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__15287 = n;
  var xs__15288 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15289 = xs__15288;
      if(and__3822__auto____15289) {
        return n__15287 > 0
      }else {
        return and__3822__auto____15289
      }
    }())) {
      var G__15290 = n__15287 - 1;
      var G__15291 = cljs.core.next.call(null, xs__15288);
      n__15287 = G__15290;
      xs__15288 = G__15291;
      continue
    }else {
      return xs__15288
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__15292__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__15293 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__15294 = cljs.core.next.call(null, more);
            sb = G__15293;
            more = G__15294;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__15292 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15292__delegate.call(this, x, ys)
    };
    G__15292.cljs$lang$maxFixedArity = 1;
    G__15292.cljs$lang$applyTo = function(arglist__15295) {
      var x = cljs.core.first(arglist__15295);
      var ys = cljs.core.rest(arglist__15295);
      return G__15292__delegate(x, ys)
    };
    G__15292.cljs$lang$arity$variadic = G__15292__delegate;
    return G__15292
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__15296__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__15297 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__15298 = cljs.core.next.call(null, more);
            sb = G__15297;
            more = G__15298;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__15296 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15296__delegate.call(this, x, ys)
    };
    G__15296.cljs$lang$maxFixedArity = 1;
    G__15296.cljs$lang$applyTo = function(arglist__15299) {
      var x = cljs.core.first(arglist__15299);
      var ys = cljs.core.rest(arglist__15299);
      return G__15296__delegate(x, ys)
    };
    G__15296.cljs$lang$arity$variadic = G__15296__delegate;
    return G__15296
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__15300) {
    var fmt = cljs.core.first(arglist__15300);
    var args = cljs.core.rest(arglist__15300);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__15303 = cljs.core.seq.call(null, x);
    var ys__15304 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__15303 == null) {
        return ys__15304 == null
      }else {
        if(ys__15304 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__15303), cljs.core.first.call(null, ys__15304))) {
            var G__15305 = cljs.core.next.call(null, xs__15303);
            var G__15306 = cljs.core.next.call(null, ys__15304);
            xs__15303 = G__15305;
            ys__15304 = G__15306;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__15307_SHARP_, p2__15308_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__15307_SHARP_, cljs.core.hash.call(null, p2__15308_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__15312 = 0;
  var s__15313 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__15313) {
      var e__15314 = cljs.core.first.call(null, s__15313);
      var G__15315 = (h__15312 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__15314)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__15314)))) % 4503599627370496;
      var G__15316 = cljs.core.next.call(null, s__15313);
      h__15312 = G__15315;
      s__15313 = G__15316;
      continue
    }else {
      return h__15312
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__15320 = 0;
  var s__15321 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__15321) {
      var e__15322 = cljs.core.first.call(null, s__15321);
      var G__15323 = (h__15320 + cljs.core.hash.call(null, e__15322)) % 4503599627370496;
      var G__15324 = cljs.core.next.call(null, s__15321);
      h__15320 = G__15323;
      s__15321 = G__15324;
      continue
    }else {
      return h__15320
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__15345__15346 = cljs.core.seq.call(null, fn_map);
  if(G__15345__15346) {
    var G__15348__15350 = cljs.core.first.call(null, G__15345__15346);
    var vec__15349__15351 = G__15348__15350;
    var key_name__15352 = cljs.core.nth.call(null, vec__15349__15351, 0, null);
    var f__15353 = cljs.core.nth.call(null, vec__15349__15351, 1, null);
    var G__15345__15354 = G__15345__15346;
    var G__15348__15355 = G__15348__15350;
    var G__15345__15356 = G__15345__15354;
    while(true) {
      var vec__15357__15358 = G__15348__15355;
      var key_name__15359 = cljs.core.nth.call(null, vec__15357__15358, 0, null);
      var f__15360 = cljs.core.nth.call(null, vec__15357__15358, 1, null);
      var G__15345__15361 = G__15345__15356;
      var str_name__15362 = cljs.core.name.call(null, key_name__15359);
      obj[str_name__15362] = f__15360;
      var temp__3974__auto____15363 = cljs.core.next.call(null, G__15345__15361);
      if(temp__3974__auto____15363) {
        var G__15345__15364 = temp__3974__auto____15363;
        var G__15365 = cljs.core.first.call(null, G__15345__15364);
        var G__15366 = G__15345__15364;
        G__15348__15355 = G__15365;
        G__15345__15356 = G__15366;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15367 = this;
  var h__2216__auto____15368 = this__15367.__hash;
  if(!(h__2216__auto____15368 == null)) {
    return h__2216__auto____15368
  }else {
    var h__2216__auto____15369 = cljs.core.hash_coll.call(null, coll);
    this__15367.__hash = h__2216__auto____15369;
    return h__2216__auto____15369
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15370 = this;
  if(this__15370.count === 1) {
    return null
  }else {
    return this__15370.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15371 = this;
  return new cljs.core.List(this__15371.meta, o, coll, this__15371.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__15372 = this;
  var this__15373 = this;
  return cljs.core.pr_str.call(null, this__15373)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15374 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15375 = this;
  return this__15375.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15376 = this;
  return this__15376.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15377 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15378 = this;
  return this__15378.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15379 = this;
  if(this__15379.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__15379.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15380 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15381 = this;
  return new cljs.core.List(meta, this__15381.first, this__15381.rest, this__15381.count, this__15381.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15382 = this;
  return this__15382.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15383 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15384 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15385 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15386 = this;
  return new cljs.core.List(this__15386.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__15387 = this;
  var this__15388 = this;
  return cljs.core.pr_str.call(null, this__15388)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15389 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15390 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15391 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15392 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15393 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15394 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15395 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15396 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15397 = this;
  return this__15397.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15398 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__15402__15403 = coll;
  if(G__15402__15403) {
    if(function() {
      var or__3824__auto____15404 = G__15402__15403.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____15404) {
        return or__3824__auto____15404
      }else {
        return G__15402__15403.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__15402__15403.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__15402__15403)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__15402__15403)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__15405__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__15405 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15405__delegate.call(this, x, y, z, items)
    };
    G__15405.cljs$lang$maxFixedArity = 3;
    G__15405.cljs$lang$applyTo = function(arglist__15406) {
      var x = cljs.core.first(arglist__15406);
      var y = cljs.core.first(cljs.core.next(arglist__15406));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15406)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15406)));
      return G__15405__delegate(x, y, z, items)
    };
    G__15405.cljs$lang$arity$variadic = G__15405__delegate;
    return G__15405
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15407 = this;
  var h__2216__auto____15408 = this__15407.__hash;
  if(!(h__2216__auto____15408 == null)) {
    return h__2216__auto____15408
  }else {
    var h__2216__auto____15409 = cljs.core.hash_coll.call(null, coll);
    this__15407.__hash = h__2216__auto____15409;
    return h__2216__auto____15409
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15410 = this;
  if(this__15410.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__15410.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15411 = this;
  return new cljs.core.Cons(null, o, coll, this__15411.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__15412 = this;
  var this__15413 = this;
  return cljs.core.pr_str.call(null, this__15413)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15414 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15415 = this;
  return this__15415.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15416 = this;
  if(this__15416.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__15416.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15417 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15418 = this;
  return new cljs.core.Cons(meta, this__15418.first, this__15418.rest, this__15418.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15419 = this;
  return this__15419.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15420 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15420.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____15425 = coll == null;
    if(or__3824__auto____15425) {
      return or__3824__auto____15425
    }else {
      var G__15426__15427 = coll;
      if(G__15426__15427) {
        if(function() {
          var or__3824__auto____15428 = G__15426__15427.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15428) {
            return or__3824__auto____15428
          }else {
            return G__15426__15427.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15426__15427.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15426__15427)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15426__15427)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__15432__15433 = x;
  if(G__15432__15433) {
    if(function() {
      var or__3824__auto____15434 = G__15432__15433.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____15434) {
        return or__3824__auto____15434
      }else {
        return G__15432__15433.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__15432__15433.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__15432__15433)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__15432__15433)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__15435 = null;
  var G__15435__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__15435__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__15435 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15435__2.call(this, string, f);
      case 3:
        return G__15435__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15435
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__15436 = null;
  var G__15436__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__15436__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__15436 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15436__2.call(this, string, k);
      case 3:
        return G__15436__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15436
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__15437 = null;
  var G__15437__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__15437__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__15437 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15437__2.call(this, string, n);
      case 3:
        return G__15437__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15437
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__15449 = null;
  var G__15449__2 = function(this_sym15440, coll) {
    var this__15442 = this;
    var this_sym15440__15443 = this;
    var ___15444 = this_sym15440__15443;
    if(coll == null) {
      return null
    }else {
      var strobj__15445 = coll.strobj;
      if(strobj__15445 == null) {
        return cljs.core._lookup.call(null, coll, this__15442.k, null)
      }else {
        return strobj__15445[this__15442.k]
      }
    }
  };
  var G__15449__3 = function(this_sym15441, coll, not_found) {
    var this__15442 = this;
    var this_sym15441__15446 = this;
    var ___15447 = this_sym15441__15446;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__15442.k, not_found)
    }
  };
  G__15449 = function(this_sym15441, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15449__2.call(this, this_sym15441, coll);
      case 3:
        return G__15449__3.call(this, this_sym15441, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15449
}();
cljs.core.Keyword.prototype.apply = function(this_sym15438, args15439) {
  var this__15448 = this;
  return this_sym15438.call.apply(this_sym15438, [this_sym15438].concat(args15439.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__15458 = null;
  var G__15458__2 = function(this_sym15452, coll) {
    var this_sym15452__15454 = this;
    var this__15455 = this_sym15452__15454;
    return cljs.core._lookup.call(null, coll, this__15455.toString(), null)
  };
  var G__15458__3 = function(this_sym15453, coll, not_found) {
    var this_sym15453__15456 = this;
    var this__15457 = this_sym15453__15456;
    return cljs.core._lookup.call(null, coll, this__15457.toString(), not_found)
  };
  G__15458 = function(this_sym15453, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15458__2.call(this, this_sym15453, coll);
      case 3:
        return G__15458__3.call(this, this_sym15453, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15458
}();
String.prototype.apply = function(this_sym15450, args15451) {
  return this_sym15450.call.apply(this_sym15450, [this_sym15450].concat(args15451.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__15460 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__15460
  }else {
    lazy_seq.x = x__15460.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15461 = this;
  var h__2216__auto____15462 = this__15461.__hash;
  if(!(h__2216__auto____15462 == null)) {
    return h__2216__auto____15462
  }else {
    var h__2216__auto____15463 = cljs.core.hash_coll.call(null, coll);
    this__15461.__hash = h__2216__auto____15463;
    return h__2216__auto____15463
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15464 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15465 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__15466 = this;
  var this__15467 = this;
  return cljs.core.pr_str.call(null, this__15467)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15468 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15469 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15470 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15471 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15472 = this;
  return new cljs.core.LazySeq(meta, this__15472.realized, this__15472.x, this__15472.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15473 = this;
  return this__15473.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15474 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15474.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15475 = this;
  return this__15475.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__15476 = this;
  var ___15477 = this;
  this__15476.buf[this__15476.end] = o;
  return this__15476.end = this__15476.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__15478 = this;
  var ___15479 = this;
  var ret__15480 = new cljs.core.ArrayChunk(this__15478.buf, 0, this__15478.end);
  this__15478.buf = null;
  return ret__15480
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15481 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__15481.arr[this__15481.off], this__15481.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15482 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__15482.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__15483 = this;
  if(this__15483.off === this__15483.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__15483.arr, this__15483.off + 1, this__15483.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__15484 = this;
  return this__15484.arr[this__15484.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__15485 = this;
  if(function() {
    var and__3822__auto____15486 = i >= 0;
    if(and__3822__auto____15486) {
      return i < this__15485.end - this__15485.off
    }else {
      return and__3822__auto____15486
    }
  }()) {
    return this__15485.arr[this__15485.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15487 = this;
  return this__15487.end - this__15487.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__15488 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15489 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15490 = this;
  return cljs.core._nth.call(null, this__15490.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15491 = this;
  if(cljs.core._count.call(null, this__15491.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__15491.chunk), this__15491.more, this__15491.meta)
  }else {
    if(this__15491.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__15491.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15492 = this;
  if(this__15492.more == null) {
    return null
  }else {
    return this__15492.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15493 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15494 = this;
  return new cljs.core.ChunkedCons(this__15494.chunk, this__15494.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15495 = this;
  return this__15495.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15496 = this;
  return this__15496.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15497 = this;
  if(this__15497.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__15497.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__15501__15502 = s;
    if(G__15501__15502) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____15503 = null;
        if(cljs.core.truth_(or__3824__auto____15503)) {
          return or__3824__auto____15503
        }else {
          return G__15501__15502.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__15501__15502.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__15501__15502)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__15501__15502)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__15506 = [];
  var s__15507 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__15507)) {
      ary__15506.push(cljs.core.first.call(null, s__15507));
      var G__15508 = cljs.core.next.call(null, s__15507);
      s__15507 = G__15508;
      continue
    }else {
      return ary__15506
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__15512 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__15513 = 0;
  var xs__15514 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__15514) {
      ret__15512[i__15513] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__15514));
      var G__15515 = i__15513 + 1;
      var G__15516 = cljs.core.next.call(null, xs__15514);
      i__15513 = G__15515;
      xs__15514 = G__15516;
      continue
    }else {
    }
    break
  }
  return ret__15512
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__15524 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15525 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15526 = 0;
      var s__15527 = s__15525;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15528 = s__15527;
          if(and__3822__auto____15528) {
            return i__15526 < size
          }else {
            return and__3822__auto____15528
          }
        }())) {
          a__15524[i__15526] = cljs.core.first.call(null, s__15527);
          var G__15531 = i__15526 + 1;
          var G__15532 = cljs.core.next.call(null, s__15527);
          i__15526 = G__15531;
          s__15527 = G__15532;
          continue
        }else {
          return a__15524
        }
        break
      }
    }else {
      var n__2551__auto____15529 = size;
      var i__15530 = 0;
      while(true) {
        if(i__15530 < n__2551__auto____15529) {
          a__15524[i__15530] = init_val_or_seq;
          var G__15533 = i__15530 + 1;
          i__15530 = G__15533;
          continue
        }else {
        }
        break
      }
      return a__15524
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__15541 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15542 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15543 = 0;
      var s__15544 = s__15542;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15545 = s__15544;
          if(and__3822__auto____15545) {
            return i__15543 < size
          }else {
            return and__3822__auto____15545
          }
        }())) {
          a__15541[i__15543] = cljs.core.first.call(null, s__15544);
          var G__15548 = i__15543 + 1;
          var G__15549 = cljs.core.next.call(null, s__15544);
          i__15543 = G__15548;
          s__15544 = G__15549;
          continue
        }else {
          return a__15541
        }
        break
      }
    }else {
      var n__2551__auto____15546 = size;
      var i__15547 = 0;
      while(true) {
        if(i__15547 < n__2551__auto____15546) {
          a__15541[i__15547] = init_val_or_seq;
          var G__15550 = i__15547 + 1;
          i__15547 = G__15550;
          continue
        }else {
        }
        break
      }
      return a__15541
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__15558 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__15559 = cljs.core.seq.call(null, init_val_or_seq);
      var i__15560 = 0;
      var s__15561 = s__15559;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____15562 = s__15561;
          if(and__3822__auto____15562) {
            return i__15560 < size
          }else {
            return and__3822__auto____15562
          }
        }())) {
          a__15558[i__15560] = cljs.core.first.call(null, s__15561);
          var G__15565 = i__15560 + 1;
          var G__15566 = cljs.core.next.call(null, s__15561);
          i__15560 = G__15565;
          s__15561 = G__15566;
          continue
        }else {
          return a__15558
        }
        break
      }
    }else {
      var n__2551__auto____15563 = size;
      var i__15564 = 0;
      while(true) {
        if(i__15564 < n__2551__auto____15563) {
          a__15558[i__15564] = init_val_or_seq;
          var G__15567 = i__15564 + 1;
          i__15564 = G__15567;
          continue
        }else {
        }
        break
      }
      return a__15558
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__15572 = s;
    var i__15573 = n;
    var sum__15574 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15575 = i__15573 > 0;
        if(and__3822__auto____15575) {
          return cljs.core.seq.call(null, s__15572)
        }else {
          return and__3822__auto____15575
        }
      }())) {
        var G__15576 = cljs.core.next.call(null, s__15572);
        var G__15577 = i__15573 - 1;
        var G__15578 = sum__15574 + 1;
        s__15572 = G__15576;
        i__15573 = G__15577;
        sum__15574 = G__15578;
        continue
      }else {
        return sum__15574
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__15583 = cljs.core.seq.call(null, x);
      if(s__15583) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15583)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__15583), concat.call(null, cljs.core.chunk_rest.call(null, s__15583), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__15583), concat.call(null, cljs.core.rest.call(null, s__15583), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__15587__delegate = function(x, y, zs) {
      var cat__15586 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__15585 = cljs.core.seq.call(null, xys);
          if(xys__15585) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__15585)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__15585), cat.call(null, cljs.core.chunk_rest.call(null, xys__15585), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__15585), cat.call(null, cljs.core.rest.call(null, xys__15585), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__15586.call(null, concat.call(null, x, y), zs)
    };
    var G__15587 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15587__delegate.call(this, x, y, zs)
    };
    G__15587.cljs$lang$maxFixedArity = 2;
    G__15587.cljs$lang$applyTo = function(arglist__15588) {
      var x = cljs.core.first(arglist__15588);
      var y = cljs.core.first(cljs.core.next(arglist__15588));
      var zs = cljs.core.rest(cljs.core.next(arglist__15588));
      return G__15587__delegate(x, y, zs)
    };
    G__15587.cljs$lang$arity$variadic = G__15587__delegate;
    return G__15587
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__15589__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__15589 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15589__delegate.call(this, a, b, c, d, more)
    };
    G__15589.cljs$lang$maxFixedArity = 4;
    G__15589.cljs$lang$applyTo = function(arglist__15590) {
      var a = cljs.core.first(arglist__15590);
      var b = cljs.core.first(cljs.core.next(arglist__15590));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15590)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15590))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15590))));
      return G__15589__delegate(a, b, c, d, more)
    };
    G__15589.cljs$lang$arity$variadic = G__15589__delegate;
    return G__15589
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__15632 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__15633 = cljs.core._first.call(null, args__15632);
    var args__15634 = cljs.core._rest.call(null, args__15632);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__15633)
      }else {
        return f.call(null, a__15633)
      }
    }else {
      var b__15635 = cljs.core._first.call(null, args__15634);
      var args__15636 = cljs.core._rest.call(null, args__15634);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__15633, b__15635)
        }else {
          return f.call(null, a__15633, b__15635)
        }
      }else {
        var c__15637 = cljs.core._first.call(null, args__15636);
        var args__15638 = cljs.core._rest.call(null, args__15636);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__15633, b__15635, c__15637)
          }else {
            return f.call(null, a__15633, b__15635, c__15637)
          }
        }else {
          var d__15639 = cljs.core._first.call(null, args__15638);
          var args__15640 = cljs.core._rest.call(null, args__15638);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__15633, b__15635, c__15637, d__15639)
            }else {
              return f.call(null, a__15633, b__15635, c__15637, d__15639)
            }
          }else {
            var e__15641 = cljs.core._first.call(null, args__15640);
            var args__15642 = cljs.core._rest.call(null, args__15640);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__15633, b__15635, c__15637, d__15639, e__15641)
              }else {
                return f.call(null, a__15633, b__15635, c__15637, d__15639, e__15641)
              }
            }else {
              var f__15643 = cljs.core._first.call(null, args__15642);
              var args__15644 = cljs.core._rest.call(null, args__15642);
              if(argc === 6) {
                if(f__15643.cljs$lang$arity$6) {
                  return f__15643.cljs$lang$arity$6(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643)
                }else {
                  return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643)
                }
              }else {
                var g__15645 = cljs.core._first.call(null, args__15644);
                var args__15646 = cljs.core._rest.call(null, args__15644);
                if(argc === 7) {
                  if(f__15643.cljs$lang$arity$7) {
                    return f__15643.cljs$lang$arity$7(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645)
                  }else {
                    return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645)
                  }
                }else {
                  var h__15647 = cljs.core._first.call(null, args__15646);
                  var args__15648 = cljs.core._rest.call(null, args__15646);
                  if(argc === 8) {
                    if(f__15643.cljs$lang$arity$8) {
                      return f__15643.cljs$lang$arity$8(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647)
                    }else {
                      return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647)
                    }
                  }else {
                    var i__15649 = cljs.core._first.call(null, args__15648);
                    var args__15650 = cljs.core._rest.call(null, args__15648);
                    if(argc === 9) {
                      if(f__15643.cljs$lang$arity$9) {
                        return f__15643.cljs$lang$arity$9(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649)
                      }else {
                        return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649)
                      }
                    }else {
                      var j__15651 = cljs.core._first.call(null, args__15650);
                      var args__15652 = cljs.core._rest.call(null, args__15650);
                      if(argc === 10) {
                        if(f__15643.cljs$lang$arity$10) {
                          return f__15643.cljs$lang$arity$10(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651)
                        }else {
                          return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651)
                        }
                      }else {
                        var k__15653 = cljs.core._first.call(null, args__15652);
                        var args__15654 = cljs.core._rest.call(null, args__15652);
                        if(argc === 11) {
                          if(f__15643.cljs$lang$arity$11) {
                            return f__15643.cljs$lang$arity$11(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653)
                          }else {
                            return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653)
                          }
                        }else {
                          var l__15655 = cljs.core._first.call(null, args__15654);
                          var args__15656 = cljs.core._rest.call(null, args__15654);
                          if(argc === 12) {
                            if(f__15643.cljs$lang$arity$12) {
                              return f__15643.cljs$lang$arity$12(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655)
                            }else {
                              return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655)
                            }
                          }else {
                            var m__15657 = cljs.core._first.call(null, args__15656);
                            var args__15658 = cljs.core._rest.call(null, args__15656);
                            if(argc === 13) {
                              if(f__15643.cljs$lang$arity$13) {
                                return f__15643.cljs$lang$arity$13(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657)
                              }else {
                                return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657)
                              }
                            }else {
                              var n__15659 = cljs.core._first.call(null, args__15658);
                              var args__15660 = cljs.core._rest.call(null, args__15658);
                              if(argc === 14) {
                                if(f__15643.cljs$lang$arity$14) {
                                  return f__15643.cljs$lang$arity$14(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659)
                                }else {
                                  return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659)
                                }
                              }else {
                                var o__15661 = cljs.core._first.call(null, args__15660);
                                var args__15662 = cljs.core._rest.call(null, args__15660);
                                if(argc === 15) {
                                  if(f__15643.cljs$lang$arity$15) {
                                    return f__15643.cljs$lang$arity$15(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661)
                                  }else {
                                    return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661)
                                  }
                                }else {
                                  var p__15663 = cljs.core._first.call(null, args__15662);
                                  var args__15664 = cljs.core._rest.call(null, args__15662);
                                  if(argc === 16) {
                                    if(f__15643.cljs$lang$arity$16) {
                                      return f__15643.cljs$lang$arity$16(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663)
                                    }else {
                                      return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663)
                                    }
                                  }else {
                                    var q__15665 = cljs.core._first.call(null, args__15664);
                                    var args__15666 = cljs.core._rest.call(null, args__15664);
                                    if(argc === 17) {
                                      if(f__15643.cljs$lang$arity$17) {
                                        return f__15643.cljs$lang$arity$17(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665)
                                      }else {
                                        return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665)
                                      }
                                    }else {
                                      var r__15667 = cljs.core._first.call(null, args__15666);
                                      var args__15668 = cljs.core._rest.call(null, args__15666);
                                      if(argc === 18) {
                                        if(f__15643.cljs$lang$arity$18) {
                                          return f__15643.cljs$lang$arity$18(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667)
                                        }else {
                                          return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667)
                                        }
                                      }else {
                                        var s__15669 = cljs.core._first.call(null, args__15668);
                                        var args__15670 = cljs.core._rest.call(null, args__15668);
                                        if(argc === 19) {
                                          if(f__15643.cljs$lang$arity$19) {
                                            return f__15643.cljs$lang$arity$19(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667, s__15669)
                                          }else {
                                            return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667, s__15669)
                                          }
                                        }else {
                                          var t__15671 = cljs.core._first.call(null, args__15670);
                                          var args__15672 = cljs.core._rest.call(null, args__15670);
                                          if(argc === 20) {
                                            if(f__15643.cljs$lang$arity$20) {
                                              return f__15643.cljs$lang$arity$20(a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667, s__15669, t__15671)
                                            }else {
                                              return f__15643.call(null, a__15633, b__15635, c__15637, d__15639, e__15641, f__15643, g__15645, h__15647, i__15649, j__15651, k__15653, l__15655, m__15657, n__15659, o__15661, p__15663, q__15665, r__15667, s__15669, t__15671)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__15687 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15688 = cljs.core.bounded_count.call(null, args, fixed_arity__15687 + 1);
      if(bc__15688 <= fixed_arity__15687) {
        return cljs.core.apply_to.call(null, f, bc__15688, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__15689 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__15690 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15691 = cljs.core.bounded_count.call(null, arglist__15689, fixed_arity__15690 + 1);
      if(bc__15691 <= fixed_arity__15690) {
        return cljs.core.apply_to.call(null, f, bc__15691, arglist__15689)
      }else {
        return f.cljs$lang$applyTo(arglist__15689)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15689))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__15692 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__15693 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15694 = cljs.core.bounded_count.call(null, arglist__15692, fixed_arity__15693 + 1);
      if(bc__15694 <= fixed_arity__15693) {
        return cljs.core.apply_to.call(null, f, bc__15694, arglist__15692)
      }else {
        return f.cljs$lang$applyTo(arglist__15692)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15692))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__15695 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__15696 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15697 = cljs.core.bounded_count.call(null, arglist__15695, fixed_arity__15696 + 1);
      if(bc__15697 <= fixed_arity__15696) {
        return cljs.core.apply_to.call(null, f, bc__15697, arglist__15695)
      }else {
        return f.cljs$lang$applyTo(arglist__15695)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15695))
    }
  };
  var apply__6 = function() {
    var G__15701__delegate = function(f, a, b, c, d, args) {
      var arglist__15698 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__15699 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__15700 = cljs.core.bounded_count.call(null, arglist__15698, fixed_arity__15699 + 1);
        if(bc__15700 <= fixed_arity__15699) {
          return cljs.core.apply_to.call(null, f, bc__15700, arglist__15698)
        }else {
          return f.cljs$lang$applyTo(arglist__15698)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__15698))
      }
    };
    var G__15701 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15701__delegate.call(this, f, a, b, c, d, args)
    };
    G__15701.cljs$lang$maxFixedArity = 5;
    G__15701.cljs$lang$applyTo = function(arglist__15702) {
      var f = cljs.core.first(arglist__15702);
      var a = cljs.core.first(cljs.core.next(arglist__15702));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15702)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15702))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15702)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15702)))));
      return G__15701__delegate(f, a, b, c, d, args)
    };
    G__15701.cljs$lang$arity$variadic = G__15701__delegate;
    return G__15701
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__15703) {
    var obj = cljs.core.first(arglist__15703);
    var f = cljs.core.first(cljs.core.next(arglist__15703));
    var args = cljs.core.rest(cljs.core.next(arglist__15703));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__15704__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__15704 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15704__delegate.call(this, x, y, more)
    };
    G__15704.cljs$lang$maxFixedArity = 2;
    G__15704.cljs$lang$applyTo = function(arglist__15705) {
      var x = cljs.core.first(arglist__15705);
      var y = cljs.core.first(cljs.core.next(arglist__15705));
      var more = cljs.core.rest(cljs.core.next(arglist__15705));
      return G__15704__delegate(x, y, more)
    };
    G__15704.cljs$lang$arity$variadic = G__15704__delegate;
    return G__15704
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__15706 = pred;
        var G__15707 = cljs.core.next.call(null, coll);
        pred = G__15706;
        coll = G__15707;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____15709 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____15709)) {
        return or__3824__auto____15709
      }else {
        var G__15710 = pred;
        var G__15711 = cljs.core.next.call(null, coll);
        pred = G__15710;
        coll = G__15711;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__15712 = null;
    var G__15712__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__15712__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__15712__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__15712__3 = function() {
      var G__15713__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__15713 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__15713__delegate.call(this, x, y, zs)
      };
      G__15713.cljs$lang$maxFixedArity = 2;
      G__15713.cljs$lang$applyTo = function(arglist__15714) {
        var x = cljs.core.first(arglist__15714);
        var y = cljs.core.first(cljs.core.next(arglist__15714));
        var zs = cljs.core.rest(cljs.core.next(arglist__15714));
        return G__15713__delegate(x, y, zs)
      };
      G__15713.cljs$lang$arity$variadic = G__15713__delegate;
      return G__15713
    }();
    G__15712 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__15712__0.call(this);
        case 1:
          return G__15712__1.call(this, x);
        case 2:
          return G__15712__2.call(this, x, y);
        default:
          return G__15712__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__15712.cljs$lang$maxFixedArity = 2;
    G__15712.cljs$lang$applyTo = G__15712__3.cljs$lang$applyTo;
    return G__15712
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15715__delegate = function(args) {
      return x
    };
    var G__15715 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15715__delegate.call(this, args)
    };
    G__15715.cljs$lang$maxFixedArity = 0;
    G__15715.cljs$lang$applyTo = function(arglist__15716) {
      var args = cljs.core.seq(arglist__15716);
      return G__15715__delegate(args)
    };
    G__15715.cljs$lang$arity$variadic = G__15715__delegate;
    return G__15715
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__15723 = null;
      var G__15723__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15723__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15723__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15723__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15723__4 = function() {
        var G__15724__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15724 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15724__delegate.call(this, x, y, z, args)
        };
        G__15724.cljs$lang$maxFixedArity = 3;
        G__15724.cljs$lang$applyTo = function(arglist__15725) {
          var x = cljs.core.first(arglist__15725);
          var y = cljs.core.first(cljs.core.next(arglist__15725));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15725)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15725)));
          return G__15724__delegate(x, y, z, args)
        };
        G__15724.cljs$lang$arity$variadic = G__15724__delegate;
        return G__15724
      }();
      G__15723 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15723__0.call(this);
          case 1:
            return G__15723__1.call(this, x);
          case 2:
            return G__15723__2.call(this, x, y);
          case 3:
            return G__15723__3.call(this, x, y, z);
          default:
            return G__15723__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15723.cljs$lang$maxFixedArity = 3;
      G__15723.cljs$lang$applyTo = G__15723__4.cljs$lang$applyTo;
      return G__15723
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15726 = null;
      var G__15726__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15726__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15726__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15726__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15726__4 = function() {
        var G__15727__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15727 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15727__delegate.call(this, x, y, z, args)
        };
        G__15727.cljs$lang$maxFixedArity = 3;
        G__15727.cljs$lang$applyTo = function(arglist__15728) {
          var x = cljs.core.first(arglist__15728);
          var y = cljs.core.first(cljs.core.next(arglist__15728));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15728)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15728)));
          return G__15727__delegate(x, y, z, args)
        };
        G__15727.cljs$lang$arity$variadic = G__15727__delegate;
        return G__15727
      }();
      G__15726 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15726__0.call(this);
          case 1:
            return G__15726__1.call(this, x);
          case 2:
            return G__15726__2.call(this, x, y);
          case 3:
            return G__15726__3.call(this, x, y, z);
          default:
            return G__15726__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15726.cljs$lang$maxFixedArity = 3;
      G__15726.cljs$lang$applyTo = G__15726__4.cljs$lang$applyTo;
      return G__15726
    }()
  };
  var comp__4 = function() {
    var G__15729__delegate = function(f1, f2, f3, fs) {
      var fs__15720 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15730__delegate = function(args) {
          var ret__15721 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15720), args);
          var fs__15722 = cljs.core.next.call(null, fs__15720);
          while(true) {
            if(fs__15722) {
              var G__15731 = cljs.core.first.call(null, fs__15722).call(null, ret__15721);
              var G__15732 = cljs.core.next.call(null, fs__15722);
              ret__15721 = G__15731;
              fs__15722 = G__15732;
              continue
            }else {
              return ret__15721
            }
            break
          }
        };
        var G__15730 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15730__delegate.call(this, args)
        };
        G__15730.cljs$lang$maxFixedArity = 0;
        G__15730.cljs$lang$applyTo = function(arglist__15733) {
          var args = cljs.core.seq(arglist__15733);
          return G__15730__delegate(args)
        };
        G__15730.cljs$lang$arity$variadic = G__15730__delegate;
        return G__15730
      }()
    };
    var G__15729 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15729__delegate.call(this, f1, f2, f3, fs)
    };
    G__15729.cljs$lang$maxFixedArity = 3;
    G__15729.cljs$lang$applyTo = function(arglist__15734) {
      var f1 = cljs.core.first(arglist__15734);
      var f2 = cljs.core.first(cljs.core.next(arglist__15734));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15734)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15734)));
      return G__15729__delegate(f1, f2, f3, fs)
    };
    G__15729.cljs$lang$arity$variadic = G__15729__delegate;
    return G__15729
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__15735__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15735 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15735__delegate.call(this, args)
      };
      G__15735.cljs$lang$maxFixedArity = 0;
      G__15735.cljs$lang$applyTo = function(arglist__15736) {
        var args = cljs.core.seq(arglist__15736);
        return G__15735__delegate(args)
      };
      G__15735.cljs$lang$arity$variadic = G__15735__delegate;
      return G__15735
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15737__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15737 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15737__delegate.call(this, args)
      };
      G__15737.cljs$lang$maxFixedArity = 0;
      G__15737.cljs$lang$applyTo = function(arglist__15738) {
        var args = cljs.core.seq(arglist__15738);
        return G__15737__delegate(args)
      };
      G__15737.cljs$lang$arity$variadic = G__15737__delegate;
      return G__15737
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15739__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15739 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15739__delegate.call(this, args)
      };
      G__15739.cljs$lang$maxFixedArity = 0;
      G__15739.cljs$lang$applyTo = function(arglist__15740) {
        var args = cljs.core.seq(arglist__15740);
        return G__15739__delegate(args)
      };
      G__15739.cljs$lang$arity$variadic = G__15739__delegate;
      return G__15739
    }()
  };
  var partial__5 = function() {
    var G__15741__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15742__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15742 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15742__delegate.call(this, args)
        };
        G__15742.cljs$lang$maxFixedArity = 0;
        G__15742.cljs$lang$applyTo = function(arglist__15743) {
          var args = cljs.core.seq(arglist__15743);
          return G__15742__delegate(args)
        };
        G__15742.cljs$lang$arity$variadic = G__15742__delegate;
        return G__15742
      }()
    };
    var G__15741 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15741__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15741.cljs$lang$maxFixedArity = 4;
    G__15741.cljs$lang$applyTo = function(arglist__15744) {
      var f = cljs.core.first(arglist__15744);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15744));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15744)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15744))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15744))));
      return G__15741__delegate(f, arg1, arg2, arg3, more)
    };
    G__15741.cljs$lang$arity$variadic = G__15741__delegate;
    return G__15741
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__15745 = null;
      var G__15745__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15745__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15745__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15745__4 = function() {
        var G__15746__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15746 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15746__delegate.call(this, a, b, c, ds)
        };
        G__15746.cljs$lang$maxFixedArity = 3;
        G__15746.cljs$lang$applyTo = function(arglist__15747) {
          var a = cljs.core.first(arglist__15747);
          var b = cljs.core.first(cljs.core.next(arglist__15747));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15747)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15747)));
          return G__15746__delegate(a, b, c, ds)
        };
        G__15746.cljs$lang$arity$variadic = G__15746__delegate;
        return G__15746
      }();
      G__15745 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15745__1.call(this, a);
          case 2:
            return G__15745__2.call(this, a, b);
          case 3:
            return G__15745__3.call(this, a, b, c);
          default:
            return G__15745__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15745.cljs$lang$maxFixedArity = 3;
      G__15745.cljs$lang$applyTo = G__15745__4.cljs$lang$applyTo;
      return G__15745
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15748 = null;
      var G__15748__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15748__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15748__4 = function() {
        var G__15749__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15749 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15749__delegate.call(this, a, b, c, ds)
        };
        G__15749.cljs$lang$maxFixedArity = 3;
        G__15749.cljs$lang$applyTo = function(arglist__15750) {
          var a = cljs.core.first(arglist__15750);
          var b = cljs.core.first(cljs.core.next(arglist__15750));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15750)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15750)));
          return G__15749__delegate(a, b, c, ds)
        };
        G__15749.cljs$lang$arity$variadic = G__15749__delegate;
        return G__15749
      }();
      G__15748 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15748__2.call(this, a, b);
          case 3:
            return G__15748__3.call(this, a, b, c);
          default:
            return G__15748__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15748.cljs$lang$maxFixedArity = 3;
      G__15748.cljs$lang$applyTo = G__15748__4.cljs$lang$applyTo;
      return G__15748
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15751 = null;
      var G__15751__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15751__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15751__4 = function() {
        var G__15752__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15752 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15752__delegate.call(this, a, b, c, ds)
        };
        G__15752.cljs$lang$maxFixedArity = 3;
        G__15752.cljs$lang$applyTo = function(arglist__15753) {
          var a = cljs.core.first(arglist__15753);
          var b = cljs.core.first(cljs.core.next(arglist__15753));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15753)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15753)));
          return G__15752__delegate(a, b, c, ds)
        };
        G__15752.cljs$lang$arity$variadic = G__15752__delegate;
        return G__15752
      }();
      G__15751 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15751__2.call(this, a, b);
          case 3:
            return G__15751__3.call(this, a, b, c);
          default:
            return G__15751__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15751.cljs$lang$maxFixedArity = 3;
      G__15751.cljs$lang$applyTo = G__15751__4.cljs$lang$applyTo;
      return G__15751
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__15769 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15777 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15777) {
        var s__15778 = temp__3974__auto____15777;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15778)) {
          var c__15779 = cljs.core.chunk_first.call(null, s__15778);
          var size__15780 = cljs.core.count.call(null, c__15779);
          var b__15781 = cljs.core.chunk_buffer.call(null, size__15780);
          var n__2551__auto____15782 = size__15780;
          var i__15783 = 0;
          while(true) {
            if(i__15783 < n__2551__auto____15782) {
              cljs.core.chunk_append.call(null, b__15781, f.call(null, idx + i__15783, cljs.core._nth.call(null, c__15779, i__15783)));
              var G__15784 = i__15783 + 1;
              i__15783 = G__15784;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15781), mapi.call(null, idx + size__15780, cljs.core.chunk_rest.call(null, s__15778)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15778)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15778)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15769.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15794 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15794) {
      var s__15795 = temp__3974__auto____15794;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15795)) {
        var c__15796 = cljs.core.chunk_first.call(null, s__15795);
        var size__15797 = cljs.core.count.call(null, c__15796);
        var b__15798 = cljs.core.chunk_buffer.call(null, size__15797);
        var n__2551__auto____15799 = size__15797;
        var i__15800 = 0;
        while(true) {
          if(i__15800 < n__2551__auto____15799) {
            var x__15801 = f.call(null, cljs.core._nth.call(null, c__15796, i__15800));
            if(x__15801 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15798, x__15801)
            }
            var G__15803 = i__15800 + 1;
            i__15800 = G__15803;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15798), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15795)))
      }else {
        var x__15802 = f.call(null, cljs.core.first.call(null, s__15795));
        if(x__15802 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15795))
        }else {
          return cljs.core.cons.call(null, x__15802, keep.call(null, f, cljs.core.rest.call(null, s__15795)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15829 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15839 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15839) {
        var s__15840 = temp__3974__auto____15839;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15840)) {
          var c__15841 = cljs.core.chunk_first.call(null, s__15840);
          var size__15842 = cljs.core.count.call(null, c__15841);
          var b__15843 = cljs.core.chunk_buffer.call(null, size__15842);
          var n__2551__auto____15844 = size__15842;
          var i__15845 = 0;
          while(true) {
            if(i__15845 < n__2551__auto____15844) {
              var x__15846 = f.call(null, idx + i__15845, cljs.core._nth.call(null, c__15841, i__15845));
              if(x__15846 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15843, x__15846)
              }
              var G__15848 = i__15845 + 1;
              i__15845 = G__15848;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15843), keepi.call(null, idx + size__15842, cljs.core.chunk_rest.call(null, s__15840)))
        }else {
          var x__15847 = f.call(null, idx, cljs.core.first.call(null, s__15840));
          if(x__15847 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15840))
          }else {
            return cljs.core.cons.call(null, x__15847, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15840)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15829.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15934 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15934)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15934
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15935 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15935)) {
            var and__3822__auto____15936 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15936)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15936
            }
          }else {
            return and__3822__auto____15935
          }
        }())
      };
      var ep1__4 = function() {
        var G__16005__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15937 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15937)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15937
            }
          }())
        };
        var G__16005 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16005__delegate.call(this, x, y, z, args)
        };
        G__16005.cljs$lang$maxFixedArity = 3;
        G__16005.cljs$lang$applyTo = function(arglist__16006) {
          var x = cljs.core.first(arglist__16006);
          var y = cljs.core.first(cljs.core.next(arglist__16006));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16006)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16006)));
          return G__16005__delegate(x, y, z, args)
        };
        G__16005.cljs$lang$arity$variadic = G__16005__delegate;
        return G__16005
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15949 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15949)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15949
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15950 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15950)) {
            var and__3822__auto____15951 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15951)) {
              var and__3822__auto____15952 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15952)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15952
              }
            }else {
              return and__3822__auto____15951
            }
          }else {
            return and__3822__auto____15950
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15953 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15953)) {
            var and__3822__auto____15954 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15954)) {
              var and__3822__auto____15955 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15955)) {
                var and__3822__auto____15956 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15956)) {
                  var and__3822__auto____15957 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15957)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15957
                  }
                }else {
                  return and__3822__auto____15956
                }
              }else {
                return and__3822__auto____15955
              }
            }else {
              return and__3822__auto____15954
            }
          }else {
            return and__3822__auto____15953
          }
        }())
      };
      var ep2__4 = function() {
        var G__16007__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15958 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15958)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15804_SHARP_) {
                var and__3822__auto____15959 = p1.call(null, p1__15804_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15959)) {
                  return p2.call(null, p1__15804_SHARP_)
                }else {
                  return and__3822__auto____15959
                }
              }, args)
            }else {
              return and__3822__auto____15958
            }
          }())
        };
        var G__16007 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16007__delegate.call(this, x, y, z, args)
        };
        G__16007.cljs$lang$maxFixedArity = 3;
        G__16007.cljs$lang$applyTo = function(arglist__16008) {
          var x = cljs.core.first(arglist__16008);
          var y = cljs.core.first(cljs.core.next(arglist__16008));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16008)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16008)));
          return G__16007__delegate(x, y, z, args)
        };
        G__16007.cljs$lang$arity$variadic = G__16007__delegate;
        return G__16007
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15978 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15978)) {
            var and__3822__auto____15979 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15979)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15979
            }
          }else {
            return and__3822__auto____15978
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15980 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15980)) {
            var and__3822__auto____15981 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15981)) {
              var and__3822__auto____15982 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15982)) {
                var and__3822__auto____15983 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15983)) {
                  var and__3822__auto____15984 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15984)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15984
                  }
                }else {
                  return and__3822__auto____15983
                }
              }else {
                return and__3822__auto____15982
              }
            }else {
              return and__3822__auto____15981
            }
          }else {
            return and__3822__auto____15980
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15985 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15985)) {
            var and__3822__auto____15986 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15986)) {
              var and__3822__auto____15987 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15987)) {
                var and__3822__auto____15988 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15988)) {
                  var and__3822__auto____15989 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15989)) {
                    var and__3822__auto____15990 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15990)) {
                      var and__3822__auto____15991 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15991)) {
                        var and__3822__auto____15992 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15992)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15992
                        }
                      }else {
                        return and__3822__auto____15991
                      }
                    }else {
                      return and__3822__auto____15990
                    }
                  }else {
                    return and__3822__auto____15989
                  }
                }else {
                  return and__3822__auto____15988
                }
              }else {
                return and__3822__auto____15987
              }
            }else {
              return and__3822__auto____15986
            }
          }else {
            return and__3822__auto____15985
          }
        }())
      };
      var ep3__4 = function() {
        var G__16009__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15993 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15993)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15805_SHARP_) {
                var and__3822__auto____15994 = p1.call(null, p1__15805_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15994)) {
                  var and__3822__auto____15995 = p2.call(null, p1__15805_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15995)) {
                    return p3.call(null, p1__15805_SHARP_)
                  }else {
                    return and__3822__auto____15995
                  }
                }else {
                  return and__3822__auto____15994
                }
              }, args)
            }else {
              return and__3822__auto____15993
            }
          }())
        };
        var G__16009 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16009__delegate.call(this, x, y, z, args)
        };
        G__16009.cljs$lang$maxFixedArity = 3;
        G__16009.cljs$lang$applyTo = function(arglist__16010) {
          var x = cljs.core.first(arglist__16010);
          var y = cljs.core.first(cljs.core.next(arglist__16010));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16010)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16010)));
          return G__16009__delegate(x, y, z, args)
        };
        G__16009.cljs$lang$arity$variadic = G__16009__delegate;
        return G__16009
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__16011__delegate = function(p1, p2, p3, ps) {
      var ps__15996 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15806_SHARP_) {
            return p1__15806_SHARP_.call(null, x)
          }, ps__15996)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15807_SHARP_) {
            var and__3822__auto____16001 = p1__15807_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16001)) {
              return p1__15807_SHARP_.call(null, y)
            }else {
              return and__3822__auto____16001
            }
          }, ps__15996)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15808_SHARP_) {
            var and__3822__auto____16002 = p1__15808_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16002)) {
              var and__3822__auto____16003 = p1__15808_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____16003)) {
                return p1__15808_SHARP_.call(null, z)
              }else {
                return and__3822__auto____16003
              }
            }else {
              return and__3822__auto____16002
            }
          }, ps__15996)
        };
        var epn__4 = function() {
          var G__16012__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____16004 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____16004)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15809_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15809_SHARP_, args)
                }, ps__15996)
              }else {
                return and__3822__auto____16004
              }
            }())
          };
          var G__16012 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16012__delegate.call(this, x, y, z, args)
          };
          G__16012.cljs$lang$maxFixedArity = 3;
          G__16012.cljs$lang$applyTo = function(arglist__16013) {
            var x = cljs.core.first(arglist__16013);
            var y = cljs.core.first(cljs.core.next(arglist__16013));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16013)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16013)));
            return G__16012__delegate(x, y, z, args)
          };
          G__16012.cljs$lang$arity$variadic = G__16012__delegate;
          return G__16012
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__16011 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16011__delegate.call(this, p1, p2, p3, ps)
    };
    G__16011.cljs$lang$maxFixedArity = 3;
    G__16011.cljs$lang$applyTo = function(arglist__16014) {
      var p1 = cljs.core.first(arglist__16014);
      var p2 = cljs.core.first(cljs.core.next(arglist__16014));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16014)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16014)));
      return G__16011__delegate(p1, p2, p3, ps)
    };
    G__16011.cljs$lang$arity$variadic = G__16011__delegate;
    return G__16011
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____16095 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16095)) {
          return or__3824__auto____16095
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____16096 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16096)) {
          return or__3824__auto____16096
        }else {
          var or__3824__auto____16097 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16097)) {
            return or__3824__auto____16097
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__16166__delegate = function(x, y, z, args) {
          var or__3824__auto____16098 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16098)) {
            return or__3824__auto____16098
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__16166 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16166__delegate.call(this, x, y, z, args)
        };
        G__16166.cljs$lang$maxFixedArity = 3;
        G__16166.cljs$lang$applyTo = function(arglist__16167) {
          var x = cljs.core.first(arglist__16167);
          var y = cljs.core.first(cljs.core.next(arglist__16167));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16167)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16167)));
          return G__16166__delegate(x, y, z, args)
        };
        G__16166.cljs$lang$arity$variadic = G__16166__delegate;
        return G__16166
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____16110 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16110)) {
          return or__3824__auto____16110
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____16111 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16111)) {
          return or__3824__auto____16111
        }else {
          var or__3824__auto____16112 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16112)) {
            return or__3824__auto____16112
          }else {
            var or__3824__auto____16113 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16113)) {
              return or__3824__auto____16113
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____16114 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16114)) {
          return or__3824__auto____16114
        }else {
          var or__3824__auto____16115 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____16115)) {
            return or__3824__auto____16115
          }else {
            var or__3824__auto____16116 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____16116)) {
              return or__3824__auto____16116
            }else {
              var or__3824__auto____16117 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____16117)) {
                return or__3824__auto____16117
              }else {
                var or__3824__auto____16118 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16118)) {
                  return or__3824__auto____16118
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__16168__delegate = function(x, y, z, args) {
          var or__3824__auto____16119 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16119)) {
            return or__3824__auto____16119
          }else {
            return cljs.core.some.call(null, function(p1__15849_SHARP_) {
              var or__3824__auto____16120 = p1.call(null, p1__15849_SHARP_);
              if(cljs.core.truth_(or__3824__auto____16120)) {
                return or__3824__auto____16120
              }else {
                return p2.call(null, p1__15849_SHARP_)
              }
            }, args)
          }
        };
        var G__16168 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16168__delegate.call(this, x, y, z, args)
        };
        G__16168.cljs$lang$maxFixedArity = 3;
        G__16168.cljs$lang$applyTo = function(arglist__16169) {
          var x = cljs.core.first(arglist__16169);
          var y = cljs.core.first(cljs.core.next(arglist__16169));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16169)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16169)));
          return G__16168__delegate(x, y, z, args)
        };
        G__16168.cljs$lang$arity$variadic = G__16168__delegate;
        return G__16168
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____16139 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16139)) {
          return or__3824__auto____16139
        }else {
          var or__3824__auto____16140 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16140)) {
            return or__3824__auto____16140
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____16141 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16141)) {
          return or__3824__auto____16141
        }else {
          var or__3824__auto____16142 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16142)) {
            return or__3824__auto____16142
          }else {
            var or__3824__auto____16143 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16143)) {
              return or__3824__auto____16143
            }else {
              var or__3824__auto____16144 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16144)) {
                return or__3824__auto____16144
              }else {
                var or__3824__auto____16145 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16145)) {
                  return or__3824__auto____16145
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____16146 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____16146)) {
          return or__3824__auto____16146
        }else {
          var or__3824__auto____16147 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____16147)) {
            return or__3824__auto____16147
          }else {
            var or__3824__auto____16148 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16148)) {
              return or__3824__auto____16148
            }else {
              var or__3824__auto____16149 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16149)) {
                return or__3824__auto____16149
              }else {
                var or__3824__auto____16150 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____16150)) {
                  return or__3824__auto____16150
                }else {
                  var or__3824__auto____16151 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____16151)) {
                    return or__3824__auto____16151
                  }else {
                    var or__3824__auto____16152 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____16152)) {
                      return or__3824__auto____16152
                    }else {
                      var or__3824__auto____16153 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____16153)) {
                        return or__3824__auto____16153
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__16170__delegate = function(x, y, z, args) {
          var or__3824__auto____16154 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____16154)) {
            return or__3824__auto____16154
          }else {
            return cljs.core.some.call(null, function(p1__15850_SHARP_) {
              var or__3824__auto____16155 = p1.call(null, p1__15850_SHARP_);
              if(cljs.core.truth_(or__3824__auto____16155)) {
                return or__3824__auto____16155
              }else {
                var or__3824__auto____16156 = p2.call(null, p1__15850_SHARP_);
                if(cljs.core.truth_(or__3824__auto____16156)) {
                  return or__3824__auto____16156
                }else {
                  return p3.call(null, p1__15850_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__16170 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16170__delegate.call(this, x, y, z, args)
        };
        G__16170.cljs$lang$maxFixedArity = 3;
        G__16170.cljs$lang$applyTo = function(arglist__16171) {
          var x = cljs.core.first(arglist__16171);
          var y = cljs.core.first(cljs.core.next(arglist__16171));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16171)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16171)));
          return G__16170__delegate(x, y, z, args)
        };
        G__16170.cljs$lang$arity$variadic = G__16170__delegate;
        return G__16170
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__16172__delegate = function(p1, p2, p3, ps) {
      var ps__16157 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__15851_SHARP_) {
            return p1__15851_SHARP_.call(null, x)
          }, ps__16157)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15852_SHARP_) {
            var or__3824__auto____16162 = p1__15852_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16162)) {
              return or__3824__auto____16162
            }else {
              return p1__15852_SHARP_.call(null, y)
            }
          }, ps__16157)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15853_SHARP_) {
            var or__3824__auto____16163 = p1__15853_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____16163)) {
              return or__3824__auto____16163
            }else {
              var or__3824__auto____16164 = p1__15853_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____16164)) {
                return or__3824__auto____16164
              }else {
                return p1__15853_SHARP_.call(null, z)
              }
            }
          }, ps__16157)
        };
        var spn__4 = function() {
          var G__16173__delegate = function(x, y, z, args) {
            var or__3824__auto____16165 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____16165)) {
              return or__3824__auto____16165
            }else {
              return cljs.core.some.call(null, function(p1__15854_SHARP_) {
                return cljs.core.some.call(null, p1__15854_SHARP_, args)
              }, ps__16157)
            }
          };
          var G__16173 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16173__delegate.call(this, x, y, z, args)
          };
          G__16173.cljs$lang$maxFixedArity = 3;
          G__16173.cljs$lang$applyTo = function(arglist__16174) {
            var x = cljs.core.first(arglist__16174);
            var y = cljs.core.first(cljs.core.next(arglist__16174));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16174)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16174)));
            return G__16173__delegate(x, y, z, args)
          };
          G__16173.cljs$lang$arity$variadic = G__16173__delegate;
          return G__16173
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__16172 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16172__delegate.call(this, p1, p2, p3, ps)
    };
    G__16172.cljs$lang$maxFixedArity = 3;
    G__16172.cljs$lang$applyTo = function(arglist__16175) {
      var p1 = cljs.core.first(arglist__16175);
      var p2 = cljs.core.first(cljs.core.next(arglist__16175));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16175)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16175)));
      return G__16172__delegate(p1, p2, p3, ps)
    };
    G__16172.cljs$lang$arity$variadic = G__16172__delegate;
    return G__16172
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16194 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16194) {
        var s__16195 = temp__3974__auto____16194;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16195)) {
          var c__16196 = cljs.core.chunk_first.call(null, s__16195);
          var size__16197 = cljs.core.count.call(null, c__16196);
          var b__16198 = cljs.core.chunk_buffer.call(null, size__16197);
          var n__2551__auto____16199 = size__16197;
          var i__16200 = 0;
          while(true) {
            if(i__16200 < n__2551__auto____16199) {
              cljs.core.chunk_append.call(null, b__16198, f.call(null, cljs.core._nth.call(null, c__16196, i__16200)));
              var G__16212 = i__16200 + 1;
              i__16200 = G__16212;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16198), map.call(null, f, cljs.core.chunk_rest.call(null, s__16195)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__16195)), map.call(null, f, cljs.core.rest.call(null, s__16195)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__16201 = cljs.core.seq.call(null, c1);
      var s2__16202 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____16203 = s1__16201;
        if(and__3822__auto____16203) {
          return s2__16202
        }else {
          return and__3822__auto____16203
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__16201), cljs.core.first.call(null, s2__16202)), map.call(null, f, cljs.core.rest.call(null, s1__16201), cljs.core.rest.call(null, s2__16202)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__16204 = cljs.core.seq.call(null, c1);
      var s2__16205 = cljs.core.seq.call(null, c2);
      var s3__16206 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____16207 = s1__16204;
        if(and__3822__auto____16207) {
          var and__3822__auto____16208 = s2__16205;
          if(and__3822__auto____16208) {
            return s3__16206
          }else {
            return and__3822__auto____16208
          }
        }else {
          return and__3822__auto____16207
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__16204), cljs.core.first.call(null, s2__16205), cljs.core.first.call(null, s3__16206)), map.call(null, f, cljs.core.rest.call(null, s1__16204), cljs.core.rest.call(null, s2__16205), cljs.core.rest.call(null, s3__16206)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__16213__delegate = function(f, c1, c2, c3, colls) {
      var step__16211 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__16210 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__16210)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__16210), step.call(null, map.call(null, cljs.core.rest, ss__16210)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__16015_SHARP_) {
        return cljs.core.apply.call(null, f, p1__16015_SHARP_)
      }, step__16211.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__16213 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16213__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__16213.cljs$lang$maxFixedArity = 4;
    G__16213.cljs$lang$applyTo = function(arglist__16214) {
      var f = cljs.core.first(arglist__16214);
      var c1 = cljs.core.first(cljs.core.next(arglist__16214));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16214)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16214))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16214))));
      return G__16213__delegate(f, c1, c2, c3, colls)
    };
    G__16213.cljs$lang$arity$variadic = G__16213__delegate;
    return G__16213
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____16217 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16217) {
        var s__16218 = temp__3974__auto____16217;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__16218), take.call(null, n - 1, cljs.core.rest.call(null, s__16218)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__16224 = function(n, coll) {
    while(true) {
      var s__16222 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____16223 = n > 0;
        if(and__3822__auto____16223) {
          return s__16222
        }else {
          return and__3822__auto____16223
        }
      }())) {
        var G__16225 = n - 1;
        var G__16226 = cljs.core.rest.call(null, s__16222);
        n = G__16225;
        coll = G__16226;
        continue
      }else {
        return s__16222
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__16224.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__16229 = cljs.core.seq.call(null, coll);
  var lead__16230 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__16230) {
      var G__16231 = cljs.core.next.call(null, s__16229);
      var G__16232 = cljs.core.next.call(null, lead__16230);
      s__16229 = G__16231;
      lead__16230 = G__16232;
      continue
    }else {
      return s__16229
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__16238 = function(pred, coll) {
    while(true) {
      var s__16236 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____16237 = s__16236;
        if(and__3822__auto____16237) {
          return pred.call(null, cljs.core.first.call(null, s__16236))
        }else {
          return and__3822__auto____16237
        }
      }())) {
        var G__16239 = pred;
        var G__16240 = cljs.core.rest.call(null, s__16236);
        pred = G__16239;
        coll = G__16240;
        continue
      }else {
        return s__16236
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__16238.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16243 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16243) {
      var s__16244 = temp__3974__auto____16243;
      return cljs.core.concat.call(null, s__16244, cycle.call(null, s__16244))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__16249 = cljs.core.seq.call(null, c1);
      var s2__16250 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____16251 = s1__16249;
        if(and__3822__auto____16251) {
          return s2__16250
        }else {
          return and__3822__auto____16251
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__16249), cljs.core.cons.call(null, cljs.core.first.call(null, s2__16250), interleave.call(null, cljs.core.rest.call(null, s1__16249), cljs.core.rest.call(null, s2__16250))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__16253__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__16252 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__16252)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__16252), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__16252)))
        }else {
          return null
        }
      }, null)
    };
    var G__16253 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16253__delegate.call(this, c1, c2, colls)
    };
    G__16253.cljs$lang$maxFixedArity = 2;
    G__16253.cljs$lang$applyTo = function(arglist__16254) {
      var c1 = cljs.core.first(arglist__16254);
      var c2 = cljs.core.first(cljs.core.next(arglist__16254));
      var colls = cljs.core.rest(cljs.core.next(arglist__16254));
      return G__16253__delegate(c1, c2, colls)
    };
    G__16253.cljs$lang$arity$variadic = G__16253__delegate;
    return G__16253
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__16264 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____16262 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____16262) {
        var coll__16263 = temp__3971__auto____16262;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__16263), cat.call(null, cljs.core.rest.call(null, coll__16263), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__16264.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__16265__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__16265 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16265__delegate.call(this, f, coll, colls)
    };
    G__16265.cljs$lang$maxFixedArity = 2;
    G__16265.cljs$lang$applyTo = function(arglist__16266) {
      var f = cljs.core.first(arglist__16266);
      var coll = cljs.core.first(cljs.core.next(arglist__16266));
      var colls = cljs.core.rest(cljs.core.next(arglist__16266));
      return G__16265__delegate(f, coll, colls)
    };
    G__16265.cljs$lang$arity$variadic = G__16265__delegate;
    return G__16265
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16276 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16276) {
      var s__16277 = temp__3974__auto____16276;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__16277)) {
        var c__16278 = cljs.core.chunk_first.call(null, s__16277);
        var size__16279 = cljs.core.count.call(null, c__16278);
        var b__16280 = cljs.core.chunk_buffer.call(null, size__16279);
        var n__2551__auto____16281 = size__16279;
        var i__16282 = 0;
        while(true) {
          if(i__16282 < n__2551__auto____16281) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__16278, i__16282)))) {
              cljs.core.chunk_append.call(null, b__16280, cljs.core._nth.call(null, c__16278, i__16282))
            }else {
            }
            var G__16285 = i__16282 + 1;
            i__16282 = G__16285;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16280), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__16277)))
      }else {
        var f__16283 = cljs.core.first.call(null, s__16277);
        var r__16284 = cljs.core.rest.call(null, s__16277);
        if(cljs.core.truth_(pred.call(null, f__16283))) {
          return cljs.core.cons.call(null, f__16283, filter.call(null, pred, r__16284))
        }else {
          return filter.call(null, pred, r__16284)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__16288 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__16288.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__16286_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__16286_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__16292__16293 = to;
    if(G__16292__16293) {
      if(function() {
        var or__3824__auto____16294 = G__16292__16293.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____16294) {
          return or__3824__auto____16294
        }else {
          return G__16292__16293.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__16292__16293.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__16292__16293)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__16292__16293)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__16295__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__16295 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16295__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__16295.cljs$lang$maxFixedArity = 4;
    G__16295.cljs$lang$applyTo = function(arglist__16296) {
      var f = cljs.core.first(arglist__16296);
      var c1 = cljs.core.first(cljs.core.next(arglist__16296));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16296)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16296))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16296))));
      return G__16295__delegate(f, c1, c2, c3, colls)
    };
    G__16295.cljs$lang$arity$variadic = G__16295__delegate;
    return G__16295
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16303 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16303) {
        var s__16304 = temp__3974__auto____16303;
        var p__16305 = cljs.core.take.call(null, n, s__16304);
        if(n === cljs.core.count.call(null, p__16305)) {
          return cljs.core.cons.call(null, p__16305, partition.call(null, n, step, cljs.core.drop.call(null, step, s__16304)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16306 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16306) {
        var s__16307 = temp__3974__auto____16306;
        var p__16308 = cljs.core.take.call(null, n, s__16307);
        if(n === cljs.core.count.call(null, p__16308)) {
          return cljs.core.cons.call(null, p__16308, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__16307)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__16308, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__16313 = cljs.core.lookup_sentinel;
    var m__16314 = m;
    var ks__16315 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__16315) {
        var m__16316 = cljs.core._lookup.call(null, m__16314, cljs.core.first.call(null, ks__16315), sentinel__16313);
        if(sentinel__16313 === m__16316) {
          return not_found
        }else {
          var G__16317 = sentinel__16313;
          var G__16318 = m__16316;
          var G__16319 = cljs.core.next.call(null, ks__16315);
          sentinel__16313 = G__16317;
          m__16314 = G__16318;
          ks__16315 = G__16319;
          continue
        }
      }else {
        return m__16314
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__16320, v) {
  var vec__16325__16326 = p__16320;
  var k__16327 = cljs.core.nth.call(null, vec__16325__16326, 0, null);
  var ks__16328 = cljs.core.nthnext.call(null, vec__16325__16326, 1);
  if(cljs.core.truth_(ks__16328)) {
    return cljs.core.assoc.call(null, m, k__16327, assoc_in.call(null, cljs.core._lookup.call(null, m, k__16327, null), ks__16328, v))
  }else {
    return cljs.core.assoc.call(null, m, k__16327, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__16329, f, args) {
    var vec__16334__16335 = p__16329;
    var k__16336 = cljs.core.nth.call(null, vec__16334__16335, 0, null);
    var ks__16337 = cljs.core.nthnext.call(null, vec__16334__16335, 1);
    if(cljs.core.truth_(ks__16337)) {
      return cljs.core.assoc.call(null, m, k__16336, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__16336, null), ks__16337, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__16336, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__16336, null), args))
    }
  };
  var update_in = function(m, p__16329, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__16329, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__16338) {
    var m = cljs.core.first(arglist__16338);
    var p__16329 = cljs.core.first(cljs.core.next(arglist__16338));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16338)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16338)));
    return update_in__delegate(m, p__16329, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16341 = this;
  var h__2216__auto____16342 = this__16341.__hash;
  if(!(h__2216__auto____16342 == null)) {
    return h__2216__auto____16342
  }else {
    var h__2216__auto____16343 = cljs.core.hash_coll.call(null, coll);
    this__16341.__hash = h__2216__auto____16343;
    return h__2216__auto____16343
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16344 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16345 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16346 = this;
  var new_array__16347 = this__16346.array.slice();
  new_array__16347[k] = v;
  return new cljs.core.Vector(this__16346.meta, new_array__16347, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__16378 = null;
  var G__16378__2 = function(this_sym16348, k) {
    var this__16350 = this;
    var this_sym16348__16351 = this;
    var coll__16352 = this_sym16348__16351;
    return coll__16352.cljs$core$ILookup$_lookup$arity$2(coll__16352, k)
  };
  var G__16378__3 = function(this_sym16349, k, not_found) {
    var this__16350 = this;
    var this_sym16349__16353 = this;
    var coll__16354 = this_sym16349__16353;
    return coll__16354.cljs$core$ILookup$_lookup$arity$3(coll__16354, k, not_found)
  };
  G__16378 = function(this_sym16349, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16378__2.call(this, this_sym16349, k);
      case 3:
        return G__16378__3.call(this, this_sym16349, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16378
}();
cljs.core.Vector.prototype.apply = function(this_sym16339, args16340) {
  var this__16355 = this;
  return this_sym16339.call.apply(this_sym16339, [this_sym16339].concat(args16340.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16356 = this;
  var new_array__16357 = this__16356.array.slice();
  new_array__16357.push(o);
  return new cljs.core.Vector(this__16356.meta, new_array__16357, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__16358 = this;
  var this__16359 = this;
  return cljs.core.pr_str.call(null, this__16359)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__16360 = this;
  return cljs.core.ci_reduce.call(null, this__16360.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__16361 = this;
  return cljs.core.ci_reduce.call(null, this__16361.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16362 = this;
  if(this__16362.array.length > 0) {
    var vector_seq__16363 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__16362.array.length) {
          return cljs.core.cons.call(null, this__16362.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__16363.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16364 = this;
  return this__16364.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16365 = this;
  var count__16366 = this__16365.array.length;
  if(count__16366 > 0) {
    return this__16365.array[count__16366 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16367 = this;
  if(this__16367.array.length > 0) {
    var new_array__16368 = this__16367.array.slice();
    new_array__16368.pop();
    return new cljs.core.Vector(this__16367.meta, new_array__16368, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16369 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16370 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16371 = this;
  return new cljs.core.Vector(meta, this__16371.array, this__16371.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16372 = this;
  return this__16372.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16373 = this;
  if(function() {
    var and__3822__auto____16374 = 0 <= n;
    if(and__3822__auto____16374) {
      return n < this__16373.array.length
    }else {
      return and__3822__auto____16374
    }
  }()) {
    return this__16373.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16375 = this;
  if(function() {
    var and__3822__auto____16376 = 0 <= n;
    if(and__3822__auto____16376) {
      return n < this__16375.array.length
    }else {
      return and__3822__auto____16376
    }
  }()) {
    return this__16375.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16377 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__16377.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2334__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__16380 = pv.cnt;
  if(cnt__16380 < 32) {
    return 0
  }else {
    return cnt__16380 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__16386 = level;
  var ret__16387 = node;
  while(true) {
    if(ll__16386 === 0) {
      return ret__16387
    }else {
      var embed__16388 = ret__16387;
      var r__16389 = cljs.core.pv_fresh_node.call(null, edit);
      var ___16390 = cljs.core.pv_aset.call(null, r__16389, 0, embed__16388);
      var G__16391 = ll__16386 - 5;
      var G__16392 = r__16389;
      ll__16386 = G__16391;
      ret__16387 = G__16392;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__16398 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__16399 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__16398, subidx__16399, tailnode);
    return ret__16398
  }else {
    var child__16400 = cljs.core.pv_aget.call(null, parent, subidx__16399);
    if(!(child__16400 == null)) {
      var node_to_insert__16401 = push_tail.call(null, pv, level - 5, child__16400, tailnode);
      cljs.core.pv_aset.call(null, ret__16398, subidx__16399, node_to_insert__16401);
      return ret__16398
    }else {
      var node_to_insert__16402 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__16398, subidx__16399, node_to_insert__16402);
      return ret__16398
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____16406 = 0 <= i;
    if(and__3822__auto____16406) {
      return i < pv.cnt
    }else {
      return and__3822__auto____16406
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__16407 = pv.root;
      var level__16408 = pv.shift;
      while(true) {
        if(level__16408 > 0) {
          var G__16409 = cljs.core.pv_aget.call(null, node__16407, i >>> level__16408 & 31);
          var G__16410 = level__16408 - 5;
          node__16407 = G__16409;
          level__16408 = G__16410;
          continue
        }else {
          return node__16407.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__16413 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__16413, i & 31, val);
    return ret__16413
  }else {
    var subidx__16414 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__16413, subidx__16414, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__16414), i, val));
    return ret__16413
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__16420 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__16421 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__16420));
    if(function() {
      var and__3822__auto____16422 = new_child__16421 == null;
      if(and__3822__auto____16422) {
        return subidx__16420 === 0
      }else {
        return and__3822__auto____16422
      }
    }()) {
      return null
    }else {
      var ret__16423 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__16423, subidx__16420, new_child__16421);
      return ret__16423
    }
  }else {
    if(subidx__16420 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__16424 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__16424, subidx__16420, null);
        return ret__16424
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16427 = this;
  return new cljs.core.TransientVector(this__16427.cnt, this__16427.shift, cljs.core.tv_editable_root.call(null, this__16427.root), cljs.core.tv_editable_tail.call(null, this__16427.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16428 = this;
  var h__2216__auto____16429 = this__16428.__hash;
  if(!(h__2216__auto____16429 == null)) {
    return h__2216__auto____16429
  }else {
    var h__2216__auto____16430 = cljs.core.hash_coll.call(null, coll);
    this__16428.__hash = h__2216__auto____16430;
    return h__2216__auto____16430
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16431 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16432 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16433 = this;
  if(function() {
    var and__3822__auto____16434 = 0 <= k;
    if(and__3822__auto____16434) {
      return k < this__16433.cnt
    }else {
      return and__3822__auto____16434
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__16435 = this__16433.tail.slice();
      new_tail__16435[k & 31] = v;
      return new cljs.core.PersistentVector(this__16433.meta, this__16433.cnt, this__16433.shift, this__16433.root, new_tail__16435, null)
    }else {
      return new cljs.core.PersistentVector(this__16433.meta, this__16433.cnt, this__16433.shift, cljs.core.do_assoc.call(null, coll, this__16433.shift, this__16433.root, k, v), this__16433.tail, null)
    }
  }else {
    if(k === this__16433.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__16433.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__16483 = null;
  var G__16483__2 = function(this_sym16436, k) {
    var this__16438 = this;
    var this_sym16436__16439 = this;
    var coll__16440 = this_sym16436__16439;
    return coll__16440.cljs$core$ILookup$_lookup$arity$2(coll__16440, k)
  };
  var G__16483__3 = function(this_sym16437, k, not_found) {
    var this__16438 = this;
    var this_sym16437__16441 = this;
    var coll__16442 = this_sym16437__16441;
    return coll__16442.cljs$core$ILookup$_lookup$arity$3(coll__16442, k, not_found)
  };
  G__16483 = function(this_sym16437, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16483__2.call(this, this_sym16437, k);
      case 3:
        return G__16483__3.call(this, this_sym16437, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16483
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym16425, args16426) {
  var this__16443 = this;
  return this_sym16425.call.apply(this_sym16425, [this_sym16425].concat(args16426.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__16444 = this;
  var step_init__16445 = [0, init];
  var i__16446 = 0;
  while(true) {
    if(i__16446 < this__16444.cnt) {
      var arr__16447 = cljs.core.array_for.call(null, v, i__16446);
      var len__16448 = arr__16447.length;
      var init__16452 = function() {
        var j__16449 = 0;
        var init__16450 = step_init__16445[1];
        while(true) {
          if(j__16449 < len__16448) {
            var init__16451 = f.call(null, init__16450, j__16449 + i__16446, arr__16447[j__16449]);
            if(cljs.core.reduced_QMARK_.call(null, init__16451)) {
              return init__16451
            }else {
              var G__16484 = j__16449 + 1;
              var G__16485 = init__16451;
              j__16449 = G__16484;
              init__16450 = G__16485;
              continue
            }
          }else {
            step_init__16445[0] = len__16448;
            step_init__16445[1] = init__16450;
            return init__16450
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16452)) {
        return cljs.core.deref.call(null, init__16452)
      }else {
        var G__16486 = i__16446 + step_init__16445[0];
        i__16446 = G__16486;
        continue
      }
    }else {
      return step_init__16445[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16453 = this;
  if(this__16453.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__16454 = this__16453.tail.slice();
    new_tail__16454.push(o);
    return new cljs.core.PersistentVector(this__16453.meta, this__16453.cnt + 1, this__16453.shift, this__16453.root, new_tail__16454, null)
  }else {
    var root_overflow_QMARK___16455 = this__16453.cnt >>> 5 > 1 << this__16453.shift;
    var new_shift__16456 = root_overflow_QMARK___16455 ? this__16453.shift + 5 : this__16453.shift;
    var new_root__16458 = root_overflow_QMARK___16455 ? function() {
      var n_r__16457 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__16457, 0, this__16453.root);
      cljs.core.pv_aset.call(null, n_r__16457, 1, cljs.core.new_path.call(null, null, this__16453.shift, new cljs.core.VectorNode(null, this__16453.tail)));
      return n_r__16457
    }() : cljs.core.push_tail.call(null, coll, this__16453.shift, this__16453.root, new cljs.core.VectorNode(null, this__16453.tail));
    return new cljs.core.PersistentVector(this__16453.meta, this__16453.cnt + 1, new_shift__16456, new_root__16458, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16459 = this;
  if(this__16459.cnt > 0) {
    return new cljs.core.RSeq(coll, this__16459.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__16460 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__16461 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__16462 = this;
  var this__16463 = this;
  return cljs.core.pr_str.call(null, this__16463)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__16464 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__16465 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16466 = this;
  if(this__16466.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16467 = this;
  return this__16467.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16468 = this;
  if(this__16468.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__16468.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16469 = this;
  if(this__16469.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__16469.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16469.meta)
    }else {
      if(1 < this__16469.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__16469.meta, this__16469.cnt - 1, this__16469.shift, this__16469.root, this__16469.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__16470 = cljs.core.array_for.call(null, coll, this__16469.cnt - 2);
          var nr__16471 = cljs.core.pop_tail.call(null, coll, this__16469.shift, this__16469.root);
          var new_root__16472 = nr__16471 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__16471;
          var cnt_1__16473 = this__16469.cnt - 1;
          if(function() {
            var and__3822__auto____16474 = 5 < this__16469.shift;
            if(and__3822__auto____16474) {
              return cljs.core.pv_aget.call(null, new_root__16472, 1) == null
            }else {
              return and__3822__auto____16474
            }
          }()) {
            return new cljs.core.PersistentVector(this__16469.meta, cnt_1__16473, this__16469.shift - 5, cljs.core.pv_aget.call(null, new_root__16472, 0), new_tail__16470, null)
          }else {
            return new cljs.core.PersistentVector(this__16469.meta, cnt_1__16473, this__16469.shift, new_root__16472, new_tail__16470, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16475 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16476 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16477 = this;
  return new cljs.core.PersistentVector(meta, this__16477.cnt, this__16477.shift, this__16477.root, this__16477.tail, this__16477.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16478 = this;
  return this__16478.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16479 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16480 = this;
  if(function() {
    var and__3822__auto____16481 = 0 <= n;
    if(and__3822__auto____16481) {
      return n < this__16480.cnt
    }else {
      return and__3822__auto____16481
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16482 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16482.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__16487 = xs.length;
  var xs__16488 = no_clone === true ? xs : xs.slice();
  if(l__16487 < 32) {
    return new cljs.core.PersistentVector(null, l__16487, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__16488, null)
  }else {
    var node__16489 = xs__16488.slice(0, 32);
    var v__16490 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__16489, null);
    var i__16491 = 32;
    var out__16492 = cljs.core._as_transient.call(null, v__16490);
    while(true) {
      if(i__16491 < l__16487) {
        var G__16493 = i__16491 + 1;
        var G__16494 = cljs.core.conj_BANG_.call(null, out__16492, xs__16488[i__16491]);
        i__16491 = G__16493;
        out__16492 = G__16494;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16492)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__16495) {
    var args = cljs.core.seq(arglist__16495);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16496 = this;
  if(this__16496.off + 1 < this__16496.node.length) {
    var s__16497 = cljs.core.chunked_seq.call(null, this__16496.vec, this__16496.node, this__16496.i, this__16496.off + 1);
    if(s__16497 == null) {
      return null
    }else {
      return s__16497
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16498 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16499 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16500 = this;
  return this__16500.node[this__16500.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16501 = this;
  if(this__16501.off + 1 < this__16501.node.length) {
    var s__16502 = cljs.core.chunked_seq.call(null, this__16501.vec, this__16501.node, this__16501.i, this__16501.off + 1);
    if(s__16502 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__16502
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__16503 = this;
  var l__16504 = this__16503.node.length;
  var s__16505 = this__16503.i + l__16504 < cljs.core._count.call(null, this__16503.vec) ? cljs.core.chunked_seq.call(null, this__16503.vec, this__16503.i + l__16504, 0) : null;
  if(s__16505 == null) {
    return null
  }else {
    return s__16505
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16506 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__16507 = this;
  return cljs.core.chunked_seq.call(null, this__16507.vec, this__16507.node, this__16507.i, this__16507.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__16508 = this;
  return this__16508.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16509 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__16509.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__16510 = this;
  return cljs.core.array_chunk.call(null, this__16510.node, this__16510.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__16511 = this;
  var l__16512 = this__16511.node.length;
  var s__16513 = this__16511.i + l__16512 < cljs.core._count.call(null, this__16511.vec) ? cljs.core.chunked_seq.call(null, this__16511.vec, this__16511.i + l__16512, 0) : null;
  if(s__16513 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__16513
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16516 = this;
  var h__2216__auto____16517 = this__16516.__hash;
  if(!(h__2216__auto____16517 == null)) {
    return h__2216__auto____16517
  }else {
    var h__2216__auto____16518 = cljs.core.hash_coll.call(null, coll);
    this__16516.__hash = h__2216__auto____16518;
    return h__2216__auto____16518
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16519 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16520 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__16521 = this;
  var v_pos__16522 = this__16521.start + key;
  return new cljs.core.Subvec(this__16521.meta, cljs.core._assoc.call(null, this__16521.v, v_pos__16522, val), this__16521.start, this__16521.end > v_pos__16522 + 1 ? this__16521.end : v_pos__16522 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__16548 = null;
  var G__16548__2 = function(this_sym16523, k) {
    var this__16525 = this;
    var this_sym16523__16526 = this;
    var coll__16527 = this_sym16523__16526;
    return coll__16527.cljs$core$ILookup$_lookup$arity$2(coll__16527, k)
  };
  var G__16548__3 = function(this_sym16524, k, not_found) {
    var this__16525 = this;
    var this_sym16524__16528 = this;
    var coll__16529 = this_sym16524__16528;
    return coll__16529.cljs$core$ILookup$_lookup$arity$3(coll__16529, k, not_found)
  };
  G__16548 = function(this_sym16524, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16548__2.call(this, this_sym16524, k);
      case 3:
        return G__16548__3.call(this, this_sym16524, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16548
}();
cljs.core.Subvec.prototype.apply = function(this_sym16514, args16515) {
  var this__16530 = this;
  return this_sym16514.call.apply(this_sym16514, [this_sym16514].concat(args16515.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16531 = this;
  return new cljs.core.Subvec(this__16531.meta, cljs.core._assoc_n.call(null, this__16531.v, this__16531.end, o), this__16531.start, this__16531.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__16532 = this;
  var this__16533 = this;
  return cljs.core.pr_str.call(null, this__16533)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__16534 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__16535 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16536 = this;
  var subvec_seq__16537 = function subvec_seq(i) {
    if(i === this__16536.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__16536.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__16537.call(null, this__16536.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16538 = this;
  return this__16538.end - this__16538.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16539 = this;
  return cljs.core._nth.call(null, this__16539.v, this__16539.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16540 = this;
  if(this__16540.start === this__16540.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__16540.meta, this__16540.v, this__16540.start, this__16540.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__16541 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16542 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16543 = this;
  return new cljs.core.Subvec(meta, this__16543.v, this__16543.start, this__16543.end, this__16543.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16544 = this;
  return this__16544.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16545 = this;
  return cljs.core._nth.call(null, this__16545.v, this__16545.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16546 = this;
  return cljs.core._nth.call(null, this__16546.v, this__16546.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16547 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__16547.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__16550 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__16550, 0, tl.length);
  return ret__16550
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__16554 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__16555 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__16554, subidx__16555, level === 5 ? tail_node : function() {
    var child__16556 = cljs.core.pv_aget.call(null, ret__16554, subidx__16555);
    if(!(child__16556 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__16556, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__16554
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__16561 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__16562 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__16563 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__16561, subidx__16562));
    if(function() {
      var and__3822__auto____16564 = new_child__16563 == null;
      if(and__3822__auto____16564) {
        return subidx__16562 === 0
      }else {
        return and__3822__auto____16564
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__16561, subidx__16562, new_child__16563);
      return node__16561
    }
  }else {
    if(subidx__16562 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__16561, subidx__16562, null);
        return node__16561
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____16569 = 0 <= i;
    if(and__3822__auto____16569) {
      return i < tv.cnt
    }else {
      return and__3822__auto____16569
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__16570 = tv.root;
      var node__16571 = root__16570;
      var level__16572 = tv.shift;
      while(true) {
        if(level__16572 > 0) {
          var G__16573 = cljs.core.tv_ensure_editable.call(null, root__16570.edit, cljs.core.pv_aget.call(null, node__16571, i >>> level__16572 & 31));
          var G__16574 = level__16572 - 5;
          node__16571 = G__16573;
          level__16572 = G__16574;
          continue
        }else {
          return node__16571.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__16614 = null;
  var G__16614__2 = function(this_sym16577, k) {
    var this__16579 = this;
    var this_sym16577__16580 = this;
    var coll__16581 = this_sym16577__16580;
    return coll__16581.cljs$core$ILookup$_lookup$arity$2(coll__16581, k)
  };
  var G__16614__3 = function(this_sym16578, k, not_found) {
    var this__16579 = this;
    var this_sym16578__16582 = this;
    var coll__16583 = this_sym16578__16582;
    return coll__16583.cljs$core$ILookup$_lookup$arity$3(coll__16583, k, not_found)
  };
  G__16614 = function(this_sym16578, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16614__2.call(this, this_sym16578, k);
      case 3:
        return G__16614__3.call(this, this_sym16578, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16614
}();
cljs.core.TransientVector.prototype.apply = function(this_sym16575, args16576) {
  var this__16584 = this;
  return this_sym16575.call.apply(this_sym16575, [this_sym16575].concat(args16576.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16585 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16586 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16587 = this;
  if(this__16587.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16588 = this;
  if(function() {
    var and__3822__auto____16589 = 0 <= n;
    if(and__3822__auto____16589) {
      return n < this__16588.cnt
    }else {
      return and__3822__auto____16589
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16590 = this;
  if(this__16590.root.edit) {
    return this__16590.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__16591 = this;
  if(this__16591.root.edit) {
    if(function() {
      var and__3822__auto____16592 = 0 <= n;
      if(and__3822__auto____16592) {
        return n < this__16591.cnt
      }else {
        return and__3822__auto____16592
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__16591.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__16597 = function go(level, node) {
          var node__16595 = cljs.core.tv_ensure_editable.call(null, this__16591.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__16595, n & 31, val);
            return node__16595
          }else {
            var subidx__16596 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__16595, subidx__16596, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__16595, subidx__16596)));
            return node__16595
          }
        }.call(null, this__16591.shift, this__16591.root);
        this__16591.root = new_root__16597;
        return tcoll
      }
    }else {
      if(n === this__16591.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__16591.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__16598 = this;
  if(this__16598.root.edit) {
    if(this__16598.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__16598.cnt) {
        this__16598.cnt = 0;
        return tcoll
      }else {
        if((this__16598.cnt - 1 & 31) > 0) {
          this__16598.cnt = this__16598.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__16599 = cljs.core.editable_array_for.call(null, tcoll, this__16598.cnt - 2);
            var new_root__16601 = function() {
              var nr__16600 = cljs.core.tv_pop_tail.call(null, tcoll, this__16598.shift, this__16598.root);
              if(!(nr__16600 == null)) {
                return nr__16600
              }else {
                return new cljs.core.VectorNode(this__16598.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____16602 = 5 < this__16598.shift;
              if(and__3822__auto____16602) {
                return cljs.core.pv_aget.call(null, new_root__16601, 1) == null
              }else {
                return and__3822__auto____16602
              }
            }()) {
              var new_root__16603 = cljs.core.tv_ensure_editable.call(null, this__16598.root.edit, cljs.core.pv_aget.call(null, new_root__16601, 0));
              this__16598.root = new_root__16603;
              this__16598.shift = this__16598.shift - 5;
              this__16598.cnt = this__16598.cnt - 1;
              this__16598.tail = new_tail__16599;
              return tcoll
            }else {
              this__16598.root = new_root__16601;
              this__16598.cnt = this__16598.cnt - 1;
              this__16598.tail = new_tail__16599;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16604 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16605 = this;
  if(this__16605.root.edit) {
    if(this__16605.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__16605.tail[this__16605.cnt & 31] = o;
      this__16605.cnt = this__16605.cnt + 1;
      return tcoll
    }else {
      var tail_node__16606 = new cljs.core.VectorNode(this__16605.root.edit, this__16605.tail);
      var new_tail__16607 = cljs.core.make_array.call(null, 32);
      new_tail__16607[0] = o;
      this__16605.tail = new_tail__16607;
      if(this__16605.cnt >>> 5 > 1 << this__16605.shift) {
        var new_root_array__16608 = cljs.core.make_array.call(null, 32);
        var new_shift__16609 = this__16605.shift + 5;
        new_root_array__16608[0] = this__16605.root;
        new_root_array__16608[1] = cljs.core.new_path.call(null, this__16605.root.edit, this__16605.shift, tail_node__16606);
        this__16605.root = new cljs.core.VectorNode(this__16605.root.edit, new_root_array__16608);
        this__16605.shift = new_shift__16609;
        this__16605.cnt = this__16605.cnt + 1;
        return tcoll
      }else {
        var new_root__16610 = cljs.core.tv_push_tail.call(null, tcoll, this__16605.shift, this__16605.root, tail_node__16606);
        this__16605.root = new_root__16610;
        this__16605.cnt = this__16605.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16611 = this;
  if(this__16611.root.edit) {
    this__16611.root.edit = null;
    var len__16612 = this__16611.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__16613 = cljs.core.make_array.call(null, len__16612);
    cljs.core.array_copy.call(null, this__16611.tail, 0, trimmed_tail__16613, 0, len__16612);
    return new cljs.core.PersistentVector(null, this__16611.cnt, this__16611.shift, this__16611.root, trimmed_tail__16613, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16615 = this;
  var h__2216__auto____16616 = this__16615.__hash;
  if(!(h__2216__auto____16616 == null)) {
    return h__2216__auto____16616
  }else {
    var h__2216__auto____16617 = cljs.core.hash_coll.call(null, coll);
    this__16615.__hash = h__2216__auto____16617;
    return h__2216__auto____16617
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16618 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__16619 = this;
  var this__16620 = this;
  return cljs.core.pr_str.call(null, this__16620)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16621 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16622 = this;
  return cljs.core._first.call(null, this__16622.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16623 = this;
  var temp__3971__auto____16624 = cljs.core.next.call(null, this__16623.front);
  if(temp__3971__auto____16624) {
    var f1__16625 = temp__3971__auto____16624;
    return new cljs.core.PersistentQueueSeq(this__16623.meta, f1__16625, this__16623.rear, null)
  }else {
    if(this__16623.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__16623.meta, this__16623.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16626 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16627 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__16627.front, this__16627.rear, this__16627.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16628 = this;
  return this__16628.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16629 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16629.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16630 = this;
  var h__2216__auto____16631 = this__16630.__hash;
  if(!(h__2216__auto____16631 == null)) {
    return h__2216__auto____16631
  }else {
    var h__2216__auto____16632 = cljs.core.hash_coll.call(null, coll);
    this__16630.__hash = h__2216__auto____16632;
    return h__2216__auto____16632
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16633 = this;
  if(cljs.core.truth_(this__16633.front)) {
    return new cljs.core.PersistentQueue(this__16633.meta, this__16633.count + 1, this__16633.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____16634 = this__16633.rear;
      if(cljs.core.truth_(or__3824__auto____16634)) {
        return or__3824__auto____16634
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__16633.meta, this__16633.count + 1, cljs.core.conj.call(null, this__16633.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__16635 = this;
  var this__16636 = this;
  return cljs.core.pr_str.call(null, this__16636)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16637 = this;
  var rear__16638 = cljs.core.seq.call(null, this__16637.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____16639 = this__16637.front;
    if(cljs.core.truth_(or__3824__auto____16639)) {
      return or__3824__auto____16639
    }else {
      return rear__16638
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__16637.front, cljs.core.seq.call(null, rear__16638), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16640 = this;
  return this__16640.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16641 = this;
  return cljs.core._first.call(null, this__16641.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16642 = this;
  if(cljs.core.truth_(this__16642.front)) {
    var temp__3971__auto____16643 = cljs.core.next.call(null, this__16642.front);
    if(temp__3971__auto____16643) {
      var f1__16644 = temp__3971__auto____16643;
      return new cljs.core.PersistentQueue(this__16642.meta, this__16642.count - 1, f1__16644, this__16642.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__16642.meta, this__16642.count - 1, cljs.core.seq.call(null, this__16642.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16645 = this;
  return cljs.core.first.call(null, this__16645.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16646 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16647 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16648 = this;
  return new cljs.core.PersistentQueue(meta, this__16648.count, this__16648.front, this__16648.rear, this__16648.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16649 = this;
  return this__16649.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16650 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__16651 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__16654 = array.length;
  var i__16655 = 0;
  while(true) {
    if(i__16655 < len__16654) {
      if(k === array[i__16655]) {
        return i__16655
      }else {
        var G__16656 = i__16655 + incr;
        i__16655 = G__16656;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__16659 = cljs.core.hash.call(null, a);
  var b__16660 = cljs.core.hash.call(null, b);
  if(a__16659 < b__16660) {
    return-1
  }else {
    if(a__16659 > b__16660) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__16668 = m.keys;
  var len__16669 = ks__16668.length;
  var so__16670 = m.strobj;
  var out__16671 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__16672 = 0;
  var out__16673 = cljs.core.transient$.call(null, out__16671);
  while(true) {
    if(i__16672 < len__16669) {
      var k__16674 = ks__16668[i__16672];
      var G__16675 = i__16672 + 1;
      var G__16676 = cljs.core.assoc_BANG_.call(null, out__16673, k__16674, so__16670[k__16674]);
      i__16672 = G__16675;
      out__16673 = G__16676;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__16673, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__16682 = {};
  var l__16683 = ks.length;
  var i__16684 = 0;
  while(true) {
    if(i__16684 < l__16683) {
      var k__16685 = ks[i__16684];
      new_obj__16682[k__16685] = obj[k__16685];
      var G__16686 = i__16684 + 1;
      i__16684 = G__16686;
      continue
    }else {
    }
    break
  }
  return new_obj__16682
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16689 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16690 = this;
  var h__2216__auto____16691 = this__16690.__hash;
  if(!(h__2216__auto____16691 == null)) {
    return h__2216__auto____16691
  }else {
    var h__2216__auto____16692 = cljs.core.hash_imap.call(null, coll);
    this__16690.__hash = h__2216__auto____16692;
    return h__2216__auto____16692
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16693 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16694 = this;
  if(function() {
    var and__3822__auto____16695 = goog.isString(k);
    if(and__3822__auto____16695) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16694.keys) == null)
    }else {
      return and__3822__auto____16695
    }
  }()) {
    return this__16694.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16696 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____16697 = this__16696.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____16697) {
        return or__3824__auto____16697
      }else {
        return this__16696.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__16696.keys) == null)) {
        var new_strobj__16698 = cljs.core.obj_clone.call(null, this__16696.strobj, this__16696.keys);
        new_strobj__16698[k] = v;
        return new cljs.core.ObjMap(this__16696.meta, this__16696.keys, new_strobj__16698, this__16696.update_count + 1, null)
      }else {
        var new_strobj__16699 = cljs.core.obj_clone.call(null, this__16696.strobj, this__16696.keys);
        var new_keys__16700 = this__16696.keys.slice();
        new_strobj__16699[k] = v;
        new_keys__16700.push(k);
        return new cljs.core.ObjMap(this__16696.meta, new_keys__16700, new_strobj__16699, this__16696.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16701 = this;
  if(function() {
    var and__3822__auto____16702 = goog.isString(k);
    if(and__3822__auto____16702) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16701.keys) == null)
    }else {
      return and__3822__auto____16702
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16724 = null;
  var G__16724__2 = function(this_sym16703, k) {
    var this__16705 = this;
    var this_sym16703__16706 = this;
    var coll__16707 = this_sym16703__16706;
    return coll__16707.cljs$core$ILookup$_lookup$arity$2(coll__16707, k)
  };
  var G__16724__3 = function(this_sym16704, k, not_found) {
    var this__16705 = this;
    var this_sym16704__16708 = this;
    var coll__16709 = this_sym16704__16708;
    return coll__16709.cljs$core$ILookup$_lookup$arity$3(coll__16709, k, not_found)
  };
  G__16724 = function(this_sym16704, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16724__2.call(this, this_sym16704, k);
      case 3:
        return G__16724__3.call(this, this_sym16704, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16724
}();
cljs.core.ObjMap.prototype.apply = function(this_sym16687, args16688) {
  var this__16710 = this;
  return this_sym16687.call.apply(this_sym16687, [this_sym16687].concat(args16688.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16711 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__16712 = this;
  var this__16713 = this;
  return cljs.core.pr_str.call(null, this__16713)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16714 = this;
  if(this__16714.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__16677_SHARP_) {
      return cljs.core.vector.call(null, p1__16677_SHARP_, this__16714.strobj[p1__16677_SHARP_])
    }, this__16714.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16715 = this;
  return this__16715.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16716 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16717 = this;
  return new cljs.core.ObjMap(meta, this__16717.keys, this__16717.strobj, this__16717.update_count, this__16717.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16718 = this;
  return this__16718.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16719 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16719.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16720 = this;
  if(function() {
    var and__3822__auto____16721 = goog.isString(k);
    if(and__3822__auto____16721) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16720.keys) == null)
    }else {
      return and__3822__auto____16721
    }
  }()) {
    var new_keys__16722 = this__16720.keys.slice();
    var new_strobj__16723 = cljs.core.obj_clone.call(null, this__16720.strobj, this__16720.keys);
    new_keys__16722.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16722), 1);
    cljs.core.js_delete.call(null, new_strobj__16723, k);
    return new cljs.core.ObjMap(this__16720.meta, new_keys__16722, new_strobj__16723, this__16720.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16728 = this;
  var h__2216__auto____16729 = this__16728.__hash;
  if(!(h__2216__auto____16729 == null)) {
    return h__2216__auto____16729
  }else {
    var h__2216__auto____16730 = cljs.core.hash_imap.call(null, coll);
    this__16728.__hash = h__2216__auto____16730;
    return h__2216__auto____16730
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16731 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16732 = this;
  var bucket__16733 = this__16732.hashobj[cljs.core.hash.call(null, k)];
  var i__16734 = cljs.core.truth_(bucket__16733) ? cljs.core.scan_array.call(null, 2, k, bucket__16733) : null;
  if(cljs.core.truth_(i__16734)) {
    return bucket__16733[i__16734 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16735 = this;
  var h__16736 = cljs.core.hash.call(null, k);
  var bucket__16737 = this__16735.hashobj[h__16736];
  if(cljs.core.truth_(bucket__16737)) {
    var new_bucket__16738 = bucket__16737.slice();
    var new_hashobj__16739 = goog.object.clone(this__16735.hashobj);
    new_hashobj__16739[h__16736] = new_bucket__16738;
    var temp__3971__auto____16740 = cljs.core.scan_array.call(null, 2, k, new_bucket__16738);
    if(cljs.core.truth_(temp__3971__auto____16740)) {
      var i__16741 = temp__3971__auto____16740;
      new_bucket__16738[i__16741 + 1] = v;
      return new cljs.core.HashMap(this__16735.meta, this__16735.count, new_hashobj__16739, null)
    }else {
      new_bucket__16738.push(k, v);
      return new cljs.core.HashMap(this__16735.meta, this__16735.count + 1, new_hashobj__16739, null)
    }
  }else {
    var new_hashobj__16742 = goog.object.clone(this__16735.hashobj);
    new_hashobj__16742[h__16736] = [k, v];
    return new cljs.core.HashMap(this__16735.meta, this__16735.count + 1, new_hashobj__16742, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16743 = this;
  var bucket__16744 = this__16743.hashobj[cljs.core.hash.call(null, k)];
  var i__16745 = cljs.core.truth_(bucket__16744) ? cljs.core.scan_array.call(null, 2, k, bucket__16744) : null;
  if(cljs.core.truth_(i__16745)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16770 = null;
  var G__16770__2 = function(this_sym16746, k) {
    var this__16748 = this;
    var this_sym16746__16749 = this;
    var coll__16750 = this_sym16746__16749;
    return coll__16750.cljs$core$ILookup$_lookup$arity$2(coll__16750, k)
  };
  var G__16770__3 = function(this_sym16747, k, not_found) {
    var this__16748 = this;
    var this_sym16747__16751 = this;
    var coll__16752 = this_sym16747__16751;
    return coll__16752.cljs$core$ILookup$_lookup$arity$3(coll__16752, k, not_found)
  };
  G__16770 = function(this_sym16747, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16770__2.call(this, this_sym16747, k);
      case 3:
        return G__16770__3.call(this, this_sym16747, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16770
}();
cljs.core.HashMap.prototype.apply = function(this_sym16726, args16727) {
  var this__16753 = this;
  return this_sym16726.call.apply(this_sym16726, [this_sym16726].concat(args16727.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16754 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16755 = this;
  var this__16756 = this;
  return cljs.core.pr_str.call(null, this__16756)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16757 = this;
  if(this__16757.count > 0) {
    var hashes__16758 = cljs.core.js_keys.call(null, this__16757.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16725_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16757.hashobj[p1__16725_SHARP_]))
    }, hashes__16758)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16759 = this;
  return this__16759.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16760 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16761 = this;
  return new cljs.core.HashMap(meta, this__16761.count, this__16761.hashobj, this__16761.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16762 = this;
  return this__16762.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16763 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16763.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16764 = this;
  var h__16765 = cljs.core.hash.call(null, k);
  var bucket__16766 = this__16764.hashobj[h__16765];
  var i__16767 = cljs.core.truth_(bucket__16766) ? cljs.core.scan_array.call(null, 2, k, bucket__16766) : null;
  if(cljs.core.not.call(null, i__16767)) {
    return coll
  }else {
    var new_hashobj__16768 = goog.object.clone(this__16764.hashobj);
    if(3 > bucket__16766.length) {
      cljs.core.js_delete.call(null, new_hashobj__16768, h__16765)
    }else {
      var new_bucket__16769 = bucket__16766.slice();
      new_bucket__16769.splice(i__16767, 2);
      new_hashobj__16768[h__16765] = new_bucket__16769
    }
    return new cljs.core.HashMap(this__16764.meta, this__16764.count - 1, new_hashobj__16768, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16771 = ks.length;
  var i__16772 = 0;
  var out__16773 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16772 < len__16771) {
      var G__16774 = i__16772 + 1;
      var G__16775 = cljs.core.assoc.call(null, out__16773, ks[i__16772], vs[i__16772]);
      i__16772 = G__16774;
      out__16773 = G__16775;
      continue
    }else {
      return out__16773
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16779 = m.arr;
  var len__16780 = arr__16779.length;
  var i__16781 = 0;
  while(true) {
    if(len__16780 <= i__16781) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16779[i__16781], k)) {
        return i__16781
      }else {
        if("\ufdd0'else") {
          var G__16782 = i__16781 + 2;
          i__16781 = G__16782;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16785 = this;
  return new cljs.core.TransientArrayMap({}, this__16785.arr.length, this__16785.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16786 = this;
  var h__2216__auto____16787 = this__16786.__hash;
  if(!(h__2216__auto____16787 == null)) {
    return h__2216__auto____16787
  }else {
    var h__2216__auto____16788 = cljs.core.hash_imap.call(null, coll);
    this__16786.__hash = h__2216__auto____16788;
    return h__2216__auto____16788
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16789 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16790 = this;
  var idx__16791 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16791 === -1) {
    return not_found
  }else {
    return this__16790.arr[idx__16791 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16792 = this;
  var idx__16793 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16793 === -1) {
    if(this__16792.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16792.meta, this__16792.cnt + 1, function() {
        var G__16794__16795 = this__16792.arr.slice();
        G__16794__16795.push(k);
        G__16794__16795.push(v);
        return G__16794__16795
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16792.arr[idx__16793 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16792.meta, this__16792.cnt, function() {
          var G__16796__16797 = this__16792.arr.slice();
          G__16796__16797[idx__16793 + 1] = v;
          return G__16796__16797
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16798 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16830 = null;
  var G__16830__2 = function(this_sym16799, k) {
    var this__16801 = this;
    var this_sym16799__16802 = this;
    var coll__16803 = this_sym16799__16802;
    return coll__16803.cljs$core$ILookup$_lookup$arity$2(coll__16803, k)
  };
  var G__16830__3 = function(this_sym16800, k, not_found) {
    var this__16801 = this;
    var this_sym16800__16804 = this;
    var coll__16805 = this_sym16800__16804;
    return coll__16805.cljs$core$ILookup$_lookup$arity$3(coll__16805, k, not_found)
  };
  G__16830 = function(this_sym16800, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16830__2.call(this, this_sym16800, k);
      case 3:
        return G__16830__3.call(this, this_sym16800, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16830
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16783, args16784) {
  var this__16806 = this;
  return this_sym16783.call.apply(this_sym16783, [this_sym16783].concat(args16784.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16807 = this;
  var len__16808 = this__16807.arr.length;
  var i__16809 = 0;
  var init__16810 = init;
  while(true) {
    if(i__16809 < len__16808) {
      var init__16811 = f.call(null, init__16810, this__16807.arr[i__16809], this__16807.arr[i__16809 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16811)) {
        return cljs.core.deref.call(null, init__16811)
      }else {
        var G__16831 = i__16809 + 2;
        var G__16832 = init__16811;
        i__16809 = G__16831;
        init__16810 = G__16832;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16812 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16813 = this;
  var this__16814 = this;
  return cljs.core.pr_str.call(null, this__16814)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16815 = this;
  if(this__16815.cnt > 0) {
    var len__16816 = this__16815.arr.length;
    var array_map_seq__16817 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16816) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16815.arr[i], this__16815.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16817.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16818 = this;
  return this__16818.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16819 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16820 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16820.cnt, this__16820.arr, this__16820.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16821 = this;
  return this__16821.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16822 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16822.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16823 = this;
  var idx__16824 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16824 >= 0) {
    var len__16825 = this__16823.arr.length;
    var new_len__16826 = len__16825 - 2;
    if(new_len__16826 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16827 = cljs.core.make_array.call(null, new_len__16826);
      var s__16828 = 0;
      var d__16829 = 0;
      while(true) {
        if(s__16828 >= len__16825) {
          return new cljs.core.PersistentArrayMap(this__16823.meta, this__16823.cnt - 1, new_arr__16827, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16823.arr[s__16828])) {
            var G__16833 = s__16828 + 2;
            var G__16834 = d__16829;
            s__16828 = G__16833;
            d__16829 = G__16834;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16827[d__16829] = this__16823.arr[s__16828];
              new_arr__16827[d__16829 + 1] = this__16823.arr[s__16828 + 1];
              var G__16835 = s__16828 + 2;
              var G__16836 = d__16829 + 2;
              s__16828 = G__16835;
              d__16829 = G__16836;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__16837 = cljs.core.count.call(null, ks);
  var i__16838 = 0;
  var out__16839 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16838 < len__16837) {
      var G__16840 = i__16838 + 1;
      var G__16841 = cljs.core.assoc_BANG_.call(null, out__16839, ks[i__16838], vs[i__16838]);
      i__16838 = G__16840;
      out__16839 = G__16841;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16839)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16842 = this;
  if(cljs.core.truth_(this__16842.editable_QMARK_)) {
    var idx__16843 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16843 >= 0) {
      this__16842.arr[idx__16843] = this__16842.arr[this__16842.len - 2];
      this__16842.arr[idx__16843 + 1] = this__16842.arr[this__16842.len - 1];
      var G__16844__16845 = this__16842.arr;
      G__16844__16845.pop();
      G__16844__16845.pop();
      G__16844__16845;
      this__16842.len = this__16842.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16846 = this;
  if(cljs.core.truth_(this__16846.editable_QMARK_)) {
    var idx__16847 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16847 === -1) {
      if(this__16846.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__16846.len = this__16846.len + 2;
        this__16846.arr.push(key);
        this__16846.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__16846.len, this__16846.arr), key, val)
      }
    }else {
      if(val === this__16846.arr[idx__16847 + 1]) {
        return tcoll
      }else {
        this__16846.arr[idx__16847 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16848 = this;
  if(cljs.core.truth_(this__16848.editable_QMARK_)) {
    if(function() {
      var G__16849__16850 = o;
      if(G__16849__16850) {
        if(function() {
          var or__3824__auto____16851 = G__16849__16850.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16851) {
            return or__3824__auto____16851
          }else {
            return G__16849__16850.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16849__16850.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16849__16850)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16849__16850)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16852 = cljs.core.seq.call(null, o);
      var tcoll__16853 = tcoll;
      while(true) {
        var temp__3971__auto____16854 = cljs.core.first.call(null, es__16852);
        if(cljs.core.truth_(temp__3971__auto____16854)) {
          var e__16855 = temp__3971__auto____16854;
          var G__16861 = cljs.core.next.call(null, es__16852);
          var G__16862 = tcoll__16853.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__16853, cljs.core.key.call(null, e__16855), cljs.core.val.call(null, e__16855));
          es__16852 = G__16861;
          tcoll__16853 = G__16862;
          continue
        }else {
          return tcoll__16853
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16856 = this;
  if(cljs.core.truth_(this__16856.editable_QMARK_)) {
    this__16856.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__16856.len, 2), this__16856.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16857 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16858 = this;
  if(cljs.core.truth_(this__16858.editable_QMARK_)) {
    var idx__16859 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__16859 === -1) {
      return not_found
    }else {
      return this__16858.arr[idx__16859 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16860 = this;
  if(cljs.core.truth_(this__16860.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__16860.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__16865 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__16866 = 0;
  while(true) {
    if(i__16866 < len) {
      var G__16867 = cljs.core.assoc_BANG_.call(null, out__16865, arr[i__16866], arr[i__16866 + 1]);
      var G__16868 = i__16866 + 2;
      out__16865 = G__16867;
      i__16866 = G__16868;
      continue
    }else {
      return out__16865
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2334__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__16873__16874 = arr.slice();
    G__16873__16874[i] = a;
    return G__16873__16874
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__16875__16876 = arr.slice();
    G__16875__16876[i] = a;
    G__16875__16876[j] = b;
    return G__16875__16876
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__16878 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__16878, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__16878, 2 * i, new_arr__16878.length - 2 * i);
  return new_arr__16878
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__16881 = inode.ensure_editable(edit);
    editable__16881.arr[i] = a;
    return editable__16881
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__16882 = inode.ensure_editable(edit);
    editable__16882.arr[i] = a;
    editable__16882.arr[j] = b;
    return editable__16882
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__16889 = arr.length;
  var i__16890 = 0;
  var init__16891 = init;
  while(true) {
    if(i__16890 < len__16889) {
      var init__16894 = function() {
        var k__16892 = arr[i__16890];
        if(!(k__16892 == null)) {
          return f.call(null, init__16891, k__16892, arr[i__16890 + 1])
        }else {
          var node__16893 = arr[i__16890 + 1];
          if(!(node__16893 == null)) {
            return node__16893.kv_reduce(f, init__16891)
          }else {
            return init__16891
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16894)) {
        return cljs.core.deref.call(null, init__16894)
      }else {
        var G__16895 = i__16890 + 2;
        var G__16896 = init__16894;
        i__16890 = G__16895;
        init__16891 = G__16896;
        continue
      }
    }else {
      return init__16891
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__16897 = this;
  var inode__16898 = this;
  if(this__16897.bitmap === bit) {
    return null
  }else {
    var editable__16899 = inode__16898.ensure_editable(e);
    var earr__16900 = editable__16899.arr;
    var len__16901 = earr__16900.length;
    editable__16899.bitmap = bit ^ editable__16899.bitmap;
    cljs.core.array_copy.call(null, earr__16900, 2 * (i + 1), earr__16900, 2 * i, len__16901 - 2 * (i + 1));
    earr__16900[len__16901 - 2] = null;
    earr__16900[len__16901 - 1] = null;
    return editable__16899
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16902 = this;
  var inode__16903 = this;
  var bit__16904 = 1 << (hash >>> shift & 31);
  var idx__16905 = cljs.core.bitmap_indexed_node_index.call(null, this__16902.bitmap, bit__16904);
  if((this__16902.bitmap & bit__16904) === 0) {
    var n__16906 = cljs.core.bit_count.call(null, this__16902.bitmap);
    if(2 * n__16906 < this__16902.arr.length) {
      var editable__16907 = inode__16903.ensure_editable(edit);
      var earr__16908 = editable__16907.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__16908, 2 * idx__16905, earr__16908, 2 * (idx__16905 + 1), 2 * (n__16906 - idx__16905));
      earr__16908[2 * idx__16905] = key;
      earr__16908[2 * idx__16905 + 1] = val;
      editable__16907.bitmap = editable__16907.bitmap | bit__16904;
      return editable__16907
    }else {
      if(n__16906 >= 16) {
        var nodes__16909 = cljs.core.make_array.call(null, 32);
        var jdx__16910 = hash >>> shift & 31;
        nodes__16909[jdx__16910] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__16911 = 0;
        var j__16912 = 0;
        while(true) {
          if(i__16911 < 32) {
            if((this__16902.bitmap >>> i__16911 & 1) === 0) {
              var G__16965 = i__16911 + 1;
              var G__16966 = j__16912;
              i__16911 = G__16965;
              j__16912 = G__16966;
              continue
            }else {
              nodes__16909[i__16911] = !(this__16902.arr[j__16912] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__16902.arr[j__16912]), this__16902.arr[j__16912], this__16902.arr[j__16912 + 1], added_leaf_QMARK_) : this__16902.arr[j__16912 + 1];
              var G__16967 = i__16911 + 1;
              var G__16968 = j__16912 + 2;
              i__16911 = G__16967;
              j__16912 = G__16968;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__16906 + 1, nodes__16909)
      }else {
        if("\ufdd0'else") {
          var new_arr__16913 = cljs.core.make_array.call(null, 2 * (n__16906 + 4));
          cljs.core.array_copy.call(null, this__16902.arr, 0, new_arr__16913, 0, 2 * idx__16905);
          new_arr__16913[2 * idx__16905] = key;
          new_arr__16913[2 * idx__16905 + 1] = val;
          cljs.core.array_copy.call(null, this__16902.arr, 2 * idx__16905, new_arr__16913, 2 * (idx__16905 + 1), 2 * (n__16906 - idx__16905));
          added_leaf_QMARK_.val = true;
          var editable__16914 = inode__16903.ensure_editable(edit);
          editable__16914.arr = new_arr__16913;
          editable__16914.bitmap = editable__16914.bitmap | bit__16904;
          return editable__16914
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__16915 = this__16902.arr[2 * idx__16905];
    var val_or_node__16916 = this__16902.arr[2 * idx__16905 + 1];
    if(key_or_nil__16915 == null) {
      var n__16917 = val_or_node__16916.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16917 === val_or_node__16916) {
        return inode__16903
      }else {
        return cljs.core.edit_and_set.call(null, inode__16903, edit, 2 * idx__16905 + 1, n__16917)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16915)) {
        if(val === val_or_node__16916) {
          return inode__16903
        }else {
          return cljs.core.edit_and_set.call(null, inode__16903, edit, 2 * idx__16905 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__16903, edit, 2 * idx__16905, null, 2 * idx__16905 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__16915, val_or_node__16916, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__16918 = this;
  var inode__16919 = this;
  return cljs.core.create_inode_seq.call(null, this__16918.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16920 = this;
  var inode__16921 = this;
  var bit__16922 = 1 << (hash >>> shift & 31);
  if((this__16920.bitmap & bit__16922) === 0) {
    return inode__16921
  }else {
    var idx__16923 = cljs.core.bitmap_indexed_node_index.call(null, this__16920.bitmap, bit__16922);
    var key_or_nil__16924 = this__16920.arr[2 * idx__16923];
    var val_or_node__16925 = this__16920.arr[2 * idx__16923 + 1];
    if(key_or_nil__16924 == null) {
      var n__16926 = val_or_node__16925.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__16926 === val_or_node__16925) {
        return inode__16921
      }else {
        if(!(n__16926 == null)) {
          return cljs.core.edit_and_set.call(null, inode__16921, edit, 2 * idx__16923 + 1, n__16926)
        }else {
          if(this__16920.bitmap === bit__16922) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__16921.edit_and_remove_pair(edit, bit__16922, idx__16923)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16924)) {
        removed_leaf_QMARK_[0] = true;
        return inode__16921.edit_and_remove_pair(edit, bit__16922, idx__16923)
      }else {
        if("\ufdd0'else") {
          return inode__16921
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__16927 = this;
  var inode__16928 = this;
  if(e === this__16927.edit) {
    return inode__16928
  }else {
    var n__16929 = cljs.core.bit_count.call(null, this__16927.bitmap);
    var new_arr__16930 = cljs.core.make_array.call(null, n__16929 < 0 ? 4 : 2 * (n__16929 + 1));
    cljs.core.array_copy.call(null, this__16927.arr, 0, new_arr__16930, 0, 2 * n__16929);
    return new cljs.core.BitmapIndexedNode(e, this__16927.bitmap, new_arr__16930)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__16931 = this;
  var inode__16932 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16931.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16933 = this;
  var inode__16934 = this;
  var bit__16935 = 1 << (hash >>> shift & 31);
  if((this__16933.bitmap & bit__16935) === 0) {
    return not_found
  }else {
    var idx__16936 = cljs.core.bitmap_indexed_node_index.call(null, this__16933.bitmap, bit__16935);
    var key_or_nil__16937 = this__16933.arr[2 * idx__16936];
    var val_or_node__16938 = this__16933.arr[2 * idx__16936 + 1];
    if(key_or_nil__16937 == null) {
      return val_or_node__16938.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16937)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__16937, val_or_node__16938], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__16939 = this;
  var inode__16940 = this;
  var bit__16941 = 1 << (hash >>> shift & 31);
  if((this__16939.bitmap & bit__16941) === 0) {
    return inode__16940
  }else {
    var idx__16942 = cljs.core.bitmap_indexed_node_index.call(null, this__16939.bitmap, bit__16941);
    var key_or_nil__16943 = this__16939.arr[2 * idx__16942];
    var val_or_node__16944 = this__16939.arr[2 * idx__16942 + 1];
    if(key_or_nil__16943 == null) {
      var n__16945 = val_or_node__16944.inode_without(shift + 5, hash, key);
      if(n__16945 === val_or_node__16944) {
        return inode__16940
      }else {
        if(!(n__16945 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__16939.bitmap, cljs.core.clone_and_set.call(null, this__16939.arr, 2 * idx__16942 + 1, n__16945))
        }else {
          if(this__16939.bitmap === bit__16941) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__16939.bitmap ^ bit__16941, cljs.core.remove_pair.call(null, this__16939.arr, idx__16942))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16943)) {
        return new cljs.core.BitmapIndexedNode(null, this__16939.bitmap ^ bit__16941, cljs.core.remove_pair.call(null, this__16939.arr, idx__16942))
      }else {
        if("\ufdd0'else") {
          return inode__16940
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16946 = this;
  var inode__16947 = this;
  var bit__16948 = 1 << (hash >>> shift & 31);
  var idx__16949 = cljs.core.bitmap_indexed_node_index.call(null, this__16946.bitmap, bit__16948);
  if((this__16946.bitmap & bit__16948) === 0) {
    var n__16950 = cljs.core.bit_count.call(null, this__16946.bitmap);
    if(n__16950 >= 16) {
      var nodes__16951 = cljs.core.make_array.call(null, 32);
      var jdx__16952 = hash >>> shift & 31;
      nodes__16951[jdx__16952] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__16953 = 0;
      var j__16954 = 0;
      while(true) {
        if(i__16953 < 32) {
          if((this__16946.bitmap >>> i__16953 & 1) === 0) {
            var G__16969 = i__16953 + 1;
            var G__16970 = j__16954;
            i__16953 = G__16969;
            j__16954 = G__16970;
            continue
          }else {
            nodes__16951[i__16953] = !(this__16946.arr[j__16954] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__16946.arr[j__16954]), this__16946.arr[j__16954], this__16946.arr[j__16954 + 1], added_leaf_QMARK_) : this__16946.arr[j__16954 + 1];
            var G__16971 = i__16953 + 1;
            var G__16972 = j__16954 + 2;
            i__16953 = G__16971;
            j__16954 = G__16972;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__16950 + 1, nodes__16951)
    }else {
      var new_arr__16955 = cljs.core.make_array.call(null, 2 * (n__16950 + 1));
      cljs.core.array_copy.call(null, this__16946.arr, 0, new_arr__16955, 0, 2 * idx__16949);
      new_arr__16955[2 * idx__16949] = key;
      new_arr__16955[2 * idx__16949 + 1] = val;
      cljs.core.array_copy.call(null, this__16946.arr, 2 * idx__16949, new_arr__16955, 2 * (idx__16949 + 1), 2 * (n__16950 - idx__16949));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__16946.bitmap | bit__16948, new_arr__16955)
    }
  }else {
    var key_or_nil__16956 = this__16946.arr[2 * idx__16949];
    var val_or_node__16957 = this__16946.arr[2 * idx__16949 + 1];
    if(key_or_nil__16956 == null) {
      var n__16958 = val_or_node__16957.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16958 === val_or_node__16957) {
        return inode__16947
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__16946.bitmap, cljs.core.clone_and_set.call(null, this__16946.arr, 2 * idx__16949 + 1, n__16958))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16956)) {
        if(val === val_or_node__16957) {
          return inode__16947
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__16946.bitmap, cljs.core.clone_and_set.call(null, this__16946.arr, 2 * idx__16949 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__16946.bitmap, cljs.core.clone_and_set.call(null, this__16946.arr, 2 * idx__16949, null, 2 * idx__16949 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__16956, val_or_node__16957, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16959 = this;
  var inode__16960 = this;
  var bit__16961 = 1 << (hash >>> shift & 31);
  if((this__16959.bitmap & bit__16961) === 0) {
    return not_found
  }else {
    var idx__16962 = cljs.core.bitmap_indexed_node_index.call(null, this__16959.bitmap, bit__16961);
    var key_or_nil__16963 = this__16959.arr[2 * idx__16962];
    var val_or_node__16964 = this__16959.arr[2 * idx__16962 + 1];
    if(key_or_nil__16963 == null) {
      return val_or_node__16964.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16963)) {
        return val_or_node__16964
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__16980 = array_node.arr;
  var len__16981 = 2 * (array_node.cnt - 1);
  var new_arr__16982 = cljs.core.make_array.call(null, len__16981);
  var i__16983 = 0;
  var j__16984 = 1;
  var bitmap__16985 = 0;
  while(true) {
    if(i__16983 < len__16981) {
      if(function() {
        var and__3822__auto____16986 = !(i__16983 === idx);
        if(and__3822__auto____16986) {
          return!(arr__16980[i__16983] == null)
        }else {
          return and__3822__auto____16986
        }
      }()) {
        new_arr__16982[j__16984] = arr__16980[i__16983];
        var G__16987 = i__16983 + 1;
        var G__16988 = j__16984 + 2;
        var G__16989 = bitmap__16985 | 1 << i__16983;
        i__16983 = G__16987;
        j__16984 = G__16988;
        bitmap__16985 = G__16989;
        continue
      }else {
        var G__16990 = i__16983 + 1;
        var G__16991 = j__16984;
        var G__16992 = bitmap__16985;
        i__16983 = G__16990;
        j__16984 = G__16991;
        bitmap__16985 = G__16992;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__16985, new_arr__16982)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16993 = this;
  var inode__16994 = this;
  var idx__16995 = hash >>> shift & 31;
  var node__16996 = this__16993.arr[idx__16995];
  if(node__16996 == null) {
    var editable__16997 = cljs.core.edit_and_set.call(null, inode__16994, edit, idx__16995, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__16997.cnt = editable__16997.cnt + 1;
    return editable__16997
  }else {
    var n__16998 = node__16996.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16998 === node__16996) {
      return inode__16994
    }else {
      return cljs.core.edit_and_set.call(null, inode__16994, edit, idx__16995, n__16998)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__16999 = this;
  var inode__17000 = this;
  return cljs.core.create_array_node_seq.call(null, this__16999.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17001 = this;
  var inode__17002 = this;
  var idx__17003 = hash >>> shift & 31;
  var node__17004 = this__17001.arr[idx__17003];
  if(node__17004 == null) {
    return inode__17002
  }else {
    var n__17005 = node__17004.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__17005 === node__17004) {
      return inode__17002
    }else {
      if(n__17005 == null) {
        if(this__17001.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17002, edit, idx__17003)
        }else {
          var editable__17006 = cljs.core.edit_and_set.call(null, inode__17002, edit, idx__17003, n__17005);
          editable__17006.cnt = editable__17006.cnt - 1;
          return editable__17006
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__17002, edit, idx__17003, n__17005)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__17007 = this;
  var inode__17008 = this;
  if(e === this__17007.edit) {
    return inode__17008
  }else {
    return new cljs.core.ArrayNode(e, this__17007.cnt, this__17007.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__17009 = this;
  var inode__17010 = this;
  var len__17011 = this__17009.arr.length;
  var i__17012 = 0;
  var init__17013 = init;
  while(true) {
    if(i__17012 < len__17011) {
      var node__17014 = this__17009.arr[i__17012];
      if(!(node__17014 == null)) {
        var init__17015 = node__17014.kv_reduce(f, init__17013);
        if(cljs.core.reduced_QMARK_.call(null, init__17015)) {
          return cljs.core.deref.call(null, init__17015)
        }else {
          var G__17034 = i__17012 + 1;
          var G__17035 = init__17015;
          i__17012 = G__17034;
          init__17013 = G__17035;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__17013
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17016 = this;
  var inode__17017 = this;
  var idx__17018 = hash >>> shift & 31;
  var node__17019 = this__17016.arr[idx__17018];
  if(!(node__17019 == null)) {
    return node__17019.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__17020 = this;
  var inode__17021 = this;
  var idx__17022 = hash >>> shift & 31;
  var node__17023 = this__17020.arr[idx__17022];
  if(!(node__17023 == null)) {
    var n__17024 = node__17023.inode_without(shift + 5, hash, key);
    if(n__17024 === node__17023) {
      return inode__17021
    }else {
      if(n__17024 == null) {
        if(this__17020.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17021, null, idx__17022)
        }else {
          return new cljs.core.ArrayNode(null, this__17020.cnt - 1, cljs.core.clone_and_set.call(null, this__17020.arr, idx__17022, n__17024))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__17020.cnt, cljs.core.clone_and_set.call(null, this__17020.arr, idx__17022, n__17024))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__17021
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17025 = this;
  var inode__17026 = this;
  var idx__17027 = hash >>> shift & 31;
  var node__17028 = this__17025.arr[idx__17027];
  if(node__17028 == null) {
    return new cljs.core.ArrayNode(null, this__17025.cnt + 1, cljs.core.clone_and_set.call(null, this__17025.arr, idx__17027, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__17029 = node__17028.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17029 === node__17028) {
      return inode__17026
    }else {
      return new cljs.core.ArrayNode(null, this__17025.cnt, cljs.core.clone_and_set.call(null, this__17025.arr, idx__17027, n__17029))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17030 = this;
  var inode__17031 = this;
  var idx__17032 = hash >>> shift & 31;
  var node__17033 = this__17030.arr[idx__17032];
  if(!(node__17033 == null)) {
    return node__17033.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__17038 = 2 * cnt;
  var i__17039 = 0;
  while(true) {
    if(i__17039 < lim__17038) {
      if(cljs.core.key_test.call(null, key, arr[i__17039])) {
        return i__17039
      }else {
        var G__17040 = i__17039 + 2;
        i__17039 = G__17040;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17041 = this;
  var inode__17042 = this;
  if(hash === this__17041.collision_hash) {
    var idx__17043 = cljs.core.hash_collision_node_find_index.call(null, this__17041.arr, this__17041.cnt, key);
    if(idx__17043 === -1) {
      if(this__17041.arr.length > 2 * this__17041.cnt) {
        var editable__17044 = cljs.core.edit_and_set.call(null, inode__17042, edit, 2 * this__17041.cnt, key, 2 * this__17041.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__17044.cnt = editable__17044.cnt + 1;
        return editable__17044
      }else {
        var len__17045 = this__17041.arr.length;
        var new_arr__17046 = cljs.core.make_array.call(null, len__17045 + 2);
        cljs.core.array_copy.call(null, this__17041.arr, 0, new_arr__17046, 0, len__17045);
        new_arr__17046[len__17045] = key;
        new_arr__17046[len__17045 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__17042.ensure_editable_array(edit, this__17041.cnt + 1, new_arr__17046)
      }
    }else {
      if(this__17041.arr[idx__17043 + 1] === val) {
        return inode__17042
      }else {
        return cljs.core.edit_and_set.call(null, inode__17042, edit, idx__17043 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__17041.collision_hash >>> shift & 31), [null, inode__17042, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__17047 = this;
  var inode__17048 = this;
  return cljs.core.create_inode_seq.call(null, this__17047.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17049 = this;
  var inode__17050 = this;
  var idx__17051 = cljs.core.hash_collision_node_find_index.call(null, this__17049.arr, this__17049.cnt, key);
  if(idx__17051 === -1) {
    return inode__17050
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__17049.cnt === 1) {
      return null
    }else {
      var editable__17052 = inode__17050.ensure_editable(edit);
      var earr__17053 = editable__17052.arr;
      earr__17053[idx__17051] = earr__17053[2 * this__17049.cnt - 2];
      earr__17053[idx__17051 + 1] = earr__17053[2 * this__17049.cnt - 1];
      earr__17053[2 * this__17049.cnt - 1] = null;
      earr__17053[2 * this__17049.cnt - 2] = null;
      editable__17052.cnt = editable__17052.cnt - 1;
      return editable__17052
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__17054 = this;
  var inode__17055 = this;
  if(e === this__17054.edit) {
    return inode__17055
  }else {
    var new_arr__17056 = cljs.core.make_array.call(null, 2 * (this__17054.cnt + 1));
    cljs.core.array_copy.call(null, this__17054.arr, 0, new_arr__17056, 0, 2 * this__17054.cnt);
    return new cljs.core.HashCollisionNode(e, this__17054.collision_hash, this__17054.cnt, new_arr__17056)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__17057 = this;
  var inode__17058 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17057.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17059 = this;
  var inode__17060 = this;
  var idx__17061 = cljs.core.hash_collision_node_find_index.call(null, this__17059.arr, this__17059.cnt, key);
  if(idx__17061 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17059.arr[idx__17061])) {
      return cljs.core.PersistentVector.fromArray([this__17059.arr[idx__17061], this__17059.arr[idx__17061 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__17062 = this;
  var inode__17063 = this;
  var idx__17064 = cljs.core.hash_collision_node_find_index.call(null, this__17062.arr, this__17062.cnt, key);
  if(idx__17064 === -1) {
    return inode__17063
  }else {
    if(this__17062.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__17062.collision_hash, this__17062.cnt - 1, cljs.core.remove_pair.call(null, this__17062.arr, cljs.core.quot.call(null, idx__17064, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17065 = this;
  var inode__17066 = this;
  if(hash === this__17065.collision_hash) {
    var idx__17067 = cljs.core.hash_collision_node_find_index.call(null, this__17065.arr, this__17065.cnt, key);
    if(idx__17067 === -1) {
      var len__17068 = this__17065.arr.length;
      var new_arr__17069 = cljs.core.make_array.call(null, len__17068 + 2);
      cljs.core.array_copy.call(null, this__17065.arr, 0, new_arr__17069, 0, len__17068);
      new_arr__17069[len__17068] = key;
      new_arr__17069[len__17068 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__17065.collision_hash, this__17065.cnt + 1, new_arr__17069)
    }else {
      if(cljs.core._EQ_.call(null, this__17065.arr[idx__17067], val)) {
        return inode__17066
      }else {
        return new cljs.core.HashCollisionNode(null, this__17065.collision_hash, this__17065.cnt, cljs.core.clone_and_set.call(null, this__17065.arr, idx__17067 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__17065.collision_hash >>> shift & 31), [null, inode__17066])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17070 = this;
  var inode__17071 = this;
  var idx__17072 = cljs.core.hash_collision_node_find_index.call(null, this__17070.arr, this__17070.cnt, key);
  if(idx__17072 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17070.arr[idx__17072])) {
      return this__17070.arr[idx__17072 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__17073 = this;
  var inode__17074 = this;
  if(e === this__17073.edit) {
    this__17073.arr = array;
    this__17073.cnt = count;
    return inode__17074
  }else {
    return new cljs.core.HashCollisionNode(this__17073.edit, this__17073.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17079 = cljs.core.hash.call(null, key1);
    if(key1hash__17079 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17079, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17080 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__17079, key1, val1, added_leaf_QMARK___17080).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___17080)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__17081 = cljs.core.hash.call(null, key1);
    if(key1hash__17081 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__17081, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___17082 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__17081, key1, val1, added_leaf_QMARK___17082).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___17082)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17083 = this;
  var h__2216__auto____17084 = this__17083.__hash;
  if(!(h__2216__auto____17084 == null)) {
    return h__2216__auto____17084
  }else {
    var h__2216__auto____17085 = cljs.core.hash_coll.call(null, coll);
    this__17083.__hash = h__2216__auto____17085;
    return h__2216__auto____17085
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17086 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__17087 = this;
  var this__17088 = this;
  return cljs.core.pr_str.call(null, this__17088)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17089 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17090 = this;
  if(this__17090.s == null) {
    return cljs.core.PersistentVector.fromArray([this__17090.nodes[this__17090.i], this__17090.nodes[this__17090.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__17090.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17091 = this;
  if(this__17091.s == null) {
    return cljs.core.create_inode_seq.call(null, this__17091.nodes, this__17091.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__17091.nodes, this__17091.i, cljs.core.next.call(null, this__17091.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17092 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17093 = this;
  return new cljs.core.NodeSeq(meta, this__17093.nodes, this__17093.i, this__17093.s, this__17093.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17094 = this;
  return this__17094.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17095 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17095.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__17102 = nodes.length;
      var j__17103 = i;
      while(true) {
        if(j__17103 < len__17102) {
          if(!(nodes[j__17103] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__17103, null, null)
          }else {
            var temp__3971__auto____17104 = nodes[j__17103 + 1];
            if(cljs.core.truth_(temp__3971__auto____17104)) {
              var node__17105 = temp__3971__auto____17104;
              var temp__3971__auto____17106 = node__17105.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____17106)) {
                var node_seq__17107 = temp__3971__auto____17106;
                return new cljs.core.NodeSeq(null, nodes, j__17103 + 2, node_seq__17107, null)
              }else {
                var G__17108 = j__17103 + 2;
                j__17103 = G__17108;
                continue
              }
            }else {
              var G__17109 = j__17103 + 2;
              j__17103 = G__17109;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17110 = this;
  var h__2216__auto____17111 = this__17110.__hash;
  if(!(h__2216__auto____17111 == null)) {
    return h__2216__auto____17111
  }else {
    var h__2216__auto____17112 = cljs.core.hash_coll.call(null, coll);
    this__17110.__hash = h__2216__auto____17112;
    return h__2216__auto____17112
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17113 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__17114 = this;
  var this__17115 = this;
  return cljs.core.pr_str.call(null, this__17115)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17116 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17117 = this;
  return cljs.core.first.call(null, this__17117.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17118 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__17118.nodes, this__17118.i, cljs.core.next.call(null, this__17118.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17119 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17120 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__17120.nodes, this__17120.i, this__17120.s, this__17120.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17121 = this;
  return this__17121.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17122 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17122.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__17129 = nodes.length;
      var j__17130 = i;
      while(true) {
        if(j__17130 < len__17129) {
          var temp__3971__auto____17131 = nodes[j__17130];
          if(cljs.core.truth_(temp__3971__auto____17131)) {
            var nj__17132 = temp__3971__auto____17131;
            var temp__3971__auto____17133 = nj__17132.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____17133)) {
              var ns__17134 = temp__3971__auto____17133;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__17130 + 1, ns__17134, null)
            }else {
              var G__17135 = j__17130 + 1;
              j__17130 = G__17135;
              continue
            }
          }else {
            var G__17136 = j__17130 + 1;
            j__17130 = G__17136;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__17139 = this;
  return new cljs.core.TransientHashMap({}, this__17139.root, this__17139.cnt, this__17139.has_nil_QMARK_, this__17139.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17140 = this;
  var h__2216__auto____17141 = this__17140.__hash;
  if(!(h__2216__auto____17141 == null)) {
    return h__2216__auto____17141
  }else {
    var h__2216__auto____17142 = cljs.core.hash_imap.call(null, coll);
    this__17140.__hash = h__2216__auto____17142;
    return h__2216__auto____17142
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17143 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17144 = this;
  if(k == null) {
    if(this__17144.has_nil_QMARK_) {
      return this__17144.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__17144.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__17144.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17145 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____17146 = this__17145.has_nil_QMARK_;
      if(and__3822__auto____17146) {
        return v === this__17145.nil_val
      }else {
        return and__3822__auto____17146
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__17145.meta, this__17145.has_nil_QMARK_ ? this__17145.cnt : this__17145.cnt + 1, this__17145.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___17147 = new cljs.core.Box(false);
    var new_root__17148 = (this__17145.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__17145.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___17147);
    if(new_root__17148 === this__17145.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__17145.meta, added_leaf_QMARK___17147.val ? this__17145.cnt + 1 : this__17145.cnt, new_root__17148, this__17145.has_nil_QMARK_, this__17145.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17149 = this;
  if(k == null) {
    return this__17149.has_nil_QMARK_
  }else {
    if(this__17149.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__17149.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__17172 = null;
  var G__17172__2 = function(this_sym17150, k) {
    var this__17152 = this;
    var this_sym17150__17153 = this;
    var coll__17154 = this_sym17150__17153;
    return coll__17154.cljs$core$ILookup$_lookup$arity$2(coll__17154, k)
  };
  var G__17172__3 = function(this_sym17151, k, not_found) {
    var this__17152 = this;
    var this_sym17151__17155 = this;
    var coll__17156 = this_sym17151__17155;
    return coll__17156.cljs$core$ILookup$_lookup$arity$3(coll__17156, k, not_found)
  };
  G__17172 = function(this_sym17151, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17172__2.call(this, this_sym17151, k);
      case 3:
        return G__17172__3.call(this, this_sym17151, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17172
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym17137, args17138) {
  var this__17157 = this;
  return this_sym17137.call.apply(this_sym17137, [this_sym17137].concat(args17138.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17158 = this;
  var init__17159 = this__17158.has_nil_QMARK_ ? f.call(null, init, null, this__17158.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__17159)) {
    return cljs.core.deref.call(null, init__17159)
  }else {
    if(!(this__17158.root == null)) {
      return this__17158.root.kv_reduce(f, init__17159)
    }else {
      if("\ufdd0'else") {
        return init__17159
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17160 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__17161 = this;
  var this__17162 = this;
  return cljs.core.pr_str.call(null, this__17162)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17163 = this;
  if(this__17163.cnt > 0) {
    var s__17164 = !(this__17163.root == null) ? this__17163.root.inode_seq() : null;
    if(this__17163.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__17163.nil_val], true), s__17164)
    }else {
      return s__17164
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17165 = this;
  return this__17165.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17166 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17167 = this;
  return new cljs.core.PersistentHashMap(meta, this__17167.cnt, this__17167.root, this__17167.has_nil_QMARK_, this__17167.nil_val, this__17167.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17168 = this;
  return this__17168.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17169 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__17169.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17170 = this;
  if(k == null) {
    if(this__17170.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__17170.meta, this__17170.cnt - 1, this__17170.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__17170.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__17171 = this__17170.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__17171 === this__17170.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__17170.meta, this__17170.cnt - 1, new_root__17171, this__17170.has_nil_QMARK_, this__17170.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__17173 = ks.length;
  var i__17174 = 0;
  var out__17175 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__17174 < len__17173) {
      var G__17176 = i__17174 + 1;
      var G__17177 = cljs.core.assoc_BANG_.call(null, out__17175, ks[i__17174], vs[i__17174]);
      i__17174 = G__17176;
      out__17175 = G__17177;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17175)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__17178 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17179 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__17180 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17181 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17182 = this;
  if(k == null) {
    if(this__17182.has_nil_QMARK_) {
      return this__17182.nil_val
    }else {
      return null
    }
  }else {
    if(this__17182.root == null) {
      return null
    }else {
      return this__17182.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17183 = this;
  if(k == null) {
    if(this__17183.has_nil_QMARK_) {
      return this__17183.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__17183.root == null) {
      return not_found
    }else {
      return this__17183.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17184 = this;
  if(this__17184.edit) {
    return this__17184.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__17185 = this;
  var tcoll__17186 = this;
  if(this__17185.edit) {
    if(function() {
      var G__17187__17188 = o;
      if(G__17187__17188) {
        if(function() {
          var or__3824__auto____17189 = G__17187__17188.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17189) {
            return or__3824__auto____17189
          }else {
            return G__17187__17188.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17187__17188.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17187__17188)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17187__17188)
      }
    }()) {
      return tcoll__17186.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17190 = cljs.core.seq.call(null, o);
      var tcoll__17191 = tcoll__17186;
      while(true) {
        var temp__3971__auto____17192 = cljs.core.first.call(null, es__17190);
        if(cljs.core.truth_(temp__3971__auto____17192)) {
          var e__17193 = temp__3971__auto____17192;
          var G__17204 = cljs.core.next.call(null, es__17190);
          var G__17205 = tcoll__17191.assoc_BANG_(cljs.core.key.call(null, e__17193), cljs.core.val.call(null, e__17193));
          es__17190 = G__17204;
          tcoll__17191 = G__17205;
          continue
        }else {
          return tcoll__17191
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__17194 = this;
  var tcoll__17195 = this;
  if(this__17194.edit) {
    if(k == null) {
      if(this__17194.nil_val === v) {
      }else {
        this__17194.nil_val = v
      }
      if(this__17194.has_nil_QMARK_) {
      }else {
        this__17194.count = this__17194.count + 1;
        this__17194.has_nil_QMARK_ = true
      }
      return tcoll__17195
    }else {
      var added_leaf_QMARK___17196 = new cljs.core.Box(false);
      var node__17197 = (this__17194.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__17194.root).inode_assoc_BANG_(this__17194.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___17196);
      if(node__17197 === this__17194.root) {
      }else {
        this__17194.root = node__17197
      }
      if(added_leaf_QMARK___17196.val) {
        this__17194.count = this__17194.count + 1
      }else {
      }
      return tcoll__17195
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__17198 = this;
  var tcoll__17199 = this;
  if(this__17198.edit) {
    if(k == null) {
      if(this__17198.has_nil_QMARK_) {
        this__17198.has_nil_QMARK_ = false;
        this__17198.nil_val = null;
        this__17198.count = this__17198.count - 1;
        return tcoll__17199
      }else {
        return tcoll__17199
      }
    }else {
      if(this__17198.root == null) {
        return tcoll__17199
      }else {
        var removed_leaf_QMARK___17200 = new cljs.core.Box(false);
        var node__17201 = this__17198.root.inode_without_BANG_(this__17198.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___17200);
        if(node__17201 === this__17198.root) {
        }else {
          this__17198.root = node__17201
        }
        if(cljs.core.truth_(removed_leaf_QMARK___17200[0])) {
          this__17198.count = this__17198.count - 1
        }else {
        }
        return tcoll__17199
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__17202 = this;
  var tcoll__17203 = this;
  if(this__17202.edit) {
    this__17202.edit = null;
    return new cljs.core.PersistentHashMap(null, this__17202.count, this__17202.root, this__17202.has_nil_QMARK_, this__17202.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__17208 = node;
  var stack__17209 = stack;
  while(true) {
    if(!(t__17208 == null)) {
      var G__17210 = ascending_QMARK_ ? t__17208.left : t__17208.right;
      var G__17211 = cljs.core.conj.call(null, stack__17209, t__17208);
      t__17208 = G__17210;
      stack__17209 = G__17211;
      continue
    }else {
      return stack__17209
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17212 = this;
  var h__2216__auto____17213 = this__17212.__hash;
  if(!(h__2216__auto____17213 == null)) {
    return h__2216__auto____17213
  }else {
    var h__2216__auto____17214 = cljs.core.hash_coll.call(null, coll);
    this__17212.__hash = h__2216__auto____17214;
    return h__2216__auto____17214
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17215 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__17216 = this;
  var this__17217 = this;
  return cljs.core.pr_str.call(null, this__17217)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__17218 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17219 = this;
  if(this__17219.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__17219.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__17220 = this;
  return cljs.core.peek.call(null, this__17220.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__17221 = this;
  var t__17222 = cljs.core.first.call(null, this__17221.stack);
  var next_stack__17223 = cljs.core.tree_map_seq_push.call(null, this__17221.ascending_QMARK_ ? t__17222.right : t__17222.left, cljs.core.next.call(null, this__17221.stack), this__17221.ascending_QMARK_);
  if(!(next_stack__17223 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__17223, this__17221.ascending_QMARK_, this__17221.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17224 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17225 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__17225.stack, this__17225.ascending_QMARK_, this__17225.cnt, this__17225.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17226 = this;
  return this__17226.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____17228 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____17228) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____17228
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____17230 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____17230) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____17230
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__17234 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__17234)) {
    return cljs.core.deref.call(null, init__17234)
  }else {
    var init__17235 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__17234) : init__17234;
    if(cljs.core.reduced_QMARK_.call(null, init__17235)) {
      return cljs.core.deref.call(null, init__17235)
    }else {
      var init__17236 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__17235) : init__17235;
      if(cljs.core.reduced_QMARK_.call(null, init__17236)) {
        return cljs.core.deref.call(null, init__17236)
      }else {
        return init__17236
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17239 = this;
  var h__2216__auto____17240 = this__17239.__hash;
  if(!(h__2216__auto____17240 == null)) {
    return h__2216__auto____17240
  }else {
    var h__2216__auto____17241 = cljs.core.hash_coll.call(null, coll);
    this__17239.__hash = h__2216__auto____17241;
    return h__2216__auto____17241
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__17242 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__17243 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__17244 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__17244.key, this__17244.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__17292 = null;
  var G__17292__2 = function(this_sym17245, k) {
    var this__17247 = this;
    var this_sym17245__17248 = this;
    var node__17249 = this_sym17245__17248;
    return node__17249.cljs$core$ILookup$_lookup$arity$2(node__17249, k)
  };
  var G__17292__3 = function(this_sym17246, k, not_found) {
    var this__17247 = this;
    var this_sym17246__17250 = this;
    var node__17251 = this_sym17246__17250;
    return node__17251.cljs$core$ILookup$_lookup$arity$3(node__17251, k, not_found)
  };
  G__17292 = function(this_sym17246, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17292__2.call(this, this_sym17246, k);
      case 3:
        return G__17292__3.call(this, this_sym17246, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17292
}();
cljs.core.BlackNode.prototype.apply = function(this_sym17237, args17238) {
  var this__17252 = this;
  return this_sym17237.call.apply(this_sym17237, [this_sym17237].concat(args17238.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__17253 = this;
  return cljs.core.PersistentVector.fromArray([this__17253.key, this__17253.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__17254 = this;
  return this__17254.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__17255 = this;
  return this__17255.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__17256 = this;
  var node__17257 = this;
  return ins.balance_right(node__17257)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__17258 = this;
  var node__17259 = this;
  return new cljs.core.RedNode(this__17258.key, this__17258.val, this__17258.left, this__17258.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__17260 = this;
  var node__17261 = this;
  return cljs.core.balance_right_del.call(null, this__17260.key, this__17260.val, this__17260.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__17262 = this;
  var node__17263 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__17264 = this;
  var node__17265 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__17265, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__17266 = this;
  var node__17267 = this;
  return cljs.core.balance_left_del.call(null, this__17266.key, this__17266.val, del, this__17266.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__17268 = this;
  var node__17269 = this;
  return ins.balance_left(node__17269)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__17270 = this;
  var node__17271 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__17271, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__17293 = null;
  var G__17293__0 = function() {
    var this__17272 = this;
    var this__17274 = this;
    return cljs.core.pr_str.call(null, this__17274)
  };
  G__17293 = function() {
    switch(arguments.length) {
      case 0:
        return G__17293__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17293
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__17275 = this;
  var node__17276 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__17276, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__17277 = this;
  var node__17278 = this;
  return node__17278
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__17279 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__17280 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__17281 = this;
  return cljs.core.list.call(null, this__17281.key, this__17281.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__17282 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__17283 = this;
  return this__17283.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__17284 = this;
  return cljs.core.PersistentVector.fromArray([this__17284.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__17285 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__17285.key, this__17285.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17286 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__17287 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__17287.key, this__17287.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__17288 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__17289 = this;
  if(n === 0) {
    return this__17289.key
  }else {
    if(n === 1) {
      return this__17289.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__17290 = this;
  if(n === 0) {
    return this__17290.key
  }else {
    if(n === 1) {
      return this__17290.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__17291 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17296 = this;
  var h__2216__auto____17297 = this__17296.__hash;
  if(!(h__2216__auto____17297 == null)) {
    return h__2216__auto____17297
  }else {
    var h__2216__auto____17298 = cljs.core.hash_coll.call(null, coll);
    this__17296.__hash = h__2216__auto____17298;
    return h__2216__auto____17298
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__17299 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__17300 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__17301 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__17301.key, this__17301.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__17349 = null;
  var G__17349__2 = function(this_sym17302, k) {
    var this__17304 = this;
    var this_sym17302__17305 = this;
    var node__17306 = this_sym17302__17305;
    return node__17306.cljs$core$ILookup$_lookup$arity$2(node__17306, k)
  };
  var G__17349__3 = function(this_sym17303, k, not_found) {
    var this__17304 = this;
    var this_sym17303__17307 = this;
    var node__17308 = this_sym17303__17307;
    return node__17308.cljs$core$ILookup$_lookup$arity$3(node__17308, k, not_found)
  };
  G__17349 = function(this_sym17303, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17349__2.call(this, this_sym17303, k);
      case 3:
        return G__17349__3.call(this, this_sym17303, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17349
}();
cljs.core.RedNode.prototype.apply = function(this_sym17294, args17295) {
  var this__17309 = this;
  return this_sym17294.call.apply(this_sym17294, [this_sym17294].concat(args17295.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__17310 = this;
  return cljs.core.PersistentVector.fromArray([this__17310.key, this__17310.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__17311 = this;
  return this__17311.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__17312 = this;
  return this__17312.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__17313 = this;
  var node__17314 = this;
  return new cljs.core.RedNode(this__17313.key, this__17313.val, this__17313.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__17315 = this;
  var node__17316 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__17317 = this;
  var node__17318 = this;
  return new cljs.core.RedNode(this__17317.key, this__17317.val, this__17317.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__17319 = this;
  var node__17320 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__17321 = this;
  var node__17322 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__17322, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__17323 = this;
  var node__17324 = this;
  return new cljs.core.RedNode(this__17323.key, this__17323.val, del, this__17323.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__17325 = this;
  var node__17326 = this;
  return new cljs.core.RedNode(this__17325.key, this__17325.val, ins, this__17325.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__17327 = this;
  var node__17328 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17327.left)) {
    return new cljs.core.RedNode(this__17327.key, this__17327.val, this__17327.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__17327.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17327.right)) {
      return new cljs.core.RedNode(this__17327.right.key, this__17327.right.val, new cljs.core.BlackNode(this__17327.key, this__17327.val, this__17327.left, this__17327.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__17327.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__17328, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__17350 = null;
  var G__17350__0 = function() {
    var this__17329 = this;
    var this__17331 = this;
    return cljs.core.pr_str.call(null, this__17331)
  };
  G__17350 = function() {
    switch(arguments.length) {
      case 0:
        return G__17350__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17350
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__17332 = this;
  var node__17333 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17332.right)) {
    return new cljs.core.RedNode(this__17332.key, this__17332.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__17332.left, null), this__17332.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__17332.left)) {
      return new cljs.core.RedNode(this__17332.left.key, this__17332.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__17332.left.left, null), new cljs.core.BlackNode(this__17332.key, this__17332.val, this__17332.left.right, this__17332.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__17333, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__17334 = this;
  var node__17335 = this;
  return new cljs.core.BlackNode(this__17334.key, this__17334.val, this__17334.left, this__17334.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__17336 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__17337 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__17338 = this;
  return cljs.core.list.call(null, this__17338.key, this__17338.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__17339 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__17340 = this;
  return this__17340.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__17341 = this;
  return cljs.core.PersistentVector.fromArray([this__17341.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__17342 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__17342.key, this__17342.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17343 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__17344 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__17344.key, this__17344.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__17345 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__17346 = this;
  if(n === 0) {
    return this__17346.key
  }else {
    if(n === 1) {
      return this__17346.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__17347 = this;
  if(n === 0) {
    return this__17347.key
  }else {
    if(n === 1) {
      return this__17347.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__17348 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__17354 = comp.call(null, k, tree.key);
    if(c__17354 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__17354 < 0) {
        var ins__17355 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__17355 == null)) {
          return tree.add_left(ins__17355)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__17356 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__17356 == null)) {
            return tree.add_right(ins__17356)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__17359 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__17359)) {
            return new cljs.core.RedNode(app__17359.key, app__17359.val, new cljs.core.RedNode(left.key, left.val, left.left, app__17359.left, null), new cljs.core.RedNode(right.key, right.val, app__17359.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__17359, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__17360 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__17360)) {
              return new cljs.core.RedNode(app__17360.key, app__17360.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__17360.left, null), new cljs.core.BlackNode(right.key, right.val, app__17360.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__17360, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__17366 = comp.call(null, k, tree.key);
    if(c__17366 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__17366 < 0) {
        var del__17367 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____17368 = !(del__17367 == null);
          if(or__3824__auto____17368) {
            return or__3824__auto____17368
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__17367, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__17367, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__17369 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____17370 = !(del__17369 == null);
            if(or__3824__auto____17370) {
              return or__3824__auto____17370
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__17369)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__17369, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__17373 = tree.key;
  var c__17374 = comp.call(null, k, tk__17373);
  if(c__17374 === 0) {
    return tree.replace(tk__17373, v, tree.left, tree.right)
  }else {
    if(c__17374 < 0) {
      return tree.replace(tk__17373, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__17373, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17377 = this;
  var h__2216__auto____17378 = this__17377.__hash;
  if(!(h__2216__auto____17378 == null)) {
    return h__2216__auto____17378
  }else {
    var h__2216__auto____17379 = cljs.core.hash_imap.call(null, coll);
    this__17377.__hash = h__2216__auto____17379;
    return h__2216__auto____17379
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17380 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17381 = this;
  var n__17382 = coll.entry_at(k);
  if(!(n__17382 == null)) {
    return n__17382.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17383 = this;
  var found__17384 = [null];
  var t__17385 = cljs.core.tree_map_add.call(null, this__17383.comp, this__17383.tree, k, v, found__17384);
  if(t__17385 == null) {
    var found_node__17386 = cljs.core.nth.call(null, found__17384, 0);
    if(cljs.core._EQ_.call(null, v, found_node__17386.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__17383.comp, cljs.core.tree_map_replace.call(null, this__17383.comp, this__17383.tree, k, v), this__17383.cnt, this__17383.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__17383.comp, t__17385.blacken(), this__17383.cnt + 1, this__17383.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17387 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__17421 = null;
  var G__17421__2 = function(this_sym17388, k) {
    var this__17390 = this;
    var this_sym17388__17391 = this;
    var coll__17392 = this_sym17388__17391;
    return coll__17392.cljs$core$ILookup$_lookup$arity$2(coll__17392, k)
  };
  var G__17421__3 = function(this_sym17389, k, not_found) {
    var this__17390 = this;
    var this_sym17389__17393 = this;
    var coll__17394 = this_sym17389__17393;
    return coll__17394.cljs$core$ILookup$_lookup$arity$3(coll__17394, k, not_found)
  };
  G__17421 = function(this_sym17389, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17421__2.call(this, this_sym17389, k);
      case 3:
        return G__17421__3.call(this, this_sym17389, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17421
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym17375, args17376) {
  var this__17395 = this;
  return this_sym17375.call.apply(this_sym17375, [this_sym17375].concat(args17376.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17396 = this;
  if(!(this__17396.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__17396.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17397 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17398 = this;
  if(this__17398.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17398.tree, false, this__17398.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__17399 = this;
  var this__17400 = this;
  return cljs.core.pr_str.call(null, this__17400)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__17401 = this;
  var coll__17402 = this;
  var t__17403 = this__17401.tree;
  while(true) {
    if(!(t__17403 == null)) {
      var c__17404 = this__17401.comp.call(null, k, t__17403.key);
      if(c__17404 === 0) {
        return t__17403
      }else {
        if(c__17404 < 0) {
          var G__17422 = t__17403.left;
          t__17403 = G__17422;
          continue
        }else {
          if("\ufdd0'else") {
            var G__17423 = t__17403.right;
            t__17403 = G__17423;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__17405 = this;
  if(this__17405.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17405.tree, ascending_QMARK_, this__17405.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__17406 = this;
  if(this__17406.cnt > 0) {
    var stack__17407 = null;
    var t__17408 = this__17406.tree;
    while(true) {
      if(!(t__17408 == null)) {
        var c__17409 = this__17406.comp.call(null, k, t__17408.key);
        if(c__17409 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__17407, t__17408), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__17409 < 0) {
              var G__17424 = cljs.core.conj.call(null, stack__17407, t__17408);
              var G__17425 = t__17408.left;
              stack__17407 = G__17424;
              t__17408 = G__17425;
              continue
            }else {
              var G__17426 = stack__17407;
              var G__17427 = t__17408.right;
              stack__17407 = G__17426;
              t__17408 = G__17427;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__17409 > 0) {
                var G__17428 = cljs.core.conj.call(null, stack__17407, t__17408);
                var G__17429 = t__17408.right;
                stack__17407 = G__17428;
                t__17408 = G__17429;
                continue
              }else {
                var G__17430 = stack__17407;
                var G__17431 = t__17408.left;
                stack__17407 = G__17430;
                t__17408 = G__17431;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__17407 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__17407, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__17410 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__17411 = this;
  return this__17411.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17412 = this;
  if(this__17412.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__17412.tree, true, this__17412.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17413 = this;
  return this__17413.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17414 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17415 = this;
  return new cljs.core.PersistentTreeMap(this__17415.comp, this__17415.tree, this__17415.cnt, meta, this__17415.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17416 = this;
  return this__17416.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17417 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__17417.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17418 = this;
  var found__17419 = [null];
  var t__17420 = cljs.core.tree_map_remove.call(null, this__17418.comp, this__17418.tree, k, found__17419);
  if(t__17420 == null) {
    if(cljs.core.nth.call(null, found__17419, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__17418.comp, null, 0, this__17418.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__17418.comp, t__17420.blacken(), this__17418.cnt - 1, this__17418.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__17434 = cljs.core.seq.call(null, keyvals);
    var out__17435 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__17434) {
        var G__17436 = cljs.core.nnext.call(null, in__17434);
        var G__17437 = cljs.core.assoc_BANG_.call(null, out__17435, cljs.core.first.call(null, in__17434), cljs.core.second.call(null, in__17434));
        in__17434 = G__17436;
        out__17435 = G__17437;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__17435)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__17438) {
    var keyvals = cljs.core.seq(arglist__17438);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__17439) {
    var keyvals = cljs.core.seq(arglist__17439);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__17443 = [];
    var obj__17444 = {};
    var kvs__17445 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__17445) {
        ks__17443.push(cljs.core.first.call(null, kvs__17445));
        obj__17444[cljs.core.first.call(null, kvs__17445)] = cljs.core.second.call(null, kvs__17445);
        var G__17446 = cljs.core.nnext.call(null, kvs__17445);
        kvs__17445 = G__17446;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__17443, obj__17444)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__17447) {
    var keyvals = cljs.core.seq(arglist__17447);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__17450 = cljs.core.seq.call(null, keyvals);
    var out__17451 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__17450) {
        var G__17452 = cljs.core.nnext.call(null, in__17450);
        var G__17453 = cljs.core.assoc.call(null, out__17451, cljs.core.first.call(null, in__17450), cljs.core.second.call(null, in__17450));
        in__17450 = G__17452;
        out__17451 = G__17453;
        continue
      }else {
        return out__17451
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__17454) {
    var keyvals = cljs.core.seq(arglist__17454);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__17457 = cljs.core.seq.call(null, keyvals);
    var out__17458 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__17457) {
        var G__17459 = cljs.core.nnext.call(null, in__17457);
        var G__17460 = cljs.core.assoc.call(null, out__17458, cljs.core.first.call(null, in__17457), cljs.core.second.call(null, in__17457));
        in__17457 = G__17459;
        out__17458 = G__17460;
        continue
      }else {
        return out__17458
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__17461) {
    var comparator = cljs.core.first(arglist__17461);
    var keyvals = cljs.core.rest(arglist__17461);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__17462_SHARP_, p2__17463_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____17465 = p1__17462_SHARP_;
          if(cljs.core.truth_(or__3824__auto____17465)) {
            return or__3824__auto____17465
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__17463_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__17466) {
    var maps = cljs.core.seq(arglist__17466);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__17474 = function(m, e) {
        var k__17472 = cljs.core.first.call(null, e);
        var v__17473 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__17472)) {
          return cljs.core.assoc.call(null, m, k__17472, f.call(null, cljs.core._lookup.call(null, m, k__17472, null), v__17473))
        }else {
          return cljs.core.assoc.call(null, m, k__17472, v__17473)
        }
      };
      var merge2__17476 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__17474, function() {
          var or__3824__auto____17475 = m1;
          if(cljs.core.truth_(or__3824__auto____17475)) {
            return or__3824__auto____17475
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__17476, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__17477) {
    var f = cljs.core.first(arglist__17477);
    var maps = cljs.core.rest(arglist__17477);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__17482 = cljs.core.ObjMap.EMPTY;
  var keys__17483 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__17483) {
      var key__17484 = cljs.core.first.call(null, keys__17483);
      var entry__17485 = cljs.core._lookup.call(null, map, key__17484, "\ufdd0'user/not-found");
      var G__17486 = cljs.core.not_EQ_.call(null, entry__17485, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__17482, key__17484, entry__17485) : ret__17482;
      var G__17487 = cljs.core.next.call(null, keys__17483);
      ret__17482 = G__17486;
      keys__17483 = G__17487;
      continue
    }else {
      return ret__17482
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__17491 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__17491.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17492 = this;
  var h__2216__auto____17493 = this__17492.__hash;
  if(!(h__2216__auto____17493 == null)) {
    return h__2216__auto____17493
  }else {
    var h__2216__auto____17494 = cljs.core.hash_iset.call(null, coll);
    this__17492.__hash = h__2216__auto____17494;
    return h__2216__auto____17494
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__17495 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__17496 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__17496.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__17517 = null;
  var G__17517__2 = function(this_sym17497, k) {
    var this__17499 = this;
    var this_sym17497__17500 = this;
    var coll__17501 = this_sym17497__17500;
    return coll__17501.cljs$core$ILookup$_lookup$arity$2(coll__17501, k)
  };
  var G__17517__3 = function(this_sym17498, k, not_found) {
    var this__17499 = this;
    var this_sym17498__17502 = this;
    var coll__17503 = this_sym17498__17502;
    return coll__17503.cljs$core$ILookup$_lookup$arity$3(coll__17503, k, not_found)
  };
  G__17517 = function(this_sym17498, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17517__2.call(this, this_sym17498, k);
      case 3:
        return G__17517__3.call(this, this_sym17498, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17517
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym17489, args17490) {
  var this__17504 = this;
  return this_sym17489.call.apply(this_sym17489, [this_sym17489].concat(args17490.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17505 = this;
  return new cljs.core.PersistentHashSet(this__17505.meta, cljs.core.assoc.call(null, this__17505.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__17506 = this;
  var this__17507 = this;
  return cljs.core.pr_str.call(null, this__17507)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17508 = this;
  return cljs.core.keys.call(null, this__17508.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__17509 = this;
  return new cljs.core.PersistentHashSet(this__17509.meta, cljs.core.dissoc.call(null, this__17509.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17510 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17511 = this;
  var and__3822__auto____17512 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____17512) {
    var and__3822__auto____17513 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____17513) {
      return cljs.core.every_QMARK_.call(null, function(p1__17488_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__17488_SHARP_)
      }, other)
    }else {
      return and__3822__auto____17513
    }
  }else {
    return and__3822__auto____17512
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17514 = this;
  return new cljs.core.PersistentHashSet(meta, this__17514.hash_map, this__17514.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17515 = this;
  return this__17515.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17516 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__17516.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__17518 = cljs.core.count.call(null, items);
  var i__17519 = 0;
  var out__17520 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__17519 < len__17518) {
      var G__17521 = i__17519 + 1;
      var G__17522 = cljs.core.conj_BANG_.call(null, out__17520, items[i__17519]);
      i__17519 = G__17521;
      out__17520 = G__17522;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17520)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__17540 = null;
  var G__17540__2 = function(this_sym17526, k) {
    var this__17528 = this;
    var this_sym17526__17529 = this;
    var tcoll__17530 = this_sym17526__17529;
    if(cljs.core._lookup.call(null, this__17528.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__17540__3 = function(this_sym17527, k, not_found) {
    var this__17528 = this;
    var this_sym17527__17531 = this;
    var tcoll__17532 = this_sym17527__17531;
    if(cljs.core._lookup.call(null, this__17528.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__17540 = function(this_sym17527, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17540__2.call(this, this_sym17527, k);
      case 3:
        return G__17540__3.call(this, this_sym17527, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17540
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym17524, args17525) {
  var this__17533 = this;
  return this_sym17524.call.apply(this_sym17524, [this_sym17524].concat(args17525.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__17534 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__17535 = this;
  if(cljs.core._lookup.call(null, this__17535.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17536 = this;
  return cljs.core.count.call(null, this__17536.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__17537 = this;
  this__17537.transient_map = cljs.core.dissoc_BANG_.call(null, this__17537.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17538 = this;
  this__17538.transient_map = cljs.core.assoc_BANG_.call(null, this__17538.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17539 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__17539.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17543 = this;
  var h__2216__auto____17544 = this__17543.__hash;
  if(!(h__2216__auto____17544 == null)) {
    return h__2216__auto____17544
  }else {
    var h__2216__auto____17545 = cljs.core.hash_iset.call(null, coll);
    this__17543.__hash = h__2216__auto____17545;
    return h__2216__auto____17545
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__17546 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__17547 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__17547.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__17573 = null;
  var G__17573__2 = function(this_sym17548, k) {
    var this__17550 = this;
    var this_sym17548__17551 = this;
    var coll__17552 = this_sym17548__17551;
    return coll__17552.cljs$core$ILookup$_lookup$arity$2(coll__17552, k)
  };
  var G__17573__3 = function(this_sym17549, k, not_found) {
    var this__17550 = this;
    var this_sym17549__17553 = this;
    var coll__17554 = this_sym17549__17553;
    return coll__17554.cljs$core$ILookup$_lookup$arity$3(coll__17554, k, not_found)
  };
  G__17573 = function(this_sym17549, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17573__2.call(this, this_sym17549, k);
      case 3:
        return G__17573__3.call(this, this_sym17549, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17573
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym17541, args17542) {
  var this__17555 = this;
  return this_sym17541.call.apply(this_sym17541, [this_sym17541].concat(args17542.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17556 = this;
  return new cljs.core.PersistentTreeSet(this__17556.meta, cljs.core.assoc.call(null, this__17556.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17557 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__17557.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__17558 = this;
  var this__17559 = this;
  return cljs.core.pr_str.call(null, this__17559)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__17560 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__17560.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__17561 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__17561.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__17562 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__17563 = this;
  return cljs.core._comparator.call(null, this__17563.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17564 = this;
  return cljs.core.keys.call(null, this__17564.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__17565 = this;
  return new cljs.core.PersistentTreeSet(this__17565.meta, cljs.core.dissoc.call(null, this__17565.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17566 = this;
  return cljs.core.count.call(null, this__17566.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17567 = this;
  var and__3822__auto____17568 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____17568) {
    var and__3822__auto____17569 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____17569) {
      return cljs.core.every_QMARK_.call(null, function(p1__17523_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__17523_SHARP_)
      }, other)
    }else {
      return and__3822__auto____17569
    }
  }else {
    return and__3822__auto____17568
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17570 = this;
  return new cljs.core.PersistentTreeSet(meta, this__17570.tree_map, this__17570.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17571 = this;
  return this__17571.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17572 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__17572.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__17578__delegate = function(keys) {
      var in__17576 = cljs.core.seq.call(null, keys);
      var out__17577 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__17576)) {
          var G__17579 = cljs.core.next.call(null, in__17576);
          var G__17580 = cljs.core.conj_BANG_.call(null, out__17577, cljs.core.first.call(null, in__17576));
          in__17576 = G__17579;
          out__17577 = G__17580;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__17577)
        }
        break
      }
    };
    var G__17578 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17578__delegate.call(this, keys)
    };
    G__17578.cljs$lang$maxFixedArity = 0;
    G__17578.cljs$lang$applyTo = function(arglist__17581) {
      var keys = cljs.core.seq(arglist__17581);
      return G__17578__delegate(keys)
    };
    G__17578.cljs$lang$arity$variadic = G__17578__delegate;
    return G__17578
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__17582) {
    var keys = cljs.core.seq(arglist__17582);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__17584) {
    var comparator = cljs.core.first(arglist__17584);
    var keys = cljs.core.rest(arglist__17584);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__17590 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____17591 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____17591)) {
        var e__17592 = temp__3971__auto____17591;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__17592))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__17590, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__17583_SHARP_) {
      var temp__3971__auto____17593 = cljs.core.find.call(null, smap, p1__17583_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____17593)) {
        var e__17594 = temp__3971__auto____17593;
        return cljs.core.second.call(null, e__17594)
      }else {
        return p1__17583_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__17624 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__17617, seen) {
        while(true) {
          var vec__17618__17619 = p__17617;
          var f__17620 = cljs.core.nth.call(null, vec__17618__17619, 0, null);
          var xs__17621 = vec__17618__17619;
          var temp__3974__auto____17622 = cljs.core.seq.call(null, xs__17621);
          if(temp__3974__auto____17622) {
            var s__17623 = temp__3974__auto____17622;
            if(cljs.core.contains_QMARK_.call(null, seen, f__17620)) {
              var G__17625 = cljs.core.rest.call(null, s__17623);
              var G__17626 = seen;
              p__17617 = G__17625;
              seen = G__17626;
              continue
            }else {
              return cljs.core.cons.call(null, f__17620, step.call(null, cljs.core.rest.call(null, s__17623), cljs.core.conj.call(null, seen, f__17620)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__17624.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__17629 = cljs.core.PersistentVector.EMPTY;
  var s__17630 = s;
  while(true) {
    if(cljs.core.next.call(null, s__17630)) {
      var G__17631 = cljs.core.conj.call(null, ret__17629, cljs.core.first.call(null, s__17630));
      var G__17632 = cljs.core.next.call(null, s__17630);
      ret__17629 = G__17631;
      s__17630 = G__17632;
      continue
    }else {
      return cljs.core.seq.call(null, ret__17629)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____17635 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____17635) {
        return or__3824__auto____17635
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__17636 = x.lastIndexOf("/");
      if(i__17636 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__17636 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____17639 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____17639) {
      return or__3824__auto____17639
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__17640 = x.lastIndexOf("/");
    if(i__17640 > -1) {
      return cljs.core.subs.call(null, x, 2, i__17640)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__17647 = cljs.core.ObjMap.EMPTY;
  var ks__17648 = cljs.core.seq.call(null, keys);
  var vs__17649 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____17650 = ks__17648;
      if(and__3822__auto____17650) {
        return vs__17649
      }else {
        return and__3822__auto____17650
      }
    }()) {
      var G__17651 = cljs.core.assoc.call(null, map__17647, cljs.core.first.call(null, ks__17648), cljs.core.first.call(null, vs__17649));
      var G__17652 = cljs.core.next.call(null, ks__17648);
      var G__17653 = cljs.core.next.call(null, vs__17649);
      map__17647 = G__17651;
      ks__17648 = G__17652;
      vs__17649 = G__17653;
      continue
    }else {
      return map__17647
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__17656__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17641_SHARP_, p2__17642_SHARP_) {
        return max_key.call(null, k, p1__17641_SHARP_, p2__17642_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__17656 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17656__delegate.call(this, k, x, y, more)
    };
    G__17656.cljs$lang$maxFixedArity = 3;
    G__17656.cljs$lang$applyTo = function(arglist__17657) {
      var k = cljs.core.first(arglist__17657);
      var x = cljs.core.first(cljs.core.next(arglist__17657));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17657)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17657)));
      return G__17656__delegate(k, x, y, more)
    };
    G__17656.cljs$lang$arity$variadic = G__17656__delegate;
    return G__17656
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__17658__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17654_SHARP_, p2__17655_SHARP_) {
        return min_key.call(null, k, p1__17654_SHARP_, p2__17655_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__17658 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17658__delegate.call(this, k, x, y, more)
    };
    G__17658.cljs$lang$maxFixedArity = 3;
    G__17658.cljs$lang$applyTo = function(arglist__17659) {
      var k = cljs.core.first(arglist__17659);
      var x = cljs.core.first(cljs.core.next(arglist__17659));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17659)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17659)));
      return G__17658__delegate(k, x, y, more)
    };
    G__17658.cljs$lang$arity$variadic = G__17658__delegate;
    return G__17658
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17662 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17662) {
        var s__17663 = temp__3974__auto____17662;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__17663), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__17663)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17666 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17666) {
      var s__17667 = temp__3974__auto____17666;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__17667)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17667), take_while.call(null, pred, cljs.core.rest.call(null, s__17667)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__17669 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__17669.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__17681 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____17682 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____17682)) {
        var vec__17683__17684 = temp__3974__auto____17682;
        var e__17685 = cljs.core.nth.call(null, vec__17683__17684, 0, null);
        var s__17686 = vec__17683__17684;
        if(cljs.core.truth_(include__17681.call(null, e__17685))) {
          return s__17686
        }else {
          return cljs.core.next.call(null, s__17686)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17681, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17687 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____17687)) {
      var vec__17688__17689 = temp__3974__auto____17687;
      var e__17690 = cljs.core.nth.call(null, vec__17688__17689, 0, null);
      var s__17691 = vec__17688__17689;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__17690)) ? s__17691 : cljs.core.next.call(null, s__17691))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__17703 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____17704 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____17704)) {
        var vec__17705__17706 = temp__3974__auto____17704;
        var e__17707 = cljs.core.nth.call(null, vec__17705__17706, 0, null);
        var s__17708 = vec__17705__17706;
        if(cljs.core.truth_(include__17703.call(null, e__17707))) {
          return s__17708
        }else {
          return cljs.core.next.call(null, s__17708)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17703, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17709 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____17709)) {
      var vec__17710__17711 = temp__3974__auto____17709;
      var e__17712 = cljs.core.nth.call(null, vec__17710__17711, 0, null);
      var s__17713 = vec__17710__17711;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__17712)) ? s__17713 : cljs.core.next.call(null, s__17713))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__17714 = this;
  var h__2216__auto____17715 = this__17714.__hash;
  if(!(h__2216__auto____17715 == null)) {
    return h__2216__auto____17715
  }else {
    var h__2216__auto____17716 = cljs.core.hash_coll.call(null, rng);
    this__17714.__hash = h__2216__auto____17716;
    return h__2216__auto____17716
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17717 = this;
  if(this__17717.step > 0) {
    if(this__17717.start + this__17717.step < this__17717.end) {
      return new cljs.core.Range(this__17717.meta, this__17717.start + this__17717.step, this__17717.end, this__17717.step, null)
    }else {
      return null
    }
  }else {
    if(this__17717.start + this__17717.step > this__17717.end) {
      return new cljs.core.Range(this__17717.meta, this__17717.start + this__17717.step, this__17717.end, this__17717.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17718 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17719 = this;
  var this__17720 = this;
  return cljs.core.pr_str.call(null, this__17720)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17721 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17722 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17723 = this;
  if(this__17723.step > 0) {
    if(this__17723.start < this__17723.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17723.start > this__17723.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17724 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17724.end - this__17724.start) / this__17724.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17725 = this;
  return this__17725.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17726 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17726.meta, this__17726.start + this__17726.step, this__17726.end, this__17726.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17727 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17728 = this;
  return new cljs.core.Range(meta, this__17728.start, this__17728.end, this__17728.step, this__17728.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17729 = this;
  return this__17729.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17730 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17730.start + n * this__17730.step
  }else {
    if(function() {
      var and__3822__auto____17731 = this__17730.start > this__17730.end;
      if(and__3822__auto____17731) {
        return this__17730.step === 0
      }else {
        return and__3822__auto____17731
      }
    }()) {
      return this__17730.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17732 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17732.start + n * this__17732.step
  }else {
    if(function() {
      var and__3822__auto____17733 = this__17732.start > this__17732.end;
      if(and__3822__auto____17733) {
        return this__17732.step === 0
      }else {
        return and__3822__auto____17733
      }
    }()) {
      return this__17732.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17734 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17734.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17737 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17737) {
      var s__17738 = temp__3974__auto____17737;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17738), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17738)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17745 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17745) {
      var s__17746 = temp__3974__auto____17745;
      var fst__17747 = cljs.core.first.call(null, s__17746);
      var fv__17748 = f.call(null, fst__17747);
      var run__17749 = cljs.core.cons.call(null, fst__17747, cljs.core.take_while.call(null, function(p1__17739_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17748, f.call(null, p1__17739_SHARP_))
      }, cljs.core.next.call(null, s__17746)));
      return cljs.core.cons.call(null, run__17749, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17749), s__17746))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17764 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17764) {
        var s__17765 = temp__3971__auto____17764;
        return reductions.call(null, f, cljs.core.first.call(null, s__17765), cljs.core.rest.call(null, s__17765))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17766 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17766) {
        var s__17767 = temp__3974__auto____17766;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17767)), cljs.core.rest.call(null, s__17767))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__17770 = null;
      var G__17770__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17770__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17770__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17770__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17770__4 = function() {
        var G__17771__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17771 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17771__delegate.call(this, x, y, z, args)
        };
        G__17771.cljs$lang$maxFixedArity = 3;
        G__17771.cljs$lang$applyTo = function(arglist__17772) {
          var x = cljs.core.first(arglist__17772);
          var y = cljs.core.first(cljs.core.next(arglist__17772));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17772)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17772)));
          return G__17771__delegate(x, y, z, args)
        };
        G__17771.cljs$lang$arity$variadic = G__17771__delegate;
        return G__17771
      }();
      G__17770 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17770__0.call(this);
          case 1:
            return G__17770__1.call(this, x);
          case 2:
            return G__17770__2.call(this, x, y);
          case 3:
            return G__17770__3.call(this, x, y, z);
          default:
            return G__17770__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17770.cljs$lang$maxFixedArity = 3;
      G__17770.cljs$lang$applyTo = G__17770__4.cljs$lang$applyTo;
      return G__17770
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17773 = null;
      var G__17773__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17773__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17773__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17773__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17773__4 = function() {
        var G__17774__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17774 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17774__delegate.call(this, x, y, z, args)
        };
        G__17774.cljs$lang$maxFixedArity = 3;
        G__17774.cljs$lang$applyTo = function(arglist__17775) {
          var x = cljs.core.first(arglist__17775);
          var y = cljs.core.first(cljs.core.next(arglist__17775));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17775)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17775)));
          return G__17774__delegate(x, y, z, args)
        };
        G__17774.cljs$lang$arity$variadic = G__17774__delegate;
        return G__17774
      }();
      G__17773 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17773__0.call(this);
          case 1:
            return G__17773__1.call(this, x);
          case 2:
            return G__17773__2.call(this, x, y);
          case 3:
            return G__17773__3.call(this, x, y, z);
          default:
            return G__17773__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17773.cljs$lang$maxFixedArity = 3;
      G__17773.cljs$lang$applyTo = G__17773__4.cljs$lang$applyTo;
      return G__17773
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17776 = null;
      var G__17776__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17776__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17776__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17776__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17776__4 = function() {
        var G__17777__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17777 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17777__delegate.call(this, x, y, z, args)
        };
        G__17777.cljs$lang$maxFixedArity = 3;
        G__17777.cljs$lang$applyTo = function(arglist__17778) {
          var x = cljs.core.first(arglist__17778);
          var y = cljs.core.first(cljs.core.next(arglist__17778));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17778)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17778)));
          return G__17777__delegate(x, y, z, args)
        };
        G__17777.cljs$lang$arity$variadic = G__17777__delegate;
        return G__17777
      }();
      G__17776 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17776__0.call(this);
          case 1:
            return G__17776__1.call(this, x);
          case 2:
            return G__17776__2.call(this, x, y);
          case 3:
            return G__17776__3.call(this, x, y, z);
          default:
            return G__17776__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17776.cljs$lang$maxFixedArity = 3;
      G__17776.cljs$lang$applyTo = G__17776__4.cljs$lang$applyTo;
      return G__17776
    }()
  };
  var juxt__4 = function() {
    var G__17779__delegate = function(f, g, h, fs) {
      var fs__17769 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17780 = null;
        var G__17780__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17750_SHARP_, p2__17751_SHARP_) {
            return cljs.core.conj.call(null, p1__17750_SHARP_, p2__17751_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17769)
        };
        var G__17780__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17752_SHARP_, p2__17753_SHARP_) {
            return cljs.core.conj.call(null, p1__17752_SHARP_, p2__17753_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17769)
        };
        var G__17780__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17754_SHARP_, p2__17755_SHARP_) {
            return cljs.core.conj.call(null, p1__17754_SHARP_, p2__17755_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17769)
        };
        var G__17780__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17756_SHARP_, p2__17757_SHARP_) {
            return cljs.core.conj.call(null, p1__17756_SHARP_, p2__17757_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17769)
        };
        var G__17780__4 = function() {
          var G__17781__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17758_SHARP_, p2__17759_SHARP_) {
              return cljs.core.conj.call(null, p1__17758_SHARP_, cljs.core.apply.call(null, p2__17759_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17769)
          };
          var G__17781 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17781__delegate.call(this, x, y, z, args)
          };
          G__17781.cljs$lang$maxFixedArity = 3;
          G__17781.cljs$lang$applyTo = function(arglist__17782) {
            var x = cljs.core.first(arglist__17782);
            var y = cljs.core.first(cljs.core.next(arglist__17782));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17782)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17782)));
            return G__17781__delegate(x, y, z, args)
          };
          G__17781.cljs$lang$arity$variadic = G__17781__delegate;
          return G__17781
        }();
        G__17780 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17780__0.call(this);
            case 1:
              return G__17780__1.call(this, x);
            case 2:
              return G__17780__2.call(this, x, y);
            case 3:
              return G__17780__3.call(this, x, y, z);
            default:
              return G__17780__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17780.cljs$lang$maxFixedArity = 3;
        G__17780.cljs$lang$applyTo = G__17780__4.cljs$lang$applyTo;
        return G__17780
      }()
    };
    var G__17779 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17779__delegate.call(this, f, g, h, fs)
    };
    G__17779.cljs$lang$maxFixedArity = 3;
    G__17779.cljs$lang$applyTo = function(arglist__17783) {
      var f = cljs.core.first(arglist__17783);
      var g = cljs.core.first(cljs.core.next(arglist__17783));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17783)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17783)));
      return G__17779__delegate(f, g, h, fs)
    };
    G__17779.cljs$lang$arity$variadic = G__17779__delegate;
    return G__17779
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__17786 = cljs.core.next.call(null, coll);
        coll = G__17786;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____17785 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17785) {
          return n > 0
        }else {
          return and__3822__auto____17785
        }
      }())) {
        var G__17787 = n - 1;
        var G__17788 = cljs.core.next.call(null, coll);
        n = G__17787;
        coll = G__17788;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__17790 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17790), s)) {
    if(cljs.core.count.call(null, matches__17790) === 1) {
      return cljs.core.first.call(null, matches__17790)
    }else {
      return cljs.core.vec.call(null, matches__17790)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17792 = re.exec(s);
  if(matches__17792 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17792) === 1) {
      return cljs.core.first.call(null, matches__17792)
    }else {
      return cljs.core.vec.call(null, matches__17792)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17797 = cljs.core.re_find.call(null, re, s);
  var match_idx__17798 = s.search(re);
  var match_str__17799 = cljs.core.coll_QMARK_.call(null, match_data__17797) ? cljs.core.first.call(null, match_data__17797) : match_data__17797;
  var post_match__17800 = cljs.core.subs.call(null, s, match_idx__17798 + cljs.core.count.call(null, match_str__17799));
  if(cljs.core.truth_(match_data__17797)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17797, re_seq.call(null, re, post_match__17800))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17807__17808 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17809 = cljs.core.nth.call(null, vec__17807__17808, 0, null);
  var flags__17810 = cljs.core.nth.call(null, vec__17807__17808, 1, null);
  var pattern__17811 = cljs.core.nth.call(null, vec__17807__17808, 2, null);
  return new RegExp(pattern__17811, flags__17810)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17801_SHARP_) {
    return print_one.call(null, p1__17801_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____17821 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17821)) {
            var and__3822__auto____17825 = function() {
              var G__17822__17823 = obj;
              if(G__17822__17823) {
                if(function() {
                  var or__3824__auto____17824 = G__17822__17823.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17824) {
                    return or__3824__auto____17824
                  }else {
                    return G__17822__17823.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17822__17823.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17822__17823)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17822__17823)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17825)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17825
            }
          }else {
            return and__3822__auto____17821
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17826 = !(obj == null);
          if(and__3822__auto____17826) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17826
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17827__17828 = obj;
          if(G__17827__17828) {
            if(function() {
              var or__3824__auto____17829 = G__17827__17828.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17829) {
                return or__3824__auto____17829
              }else {
                return G__17827__17828.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17827__17828.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17827__17828)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17827__17828)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__17849 = new goog.string.StringBuffer;
  var G__17850__17851 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17850__17851) {
    var string__17852 = cljs.core.first.call(null, G__17850__17851);
    var G__17850__17853 = G__17850__17851;
    while(true) {
      sb__17849.append(string__17852);
      var temp__3974__auto____17854 = cljs.core.next.call(null, G__17850__17853);
      if(temp__3974__auto____17854) {
        var G__17850__17855 = temp__3974__auto____17854;
        var G__17868 = cljs.core.first.call(null, G__17850__17855);
        var G__17869 = G__17850__17855;
        string__17852 = G__17868;
        G__17850__17853 = G__17869;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17856__17857 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17856__17857) {
    var obj__17858 = cljs.core.first.call(null, G__17856__17857);
    var G__17856__17859 = G__17856__17857;
    while(true) {
      sb__17849.append(" ");
      var G__17860__17861 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17858, opts));
      if(G__17860__17861) {
        var string__17862 = cljs.core.first.call(null, G__17860__17861);
        var G__17860__17863 = G__17860__17861;
        while(true) {
          sb__17849.append(string__17862);
          var temp__3974__auto____17864 = cljs.core.next.call(null, G__17860__17863);
          if(temp__3974__auto____17864) {
            var G__17860__17865 = temp__3974__auto____17864;
            var G__17870 = cljs.core.first.call(null, G__17860__17865);
            var G__17871 = G__17860__17865;
            string__17862 = G__17870;
            G__17860__17863 = G__17871;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17866 = cljs.core.next.call(null, G__17856__17859);
      if(temp__3974__auto____17866) {
        var G__17856__17867 = temp__3974__auto____17866;
        var G__17872 = cljs.core.first.call(null, G__17856__17867);
        var G__17873 = G__17856__17867;
        obj__17858 = G__17872;
        G__17856__17859 = G__17873;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__17849
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__17875 = cljs.core.pr_sb.call(null, objs, opts);
  sb__17875.append("\n");
  return[cljs.core.str(sb__17875)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__17894__17895 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17894__17895) {
    var string__17896 = cljs.core.first.call(null, G__17894__17895);
    var G__17894__17897 = G__17894__17895;
    while(true) {
      cljs.core.string_print.call(null, string__17896);
      var temp__3974__auto____17898 = cljs.core.next.call(null, G__17894__17897);
      if(temp__3974__auto____17898) {
        var G__17894__17899 = temp__3974__auto____17898;
        var G__17912 = cljs.core.first.call(null, G__17894__17899);
        var G__17913 = G__17894__17899;
        string__17896 = G__17912;
        G__17894__17897 = G__17913;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17900__17901 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17900__17901) {
    var obj__17902 = cljs.core.first.call(null, G__17900__17901);
    var G__17900__17903 = G__17900__17901;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__17904__17905 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17902, opts));
      if(G__17904__17905) {
        var string__17906 = cljs.core.first.call(null, G__17904__17905);
        var G__17904__17907 = G__17904__17905;
        while(true) {
          cljs.core.string_print.call(null, string__17906);
          var temp__3974__auto____17908 = cljs.core.next.call(null, G__17904__17907);
          if(temp__3974__auto____17908) {
            var G__17904__17909 = temp__3974__auto____17908;
            var G__17914 = cljs.core.first.call(null, G__17904__17909);
            var G__17915 = G__17904__17909;
            string__17906 = G__17914;
            G__17904__17907 = G__17915;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17910 = cljs.core.next.call(null, G__17900__17903);
      if(temp__3974__auto____17910) {
        var G__17900__17911 = temp__3974__auto____17910;
        var G__17916 = cljs.core.first.call(null, G__17900__17911);
        var G__17917 = G__17900__17911;
        obj__17902 = G__17916;
        G__17900__17903 = G__17917;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__17918) {
    var objs = cljs.core.seq(arglist__17918);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__17919) {
    var objs = cljs.core.seq(arglist__17919);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__17920) {
    var objs = cljs.core.seq(arglist__17920);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__17921) {
    var objs = cljs.core.seq(arglist__17921);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__17922) {
    var objs = cljs.core.seq(arglist__17922);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__17923) {
    var objs = cljs.core.seq(arglist__17923);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__17924) {
    var objs = cljs.core.seq(arglist__17924);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__17925) {
    var objs = cljs.core.seq(arglist__17925);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__17926) {
    var fmt = cljs.core.first(arglist__17926);
    var args = cljs.core.rest(arglist__17926);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17927 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17927, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17928 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17928, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17929 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17929, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____17930 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____17930)) {
        var nspc__17931 = temp__3974__auto____17930;
        return[cljs.core.str(nspc__17931), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____17932 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____17932)) {
          var nspc__17933 = temp__3974__auto____17932;
          return[cljs.core.str(nspc__17933), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17934 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17934, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__17936 = function(n, len) {
    var ns__17935 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__17935) < len) {
        var G__17938 = [cljs.core.str("0"), cljs.core.str(ns__17935)].join("");
        ns__17935 = G__17938;
        continue
      }else {
        return ns__17935
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__17936.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__17936.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__17936.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17936.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17936.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__17936.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17937 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17937, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17939 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__17940 = this;
  var G__17941__17942 = cljs.core.seq.call(null, this__17940.watches);
  if(G__17941__17942) {
    var G__17944__17946 = cljs.core.first.call(null, G__17941__17942);
    var vec__17945__17947 = G__17944__17946;
    var key__17948 = cljs.core.nth.call(null, vec__17945__17947, 0, null);
    var f__17949 = cljs.core.nth.call(null, vec__17945__17947, 1, null);
    var G__17941__17950 = G__17941__17942;
    var G__17944__17951 = G__17944__17946;
    var G__17941__17952 = G__17941__17950;
    while(true) {
      var vec__17953__17954 = G__17944__17951;
      var key__17955 = cljs.core.nth.call(null, vec__17953__17954, 0, null);
      var f__17956 = cljs.core.nth.call(null, vec__17953__17954, 1, null);
      var G__17941__17957 = G__17941__17952;
      f__17956.call(null, key__17955, this$, oldval, newval);
      var temp__3974__auto____17958 = cljs.core.next.call(null, G__17941__17957);
      if(temp__3974__auto____17958) {
        var G__17941__17959 = temp__3974__auto____17958;
        var G__17966 = cljs.core.first.call(null, G__17941__17959);
        var G__17967 = G__17941__17959;
        G__17944__17951 = G__17966;
        G__17941__17952 = G__17967;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__17960 = this;
  return this$.watches = cljs.core.assoc.call(null, this__17960.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__17961 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__17961.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__17962 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__17962.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__17963 = this;
  return this__17963.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17964 = this;
  return this__17964.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17965 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__17979__delegate = function(x, p__17968) {
      var map__17974__17975 = p__17968;
      var map__17974__17976 = cljs.core.seq_QMARK_.call(null, map__17974__17975) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17974__17975) : map__17974__17975;
      var validator__17977 = cljs.core._lookup.call(null, map__17974__17976, "\ufdd0'validator", null);
      var meta__17978 = cljs.core._lookup.call(null, map__17974__17976, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__17978, validator__17977, null)
    };
    var G__17979 = function(x, var_args) {
      var p__17968 = null;
      if(goog.isDef(var_args)) {
        p__17968 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17979__delegate.call(this, x, p__17968)
    };
    G__17979.cljs$lang$maxFixedArity = 1;
    G__17979.cljs$lang$applyTo = function(arglist__17980) {
      var x = cljs.core.first(arglist__17980);
      var p__17968 = cljs.core.rest(arglist__17980);
      return G__17979__delegate(x, p__17968)
    };
    G__17979.cljs$lang$arity$variadic = G__17979__delegate;
    return G__17979
  }();
  atom = function(x, var_args) {
    var p__17968 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____17984 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____17984)) {
    var validate__17985 = temp__3974__auto____17984;
    if(cljs.core.truth_(validate__17985.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__17986 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__17986, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__17987__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__17987 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__17987__delegate.call(this, a, f, x, y, z, more)
    };
    G__17987.cljs$lang$maxFixedArity = 5;
    G__17987.cljs$lang$applyTo = function(arglist__17988) {
      var a = cljs.core.first(arglist__17988);
      var f = cljs.core.first(cljs.core.next(arglist__17988));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17988)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17988))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17988)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17988)))));
      return G__17987__delegate(a, f, x, y, z, more)
    };
    G__17987.cljs$lang$arity$variadic = G__17987__delegate;
    return G__17987
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__17989) {
    var iref = cljs.core.first(arglist__17989);
    var f = cljs.core.first(cljs.core.next(arglist__17989));
    var args = cljs.core.rest(cljs.core.next(arglist__17989));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__17990 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__17990.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17991 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__17991.state, function(p__17992) {
    var map__17993__17994 = p__17992;
    var map__17993__17995 = cljs.core.seq_QMARK_.call(null, map__17993__17994) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17993__17994) : map__17993__17994;
    var curr_state__17996 = map__17993__17995;
    var done__17997 = cljs.core._lookup.call(null, map__17993__17995, "\ufdd0'done", null);
    if(cljs.core.truth_(done__17997)) {
      return curr_state__17996
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__17991.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__18018__18019 = options;
    var map__18018__18020 = cljs.core.seq_QMARK_.call(null, map__18018__18019) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18018__18019) : map__18018__18019;
    var keywordize_keys__18021 = cljs.core._lookup.call(null, map__18018__18020, "\ufdd0'keywordize-keys", null);
    var keyfn__18022 = cljs.core.truth_(keywordize_keys__18021) ? cljs.core.keyword : cljs.core.str;
    var f__18037 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2486__auto____18036 = function iter__18030(s__18031) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__18031__18034 = s__18031;
                    while(true) {
                      if(cljs.core.seq.call(null, s__18031__18034)) {
                        var k__18035 = cljs.core.first.call(null, s__18031__18034);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__18022.call(null, k__18035), thisfn.call(null, x[k__18035])], true), iter__18030.call(null, cljs.core.rest.call(null, s__18031__18034)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2486__auto____18036.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__18037.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__18038) {
    var x = cljs.core.first(arglist__18038);
    var options = cljs.core.rest(arglist__18038);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__18043 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__18047__delegate = function(args) {
      var temp__3971__auto____18044 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__18043), args, null);
      if(cljs.core.truth_(temp__3971__auto____18044)) {
        var v__18045 = temp__3971__auto____18044;
        return v__18045
      }else {
        var ret__18046 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__18043, cljs.core.assoc, args, ret__18046);
        return ret__18046
      }
    };
    var G__18047 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18047__delegate.call(this, args)
    };
    G__18047.cljs$lang$maxFixedArity = 0;
    G__18047.cljs$lang$applyTo = function(arglist__18048) {
      var args = cljs.core.seq(arglist__18048);
      return G__18047__delegate(args)
    };
    G__18047.cljs$lang$arity$variadic = G__18047__delegate;
    return G__18047
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__18050 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__18050)) {
        var G__18051 = ret__18050;
        f = G__18051;
        continue
      }else {
        return ret__18050
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__18052__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__18052 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18052__delegate.call(this, f, args)
    };
    G__18052.cljs$lang$maxFixedArity = 1;
    G__18052.cljs$lang$applyTo = function(arglist__18053) {
      var f = cljs.core.first(arglist__18053);
      var args = cljs.core.rest(arglist__18053);
      return G__18052__delegate(f, args)
    };
    G__18052.cljs$lang$arity$variadic = G__18052__delegate;
    return G__18052
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__18055 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__18055, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__18055, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____18064 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____18064) {
      return or__3824__auto____18064
    }else {
      var or__3824__auto____18065 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____18065) {
        return or__3824__auto____18065
      }else {
        var and__3822__auto____18066 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____18066) {
          var and__3822__auto____18067 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____18067) {
            var and__3822__auto____18068 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____18068) {
              var ret__18069 = true;
              var i__18070 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____18071 = cljs.core.not.call(null, ret__18069);
                  if(or__3824__auto____18071) {
                    return or__3824__auto____18071
                  }else {
                    return i__18070 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__18069
                }else {
                  var G__18072 = isa_QMARK_.call(null, h, child.call(null, i__18070), parent.call(null, i__18070));
                  var G__18073 = i__18070 + 1;
                  ret__18069 = G__18072;
                  i__18070 = G__18073;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____18068
            }
          }else {
            return and__3822__auto____18067
          }
        }else {
          return and__3822__auto____18066
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__18082 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__18083 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__18084 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__18085 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____18086 = cljs.core.contains_QMARK_.call(null, tp__18082.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__18084.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__18084.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__18082, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__18085.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__18083, parent, ta__18084), "\ufdd0'descendants":tf__18085.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__18084, tag, td__18083)})
    }();
    if(cljs.core.truth_(or__3824__auto____18086)) {
      return or__3824__auto____18086
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__18091 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__18092 = cljs.core.truth_(parentMap__18091.call(null, tag)) ? cljs.core.disj.call(null, parentMap__18091.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__18093 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__18092)) ? cljs.core.assoc.call(null, parentMap__18091, tag, childsParents__18092) : cljs.core.dissoc.call(null, parentMap__18091, tag);
    var deriv_seq__18094 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__18074_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__18074_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__18074_SHARP_), cljs.core.second.call(null, p1__18074_SHARP_)))
    }, cljs.core.seq.call(null, newParents__18093)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__18091.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__18075_SHARP_, p2__18076_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__18075_SHARP_, p2__18076_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__18094))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__18102 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____18104 = cljs.core.truth_(function() {
    var and__3822__auto____18103 = xprefs__18102;
    if(cljs.core.truth_(and__3822__auto____18103)) {
      return xprefs__18102.call(null, y)
    }else {
      return and__3822__auto____18103
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____18104)) {
    return or__3824__auto____18104
  }else {
    var or__3824__auto____18106 = function() {
      var ps__18105 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__18105) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__18105), prefer_table))) {
          }else {
          }
          var G__18109 = cljs.core.rest.call(null, ps__18105);
          ps__18105 = G__18109;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____18106)) {
      return or__3824__auto____18106
    }else {
      var or__3824__auto____18108 = function() {
        var ps__18107 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__18107) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__18107), y, prefer_table))) {
            }else {
            }
            var G__18110 = cljs.core.rest.call(null, ps__18107);
            ps__18107 = G__18110;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____18108)) {
        return or__3824__auto____18108
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____18112 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____18112)) {
    return or__3824__auto____18112
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__18130 = cljs.core.reduce.call(null, function(be, p__18122) {
    var vec__18123__18124 = p__18122;
    var k__18125 = cljs.core.nth.call(null, vec__18123__18124, 0, null);
    var ___18126 = cljs.core.nth.call(null, vec__18123__18124, 1, null);
    var e__18127 = vec__18123__18124;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__18125)) {
      var be2__18129 = cljs.core.truth_(function() {
        var or__3824__auto____18128 = be == null;
        if(or__3824__auto____18128) {
          return or__3824__auto____18128
        }else {
          return cljs.core.dominates.call(null, k__18125, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__18127 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__18129), k__18125, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__18125), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__18129)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__18129
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__18130)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__18130));
      return cljs.core.second.call(null, best_entry__18130)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____18135 = mf;
    if(and__3822__auto____18135) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____18135
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2387__auto____18136 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18137 = cljs.core._reset[goog.typeOf(x__2387__auto____18136)];
      if(or__3824__auto____18137) {
        return or__3824__auto____18137
      }else {
        var or__3824__auto____18138 = cljs.core._reset["_"];
        if(or__3824__auto____18138) {
          return or__3824__auto____18138
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____18143 = mf;
    if(and__3822__auto____18143) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____18143
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2387__auto____18144 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18145 = cljs.core._add_method[goog.typeOf(x__2387__auto____18144)];
      if(or__3824__auto____18145) {
        return or__3824__auto____18145
      }else {
        var or__3824__auto____18146 = cljs.core._add_method["_"];
        if(or__3824__auto____18146) {
          return or__3824__auto____18146
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____18151 = mf;
    if(and__3822__auto____18151) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____18151
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2387__auto____18152 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18153 = cljs.core._remove_method[goog.typeOf(x__2387__auto____18152)];
      if(or__3824__auto____18153) {
        return or__3824__auto____18153
      }else {
        var or__3824__auto____18154 = cljs.core._remove_method["_"];
        if(or__3824__auto____18154) {
          return or__3824__auto____18154
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____18159 = mf;
    if(and__3822__auto____18159) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____18159
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2387__auto____18160 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18161 = cljs.core._prefer_method[goog.typeOf(x__2387__auto____18160)];
      if(or__3824__auto____18161) {
        return or__3824__auto____18161
      }else {
        var or__3824__auto____18162 = cljs.core._prefer_method["_"];
        if(or__3824__auto____18162) {
          return or__3824__auto____18162
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____18167 = mf;
    if(and__3822__auto____18167) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____18167
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2387__auto____18168 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18169 = cljs.core._get_method[goog.typeOf(x__2387__auto____18168)];
      if(or__3824__auto____18169) {
        return or__3824__auto____18169
      }else {
        var or__3824__auto____18170 = cljs.core._get_method["_"];
        if(or__3824__auto____18170) {
          return or__3824__auto____18170
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____18175 = mf;
    if(and__3822__auto____18175) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____18175
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2387__auto____18176 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18177 = cljs.core._methods[goog.typeOf(x__2387__auto____18176)];
      if(or__3824__auto____18177) {
        return or__3824__auto____18177
      }else {
        var or__3824__auto____18178 = cljs.core._methods["_"];
        if(or__3824__auto____18178) {
          return or__3824__auto____18178
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____18183 = mf;
    if(and__3822__auto____18183) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____18183
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2387__auto____18184 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18185 = cljs.core._prefers[goog.typeOf(x__2387__auto____18184)];
      if(or__3824__auto____18185) {
        return or__3824__auto____18185
      }else {
        var or__3824__auto____18186 = cljs.core._prefers["_"];
        if(or__3824__auto____18186) {
          return or__3824__auto____18186
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____18191 = mf;
    if(and__3822__auto____18191) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____18191
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2387__auto____18192 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____18193 = cljs.core._dispatch[goog.typeOf(x__2387__auto____18192)];
      if(or__3824__auto____18193) {
        return or__3824__auto____18193
      }else {
        var or__3824__auto____18194 = cljs.core._dispatch["_"];
        if(or__3824__auto____18194) {
          return or__3824__auto____18194
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__18197 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__18198 = cljs.core._get_method.call(null, mf, dispatch_val__18197);
  if(cljs.core.truth_(target_fn__18198)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__18197)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__18198, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__18199 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__18200 = this;
  cljs.core.swap_BANG_.call(null, this__18200.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18200.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18200.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__18200.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__18201 = this;
  cljs.core.swap_BANG_.call(null, this__18201.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__18201.method_cache, this__18201.method_table, this__18201.cached_hierarchy, this__18201.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__18202 = this;
  cljs.core.swap_BANG_.call(null, this__18202.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__18202.method_cache, this__18202.method_table, this__18202.cached_hierarchy, this__18202.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__18203 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__18203.cached_hierarchy), cljs.core.deref.call(null, this__18203.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__18203.method_cache, this__18203.method_table, this__18203.cached_hierarchy, this__18203.hierarchy)
  }
  var temp__3971__auto____18204 = cljs.core.deref.call(null, this__18203.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____18204)) {
    var target_fn__18205 = temp__3971__auto____18204;
    return target_fn__18205
  }else {
    var temp__3971__auto____18206 = cljs.core.find_and_cache_best_method.call(null, this__18203.name, dispatch_val, this__18203.hierarchy, this__18203.method_table, this__18203.prefer_table, this__18203.method_cache, this__18203.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____18206)) {
      var target_fn__18207 = temp__3971__auto____18206;
      return target_fn__18207
    }else {
      return cljs.core.deref.call(null, this__18203.method_table).call(null, this__18203.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__18208 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__18208.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__18208.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__18208.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__18208.method_cache, this__18208.method_table, this__18208.cached_hierarchy, this__18208.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__18209 = this;
  return cljs.core.deref.call(null, this__18209.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__18210 = this;
  return cljs.core.deref.call(null, this__18210.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__18211 = this;
  return cljs.core.do_dispatch.call(null, mf, this__18211.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__18213__delegate = function(_, args) {
    var self__18212 = this;
    return cljs.core._dispatch.call(null, self__18212, args)
  };
  var G__18213 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__18213__delegate.call(this, _, args)
  };
  G__18213.cljs$lang$maxFixedArity = 1;
  G__18213.cljs$lang$applyTo = function(arglist__18214) {
    var _ = cljs.core.first(arglist__18214);
    var args = cljs.core.rest(arglist__18214);
    return G__18213__delegate(_, args)
  };
  G__18213.cljs$lang$arity$variadic = G__18213__delegate;
  return G__18213
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__18215 = this;
  return cljs.core._dispatch.call(null, self__18215, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__18216 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_18218, _) {
  var this__18217 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__18217.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__18219 = this;
  var and__3822__auto____18220 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____18220) {
    return this__18219.uuid === other.uuid
  }else {
    return and__3822__auto____18220
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__18221 = this;
  var this__18222 = this;
  return cljs.core.pr_str.call(null, this__18222)
};
cljs.core.UUID;
goog.provide("gsim.test.parse");
goog.require("cljs.core");
goog.require("gsim.parse");
gsim.test.parse.success = 0;
gsim.test.parse.test_is_comment_QMARK_ = function test_is_comment_QMARK_() {
  var comment__14223 = "(this is a comment)";
  var not_comments__14224 = cljs.core.PersistentVector.fromArray(["this is not a comment)", "(this is also not a comment", "definitely not a comment", "G20"], true);
  if(cljs.core.truth_(gsim.parse.is_comment_QMARK_.call(null, comment__14223))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'parse/is-comment?", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 12))))].join(""));
  }
  var G__14225__14226 = cljs.core.seq.call(null, not_comments__14224);
  if(G__14225__14226) {
    var not_comment__14227 = cljs.core.first.call(null, G__14225__14226);
    var G__14225__14228 = G__14225__14226;
    while(true) {
      if(gsim.parse.is_comment_QMARK_.call(null, not_comment__14227) === false) {
      }else {
        throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'false?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse/is-comment?", "\ufdd1'not-comment"), cljs.core.hash_map("\ufdd0'line", 14))), cljs.core.hash_map("\ufdd0'line", 14))))].join(""));
      }
      var temp__3974__auto____14229 = cljs.core.next.call(null, G__14225__14228);
      if(temp__3974__auto____14229) {
        var G__14225__14230 = temp__3974__auto____14229;
        var G__14231 = cljs.core.first.call(null, G__14225__14230);
        var G__14232 = G__14225__14230;
        not_comment__14227 = G__14231;
        G__14225__14228 = G__14232;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
gsim.test.parse.test_split_comment = function test_split_comment() {
  var command__14247 = "G96 M3 S300 ";
  var comment__14248 = "(set the speed, mode, and start the spindle)";
  var vec__14249__14250 = gsim.parse.split_comment.call(null, command__14247);
  var c1__14251 = cljs.core.nth.call(null, vec__14249__14250, 0, null);
  var c2__14252 = cljs.core.nth.call(null, vec__14249__14250, 1, null);
  if(cljs.core._EQ_.call(null, c1__14251, command__14247)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c1", "\ufdd1'command"), cljs.core.hash_map("\ufdd0'line", 20))))].join(""));
  }
  if(c2__14252 == null) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'nil?", "\ufdd1'c2"), cljs.core.hash_map("\ufdd0'line", 21))))].join(""));
  }
  var vec__14253__14254 = gsim.parse.split_comment.call(null, [cljs.core.str(command__14247), cljs.core.str(comment__14248)].join(""));
  var c1__14255 = cljs.core.nth.call(null, vec__14253__14254, 0, null);
  var c2__14256 = cljs.core.nth.call(null, vec__14253__14254, 1, null);
  if(cljs.core._EQ_.call(null, c1__14255, command__14247)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c1", "\ufdd1'command"), cljs.core.hash_map("\ufdd0'line", 23))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__14256, comment__14248)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c2", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 24))))].join(""));
  }
  var vec__14257__14258 = gsim.parse.split_comment.call(null, comment__14248);
  var c1__14259 = cljs.core.nth.call(null, vec__14257__14258, 0, null);
  var c2__14260 = cljs.core.nth.call(null, vec__14257__14258, 1, null);
  if(cljs.core.empty_QMARK_.call(null, c1__14259)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'empty?", "\ufdd1'c1"), cljs.core.hash_map("\ufdd0'line", 26))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__14260, comment__14248)) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c2", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 27))))].join(""));
  }
};
gsim.test.parse.test_tokenize_block = function test_tokenize_block() {
  var commands__14272 = "G03X1.0 G96 s300 ";
  var comment__14273 = "(comment)";
  var vec__14274__14276 = gsim.parse.tokenize_block.call(null, [cljs.core.str(commands__14272), cljs.core.str(comment__14273)].join(""));
  var vec__14275__14277 = cljs.core.nth.call(null, vec__14274__14276, 0, null);
  var G03__14278 = cljs.core.nth.call(null, vec__14275__14277, 0, null);
  var X10__14279 = cljs.core.nth.call(null, vec__14275__14277, 1, null);
  var G96__14280 = cljs.core.nth.call(null, vec__14275__14277, 2, null);
  var s300__14281 = cljs.core.nth.call(null, vec__14275__14277, 3, null);
  var c2__14282 = cljs.core.nth.call(null, vec__14274__14276, 1, null);
  if(cljs.core._EQ_.call(null, "G03", G03__14278)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "G03", "\ufdd1'G03"), cljs.core.hash_map("\ufdd0'line", 33))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "X1.0", X10__14279)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "X1.0", "\ufdd1'X10"), cljs.core.hash_map("\ufdd0'line", 34))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "G96", G96__14280)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "G96", "\ufdd1'G96"), cljs.core.hash_map("\ufdd0'line", 35))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "s300", s300__14281)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "s300", "\ufdd1's300"), cljs.core.hash_map("\ufdd0'line", 36))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__14282, comment__14273)) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c2", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 37))))].join(""));
  }
};
gsim.test.parse.run = function run() {
  console.log("Testing parse.");
  gsim.test.parse.test_is_comment_QMARK_.call(null);
  gsim.test.parse.test_split_comment.call(null);
  gsim.test.parse.test_tokenize_block.call(null);
  return gsim.test.parse.success
};
goog.provide("gsim.test.machine");
goog.require("cljs.core");
gsim.test.machine.test_new_machine = function test_new_machine() {
  return null
};
gsim.test.machine.run = function run() {
  return gsim.test.machine.test_new_machine.call(null)
};
goog.provide("gsim.test");
goog.require("cljs.core");
goog.require("gsim.test.parse");
goog.require("gsim.test.machine");
gsim.test.success = 0;
gsim.test.run = function run() {
  console.log("Testing machine.");
  gsim.test.machine.run.call(null);
  gsim.test.parse.run.call(null);
  return gsim.test.success
};
goog.exportSymbol("gsim.test.run", gsim.test.run);
