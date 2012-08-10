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
  var x__23895 = x == null ? null : x;
  if(p[goog.typeOf(x__23895)]) {
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
    var G__23896__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__23896 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__23896__delegate.call(this, array, i, idxs)
    };
    G__23896.cljs$lang$maxFixedArity = 2;
    G__23896.cljs$lang$applyTo = function(arglist__23897) {
      var array = cljs.core.first(arglist__23897);
      var i = cljs.core.first(cljs.core.next(arglist__23897));
      var idxs = cljs.core.rest(cljs.core.next(arglist__23897));
      return G__23896__delegate(array, i, idxs)
    };
    G__23896.cljs$lang$arity$variadic = G__23896__delegate;
    return G__23896
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
      var and__3822__auto____23982 = this$;
      if(and__3822__auto____23982) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____23982
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2394__auto____23983 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____23984 = cljs.core._invoke[goog.typeOf(x__2394__auto____23983)];
        if(or__3824__auto____23984) {
          return or__3824__auto____23984
        }else {
          var or__3824__auto____23985 = cljs.core._invoke["_"];
          if(or__3824__auto____23985) {
            return or__3824__auto____23985
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____23986 = this$;
      if(and__3822__auto____23986) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____23986
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2394__auto____23987 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____23988 = cljs.core._invoke[goog.typeOf(x__2394__auto____23987)];
        if(or__3824__auto____23988) {
          return or__3824__auto____23988
        }else {
          var or__3824__auto____23989 = cljs.core._invoke["_"];
          if(or__3824__auto____23989) {
            return or__3824__auto____23989
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____23990 = this$;
      if(and__3822__auto____23990) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____23990
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2394__auto____23991 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____23992 = cljs.core._invoke[goog.typeOf(x__2394__auto____23991)];
        if(or__3824__auto____23992) {
          return or__3824__auto____23992
        }else {
          var or__3824__auto____23993 = cljs.core._invoke["_"];
          if(or__3824__auto____23993) {
            return or__3824__auto____23993
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____23994 = this$;
      if(and__3822__auto____23994) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____23994
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2394__auto____23995 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____23996 = cljs.core._invoke[goog.typeOf(x__2394__auto____23995)];
        if(or__3824__auto____23996) {
          return or__3824__auto____23996
        }else {
          var or__3824__auto____23997 = cljs.core._invoke["_"];
          if(or__3824__auto____23997) {
            return or__3824__auto____23997
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____23998 = this$;
      if(and__3822__auto____23998) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____23998
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2394__auto____23999 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24000 = cljs.core._invoke[goog.typeOf(x__2394__auto____23999)];
        if(or__3824__auto____24000) {
          return or__3824__auto____24000
        }else {
          var or__3824__auto____24001 = cljs.core._invoke["_"];
          if(or__3824__auto____24001) {
            return or__3824__auto____24001
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____24002 = this$;
      if(and__3822__auto____24002) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____24002
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2394__auto____24003 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24004 = cljs.core._invoke[goog.typeOf(x__2394__auto____24003)];
        if(or__3824__auto____24004) {
          return or__3824__auto____24004
        }else {
          var or__3824__auto____24005 = cljs.core._invoke["_"];
          if(or__3824__auto____24005) {
            return or__3824__auto____24005
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____24006 = this$;
      if(and__3822__auto____24006) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____24006
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2394__auto____24007 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24008 = cljs.core._invoke[goog.typeOf(x__2394__auto____24007)];
        if(or__3824__auto____24008) {
          return or__3824__auto____24008
        }else {
          var or__3824__auto____24009 = cljs.core._invoke["_"];
          if(or__3824__auto____24009) {
            return or__3824__auto____24009
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____24010 = this$;
      if(and__3822__auto____24010) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____24010
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2394__auto____24011 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24012 = cljs.core._invoke[goog.typeOf(x__2394__auto____24011)];
        if(or__3824__auto____24012) {
          return or__3824__auto____24012
        }else {
          var or__3824__auto____24013 = cljs.core._invoke["_"];
          if(or__3824__auto____24013) {
            return or__3824__auto____24013
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____24014 = this$;
      if(and__3822__auto____24014) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____24014
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2394__auto____24015 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24016 = cljs.core._invoke[goog.typeOf(x__2394__auto____24015)];
        if(or__3824__auto____24016) {
          return or__3824__auto____24016
        }else {
          var or__3824__auto____24017 = cljs.core._invoke["_"];
          if(or__3824__auto____24017) {
            return or__3824__auto____24017
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____24018 = this$;
      if(and__3822__auto____24018) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____24018
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2394__auto____24019 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24020 = cljs.core._invoke[goog.typeOf(x__2394__auto____24019)];
        if(or__3824__auto____24020) {
          return or__3824__auto____24020
        }else {
          var or__3824__auto____24021 = cljs.core._invoke["_"];
          if(or__3824__auto____24021) {
            return or__3824__auto____24021
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____24022 = this$;
      if(and__3822__auto____24022) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____24022
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2394__auto____24023 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24024 = cljs.core._invoke[goog.typeOf(x__2394__auto____24023)];
        if(or__3824__auto____24024) {
          return or__3824__auto____24024
        }else {
          var or__3824__auto____24025 = cljs.core._invoke["_"];
          if(or__3824__auto____24025) {
            return or__3824__auto____24025
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____24026 = this$;
      if(and__3822__auto____24026) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____24026
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2394__auto____24027 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24028 = cljs.core._invoke[goog.typeOf(x__2394__auto____24027)];
        if(or__3824__auto____24028) {
          return or__3824__auto____24028
        }else {
          var or__3824__auto____24029 = cljs.core._invoke["_"];
          if(or__3824__auto____24029) {
            return or__3824__auto____24029
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____24030 = this$;
      if(and__3822__auto____24030) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____24030
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2394__auto____24031 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24032 = cljs.core._invoke[goog.typeOf(x__2394__auto____24031)];
        if(or__3824__auto____24032) {
          return or__3824__auto____24032
        }else {
          var or__3824__auto____24033 = cljs.core._invoke["_"];
          if(or__3824__auto____24033) {
            return or__3824__auto____24033
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____24034 = this$;
      if(and__3822__auto____24034) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____24034
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2394__auto____24035 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24036 = cljs.core._invoke[goog.typeOf(x__2394__auto____24035)];
        if(or__3824__auto____24036) {
          return or__3824__auto____24036
        }else {
          var or__3824__auto____24037 = cljs.core._invoke["_"];
          if(or__3824__auto____24037) {
            return or__3824__auto____24037
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____24038 = this$;
      if(and__3822__auto____24038) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____24038
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2394__auto____24039 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24040 = cljs.core._invoke[goog.typeOf(x__2394__auto____24039)];
        if(or__3824__auto____24040) {
          return or__3824__auto____24040
        }else {
          var or__3824__auto____24041 = cljs.core._invoke["_"];
          if(or__3824__auto____24041) {
            return or__3824__auto____24041
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____24042 = this$;
      if(and__3822__auto____24042) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____24042
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2394__auto____24043 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24044 = cljs.core._invoke[goog.typeOf(x__2394__auto____24043)];
        if(or__3824__auto____24044) {
          return or__3824__auto____24044
        }else {
          var or__3824__auto____24045 = cljs.core._invoke["_"];
          if(or__3824__auto____24045) {
            return or__3824__auto____24045
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____24046 = this$;
      if(and__3822__auto____24046) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____24046
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2394__auto____24047 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24048 = cljs.core._invoke[goog.typeOf(x__2394__auto____24047)];
        if(or__3824__auto____24048) {
          return or__3824__auto____24048
        }else {
          var or__3824__auto____24049 = cljs.core._invoke["_"];
          if(or__3824__auto____24049) {
            return or__3824__auto____24049
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____24050 = this$;
      if(and__3822__auto____24050) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____24050
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2394__auto____24051 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24052 = cljs.core._invoke[goog.typeOf(x__2394__auto____24051)];
        if(or__3824__auto____24052) {
          return or__3824__auto____24052
        }else {
          var or__3824__auto____24053 = cljs.core._invoke["_"];
          if(or__3824__auto____24053) {
            return or__3824__auto____24053
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____24054 = this$;
      if(and__3822__auto____24054) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____24054
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2394__auto____24055 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24056 = cljs.core._invoke[goog.typeOf(x__2394__auto____24055)];
        if(or__3824__auto____24056) {
          return or__3824__auto____24056
        }else {
          var or__3824__auto____24057 = cljs.core._invoke["_"];
          if(or__3824__auto____24057) {
            return or__3824__auto____24057
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____24058 = this$;
      if(and__3822__auto____24058) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____24058
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2394__auto____24059 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24060 = cljs.core._invoke[goog.typeOf(x__2394__auto____24059)];
        if(or__3824__auto____24060) {
          return or__3824__auto____24060
        }else {
          var or__3824__auto____24061 = cljs.core._invoke["_"];
          if(or__3824__auto____24061) {
            return or__3824__auto____24061
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____24062 = this$;
      if(and__3822__auto____24062) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____24062
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2394__auto____24063 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____24064 = cljs.core._invoke[goog.typeOf(x__2394__auto____24063)];
        if(or__3824__auto____24064) {
          return or__3824__auto____24064
        }else {
          var or__3824__auto____24065 = cljs.core._invoke["_"];
          if(or__3824__auto____24065) {
            return or__3824__auto____24065
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
    var and__3822__auto____24070 = coll;
    if(and__3822__auto____24070) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____24070
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2394__auto____24071 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24072 = cljs.core._count[goog.typeOf(x__2394__auto____24071)];
      if(or__3824__auto____24072) {
        return or__3824__auto____24072
      }else {
        var or__3824__auto____24073 = cljs.core._count["_"];
        if(or__3824__auto____24073) {
          return or__3824__auto____24073
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
    var and__3822__auto____24078 = coll;
    if(and__3822__auto____24078) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____24078
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2394__auto____24079 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24080 = cljs.core._empty[goog.typeOf(x__2394__auto____24079)];
      if(or__3824__auto____24080) {
        return or__3824__auto____24080
      }else {
        var or__3824__auto____24081 = cljs.core._empty["_"];
        if(or__3824__auto____24081) {
          return or__3824__auto____24081
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
    var and__3822__auto____24086 = coll;
    if(and__3822__auto____24086) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____24086
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2394__auto____24087 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24088 = cljs.core._conj[goog.typeOf(x__2394__auto____24087)];
      if(or__3824__auto____24088) {
        return or__3824__auto____24088
      }else {
        var or__3824__auto____24089 = cljs.core._conj["_"];
        if(or__3824__auto____24089) {
          return or__3824__auto____24089
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
      var and__3822__auto____24098 = coll;
      if(and__3822__auto____24098) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____24098
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2394__auto____24099 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____24100 = cljs.core._nth[goog.typeOf(x__2394__auto____24099)];
        if(or__3824__auto____24100) {
          return or__3824__auto____24100
        }else {
          var or__3824__auto____24101 = cljs.core._nth["_"];
          if(or__3824__auto____24101) {
            return or__3824__auto____24101
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____24102 = coll;
      if(and__3822__auto____24102) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____24102
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2394__auto____24103 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____24104 = cljs.core._nth[goog.typeOf(x__2394__auto____24103)];
        if(or__3824__auto____24104) {
          return or__3824__auto____24104
        }else {
          var or__3824__auto____24105 = cljs.core._nth["_"];
          if(or__3824__auto____24105) {
            return or__3824__auto____24105
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
    var and__3822__auto____24110 = coll;
    if(and__3822__auto____24110) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____24110
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2394__auto____24111 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24112 = cljs.core._first[goog.typeOf(x__2394__auto____24111)];
      if(or__3824__auto____24112) {
        return or__3824__auto____24112
      }else {
        var or__3824__auto____24113 = cljs.core._first["_"];
        if(or__3824__auto____24113) {
          return or__3824__auto____24113
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____24118 = coll;
    if(and__3822__auto____24118) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____24118
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2394__auto____24119 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24120 = cljs.core._rest[goog.typeOf(x__2394__auto____24119)];
      if(or__3824__auto____24120) {
        return or__3824__auto____24120
      }else {
        var or__3824__auto____24121 = cljs.core._rest["_"];
        if(or__3824__auto____24121) {
          return or__3824__auto____24121
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
    var and__3822__auto____24126 = coll;
    if(and__3822__auto____24126) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____24126
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2394__auto____24127 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24128 = cljs.core._next[goog.typeOf(x__2394__auto____24127)];
      if(or__3824__auto____24128) {
        return or__3824__auto____24128
      }else {
        var or__3824__auto____24129 = cljs.core._next["_"];
        if(or__3824__auto____24129) {
          return or__3824__auto____24129
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
      var and__3822__auto____24138 = o;
      if(and__3822__auto____24138) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____24138
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2394__auto____24139 = o == null ? null : o;
      return function() {
        var or__3824__auto____24140 = cljs.core._lookup[goog.typeOf(x__2394__auto____24139)];
        if(or__3824__auto____24140) {
          return or__3824__auto____24140
        }else {
          var or__3824__auto____24141 = cljs.core._lookup["_"];
          if(or__3824__auto____24141) {
            return or__3824__auto____24141
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____24142 = o;
      if(and__3822__auto____24142) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____24142
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2394__auto____24143 = o == null ? null : o;
      return function() {
        var or__3824__auto____24144 = cljs.core._lookup[goog.typeOf(x__2394__auto____24143)];
        if(or__3824__auto____24144) {
          return or__3824__auto____24144
        }else {
          var or__3824__auto____24145 = cljs.core._lookup["_"];
          if(or__3824__auto____24145) {
            return or__3824__auto____24145
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
    var and__3822__auto____24150 = coll;
    if(and__3822__auto____24150) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____24150
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2394__auto____24151 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24152 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2394__auto____24151)];
      if(or__3824__auto____24152) {
        return or__3824__auto____24152
      }else {
        var or__3824__auto____24153 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____24153) {
          return or__3824__auto____24153
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____24158 = coll;
    if(and__3822__auto____24158) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____24158
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2394__auto____24159 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24160 = cljs.core._assoc[goog.typeOf(x__2394__auto____24159)];
      if(or__3824__auto____24160) {
        return or__3824__auto____24160
      }else {
        var or__3824__auto____24161 = cljs.core._assoc["_"];
        if(or__3824__auto____24161) {
          return or__3824__auto____24161
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
    var and__3822__auto____24166 = coll;
    if(and__3822__auto____24166) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____24166
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2394__auto____24167 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24168 = cljs.core._dissoc[goog.typeOf(x__2394__auto____24167)];
      if(or__3824__auto____24168) {
        return or__3824__auto____24168
      }else {
        var or__3824__auto____24169 = cljs.core._dissoc["_"];
        if(or__3824__auto____24169) {
          return or__3824__auto____24169
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
    var and__3822__auto____24174 = coll;
    if(and__3822__auto____24174) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____24174
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2394__auto____24175 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24176 = cljs.core._key[goog.typeOf(x__2394__auto____24175)];
      if(or__3824__auto____24176) {
        return or__3824__auto____24176
      }else {
        var or__3824__auto____24177 = cljs.core._key["_"];
        if(or__3824__auto____24177) {
          return or__3824__auto____24177
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____24182 = coll;
    if(and__3822__auto____24182) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____24182
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2394__auto____24183 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24184 = cljs.core._val[goog.typeOf(x__2394__auto____24183)];
      if(or__3824__auto____24184) {
        return or__3824__auto____24184
      }else {
        var or__3824__auto____24185 = cljs.core._val["_"];
        if(or__3824__auto____24185) {
          return or__3824__auto____24185
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
    var and__3822__auto____24190 = coll;
    if(and__3822__auto____24190) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____24190
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2394__auto____24191 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24192 = cljs.core._disjoin[goog.typeOf(x__2394__auto____24191)];
      if(or__3824__auto____24192) {
        return or__3824__auto____24192
      }else {
        var or__3824__auto____24193 = cljs.core._disjoin["_"];
        if(or__3824__auto____24193) {
          return or__3824__auto____24193
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
    var and__3822__auto____24198 = coll;
    if(and__3822__auto____24198) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____24198
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2394__auto____24199 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24200 = cljs.core._peek[goog.typeOf(x__2394__auto____24199)];
      if(or__3824__auto____24200) {
        return or__3824__auto____24200
      }else {
        var or__3824__auto____24201 = cljs.core._peek["_"];
        if(or__3824__auto____24201) {
          return or__3824__auto____24201
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____24206 = coll;
    if(and__3822__auto____24206) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____24206
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2394__auto____24207 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24208 = cljs.core._pop[goog.typeOf(x__2394__auto____24207)];
      if(or__3824__auto____24208) {
        return or__3824__auto____24208
      }else {
        var or__3824__auto____24209 = cljs.core._pop["_"];
        if(or__3824__auto____24209) {
          return or__3824__auto____24209
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
    var and__3822__auto____24214 = coll;
    if(and__3822__auto____24214) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____24214
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2394__auto____24215 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24216 = cljs.core._assoc_n[goog.typeOf(x__2394__auto____24215)];
      if(or__3824__auto____24216) {
        return or__3824__auto____24216
      }else {
        var or__3824__auto____24217 = cljs.core._assoc_n["_"];
        if(or__3824__auto____24217) {
          return or__3824__auto____24217
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
    var and__3822__auto____24222 = o;
    if(and__3822__auto____24222) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____24222
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2394__auto____24223 = o == null ? null : o;
    return function() {
      var or__3824__auto____24224 = cljs.core._deref[goog.typeOf(x__2394__auto____24223)];
      if(or__3824__auto____24224) {
        return or__3824__auto____24224
      }else {
        var or__3824__auto____24225 = cljs.core._deref["_"];
        if(or__3824__auto____24225) {
          return or__3824__auto____24225
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
    var and__3822__auto____24230 = o;
    if(and__3822__auto____24230) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____24230
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2394__auto____24231 = o == null ? null : o;
    return function() {
      var or__3824__auto____24232 = cljs.core._deref_with_timeout[goog.typeOf(x__2394__auto____24231)];
      if(or__3824__auto____24232) {
        return or__3824__auto____24232
      }else {
        var or__3824__auto____24233 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____24233) {
          return or__3824__auto____24233
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
    var and__3822__auto____24238 = o;
    if(and__3822__auto____24238) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____24238
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2394__auto____24239 = o == null ? null : o;
    return function() {
      var or__3824__auto____24240 = cljs.core._meta[goog.typeOf(x__2394__auto____24239)];
      if(or__3824__auto____24240) {
        return or__3824__auto____24240
      }else {
        var or__3824__auto____24241 = cljs.core._meta["_"];
        if(or__3824__auto____24241) {
          return or__3824__auto____24241
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
    var and__3822__auto____24246 = o;
    if(and__3822__auto____24246) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____24246
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2394__auto____24247 = o == null ? null : o;
    return function() {
      var or__3824__auto____24248 = cljs.core._with_meta[goog.typeOf(x__2394__auto____24247)];
      if(or__3824__auto____24248) {
        return or__3824__auto____24248
      }else {
        var or__3824__auto____24249 = cljs.core._with_meta["_"];
        if(or__3824__auto____24249) {
          return or__3824__auto____24249
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
      var and__3822__auto____24258 = coll;
      if(and__3822__auto____24258) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____24258
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2394__auto____24259 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____24260 = cljs.core._reduce[goog.typeOf(x__2394__auto____24259)];
        if(or__3824__auto____24260) {
          return or__3824__auto____24260
        }else {
          var or__3824__auto____24261 = cljs.core._reduce["_"];
          if(or__3824__auto____24261) {
            return or__3824__auto____24261
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____24262 = coll;
      if(and__3822__auto____24262) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____24262
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2394__auto____24263 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____24264 = cljs.core._reduce[goog.typeOf(x__2394__auto____24263)];
        if(or__3824__auto____24264) {
          return or__3824__auto____24264
        }else {
          var or__3824__auto____24265 = cljs.core._reduce["_"];
          if(or__3824__auto____24265) {
            return or__3824__auto____24265
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
    var and__3822__auto____24270 = coll;
    if(and__3822__auto____24270) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____24270
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2394__auto____24271 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24272 = cljs.core._kv_reduce[goog.typeOf(x__2394__auto____24271)];
      if(or__3824__auto____24272) {
        return or__3824__auto____24272
      }else {
        var or__3824__auto____24273 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____24273) {
          return or__3824__auto____24273
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
    var and__3822__auto____24278 = o;
    if(and__3822__auto____24278) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____24278
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2394__auto____24279 = o == null ? null : o;
    return function() {
      var or__3824__auto____24280 = cljs.core._equiv[goog.typeOf(x__2394__auto____24279)];
      if(or__3824__auto____24280) {
        return or__3824__auto____24280
      }else {
        var or__3824__auto____24281 = cljs.core._equiv["_"];
        if(or__3824__auto____24281) {
          return or__3824__auto____24281
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
    var and__3822__auto____24286 = o;
    if(and__3822__auto____24286) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____24286
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2394__auto____24287 = o == null ? null : o;
    return function() {
      var or__3824__auto____24288 = cljs.core._hash[goog.typeOf(x__2394__auto____24287)];
      if(or__3824__auto____24288) {
        return or__3824__auto____24288
      }else {
        var or__3824__auto____24289 = cljs.core._hash["_"];
        if(or__3824__auto____24289) {
          return or__3824__auto____24289
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
    var and__3822__auto____24294 = o;
    if(and__3822__auto____24294) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____24294
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2394__auto____24295 = o == null ? null : o;
    return function() {
      var or__3824__auto____24296 = cljs.core._seq[goog.typeOf(x__2394__auto____24295)];
      if(or__3824__auto____24296) {
        return or__3824__auto____24296
      }else {
        var or__3824__auto____24297 = cljs.core._seq["_"];
        if(or__3824__auto____24297) {
          return or__3824__auto____24297
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
    var and__3822__auto____24302 = coll;
    if(and__3822__auto____24302) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____24302
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2394__auto____24303 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24304 = cljs.core._rseq[goog.typeOf(x__2394__auto____24303)];
      if(or__3824__auto____24304) {
        return or__3824__auto____24304
      }else {
        var or__3824__auto____24305 = cljs.core._rseq["_"];
        if(or__3824__auto____24305) {
          return or__3824__auto____24305
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
    var and__3822__auto____24310 = coll;
    if(and__3822__auto____24310) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____24310
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2394__auto____24311 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24312 = cljs.core._sorted_seq[goog.typeOf(x__2394__auto____24311)];
      if(or__3824__auto____24312) {
        return or__3824__auto____24312
      }else {
        var or__3824__auto____24313 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____24313) {
          return or__3824__auto____24313
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____24318 = coll;
    if(and__3822__auto____24318) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____24318
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2394__auto____24319 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24320 = cljs.core._sorted_seq_from[goog.typeOf(x__2394__auto____24319)];
      if(or__3824__auto____24320) {
        return or__3824__auto____24320
      }else {
        var or__3824__auto____24321 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____24321) {
          return or__3824__auto____24321
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____24326 = coll;
    if(and__3822__auto____24326) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____24326
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2394__auto____24327 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24328 = cljs.core._entry_key[goog.typeOf(x__2394__auto____24327)];
      if(or__3824__auto____24328) {
        return or__3824__auto____24328
      }else {
        var or__3824__auto____24329 = cljs.core._entry_key["_"];
        if(or__3824__auto____24329) {
          return or__3824__auto____24329
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____24334 = coll;
    if(and__3822__auto____24334) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____24334
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2394__auto____24335 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24336 = cljs.core._comparator[goog.typeOf(x__2394__auto____24335)];
      if(or__3824__auto____24336) {
        return or__3824__auto____24336
      }else {
        var or__3824__auto____24337 = cljs.core._comparator["_"];
        if(or__3824__auto____24337) {
          return or__3824__auto____24337
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
    var and__3822__auto____24342 = o;
    if(and__3822__auto____24342) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____24342
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2394__auto____24343 = o == null ? null : o;
    return function() {
      var or__3824__auto____24344 = cljs.core._pr_seq[goog.typeOf(x__2394__auto____24343)];
      if(or__3824__auto____24344) {
        return or__3824__auto____24344
      }else {
        var or__3824__auto____24345 = cljs.core._pr_seq["_"];
        if(or__3824__auto____24345) {
          return or__3824__auto____24345
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
    var and__3822__auto____24350 = d;
    if(and__3822__auto____24350) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____24350
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2394__auto____24351 = d == null ? null : d;
    return function() {
      var or__3824__auto____24352 = cljs.core._realized_QMARK_[goog.typeOf(x__2394__auto____24351)];
      if(or__3824__auto____24352) {
        return or__3824__auto____24352
      }else {
        var or__3824__auto____24353 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____24353) {
          return or__3824__auto____24353
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
    var and__3822__auto____24358 = this$;
    if(and__3822__auto____24358) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____24358
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2394__auto____24359 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____24360 = cljs.core._notify_watches[goog.typeOf(x__2394__auto____24359)];
      if(or__3824__auto____24360) {
        return or__3824__auto____24360
      }else {
        var or__3824__auto____24361 = cljs.core._notify_watches["_"];
        if(or__3824__auto____24361) {
          return or__3824__auto____24361
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____24366 = this$;
    if(and__3822__auto____24366) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____24366
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2394__auto____24367 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____24368 = cljs.core._add_watch[goog.typeOf(x__2394__auto____24367)];
      if(or__3824__auto____24368) {
        return or__3824__auto____24368
      }else {
        var or__3824__auto____24369 = cljs.core._add_watch["_"];
        if(or__3824__auto____24369) {
          return or__3824__auto____24369
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____24374 = this$;
    if(and__3822__auto____24374) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____24374
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2394__auto____24375 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____24376 = cljs.core._remove_watch[goog.typeOf(x__2394__auto____24375)];
      if(or__3824__auto____24376) {
        return or__3824__auto____24376
      }else {
        var or__3824__auto____24377 = cljs.core._remove_watch["_"];
        if(or__3824__auto____24377) {
          return or__3824__auto____24377
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
    var and__3822__auto____24382 = coll;
    if(and__3822__auto____24382) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____24382
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2394__auto____24383 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24384 = cljs.core._as_transient[goog.typeOf(x__2394__auto____24383)];
      if(or__3824__auto____24384) {
        return or__3824__auto____24384
      }else {
        var or__3824__auto____24385 = cljs.core._as_transient["_"];
        if(or__3824__auto____24385) {
          return or__3824__auto____24385
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
    var and__3822__auto____24390 = tcoll;
    if(and__3822__auto____24390) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____24390
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2394__auto____24391 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24392 = cljs.core._conj_BANG_[goog.typeOf(x__2394__auto____24391)];
      if(or__3824__auto____24392) {
        return or__3824__auto____24392
      }else {
        var or__3824__auto____24393 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____24393) {
          return or__3824__auto____24393
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____24398 = tcoll;
    if(and__3822__auto____24398) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____24398
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2394__auto____24399 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24400 = cljs.core._persistent_BANG_[goog.typeOf(x__2394__auto____24399)];
      if(or__3824__auto____24400) {
        return or__3824__auto____24400
      }else {
        var or__3824__auto____24401 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____24401) {
          return or__3824__auto____24401
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
    var and__3822__auto____24406 = tcoll;
    if(and__3822__auto____24406) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____24406
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2394__auto____24407 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24408 = cljs.core._assoc_BANG_[goog.typeOf(x__2394__auto____24407)];
      if(or__3824__auto____24408) {
        return or__3824__auto____24408
      }else {
        var or__3824__auto____24409 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____24409) {
          return or__3824__auto____24409
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
    var and__3822__auto____24414 = tcoll;
    if(and__3822__auto____24414) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____24414
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2394__auto____24415 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24416 = cljs.core._dissoc_BANG_[goog.typeOf(x__2394__auto____24415)];
      if(or__3824__auto____24416) {
        return or__3824__auto____24416
      }else {
        var or__3824__auto____24417 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____24417) {
          return or__3824__auto____24417
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
    var and__3822__auto____24422 = tcoll;
    if(and__3822__auto____24422) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____24422
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2394__auto____24423 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24424 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2394__auto____24423)];
      if(or__3824__auto____24424) {
        return or__3824__auto____24424
      }else {
        var or__3824__auto____24425 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____24425) {
          return or__3824__auto____24425
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____24430 = tcoll;
    if(and__3822__auto____24430) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____24430
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2394__auto____24431 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24432 = cljs.core._pop_BANG_[goog.typeOf(x__2394__auto____24431)];
      if(or__3824__auto____24432) {
        return or__3824__auto____24432
      }else {
        var or__3824__auto____24433 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____24433) {
          return or__3824__auto____24433
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
    var and__3822__auto____24438 = tcoll;
    if(and__3822__auto____24438) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____24438
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2394__auto____24439 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____24440 = cljs.core._disjoin_BANG_[goog.typeOf(x__2394__auto____24439)];
      if(or__3824__auto____24440) {
        return or__3824__auto____24440
      }else {
        var or__3824__auto____24441 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____24441) {
          return or__3824__auto____24441
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
    var and__3822__auto____24446 = x;
    if(and__3822__auto____24446) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____24446
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2394__auto____24447 = x == null ? null : x;
    return function() {
      var or__3824__auto____24448 = cljs.core._compare[goog.typeOf(x__2394__auto____24447)];
      if(or__3824__auto____24448) {
        return or__3824__auto____24448
      }else {
        var or__3824__auto____24449 = cljs.core._compare["_"];
        if(or__3824__auto____24449) {
          return or__3824__auto____24449
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
    var and__3822__auto____24454 = coll;
    if(and__3822__auto____24454) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____24454
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2394__auto____24455 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24456 = cljs.core._drop_first[goog.typeOf(x__2394__auto____24455)];
      if(or__3824__auto____24456) {
        return or__3824__auto____24456
      }else {
        var or__3824__auto____24457 = cljs.core._drop_first["_"];
        if(or__3824__auto____24457) {
          return or__3824__auto____24457
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
    var and__3822__auto____24462 = coll;
    if(and__3822__auto____24462) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____24462
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2394__auto____24463 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24464 = cljs.core._chunked_first[goog.typeOf(x__2394__auto____24463)];
      if(or__3824__auto____24464) {
        return or__3824__auto____24464
      }else {
        var or__3824__auto____24465 = cljs.core._chunked_first["_"];
        if(or__3824__auto____24465) {
          return or__3824__auto____24465
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____24470 = coll;
    if(and__3822__auto____24470) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____24470
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2394__auto____24471 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24472 = cljs.core._chunked_rest[goog.typeOf(x__2394__auto____24471)];
      if(or__3824__auto____24472) {
        return or__3824__auto____24472
      }else {
        var or__3824__auto____24473 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____24473) {
          return or__3824__auto____24473
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
    var and__3822__auto____24478 = coll;
    if(and__3822__auto____24478) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____24478
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2394__auto____24479 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____24480 = cljs.core._chunked_next[goog.typeOf(x__2394__auto____24479)];
      if(or__3824__auto____24480) {
        return or__3824__auto____24480
      }else {
        var or__3824__auto____24481 = cljs.core._chunked_next["_"];
        if(or__3824__auto____24481) {
          return or__3824__auto____24481
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
    var or__3824__auto____24483 = x === y;
    if(or__3824__auto____24483) {
      return or__3824__auto____24483
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__24484__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__24485 = y;
            var G__24486 = cljs.core.first.call(null, more);
            var G__24487 = cljs.core.next.call(null, more);
            x = G__24485;
            y = G__24486;
            more = G__24487;
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
    var G__24484 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24484__delegate.call(this, x, y, more)
    };
    G__24484.cljs$lang$maxFixedArity = 2;
    G__24484.cljs$lang$applyTo = function(arglist__24488) {
      var x = cljs.core.first(arglist__24488);
      var y = cljs.core.first(cljs.core.next(arglist__24488));
      var more = cljs.core.rest(cljs.core.next(arglist__24488));
      return G__24484__delegate(x, y, more)
    };
    G__24484.cljs$lang$arity$variadic = G__24484__delegate;
    return G__24484
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
  var G__24489 = null;
  var G__24489__2 = function(o, k) {
    return null
  };
  var G__24489__3 = function(o, k, not_found) {
    return not_found
  };
  G__24489 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__24489__2.call(this, o, k);
      case 3:
        return G__24489__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24489
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
  var G__24490 = null;
  var G__24490__2 = function(_, f) {
    return f.call(null)
  };
  var G__24490__3 = function(_, f, start) {
    return start
  };
  G__24490 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__24490__2.call(this, _, f);
      case 3:
        return G__24490__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24490
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
  var G__24491 = null;
  var G__24491__2 = function(_, n) {
    return null
  };
  var G__24491__3 = function(_, n, not_found) {
    return not_found
  };
  G__24491 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__24491__2.call(this, _, n);
      case 3:
        return G__24491__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24491
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
  var and__3822__auto____24492 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____24492) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____24492
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
    var cnt__24505 = cljs.core._count.call(null, cicoll);
    if(cnt__24505 === 0) {
      return f.call(null)
    }else {
      var val__24506 = cljs.core._nth.call(null, cicoll, 0);
      var n__24507 = 1;
      while(true) {
        if(n__24507 < cnt__24505) {
          var nval__24508 = f.call(null, val__24506, cljs.core._nth.call(null, cicoll, n__24507));
          if(cljs.core.reduced_QMARK_.call(null, nval__24508)) {
            return cljs.core.deref.call(null, nval__24508)
          }else {
            var G__24517 = nval__24508;
            var G__24518 = n__24507 + 1;
            val__24506 = G__24517;
            n__24507 = G__24518;
            continue
          }
        }else {
          return val__24506
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__24509 = cljs.core._count.call(null, cicoll);
    var val__24510 = val;
    var n__24511 = 0;
    while(true) {
      if(n__24511 < cnt__24509) {
        var nval__24512 = f.call(null, val__24510, cljs.core._nth.call(null, cicoll, n__24511));
        if(cljs.core.reduced_QMARK_.call(null, nval__24512)) {
          return cljs.core.deref.call(null, nval__24512)
        }else {
          var G__24519 = nval__24512;
          var G__24520 = n__24511 + 1;
          val__24510 = G__24519;
          n__24511 = G__24520;
          continue
        }
      }else {
        return val__24510
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__24513 = cljs.core._count.call(null, cicoll);
    var val__24514 = val;
    var n__24515 = idx;
    while(true) {
      if(n__24515 < cnt__24513) {
        var nval__24516 = f.call(null, val__24514, cljs.core._nth.call(null, cicoll, n__24515));
        if(cljs.core.reduced_QMARK_.call(null, nval__24516)) {
          return cljs.core.deref.call(null, nval__24516)
        }else {
          var G__24521 = nval__24516;
          var G__24522 = n__24515 + 1;
          val__24514 = G__24521;
          n__24515 = G__24522;
          continue
        }
      }else {
        return val__24514
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
    var cnt__24535 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__24536 = arr[0];
      var n__24537 = 1;
      while(true) {
        if(n__24537 < cnt__24535) {
          var nval__24538 = f.call(null, val__24536, arr[n__24537]);
          if(cljs.core.reduced_QMARK_.call(null, nval__24538)) {
            return cljs.core.deref.call(null, nval__24538)
          }else {
            var G__24547 = nval__24538;
            var G__24548 = n__24537 + 1;
            val__24536 = G__24547;
            n__24537 = G__24548;
            continue
          }
        }else {
          return val__24536
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__24539 = arr.length;
    var val__24540 = val;
    var n__24541 = 0;
    while(true) {
      if(n__24541 < cnt__24539) {
        var nval__24542 = f.call(null, val__24540, arr[n__24541]);
        if(cljs.core.reduced_QMARK_.call(null, nval__24542)) {
          return cljs.core.deref.call(null, nval__24542)
        }else {
          var G__24549 = nval__24542;
          var G__24550 = n__24541 + 1;
          val__24540 = G__24549;
          n__24541 = G__24550;
          continue
        }
      }else {
        return val__24540
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__24543 = arr.length;
    var val__24544 = val;
    var n__24545 = idx;
    while(true) {
      if(n__24545 < cnt__24543) {
        var nval__24546 = f.call(null, val__24544, arr[n__24545]);
        if(cljs.core.reduced_QMARK_.call(null, nval__24546)) {
          return cljs.core.deref.call(null, nval__24546)
        }else {
          var G__24551 = nval__24546;
          var G__24552 = n__24545 + 1;
          val__24544 = G__24551;
          n__24545 = G__24552;
          continue
        }
      }else {
        return val__24544
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
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__24553 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__24554 = this;
  if(this__24554.i + 1 < this__24554.a.length) {
    return new cljs.core.IndexedSeq(this__24554.a, this__24554.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__24555 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__24556 = this;
  var c__24557 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__24557 > 0) {
    return new cljs.core.RSeq(coll, c__24557 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__24558 = this;
  var this__24559 = this;
  return cljs.core.pr_str.call(null, this__24559)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__24560 = this;
  if(cljs.core.counted_QMARK_.call(null, this__24560.a)) {
    return cljs.core.ci_reduce.call(null, this__24560.a, f, this__24560.a[this__24560.i], this__24560.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__24560.a[this__24560.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__24561 = this;
  if(cljs.core.counted_QMARK_.call(null, this__24561.a)) {
    return cljs.core.ci_reduce.call(null, this__24561.a, f, start, this__24561.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__24562 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__24563 = this;
  return this__24563.a.length - this__24563.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__24564 = this;
  return this__24564.a[this__24564.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__24565 = this;
  if(this__24565.i + 1 < this__24565.a.length) {
    return new cljs.core.IndexedSeq(this__24565.a, this__24565.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__24566 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__24567 = this;
  var i__24568 = n + this__24567.i;
  if(i__24568 < this__24567.a.length) {
    return this__24567.a[i__24568]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__24569 = this;
  var i__24570 = n + this__24569.i;
  if(i__24570 < this__24569.a.length) {
    return this__24569.a[i__24570]
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
  var G__24571 = null;
  var G__24571__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__24571__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__24571 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__24571__2.call(this, array, f);
      case 3:
        return G__24571__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24571
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__24572 = null;
  var G__24572__2 = function(array, k) {
    return array[k]
  };
  var G__24572__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__24572 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__24572__2.call(this, array, k);
      case 3:
        return G__24572__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24572
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__24573 = null;
  var G__24573__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__24573__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__24573 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__24573__2.call(this, array, n);
      case 3:
        return G__24573__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__24573
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
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__24574 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__24575 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__24576 = this;
  var this__24577 = this;
  return cljs.core.pr_str.call(null, this__24577)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__24578 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__24579 = this;
  return this__24579.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__24580 = this;
  return cljs.core._nth.call(null, this__24580.ci, this__24580.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__24581 = this;
  if(this__24581.i > 0) {
    return new cljs.core.RSeq(this__24581.ci, this__24581.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__24582 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__24583 = this;
  return new cljs.core.RSeq(this__24583.ci, this__24583.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__24584 = this;
  return this__24584.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__24588__24589 = coll;
      if(G__24588__24589) {
        if(function() {
          var or__3824__auto____24590 = G__24588__24589.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____24590) {
            return or__3824__auto____24590
          }else {
            return G__24588__24589.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__24588__24589.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__24588__24589)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__24588__24589)
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
      var G__24595__24596 = coll;
      if(G__24595__24596) {
        if(function() {
          var or__3824__auto____24597 = G__24595__24596.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____24597) {
            return or__3824__auto____24597
          }else {
            return G__24595__24596.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__24595__24596.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24595__24596)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24595__24596)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__24598 = cljs.core.seq.call(null, coll);
      if(s__24598 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__24598)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__24603__24604 = coll;
      if(G__24603__24604) {
        if(function() {
          var or__3824__auto____24605 = G__24603__24604.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____24605) {
            return or__3824__auto____24605
          }else {
            return G__24603__24604.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__24603__24604.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24603__24604)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24603__24604)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__24606 = cljs.core.seq.call(null, coll);
      if(!(s__24606 == null)) {
        return cljs.core._rest.call(null, s__24606)
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
      var G__24610__24611 = coll;
      if(G__24610__24611) {
        if(function() {
          var or__3824__auto____24612 = G__24610__24611.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____24612) {
            return or__3824__auto____24612
          }else {
            return G__24610__24611.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__24610__24611.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__24610__24611)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__24610__24611)
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
    var sn__24614 = cljs.core.next.call(null, s);
    if(!(sn__24614 == null)) {
      var G__24615 = sn__24614;
      s = G__24615;
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
    var G__24616__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__24617 = conj.call(null, coll, x);
          var G__24618 = cljs.core.first.call(null, xs);
          var G__24619 = cljs.core.next.call(null, xs);
          coll = G__24617;
          x = G__24618;
          xs = G__24619;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__24616 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24616__delegate.call(this, coll, x, xs)
    };
    G__24616.cljs$lang$maxFixedArity = 2;
    G__24616.cljs$lang$applyTo = function(arglist__24620) {
      var coll = cljs.core.first(arglist__24620);
      var x = cljs.core.first(cljs.core.next(arglist__24620));
      var xs = cljs.core.rest(cljs.core.next(arglist__24620));
      return G__24616__delegate(coll, x, xs)
    };
    G__24616.cljs$lang$arity$variadic = G__24616__delegate;
    return G__24616
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
  var s__24623 = cljs.core.seq.call(null, coll);
  var acc__24624 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__24623)) {
      return acc__24624 + cljs.core._count.call(null, s__24623)
    }else {
      var G__24625 = cljs.core.next.call(null, s__24623);
      var G__24626 = acc__24624 + 1;
      s__24623 = G__24625;
      acc__24624 = G__24626;
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
        var G__24633__24634 = coll;
        if(G__24633__24634) {
          if(function() {
            var or__3824__auto____24635 = G__24633__24634.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____24635) {
              return or__3824__auto____24635
            }else {
              return G__24633__24634.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__24633__24634.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24633__24634)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24633__24634)
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
        var G__24636__24637 = coll;
        if(G__24636__24637) {
          if(function() {
            var or__3824__auto____24638 = G__24636__24637.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____24638) {
              return or__3824__auto____24638
            }else {
              return G__24636__24637.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__24636__24637.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24636__24637)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24636__24637)
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
    var G__24641__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__24640 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__24642 = ret__24640;
          var G__24643 = cljs.core.first.call(null, kvs);
          var G__24644 = cljs.core.second.call(null, kvs);
          var G__24645 = cljs.core.nnext.call(null, kvs);
          coll = G__24642;
          k = G__24643;
          v = G__24644;
          kvs = G__24645;
          continue
        }else {
          return ret__24640
        }
        break
      }
    };
    var G__24641 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__24641__delegate.call(this, coll, k, v, kvs)
    };
    G__24641.cljs$lang$maxFixedArity = 3;
    G__24641.cljs$lang$applyTo = function(arglist__24646) {
      var coll = cljs.core.first(arglist__24646);
      var k = cljs.core.first(cljs.core.next(arglist__24646));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__24646)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__24646)));
      return G__24641__delegate(coll, k, v, kvs)
    };
    G__24641.cljs$lang$arity$variadic = G__24641__delegate;
    return G__24641
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
    var G__24649__delegate = function(coll, k, ks) {
      while(true) {
        var ret__24648 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__24650 = ret__24648;
          var G__24651 = cljs.core.first.call(null, ks);
          var G__24652 = cljs.core.next.call(null, ks);
          coll = G__24650;
          k = G__24651;
          ks = G__24652;
          continue
        }else {
          return ret__24648
        }
        break
      }
    };
    var G__24649 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24649__delegate.call(this, coll, k, ks)
    };
    G__24649.cljs$lang$maxFixedArity = 2;
    G__24649.cljs$lang$applyTo = function(arglist__24653) {
      var coll = cljs.core.first(arglist__24653);
      var k = cljs.core.first(cljs.core.next(arglist__24653));
      var ks = cljs.core.rest(cljs.core.next(arglist__24653));
      return G__24649__delegate(coll, k, ks)
    };
    G__24649.cljs$lang$arity$variadic = G__24649__delegate;
    return G__24649
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
    var G__24657__24658 = o;
    if(G__24657__24658) {
      if(function() {
        var or__3824__auto____24659 = G__24657__24658.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____24659) {
          return or__3824__auto____24659
        }else {
          return G__24657__24658.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__24657__24658.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__24657__24658)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__24657__24658)
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
    var G__24662__delegate = function(coll, k, ks) {
      while(true) {
        var ret__24661 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__24663 = ret__24661;
          var G__24664 = cljs.core.first.call(null, ks);
          var G__24665 = cljs.core.next.call(null, ks);
          coll = G__24663;
          k = G__24664;
          ks = G__24665;
          continue
        }else {
          return ret__24661
        }
        break
      }
    };
    var G__24662 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24662__delegate.call(this, coll, k, ks)
    };
    G__24662.cljs$lang$maxFixedArity = 2;
    G__24662.cljs$lang$applyTo = function(arglist__24666) {
      var coll = cljs.core.first(arglist__24666);
      var k = cljs.core.first(cljs.core.next(arglist__24666));
      var ks = cljs.core.rest(cljs.core.next(arglist__24666));
      return G__24662__delegate(coll, k, ks)
    };
    G__24662.cljs$lang$arity$variadic = G__24662__delegate;
    return G__24662
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
  var h__24668 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__24668;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__24668
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__24670 = cljs.core.string_hash_cache[k];
  if(!(h__24670 == null)) {
    return h__24670
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
      var and__3822__auto____24672 = goog.isString(o);
      if(and__3822__auto____24672) {
        return check_cache
      }else {
        return and__3822__auto____24672
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
    var G__24676__24677 = x;
    if(G__24676__24677) {
      if(function() {
        var or__3824__auto____24678 = G__24676__24677.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____24678) {
          return or__3824__auto____24678
        }else {
          return G__24676__24677.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__24676__24677.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__24676__24677)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__24676__24677)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__24682__24683 = x;
    if(G__24682__24683) {
      if(function() {
        var or__3824__auto____24684 = G__24682__24683.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____24684) {
          return or__3824__auto____24684
        }else {
          return G__24682__24683.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__24682__24683.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__24682__24683)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__24682__24683)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__24688__24689 = x;
  if(G__24688__24689) {
    if(function() {
      var or__3824__auto____24690 = G__24688__24689.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____24690) {
        return or__3824__auto____24690
      }else {
        return G__24688__24689.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__24688__24689.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__24688__24689)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__24688__24689)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__24694__24695 = x;
  if(G__24694__24695) {
    if(function() {
      var or__3824__auto____24696 = G__24694__24695.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____24696) {
        return or__3824__auto____24696
      }else {
        return G__24694__24695.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__24694__24695.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__24694__24695)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__24694__24695)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__24700__24701 = x;
  if(G__24700__24701) {
    if(function() {
      var or__3824__auto____24702 = G__24700__24701.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____24702) {
        return or__3824__auto____24702
      }else {
        return G__24700__24701.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__24700__24701.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__24700__24701)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__24700__24701)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__24706__24707 = x;
  if(G__24706__24707) {
    if(function() {
      var or__3824__auto____24708 = G__24706__24707.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____24708) {
        return or__3824__auto____24708
      }else {
        return G__24706__24707.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__24706__24707.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24706__24707)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__24706__24707)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__24712__24713 = x;
  if(G__24712__24713) {
    if(function() {
      var or__3824__auto____24714 = G__24712__24713.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____24714) {
        return or__3824__auto____24714
      }else {
        return G__24712__24713.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__24712__24713.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24712__24713)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24712__24713)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__24718__24719 = x;
    if(G__24718__24719) {
      if(function() {
        var or__3824__auto____24720 = G__24718__24719.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____24720) {
          return or__3824__auto____24720
        }else {
          return G__24718__24719.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__24718__24719.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__24718__24719)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__24718__24719)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__24724__24725 = x;
  if(G__24724__24725) {
    if(function() {
      var or__3824__auto____24726 = G__24724__24725.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____24726) {
        return or__3824__auto____24726
      }else {
        return G__24724__24725.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__24724__24725.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__24724__24725)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__24724__24725)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__24730__24731 = x;
  if(G__24730__24731) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____24732 = null;
      if(cljs.core.truth_(or__3824__auto____24732)) {
        return or__3824__auto____24732
      }else {
        return G__24730__24731.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__24730__24731.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__24730__24731)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__24730__24731)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__24733__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__24733 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__24733__delegate.call(this, keyvals)
    };
    G__24733.cljs$lang$maxFixedArity = 0;
    G__24733.cljs$lang$applyTo = function(arglist__24734) {
      var keyvals = cljs.core.seq(arglist__24734);
      return G__24733__delegate(keyvals)
    };
    G__24733.cljs$lang$arity$variadic = G__24733__delegate;
    return G__24733
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
  var keys__24736 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__24736.push(key)
  });
  return keys__24736
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__24740 = i;
  var j__24741 = j;
  var len__24742 = len;
  while(true) {
    if(len__24742 === 0) {
      return to
    }else {
      to[j__24741] = from[i__24740];
      var G__24743 = i__24740 + 1;
      var G__24744 = j__24741 + 1;
      var G__24745 = len__24742 - 1;
      i__24740 = G__24743;
      j__24741 = G__24744;
      len__24742 = G__24745;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__24749 = i + (len - 1);
  var j__24750 = j + (len - 1);
  var len__24751 = len;
  while(true) {
    if(len__24751 === 0) {
      return to
    }else {
      to[j__24750] = from[i__24749];
      var G__24752 = i__24749 - 1;
      var G__24753 = j__24750 - 1;
      var G__24754 = len__24751 - 1;
      i__24749 = G__24752;
      j__24750 = G__24753;
      len__24751 = G__24754;
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
    var G__24758__24759 = s;
    if(G__24758__24759) {
      if(function() {
        var or__3824__auto____24760 = G__24758__24759.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____24760) {
          return or__3824__auto____24760
        }else {
          return G__24758__24759.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__24758__24759.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24758__24759)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__24758__24759)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__24764__24765 = s;
  if(G__24764__24765) {
    if(function() {
      var or__3824__auto____24766 = G__24764__24765.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____24766) {
        return or__3824__auto____24766
      }else {
        return G__24764__24765.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__24764__24765.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__24764__24765)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__24764__24765)
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
  var and__3822__auto____24769 = goog.isString(x);
  if(and__3822__auto____24769) {
    return!function() {
      var or__3824__auto____24770 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____24770) {
        return or__3824__auto____24770
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____24769
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____24772 = goog.isString(x);
  if(and__3822__auto____24772) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____24772
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____24774 = goog.isString(x);
  if(and__3822__auto____24774) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____24774
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____24779 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____24779) {
    return or__3824__auto____24779
  }else {
    var G__24780__24781 = f;
    if(G__24780__24781) {
      if(function() {
        var or__3824__auto____24782 = G__24780__24781.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____24782) {
          return or__3824__auto____24782
        }else {
          return G__24780__24781.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__24780__24781.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__24780__24781)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__24780__24781)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____24784 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____24784) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____24784
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
    var and__3822__auto____24787 = coll;
    if(cljs.core.truth_(and__3822__auto____24787)) {
      var and__3822__auto____24788 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____24788) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____24788
      }
    }else {
      return and__3822__auto____24787
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
    var G__24797__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__24793 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__24794 = more;
        while(true) {
          var x__24795 = cljs.core.first.call(null, xs__24794);
          var etc__24796 = cljs.core.next.call(null, xs__24794);
          if(cljs.core.truth_(xs__24794)) {
            if(cljs.core.contains_QMARK_.call(null, s__24793, x__24795)) {
              return false
            }else {
              var G__24798 = cljs.core.conj.call(null, s__24793, x__24795);
              var G__24799 = etc__24796;
              s__24793 = G__24798;
              xs__24794 = G__24799;
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
    var G__24797 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24797__delegate.call(this, x, y, more)
    };
    G__24797.cljs$lang$maxFixedArity = 2;
    G__24797.cljs$lang$applyTo = function(arglist__24800) {
      var x = cljs.core.first(arglist__24800);
      var y = cljs.core.first(cljs.core.next(arglist__24800));
      var more = cljs.core.rest(cljs.core.next(arglist__24800));
      return G__24797__delegate(x, y, more)
    };
    G__24797.cljs$lang$arity$variadic = G__24797__delegate;
    return G__24797
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
            var G__24804__24805 = x;
            if(G__24804__24805) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____24806 = null;
                if(cljs.core.truth_(or__3824__auto____24806)) {
                  return or__3824__auto____24806
                }else {
                  return G__24804__24805.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__24804__24805.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__24804__24805)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__24804__24805)
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
    var xl__24811 = cljs.core.count.call(null, xs);
    var yl__24812 = cljs.core.count.call(null, ys);
    if(xl__24811 < yl__24812) {
      return-1
    }else {
      if(xl__24811 > yl__24812) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__24811, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__24813 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____24814 = d__24813 === 0;
        if(and__3822__auto____24814) {
          return n + 1 < len
        }else {
          return and__3822__auto____24814
        }
      }()) {
        var G__24815 = xs;
        var G__24816 = ys;
        var G__24817 = len;
        var G__24818 = n + 1;
        xs = G__24815;
        ys = G__24816;
        len = G__24817;
        n = G__24818;
        continue
      }else {
        return d__24813
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
      var r__24820 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__24820)) {
        return r__24820
      }else {
        if(cljs.core.truth_(r__24820)) {
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
      var a__24822 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__24822, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__24822)
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
    var temp__3971__auto____24828 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____24828) {
      var s__24829 = temp__3971__auto____24828;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__24829), cljs.core.next.call(null, s__24829))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__24830 = val;
    var coll__24831 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__24831) {
        var nval__24832 = f.call(null, val__24830, cljs.core.first.call(null, coll__24831));
        if(cljs.core.reduced_QMARK_.call(null, nval__24832)) {
          return cljs.core.deref.call(null, nval__24832)
        }else {
          var G__24833 = nval__24832;
          var G__24834 = cljs.core.next.call(null, coll__24831);
          val__24830 = G__24833;
          coll__24831 = G__24834;
          continue
        }
      }else {
        return val__24830
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
  var a__24836 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__24836);
  return cljs.core.vec.call(null, a__24836)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__24843__24844 = coll;
      if(G__24843__24844) {
        if(function() {
          var or__3824__auto____24845 = G__24843__24844.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____24845) {
            return or__3824__auto____24845
          }else {
            return G__24843__24844.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__24843__24844.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24843__24844)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24843__24844)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__24846__24847 = coll;
      if(G__24846__24847) {
        if(function() {
          var or__3824__auto____24848 = G__24846__24847.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____24848) {
            return or__3824__auto____24848
          }else {
            return G__24846__24847.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__24846__24847.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24846__24847)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__24846__24847)
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
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__24849 = this;
  return this__24849.val
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
    var G__24850__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__24850 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24850__delegate.call(this, x, y, more)
    };
    G__24850.cljs$lang$maxFixedArity = 2;
    G__24850.cljs$lang$applyTo = function(arglist__24851) {
      var x = cljs.core.first(arglist__24851);
      var y = cljs.core.first(cljs.core.next(arglist__24851));
      var more = cljs.core.rest(cljs.core.next(arglist__24851));
      return G__24850__delegate(x, y, more)
    };
    G__24850.cljs$lang$arity$variadic = G__24850__delegate;
    return G__24850
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
    var G__24852__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__24852 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24852__delegate.call(this, x, y, more)
    };
    G__24852.cljs$lang$maxFixedArity = 2;
    G__24852.cljs$lang$applyTo = function(arglist__24853) {
      var x = cljs.core.first(arglist__24853);
      var y = cljs.core.first(cljs.core.next(arglist__24853));
      var more = cljs.core.rest(cljs.core.next(arglist__24853));
      return G__24852__delegate(x, y, more)
    };
    G__24852.cljs$lang$arity$variadic = G__24852__delegate;
    return G__24852
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
    var G__24854__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__24854 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24854__delegate.call(this, x, y, more)
    };
    G__24854.cljs$lang$maxFixedArity = 2;
    G__24854.cljs$lang$applyTo = function(arglist__24855) {
      var x = cljs.core.first(arglist__24855);
      var y = cljs.core.first(cljs.core.next(arglist__24855));
      var more = cljs.core.rest(cljs.core.next(arglist__24855));
      return G__24854__delegate(x, y, more)
    };
    G__24854.cljs$lang$arity$variadic = G__24854__delegate;
    return G__24854
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
    var G__24856__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__24856 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24856__delegate.call(this, x, y, more)
    };
    G__24856.cljs$lang$maxFixedArity = 2;
    G__24856.cljs$lang$applyTo = function(arglist__24857) {
      var x = cljs.core.first(arglist__24857);
      var y = cljs.core.first(cljs.core.next(arglist__24857));
      var more = cljs.core.rest(cljs.core.next(arglist__24857));
      return G__24856__delegate(x, y, more)
    };
    G__24856.cljs$lang$arity$variadic = G__24856__delegate;
    return G__24856
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
    var G__24858__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__24859 = y;
            var G__24860 = cljs.core.first.call(null, more);
            var G__24861 = cljs.core.next.call(null, more);
            x = G__24859;
            y = G__24860;
            more = G__24861;
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
    var G__24858 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24858__delegate.call(this, x, y, more)
    };
    G__24858.cljs$lang$maxFixedArity = 2;
    G__24858.cljs$lang$applyTo = function(arglist__24862) {
      var x = cljs.core.first(arglist__24862);
      var y = cljs.core.first(cljs.core.next(arglist__24862));
      var more = cljs.core.rest(cljs.core.next(arglist__24862));
      return G__24858__delegate(x, y, more)
    };
    G__24858.cljs$lang$arity$variadic = G__24858__delegate;
    return G__24858
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
    var G__24863__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__24864 = y;
            var G__24865 = cljs.core.first.call(null, more);
            var G__24866 = cljs.core.next.call(null, more);
            x = G__24864;
            y = G__24865;
            more = G__24866;
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
    var G__24863 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24863__delegate.call(this, x, y, more)
    };
    G__24863.cljs$lang$maxFixedArity = 2;
    G__24863.cljs$lang$applyTo = function(arglist__24867) {
      var x = cljs.core.first(arglist__24867);
      var y = cljs.core.first(cljs.core.next(arglist__24867));
      var more = cljs.core.rest(cljs.core.next(arglist__24867));
      return G__24863__delegate(x, y, more)
    };
    G__24863.cljs$lang$arity$variadic = G__24863__delegate;
    return G__24863
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
    var G__24868__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__24869 = y;
            var G__24870 = cljs.core.first.call(null, more);
            var G__24871 = cljs.core.next.call(null, more);
            x = G__24869;
            y = G__24870;
            more = G__24871;
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
    var G__24868 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24868__delegate.call(this, x, y, more)
    };
    G__24868.cljs$lang$maxFixedArity = 2;
    G__24868.cljs$lang$applyTo = function(arglist__24872) {
      var x = cljs.core.first(arglist__24872);
      var y = cljs.core.first(cljs.core.next(arglist__24872));
      var more = cljs.core.rest(cljs.core.next(arglist__24872));
      return G__24868__delegate(x, y, more)
    };
    G__24868.cljs$lang$arity$variadic = G__24868__delegate;
    return G__24868
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
    var G__24873__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__24874 = y;
            var G__24875 = cljs.core.first.call(null, more);
            var G__24876 = cljs.core.next.call(null, more);
            x = G__24874;
            y = G__24875;
            more = G__24876;
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
    var G__24873 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24873__delegate.call(this, x, y, more)
    };
    G__24873.cljs$lang$maxFixedArity = 2;
    G__24873.cljs$lang$applyTo = function(arglist__24877) {
      var x = cljs.core.first(arglist__24877);
      var y = cljs.core.first(cljs.core.next(arglist__24877));
      var more = cljs.core.rest(cljs.core.next(arglist__24877));
      return G__24873__delegate(x, y, more)
    };
    G__24873.cljs$lang$arity$variadic = G__24873__delegate;
    return G__24873
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
    var G__24878__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__24878 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24878__delegate.call(this, x, y, more)
    };
    G__24878.cljs$lang$maxFixedArity = 2;
    G__24878.cljs$lang$applyTo = function(arglist__24879) {
      var x = cljs.core.first(arglist__24879);
      var y = cljs.core.first(cljs.core.next(arglist__24879));
      var more = cljs.core.rest(cljs.core.next(arglist__24879));
      return G__24878__delegate(x, y, more)
    };
    G__24878.cljs$lang$arity$variadic = G__24878__delegate;
    return G__24878
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
    var G__24880__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__24880 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24880__delegate.call(this, x, y, more)
    };
    G__24880.cljs$lang$maxFixedArity = 2;
    G__24880.cljs$lang$applyTo = function(arglist__24881) {
      var x = cljs.core.first(arglist__24881);
      var y = cljs.core.first(cljs.core.next(arglist__24881));
      var more = cljs.core.rest(cljs.core.next(arglist__24881));
      return G__24880__delegate(x, y, more)
    };
    G__24880.cljs$lang$arity$variadic = G__24880__delegate;
    return G__24880
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
  var rem__24883 = n % d;
  return cljs.core.fix.call(null, (n - rem__24883) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__24885 = cljs.core.quot.call(null, n, d);
  return n - d * q__24885
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
  var v__24888 = v - (v >> 1 & 1431655765);
  var v__24889 = (v__24888 & 858993459) + (v__24888 >> 2 & 858993459);
  return(v__24889 + (v__24889 >> 4) & 252645135) * 16843009 >> 24
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
    var G__24890__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__24891 = y;
            var G__24892 = cljs.core.first.call(null, more);
            var G__24893 = cljs.core.next.call(null, more);
            x = G__24891;
            y = G__24892;
            more = G__24893;
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
    var G__24890 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__24890__delegate.call(this, x, y, more)
    };
    G__24890.cljs$lang$maxFixedArity = 2;
    G__24890.cljs$lang$applyTo = function(arglist__24894) {
      var x = cljs.core.first(arglist__24894);
      var y = cljs.core.first(cljs.core.next(arglist__24894));
      var more = cljs.core.rest(cljs.core.next(arglist__24894));
      return G__24890__delegate(x, y, more)
    };
    G__24890.cljs$lang$arity$variadic = G__24890__delegate;
    return G__24890
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
  var n__24898 = n;
  var xs__24899 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____24900 = xs__24899;
      if(and__3822__auto____24900) {
        return n__24898 > 0
      }else {
        return and__3822__auto____24900
      }
    }())) {
      var G__24901 = n__24898 - 1;
      var G__24902 = cljs.core.next.call(null, xs__24899);
      n__24898 = G__24901;
      xs__24899 = G__24902;
      continue
    }else {
      return xs__24899
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
    var G__24903__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__24904 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__24905 = cljs.core.next.call(null, more);
            sb = G__24904;
            more = G__24905;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__24903 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__24903__delegate.call(this, x, ys)
    };
    G__24903.cljs$lang$maxFixedArity = 1;
    G__24903.cljs$lang$applyTo = function(arglist__24906) {
      var x = cljs.core.first(arglist__24906);
      var ys = cljs.core.rest(arglist__24906);
      return G__24903__delegate(x, ys)
    };
    G__24903.cljs$lang$arity$variadic = G__24903__delegate;
    return G__24903
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
    var G__24907__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__24908 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__24909 = cljs.core.next.call(null, more);
            sb = G__24908;
            more = G__24909;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__24907 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__24907__delegate.call(this, x, ys)
    };
    G__24907.cljs$lang$maxFixedArity = 1;
    G__24907.cljs$lang$applyTo = function(arglist__24910) {
      var x = cljs.core.first(arglist__24910);
      var ys = cljs.core.rest(arglist__24910);
      return G__24907__delegate(x, ys)
    };
    G__24907.cljs$lang$arity$variadic = G__24907__delegate;
    return G__24907
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
  format.cljs$lang$applyTo = function(arglist__24911) {
    var fmt = cljs.core.first(arglist__24911);
    var args = cljs.core.rest(arglist__24911);
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
    var xs__24914 = cljs.core.seq.call(null, x);
    var ys__24915 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__24914 == null) {
        return ys__24915 == null
      }else {
        if(ys__24915 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__24914), cljs.core.first.call(null, ys__24915))) {
            var G__24916 = cljs.core.next.call(null, xs__24914);
            var G__24917 = cljs.core.next.call(null, ys__24915);
            xs__24914 = G__24916;
            ys__24915 = G__24917;
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
  return cljs.core.reduce.call(null, function(p1__24918_SHARP_, p2__24919_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__24918_SHARP_, cljs.core.hash.call(null, p2__24919_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__24923 = 0;
  var s__24924 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__24924) {
      var e__24925 = cljs.core.first.call(null, s__24924);
      var G__24926 = (h__24923 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__24925)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__24925)))) % 4503599627370496;
      var G__24927 = cljs.core.next.call(null, s__24924);
      h__24923 = G__24926;
      s__24924 = G__24927;
      continue
    }else {
      return h__24923
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__24931 = 0;
  var s__24932 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__24932) {
      var e__24933 = cljs.core.first.call(null, s__24932);
      var G__24934 = (h__24931 + cljs.core.hash.call(null, e__24933)) % 4503599627370496;
      var G__24935 = cljs.core.next.call(null, s__24932);
      h__24931 = G__24934;
      s__24932 = G__24935;
      continue
    }else {
      return h__24931
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__24956__24957 = cljs.core.seq.call(null, fn_map);
  if(G__24956__24957) {
    var G__24959__24961 = cljs.core.first.call(null, G__24956__24957);
    var vec__24960__24962 = G__24959__24961;
    var key_name__24963 = cljs.core.nth.call(null, vec__24960__24962, 0, null);
    var f__24964 = cljs.core.nth.call(null, vec__24960__24962, 1, null);
    var G__24956__24965 = G__24956__24957;
    var G__24959__24966 = G__24959__24961;
    var G__24956__24967 = G__24956__24965;
    while(true) {
      var vec__24968__24969 = G__24959__24966;
      var key_name__24970 = cljs.core.nth.call(null, vec__24968__24969, 0, null);
      var f__24971 = cljs.core.nth.call(null, vec__24968__24969, 1, null);
      var G__24956__24972 = G__24956__24967;
      var str_name__24973 = cljs.core.name.call(null, key_name__24970);
      obj[str_name__24973] = f__24971;
      var temp__3974__auto____24974 = cljs.core.next.call(null, G__24956__24972);
      if(temp__3974__auto____24974) {
        var G__24956__24975 = temp__3974__auto____24974;
        var G__24976 = cljs.core.first.call(null, G__24956__24975);
        var G__24977 = G__24956__24975;
        G__24959__24966 = G__24976;
        G__24956__24967 = G__24977;
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
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__24978 = this;
  var h__2223__auto____24979 = this__24978.__hash;
  if(!(h__2223__auto____24979 == null)) {
    return h__2223__auto____24979
  }else {
    var h__2223__auto____24980 = cljs.core.hash_coll.call(null, coll);
    this__24978.__hash = h__2223__auto____24980;
    return h__2223__auto____24980
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__24981 = this;
  if(this__24981.count === 1) {
    return null
  }else {
    return this__24981.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__24982 = this;
  return new cljs.core.List(this__24982.meta, o, coll, this__24982.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__24983 = this;
  var this__24984 = this;
  return cljs.core.pr_str.call(null, this__24984)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__24985 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__24986 = this;
  return this__24986.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__24987 = this;
  return this__24987.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__24988 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__24989 = this;
  return this__24989.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__24990 = this;
  if(this__24990.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__24990.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__24991 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__24992 = this;
  return new cljs.core.List(meta, this__24992.first, this__24992.rest, this__24992.count, this__24992.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__24993 = this;
  return this__24993.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__24994 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__24995 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__24996 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__24997 = this;
  return new cljs.core.List(this__24997.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__24998 = this;
  var this__24999 = this;
  return cljs.core.pr_str.call(null, this__24999)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__25000 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__25001 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__25002 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__25003 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__25004 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__25005 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__25006 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__25007 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__25008 = this;
  return this__25008.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__25009 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__25013__25014 = coll;
  if(G__25013__25014) {
    if(function() {
      var or__3824__auto____25015 = G__25013__25014.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____25015) {
        return or__3824__auto____25015
      }else {
        return G__25013__25014.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__25013__25014.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__25013__25014)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__25013__25014)
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
    var G__25016__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__25016 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25016__delegate.call(this, x, y, z, items)
    };
    G__25016.cljs$lang$maxFixedArity = 3;
    G__25016.cljs$lang$applyTo = function(arglist__25017) {
      var x = cljs.core.first(arglist__25017);
      var y = cljs.core.first(cljs.core.next(arglist__25017));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25017)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25017)));
      return G__25016__delegate(x, y, z, items)
    };
    G__25016.cljs$lang$arity$variadic = G__25016__delegate;
    return G__25016
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
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__25018 = this;
  var h__2223__auto____25019 = this__25018.__hash;
  if(!(h__2223__auto____25019 == null)) {
    return h__2223__auto____25019
  }else {
    var h__2223__auto____25020 = cljs.core.hash_coll.call(null, coll);
    this__25018.__hash = h__2223__auto____25020;
    return h__2223__auto____25020
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__25021 = this;
  if(this__25021.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__25021.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__25022 = this;
  return new cljs.core.Cons(null, o, coll, this__25022.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__25023 = this;
  var this__25024 = this;
  return cljs.core.pr_str.call(null, this__25024)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__25025 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__25026 = this;
  return this__25026.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__25027 = this;
  if(this__25027.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__25027.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__25028 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__25029 = this;
  return new cljs.core.Cons(meta, this__25029.first, this__25029.rest, this__25029.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__25030 = this;
  return this__25030.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__25031 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__25031.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____25036 = coll == null;
    if(or__3824__auto____25036) {
      return or__3824__auto____25036
    }else {
      var G__25037__25038 = coll;
      if(G__25037__25038) {
        if(function() {
          var or__3824__auto____25039 = G__25037__25038.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____25039) {
            return or__3824__auto____25039
          }else {
            return G__25037__25038.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__25037__25038.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__25037__25038)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__25037__25038)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__25043__25044 = x;
  if(G__25043__25044) {
    if(function() {
      var or__3824__auto____25045 = G__25043__25044.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____25045) {
        return or__3824__auto____25045
      }else {
        return G__25043__25044.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__25043__25044.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__25043__25044)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__25043__25044)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__25046 = null;
  var G__25046__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__25046__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__25046 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25046__2.call(this, string, f);
      case 3:
        return G__25046__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25046
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__25047 = null;
  var G__25047__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__25047__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__25047 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25047__2.call(this, string, k);
      case 3:
        return G__25047__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25047
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__25048 = null;
  var G__25048__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__25048__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__25048 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25048__2.call(this, string, n);
      case 3:
        return G__25048__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25048
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
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__25060 = null;
  var G__25060__2 = function(this_sym25051, coll) {
    var this__25053 = this;
    var this_sym25051__25054 = this;
    var ___25055 = this_sym25051__25054;
    if(coll == null) {
      return null
    }else {
      var strobj__25056 = coll.strobj;
      if(strobj__25056 == null) {
        return cljs.core._lookup.call(null, coll, this__25053.k, null)
      }else {
        return strobj__25056[this__25053.k]
      }
    }
  };
  var G__25060__3 = function(this_sym25052, coll, not_found) {
    var this__25053 = this;
    var this_sym25052__25057 = this;
    var ___25058 = this_sym25052__25057;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__25053.k, not_found)
    }
  };
  G__25060 = function(this_sym25052, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25060__2.call(this, this_sym25052, coll);
      case 3:
        return G__25060__3.call(this, this_sym25052, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25060
}();
cljs.core.Keyword.prototype.apply = function(this_sym25049, args25050) {
  var this__25059 = this;
  return this_sym25049.call.apply(this_sym25049, [this_sym25049].concat(args25050.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__25069 = null;
  var G__25069__2 = function(this_sym25063, coll) {
    var this_sym25063__25065 = this;
    var this__25066 = this_sym25063__25065;
    return cljs.core._lookup.call(null, coll, this__25066.toString(), null)
  };
  var G__25069__3 = function(this_sym25064, coll, not_found) {
    var this_sym25064__25067 = this;
    var this__25068 = this_sym25064__25067;
    return cljs.core._lookup.call(null, coll, this__25068.toString(), not_found)
  };
  G__25069 = function(this_sym25064, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25069__2.call(this, this_sym25064, coll);
      case 3:
        return G__25069__3.call(this, this_sym25064, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25069
}();
String.prototype.apply = function(this_sym25061, args25062) {
  return this_sym25061.call.apply(this_sym25061, [this_sym25061].concat(args25062.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__25071 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__25071
  }else {
    lazy_seq.x = x__25071.call(null);
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
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__25072 = this;
  var h__2223__auto____25073 = this__25072.__hash;
  if(!(h__2223__auto____25073 == null)) {
    return h__2223__auto____25073
  }else {
    var h__2223__auto____25074 = cljs.core.hash_coll.call(null, coll);
    this__25072.__hash = h__2223__auto____25074;
    return h__2223__auto____25074
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__25075 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__25076 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__25077 = this;
  var this__25078 = this;
  return cljs.core.pr_str.call(null, this__25078)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__25079 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__25080 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__25081 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__25082 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__25083 = this;
  return new cljs.core.LazySeq(meta, this__25083.realized, this__25083.x, this__25083.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__25084 = this;
  return this__25084.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__25085 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__25085.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__25086 = this;
  return this__25086.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__25087 = this;
  var ___25088 = this;
  this__25087.buf[this__25087.end] = o;
  return this__25087.end = this__25087.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__25089 = this;
  var ___25090 = this;
  var ret__25091 = new cljs.core.ArrayChunk(this__25089.buf, 0, this__25089.end);
  this__25089.buf = null;
  return ret__25091
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
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__25092 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__25092.arr[this__25092.off], this__25092.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__25093 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__25093.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__25094 = this;
  if(this__25094.off === this__25094.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__25094.arr, this__25094.off + 1, this__25094.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__25095 = this;
  return this__25095.arr[this__25095.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__25096 = this;
  if(function() {
    var and__3822__auto____25097 = i >= 0;
    if(and__3822__auto____25097) {
      return i < this__25096.end - this__25096.off
    }else {
      return and__3822__auto____25097
    }
  }()) {
    return this__25096.arr[this__25096.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__25098 = this;
  return this__25098.end - this__25098.off
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
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__25099 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__25100 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__25101 = this;
  return cljs.core._nth.call(null, this__25101.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__25102 = this;
  if(cljs.core._count.call(null, this__25102.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__25102.chunk), this__25102.more, this__25102.meta)
  }else {
    if(this__25102.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__25102.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__25103 = this;
  if(this__25103.more == null) {
    return null
  }else {
    return this__25103.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__25104 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__25105 = this;
  return new cljs.core.ChunkedCons(this__25105.chunk, this__25105.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__25106 = this;
  return this__25106.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__25107 = this;
  return this__25107.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__25108 = this;
  if(this__25108.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__25108.more
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
    var G__25112__25113 = s;
    if(G__25112__25113) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____25114 = null;
        if(cljs.core.truth_(or__3824__auto____25114)) {
          return or__3824__auto____25114
        }else {
          return G__25112__25113.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__25112__25113.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__25112__25113)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__25112__25113)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__25117 = [];
  var s__25118 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__25118)) {
      ary__25117.push(cljs.core.first.call(null, s__25118));
      var G__25119 = cljs.core.next.call(null, s__25118);
      s__25118 = G__25119;
      continue
    }else {
      return ary__25117
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__25123 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__25124 = 0;
  var xs__25125 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__25125) {
      ret__25123[i__25124] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__25125));
      var G__25126 = i__25124 + 1;
      var G__25127 = cljs.core.next.call(null, xs__25125);
      i__25124 = G__25126;
      xs__25125 = G__25127;
      continue
    }else {
    }
    break
  }
  return ret__25123
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
    var a__25135 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__25136 = cljs.core.seq.call(null, init_val_or_seq);
      var i__25137 = 0;
      var s__25138 = s__25136;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____25139 = s__25138;
          if(and__3822__auto____25139) {
            return i__25137 < size
          }else {
            return and__3822__auto____25139
          }
        }())) {
          a__25135[i__25137] = cljs.core.first.call(null, s__25138);
          var G__25142 = i__25137 + 1;
          var G__25143 = cljs.core.next.call(null, s__25138);
          i__25137 = G__25142;
          s__25138 = G__25143;
          continue
        }else {
          return a__25135
        }
        break
      }
    }else {
      var n__2558__auto____25140 = size;
      var i__25141 = 0;
      while(true) {
        if(i__25141 < n__2558__auto____25140) {
          a__25135[i__25141] = init_val_or_seq;
          var G__25144 = i__25141 + 1;
          i__25141 = G__25144;
          continue
        }else {
        }
        break
      }
      return a__25135
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
    var a__25152 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__25153 = cljs.core.seq.call(null, init_val_or_seq);
      var i__25154 = 0;
      var s__25155 = s__25153;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____25156 = s__25155;
          if(and__3822__auto____25156) {
            return i__25154 < size
          }else {
            return and__3822__auto____25156
          }
        }())) {
          a__25152[i__25154] = cljs.core.first.call(null, s__25155);
          var G__25159 = i__25154 + 1;
          var G__25160 = cljs.core.next.call(null, s__25155);
          i__25154 = G__25159;
          s__25155 = G__25160;
          continue
        }else {
          return a__25152
        }
        break
      }
    }else {
      var n__2558__auto____25157 = size;
      var i__25158 = 0;
      while(true) {
        if(i__25158 < n__2558__auto____25157) {
          a__25152[i__25158] = init_val_or_seq;
          var G__25161 = i__25158 + 1;
          i__25158 = G__25161;
          continue
        }else {
        }
        break
      }
      return a__25152
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
    var a__25169 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__25170 = cljs.core.seq.call(null, init_val_or_seq);
      var i__25171 = 0;
      var s__25172 = s__25170;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____25173 = s__25172;
          if(and__3822__auto____25173) {
            return i__25171 < size
          }else {
            return and__3822__auto____25173
          }
        }())) {
          a__25169[i__25171] = cljs.core.first.call(null, s__25172);
          var G__25176 = i__25171 + 1;
          var G__25177 = cljs.core.next.call(null, s__25172);
          i__25171 = G__25176;
          s__25172 = G__25177;
          continue
        }else {
          return a__25169
        }
        break
      }
    }else {
      var n__2558__auto____25174 = size;
      var i__25175 = 0;
      while(true) {
        if(i__25175 < n__2558__auto____25174) {
          a__25169[i__25175] = init_val_or_seq;
          var G__25178 = i__25175 + 1;
          i__25175 = G__25178;
          continue
        }else {
        }
        break
      }
      return a__25169
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
    var s__25183 = s;
    var i__25184 = n;
    var sum__25185 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____25186 = i__25184 > 0;
        if(and__3822__auto____25186) {
          return cljs.core.seq.call(null, s__25183)
        }else {
          return and__3822__auto____25186
        }
      }())) {
        var G__25187 = cljs.core.next.call(null, s__25183);
        var G__25188 = i__25184 - 1;
        var G__25189 = sum__25185 + 1;
        s__25183 = G__25187;
        i__25184 = G__25188;
        sum__25185 = G__25189;
        continue
      }else {
        return sum__25185
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
      var s__25194 = cljs.core.seq.call(null, x);
      if(s__25194) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__25194)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__25194), concat.call(null, cljs.core.chunk_rest.call(null, s__25194), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__25194), concat.call(null, cljs.core.rest.call(null, s__25194), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__25198__delegate = function(x, y, zs) {
      var cat__25197 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__25196 = cljs.core.seq.call(null, xys);
          if(xys__25196) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__25196)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__25196), cat.call(null, cljs.core.chunk_rest.call(null, xys__25196), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__25196), cat.call(null, cljs.core.rest.call(null, xys__25196), zs))
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
      return cat__25197.call(null, concat.call(null, x, y), zs)
    };
    var G__25198 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25198__delegate.call(this, x, y, zs)
    };
    G__25198.cljs$lang$maxFixedArity = 2;
    G__25198.cljs$lang$applyTo = function(arglist__25199) {
      var x = cljs.core.first(arglist__25199);
      var y = cljs.core.first(cljs.core.next(arglist__25199));
      var zs = cljs.core.rest(cljs.core.next(arglist__25199));
      return G__25198__delegate(x, y, zs)
    };
    G__25198.cljs$lang$arity$variadic = G__25198__delegate;
    return G__25198
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
    var G__25200__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__25200 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25200__delegate.call(this, a, b, c, d, more)
    };
    G__25200.cljs$lang$maxFixedArity = 4;
    G__25200.cljs$lang$applyTo = function(arglist__25201) {
      var a = cljs.core.first(arglist__25201);
      var b = cljs.core.first(cljs.core.next(arglist__25201));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25201)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25201))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25201))));
      return G__25200__delegate(a, b, c, d, more)
    };
    G__25200.cljs$lang$arity$variadic = G__25200__delegate;
    return G__25200
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
  var args__25243 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__25244 = cljs.core._first.call(null, args__25243);
    var args__25245 = cljs.core._rest.call(null, args__25243);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__25244)
      }else {
        return f.call(null, a__25244)
      }
    }else {
      var b__25246 = cljs.core._first.call(null, args__25245);
      var args__25247 = cljs.core._rest.call(null, args__25245);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__25244, b__25246)
        }else {
          return f.call(null, a__25244, b__25246)
        }
      }else {
        var c__25248 = cljs.core._first.call(null, args__25247);
        var args__25249 = cljs.core._rest.call(null, args__25247);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__25244, b__25246, c__25248)
          }else {
            return f.call(null, a__25244, b__25246, c__25248)
          }
        }else {
          var d__25250 = cljs.core._first.call(null, args__25249);
          var args__25251 = cljs.core._rest.call(null, args__25249);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__25244, b__25246, c__25248, d__25250)
            }else {
              return f.call(null, a__25244, b__25246, c__25248, d__25250)
            }
          }else {
            var e__25252 = cljs.core._first.call(null, args__25251);
            var args__25253 = cljs.core._rest.call(null, args__25251);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__25244, b__25246, c__25248, d__25250, e__25252)
              }else {
                return f.call(null, a__25244, b__25246, c__25248, d__25250, e__25252)
              }
            }else {
              var f__25254 = cljs.core._first.call(null, args__25253);
              var args__25255 = cljs.core._rest.call(null, args__25253);
              if(argc === 6) {
                if(f__25254.cljs$lang$arity$6) {
                  return f__25254.cljs$lang$arity$6(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254)
                }else {
                  return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254)
                }
              }else {
                var g__25256 = cljs.core._first.call(null, args__25255);
                var args__25257 = cljs.core._rest.call(null, args__25255);
                if(argc === 7) {
                  if(f__25254.cljs$lang$arity$7) {
                    return f__25254.cljs$lang$arity$7(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256)
                  }else {
                    return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256)
                  }
                }else {
                  var h__25258 = cljs.core._first.call(null, args__25257);
                  var args__25259 = cljs.core._rest.call(null, args__25257);
                  if(argc === 8) {
                    if(f__25254.cljs$lang$arity$8) {
                      return f__25254.cljs$lang$arity$8(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258)
                    }else {
                      return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258)
                    }
                  }else {
                    var i__25260 = cljs.core._first.call(null, args__25259);
                    var args__25261 = cljs.core._rest.call(null, args__25259);
                    if(argc === 9) {
                      if(f__25254.cljs$lang$arity$9) {
                        return f__25254.cljs$lang$arity$9(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260)
                      }else {
                        return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260)
                      }
                    }else {
                      var j__25262 = cljs.core._first.call(null, args__25261);
                      var args__25263 = cljs.core._rest.call(null, args__25261);
                      if(argc === 10) {
                        if(f__25254.cljs$lang$arity$10) {
                          return f__25254.cljs$lang$arity$10(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262)
                        }else {
                          return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262)
                        }
                      }else {
                        var k__25264 = cljs.core._first.call(null, args__25263);
                        var args__25265 = cljs.core._rest.call(null, args__25263);
                        if(argc === 11) {
                          if(f__25254.cljs$lang$arity$11) {
                            return f__25254.cljs$lang$arity$11(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264)
                          }else {
                            return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264)
                          }
                        }else {
                          var l__25266 = cljs.core._first.call(null, args__25265);
                          var args__25267 = cljs.core._rest.call(null, args__25265);
                          if(argc === 12) {
                            if(f__25254.cljs$lang$arity$12) {
                              return f__25254.cljs$lang$arity$12(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266)
                            }else {
                              return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266)
                            }
                          }else {
                            var m__25268 = cljs.core._first.call(null, args__25267);
                            var args__25269 = cljs.core._rest.call(null, args__25267);
                            if(argc === 13) {
                              if(f__25254.cljs$lang$arity$13) {
                                return f__25254.cljs$lang$arity$13(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268)
                              }else {
                                return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268)
                              }
                            }else {
                              var n__25270 = cljs.core._first.call(null, args__25269);
                              var args__25271 = cljs.core._rest.call(null, args__25269);
                              if(argc === 14) {
                                if(f__25254.cljs$lang$arity$14) {
                                  return f__25254.cljs$lang$arity$14(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270)
                                }else {
                                  return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270)
                                }
                              }else {
                                var o__25272 = cljs.core._first.call(null, args__25271);
                                var args__25273 = cljs.core._rest.call(null, args__25271);
                                if(argc === 15) {
                                  if(f__25254.cljs$lang$arity$15) {
                                    return f__25254.cljs$lang$arity$15(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272)
                                  }else {
                                    return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272)
                                  }
                                }else {
                                  var p__25274 = cljs.core._first.call(null, args__25273);
                                  var args__25275 = cljs.core._rest.call(null, args__25273);
                                  if(argc === 16) {
                                    if(f__25254.cljs$lang$arity$16) {
                                      return f__25254.cljs$lang$arity$16(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274)
                                    }else {
                                      return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274)
                                    }
                                  }else {
                                    var q__25276 = cljs.core._first.call(null, args__25275);
                                    var args__25277 = cljs.core._rest.call(null, args__25275);
                                    if(argc === 17) {
                                      if(f__25254.cljs$lang$arity$17) {
                                        return f__25254.cljs$lang$arity$17(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276)
                                      }else {
                                        return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276)
                                      }
                                    }else {
                                      var r__25278 = cljs.core._first.call(null, args__25277);
                                      var args__25279 = cljs.core._rest.call(null, args__25277);
                                      if(argc === 18) {
                                        if(f__25254.cljs$lang$arity$18) {
                                          return f__25254.cljs$lang$arity$18(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278)
                                        }else {
                                          return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278)
                                        }
                                      }else {
                                        var s__25280 = cljs.core._first.call(null, args__25279);
                                        var args__25281 = cljs.core._rest.call(null, args__25279);
                                        if(argc === 19) {
                                          if(f__25254.cljs$lang$arity$19) {
                                            return f__25254.cljs$lang$arity$19(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278, s__25280)
                                          }else {
                                            return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278, s__25280)
                                          }
                                        }else {
                                          var t__25282 = cljs.core._first.call(null, args__25281);
                                          var args__25283 = cljs.core._rest.call(null, args__25281);
                                          if(argc === 20) {
                                            if(f__25254.cljs$lang$arity$20) {
                                              return f__25254.cljs$lang$arity$20(a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278, s__25280, t__25282)
                                            }else {
                                              return f__25254.call(null, a__25244, b__25246, c__25248, d__25250, e__25252, f__25254, g__25256, h__25258, i__25260, j__25262, k__25264, l__25266, m__25268, n__25270, o__25272, p__25274, q__25276, r__25278, s__25280, t__25282)
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
    var fixed_arity__25298 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__25299 = cljs.core.bounded_count.call(null, args, fixed_arity__25298 + 1);
      if(bc__25299 <= fixed_arity__25298) {
        return cljs.core.apply_to.call(null, f, bc__25299, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__25300 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__25301 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__25302 = cljs.core.bounded_count.call(null, arglist__25300, fixed_arity__25301 + 1);
      if(bc__25302 <= fixed_arity__25301) {
        return cljs.core.apply_to.call(null, f, bc__25302, arglist__25300)
      }else {
        return f.cljs$lang$applyTo(arglist__25300)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25300))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__25303 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__25304 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__25305 = cljs.core.bounded_count.call(null, arglist__25303, fixed_arity__25304 + 1);
      if(bc__25305 <= fixed_arity__25304) {
        return cljs.core.apply_to.call(null, f, bc__25305, arglist__25303)
      }else {
        return f.cljs$lang$applyTo(arglist__25303)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25303))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__25306 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__25307 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__25308 = cljs.core.bounded_count.call(null, arglist__25306, fixed_arity__25307 + 1);
      if(bc__25308 <= fixed_arity__25307) {
        return cljs.core.apply_to.call(null, f, bc__25308, arglist__25306)
      }else {
        return f.cljs$lang$applyTo(arglist__25306)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25306))
    }
  };
  var apply__6 = function() {
    var G__25312__delegate = function(f, a, b, c, d, args) {
      var arglist__25309 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__25310 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__25311 = cljs.core.bounded_count.call(null, arglist__25309, fixed_arity__25310 + 1);
        if(bc__25311 <= fixed_arity__25310) {
          return cljs.core.apply_to.call(null, f, bc__25311, arglist__25309)
        }else {
          return f.cljs$lang$applyTo(arglist__25309)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__25309))
      }
    };
    var G__25312 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__25312__delegate.call(this, f, a, b, c, d, args)
    };
    G__25312.cljs$lang$maxFixedArity = 5;
    G__25312.cljs$lang$applyTo = function(arglist__25313) {
      var f = cljs.core.first(arglist__25313);
      var a = cljs.core.first(cljs.core.next(arglist__25313));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25313)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25313))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25313)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25313)))));
      return G__25312__delegate(f, a, b, c, d, args)
    };
    G__25312.cljs$lang$arity$variadic = G__25312__delegate;
    return G__25312
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
  vary_meta.cljs$lang$applyTo = function(arglist__25314) {
    var obj = cljs.core.first(arglist__25314);
    var f = cljs.core.first(cljs.core.next(arglist__25314));
    var args = cljs.core.rest(cljs.core.next(arglist__25314));
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
    var G__25315__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__25315 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25315__delegate.call(this, x, y, more)
    };
    G__25315.cljs$lang$maxFixedArity = 2;
    G__25315.cljs$lang$applyTo = function(arglist__25316) {
      var x = cljs.core.first(arglist__25316);
      var y = cljs.core.first(cljs.core.next(arglist__25316));
      var more = cljs.core.rest(cljs.core.next(arglist__25316));
      return G__25315__delegate(x, y, more)
    };
    G__25315.cljs$lang$arity$variadic = G__25315__delegate;
    return G__25315
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
        var G__25317 = pred;
        var G__25318 = cljs.core.next.call(null, coll);
        pred = G__25317;
        coll = G__25318;
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
      var or__3824__auto____25320 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____25320)) {
        return or__3824__auto____25320
      }else {
        var G__25321 = pred;
        var G__25322 = cljs.core.next.call(null, coll);
        pred = G__25321;
        coll = G__25322;
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
    var G__25323 = null;
    var G__25323__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__25323__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__25323__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__25323__3 = function() {
      var G__25324__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__25324 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__25324__delegate.call(this, x, y, zs)
      };
      G__25324.cljs$lang$maxFixedArity = 2;
      G__25324.cljs$lang$applyTo = function(arglist__25325) {
        var x = cljs.core.first(arglist__25325);
        var y = cljs.core.first(cljs.core.next(arglist__25325));
        var zs = cljs.core.rest(cljs.core.next(arglist__25325));
        return G__25324__delegate(x, y, zs)
      };
      G__25324.cljs$lang$arity$variadic = G__25324__delegate;
      return G__25324
    }();
    G__25323 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__25323__0.call(this);
        case 1:
          return G__25323__1.call(this, x);
        case 2:
          return G__25323__2.call(this, x, y);
        default:
          return G__25323__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__25323.cljs$lang$maxFixedArity = 2;
    G__25323.cljs$lang$applyTo = G__25323__3.cljs$lang$applyTo;
    return G__25323
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__25326__delegate = function(args) {
      return x
    };
    var G__25326 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__25326__delegate.call(this, args)
    };
    G__25326.cljs$lang$maxFixedArity = 0;
    G__25326.cljs$lang$applyTo = function(arglist__25327) {
      var args = cljs.core.seq(arglist__25327);
      return G__25326__delegate(args)
    };
    G__25326.cljs$lang$arity$variadic = G__25326__delegate;
    return G__25326
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
      var G__25334 = null;
      var G__25334__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__25334__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__25334__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__25334__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__25334__4 = function() {
        var G__25335__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__25335 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25335__delegate.call(this, x, y, z, args)
        };
        G__25335.cljs$lang$maxFixedArity = 3;
        G__25335.cljs$lang$applyTo = function(arglist__25336) {
          var x = cljs.core.first(arglist__25336);
          var y = cljs.core.first(cljs.core.next(arglist__25336));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25336)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25336)));
          return G__25335__delegate(x, y, z, args)
        };
        G__25335.cljs$lang$arity$variadic = G__25335__delegate;
        return G__25335
      }();
      G__25334 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__25334__0.call(this);
          case 1:
            return G__25334__1.call(this, x);
          case 2:
            return G__25334__2.call(this, x, y);
          case 3:
            return G__25334__3.call(this, x, y, z);
          default:
            return G__25334__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25334.cljs$lang$maxFixedArity = 3;
      G__25334.cljs$lang$applyTo = G__25334__4.cljs$lang$applyTo;
      return G__25334
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__25337 = null;
      var G__25337__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__25337__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__25337__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__25337__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__25337__4 = function() {
        var G__25338__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__25338 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25338__delegate.call(this, x, y, z, args)
        };
        G__25338.cljs$lang$maxFixedArity = 3;
        G__25338.cljs$lang$applyTo = function(arglist__25339) {
          var x = cljs.core.first(arglist__25339);
          var y = cljs.core.first(cljs.core.next(arglist__25339));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25339)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25339)));
          return G__25338__delegate(x, y, z, args)
        };
        G__25338.cljs$lang$arity$variadic = G__25338__delegate;
        return G__25338
      }();
      G__25337 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__25337__0.call(this);
          case 1:
            return G__25337__1.call(this, x);
          case 2:
            return G__25337__2.call(this, x, y);
          case 3:
            return G__25337__3.call(this, x, y, z);
          default:
            return G__25337__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25337.cljs$lang$maxFixedArity = 3;
      G__25337.cljs$lang$applyTo = G__25337__4.cljs$lang$applyTo;
      return G__25337
    }()
  };
  var comp__4 = function() {
    var G__25340__delegate = function(f1, f2, f3, fs) {
      var fs__25331 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__25341__delegate = function(args) {
          var ret__25332 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__25331), args);
          var fs__25333 = cljs.core.next.call(null, fs__25331);
          while(true) {
            if(fs__25333) {
              var G__25342 = cljs.core.first.call(null, fs__25333).call(null, ret__25332);
              var G__25343 = cljs.core.next.call(null, fs__25333);
              ret__25332 = G__25342;
              fs__25333 = G__25343;
              continue
            }else {
              return ret__25332
            }
            break
          }
        };
        var G__25341 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__25341__delegate.call(this, args)
        };
        G__25341.cljs$lang$maxFixedArity = 0;
        G__25341.cljs$lang$applyTo = function(arglist__25344) {
          var args = cljs.core.seq(arglist__25344);
          return G__25341__delegate(args)
        };
        G__25341.cljs$lang$arity$variadic = G__25341__delegate;
        return G__25341
      }()
    };
    var G__25340 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25340__delegate.call(this, f1, f2, f3, fs)
    };
    G__25340.cljs$lang$maxFixedArity = 3;
    G__25340.cljs$lang$applyTo = function(arglist__25345) {
      var f1 = cljs.core.first(arglist__25345);
      var f2 = cljs.core.first(cljs.core.next(arglist__25345));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25345)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25345)));
      return G__25340__delegate(f1, f2, f3, fs)
    };
    G__25340.cljs$lang$arity$variadic = G__25340__delegate;
    return G__25340
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
      var G__25346__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__25346 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25346__delegate.call(this, args)
      };
      G__25346.cljs$lang$maxFixedArity = 0;
      G__25346.cljs$lang$applyTo = function(arglist__25347) {
        var args = cljs.core.seq(arglist__25347);
        return G__25346__delegate(args)
      };
      G__25346.cljs$lang$arity$variadic = G__25346__delegate;
      return G__25346
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__25348__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__25348 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25348__delegate.call(this, args)
      };
      G__25348.cljs$lang$maxFixedArity = 0;
      G__25348.cljs$lang$applyTo = function(arglist__25349) {
        var args = cljs.core.seq(arglist__25349);
        return G__25348__delegate(args)
      };
      G__25348.cljs$lang$arity$variadic = G__25348__delegate;
      return G__25348
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__25350__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__25350 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25350__delegate.call(this, args)
      };
      G__25350.cljs$lang$maxFixedArity = 0;
      G__25350.cljs$lang$applyTo = function(arglist__25351) {
        var args = cljs.core.seq(arglist__25351);
        return G__25350__delegate(args)
      };
      G__25350.cljs$lang$arity$variadic = G__25350__delegate;
      return G__25350
    }()
  };
  var partial__5 = function() {
    var G__25352__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__25353__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__25353 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__25353__delegate.call(this, args)
        };
        G__25353.cljs$lang$maxFixedArity = 0;
        G__25353.cljs$lang$applyTo = function(arglist__25354) {
          var args = cljs.core.seq(arglist__25354);
          return G__25353__delegate(args)
        };
        G__25353.cljs$lang$arity$variadic = G__25353__delegate;
        return G__25353
      }()
    };
    var G__25352 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25352__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__25352.cljs$lang$maxFixedArity = 4;
    G__25352.cljs$lang$applyTo = function(arglist__25355) {
      var f = cljs.core.first(arglist__25355);
      var arg1 = cljs.core.first(cljs.core.next(arglist__25355));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25355)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25355))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25355))));
      return G__25352__delegate(f, arg1, arg2, arg3, more)
    };
    G__25352.cljs$lang$arity$variadic = G__25352__delegate;
    return G__25352
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
      var G__25356 = null;
      var G__25356__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__25356__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__25356__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__25356__4 = function() {
        var G__25357__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__25357 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25357__delegate.call(this, a, b, c, ds)
        };
        G__25357.cljs$lang$maxFixedArity = 3;
        G__25357.cljs$lang$applyTo = function(arglist__25358) {
          var a = cljs.core.first(arglist__25358);
          var b = cljs.core.first(cljs.core.next(arglist__25358));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25358)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25358)));
          return G__25357__delegate(a, b, c, ds)
        };
        G__25357.cljs$lang$arity$variadic = G__25357__delegate;
        return G__25357
      }();
      G__25356 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__25356__1.call(this, a);
          case 2:
            return G__25356__2.call(this, a, b);
          case 3:
            return G__25356__3.call(this, a, b, c);
          default:
            return G__25356__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25356.cljs$lang$maxFixedArity = 3;
      G__25356.cljs$lang$applyTo = G__25356__4.cljs$lang$applyTo;
      return G__25356
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__25359 = null;
      var G__25359__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__25359__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__25359__4 = function() {
        var G__25360__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__25360 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25360__delegate.call(this, a, b, c, ds)
        };
        G__25360.cljs$lang$maxFixedArity = 3;
        G__25360.cljs$lang$applyTo = function(arglist__25361) {
          var a = cljs.core.first(arglist__25361);
          var b = cljs.core.first(cljs.core.next(arglist__25361));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25361)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25361)));
          return G__25360__delegate(a, b, c, ds)
        };
        G__25360.cljs$lang$arity$variadic = G__25360__delegate;
        return G__25360
      }();
      G__25359 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__25359__2.call(this, a, b);
          case 3:
            return G__25359__3.call(this, a, b, c);
          default:
            return G__25359__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25359.cljs$lang$maxFixedArity = 3;
      G__25359.cljs$lang$applyTo = G__25359__4.cljs$lang$applyTo;
      return G__25359
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__25362 = null;
      var G__25362__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__25362__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__25362__4 = function() {
        var G__25363__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__25363 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25363__delegate.call(this, a, b, c, ds)
        };
        G__25363.cljs$lang$maxFixedArity = 3;
        G__25363.cljs$lang$applyTo = function(arglist__25364) {
          var a = cljs.core.first(arglist__25364);
          var b = cljs.core.first(cljs.core.next(arglist__25364));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25364)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25364)));
          return G__25363__delegate(a, b, c, ds)
        };
        G__25363.cljs$lang$arity$variadic = G__25363__delegate;
        return G__25363
      }();
      G__25362 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__25362__2.call(this, a, b);
          case 3:
            return G__25362__3.call(this, a, b, c);
          default:
            return G__25362__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25362.cljs$lang$maxFixedArity = 3;
      G__25362.cljs$lang$applyTo = G__25362__4.cljs$lang$applyTo;
      return G__25362
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
  var mapi__25380 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____25388 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25388) {
        var s__25389 = temp__3974__auto____25388;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__25389)) {
          var c__25390 = cljs.core.chunk_first.call(null, s__25389);
          var size__25391 = cljs.core.count.call(null, c__25390);
          var b__25392 = cljs.core.chunk_buffer.call(null, size__25391);
          var n__2558__auto____25393 = size__25391;
          var i__25394 = 0;
          while(true) {
            if(i__25394 < n__2558__auto____25393) {
              cljs.core.chunk_append.call(null, b__25392, f.call(null, idx + i__25394, cljs.core._nth.call(null, c__25390, i__25394)));
              var G__25395 = i__25394 + 1;
              i__25394 = G__25395;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__25392), mapi.call(null, idx + size__25391, cljs.core.chunk_rest.call(null, s__25389)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__25389)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__25389)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__25380.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____25405 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____25405) {
      var s__25406 = temp__3974__auto____25405;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__25406)) {
        var c__25407 = cljs.core.chunk_first.call(null, s__25406);
        var size__25408 = cljs.core.count.call(null, c__25407);
        var b__25409 = cljs.core.chunk_buffer.call(null, size__25408);
        var n__2558__auto____25410 = size__25408;
        var i__25411 = 0;
        while(true) {
          if(i__25411 < n__2558__auto____25410) {
            var x__25412 = f.call(null, cljs.core._nth.call(null, c__25407, i__25411));
            if(x__25412 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__25409, x__25412)
            }
            var G__25414 = i__25411 + 1;
            i__25411 = G__25414;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__25409), keep.call(null, f, cljs.core.chunk_rest.call(null, s__25406)))
      }else {
        var x__25413 = f.call(null, cljs.core.first.call(null, s__25406));
        if(x__25413 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__25406))
        }else {
          return cljs.core.cons.call(null, x__25413, keep.call(null, f, cljs.core.rest.call(null, s__25406)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__25440 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____25450 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25450) {
        var s__25451 = temp__3974__auto____25450;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__25451)) {
          var c__25452 = cljs.core.chunk_first.call(null, s__25451);
          var size__25453 = cljs.core.count.call(null, c__25452);
          var b__25454 = cljs.core.chunk_buffer.call(null, size__25453);
          var n__2558__auto____25455 = size__25453;
          var i__25456 = 0;
          while(true) {
            if(i__25456 < n__2558__auto____25455) {
              var x__25457 = f.call(null, idx + i__25456, cljs.core._nth.call(null, c__25452, i__25456));
              if(x__25457 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__25454, x__25457)
              }
              var G__25459 = i__25456 + 1;
              i__25456 = G__25459;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__25454), keepi.call(null, idx + size__25453, cljs.core.chunk_rest.call(null, s__25451)))
        }else {
          var x__25458 = f.call(null, idx, cljs.core.first.call(null, s__25451));
          if(x__25458 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__25451))
          }else {
            return cljs.core.cons.call(null, x__25458, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__25451)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__25440.call(null, 0, coll)
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
          var and__3822__auto____25545 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25545)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____25545
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____25546 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25546)) {
            var and__3822__auto____25547 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____25547)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____25547
            }
          }else {
            return and__3822__auto____25546
          }
        }())
      };
      var ep1__4 = function() {
        var G__25616__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____25548 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____25548)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____25548
            }
          }())
        };
        var G__25616 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25616__delegate.call(this, x, y, z, args)
        };
        G__25616.cljs$lang$maxFixedArity = 3;
        G__25616.cljs$lang$applyTo = function(arglist__25617) {
          var x = cljs.core.first(arglist__25617);
          var y = cljs.core.first(cljs.core.next(arglist__25617));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25617)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25617)));
          return G__25616__delegate(x, y, z, args)
        };
        G__25616.cljs$lang$arity$variadic = G__25616__delegate;
        return G__25616
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
          var and__3822__auto____25560 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25560)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____25560
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____25561 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25561)) {
            var and__3822__auto____25562 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____25562)) {
              var and__3822__auto____25563 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____25563)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____25563
              }
            }else {
              return and__3822__auto____25562
            }
          }else {
            return and__3822__auto____25561
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____25564 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25564)) {
            var and__3822__auto____25565 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____25565)) {
              var and__3822__auto____25566 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____25566)) {
                var and__3822__auto____25567 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____25567)) {
                  var and__3822__auto____25568 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____25568)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____25568
                  }
                }else {
                  return and__3822__auto____25567
                }
              }else {
                return and__3822__auto____25566
              }
            }else {
              return and__3822__auto____25565
            }
          }else {
            return and__3822__auto____25564
          }
        }())
      };
      var ep2__4 = function() {
        var G__25618__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____25569 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____25569)) {
              return cljs.core.every_QMARK_.call(null, function(p1__25415_SHARP_) {
                var and__3822__auto____25570 = p1.call(null, p1__25415_SHARP_);
                if(cljs.core.truth_(and__3822__auto____25570)) {
                  return p2.call(null, p1__25415_SHARP_)
                }else {
                  return and__3822__auto____25570
                }
              }, args)
            }else {
              return and__3822__auto____25569
            }
          }())
        };
        var G__25618 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25618__delegate.call(this, x, y, z, args)
        };
        G__25618.cljs$lang$maxFixedArity = 3;
        G__25618.cljs$lang$applyTo = function(arglist__25619) {
          var x = cljs.core.first(arglist__25619);
          var y = cljs.core.first(cljs.core.next(arglist__25619));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25619)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25619)));
          return G__25618__delegate(x, y, z, args)
        };
        G__25618.cljs$lang$arity$variadic = G__25618__delegate;
        return G__25618
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
          var and__3822__auto____25589 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25589)) {
            var and__3822__auto____25590 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____25590)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____25590
            }
          }else {
            return and__3822__auto____25589
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____25591 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25591)) {
            var and__3822__auto____25592 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____25592)) {
              var and__3822__auto____25593 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____25593)) {
                var and__3822__auto____25594 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____25594)) {
                  var and__3822__auto____25595 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____25595)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____25595
                  }
                }else {
                  return and__3822__auto____25594
                }
              }else {
                return and__3822__auto____25593
              }
            }else {
              return and__3822__auto____25592
            }
          }else {
            return and__3822__auto____25591
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____25596 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____25596)) {
            var and__3822__auto____25597 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____25597)) {
              var and__3822__auto____25598 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____25598)) {
                var and__3822__auto____25599 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____25599)) {
                  var and__3822__auto____25600 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____25600)) {
                    var and__3822__auto____25601 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____25601)) {
                      var and__3822__auto____25602 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____25602)) {
                        var and__3822__auto____25603 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____25603)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____25603
                        }
                      }else {
                        return and__3822__auto____25602
                      }
                    }else {
                      return and__3822__auto____25601
                    }
                  }else {
                    return and__3822__auto____25600
                  }
                }else {
                  return and__3822__auto____25599
                }
              }else {
                return and__3822__auto____25598
              }
            }else {
              return and__3822__auto____25597
            }
          }else {
            return and__3822__auto____25596
          }
        }())
      };
      var ep3__4 = function() {
        var G__25620__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____25604 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____25604)) {
              return cljs.core.every_QMARK_.call(null, function(p1__25416_SHARP_) {
                var and__3822__auto____25605 = p1.call(null, p1__25416_SHARP_);
                if(cljs.core.truth_(and__3822__auto____25605)) {
                  var and__3822__auto____25606 = p2.call(null, p1__25416_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____25606)) {
                    return p3.call(null, p1__25416_SHARP_)
                  }else {
                    return and__3822__auto____25606
                  }
                }else {
                  return and__3822__auto____25605
                }
              }, args)
            }else {
              return and__3822__auto____25604
            }
          }())
        };
        var G__25620 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25620__delegate.call(this, x, y, z, args)
        };
        G__25620.cljs$lang$maxFixedArity = 3;
        G__25620.cljs$lang$applyTo = function(arglist__25621) {
          var x = cljs.core.first(arglist__25621);
          var y = cljs.core.first(cljs.core.next(arglist__25621));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25621)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25621)));
          return G__25620__delegate(x, y, z, args)
        };
        G__25620.cljs$lang$arity$variadic = G__25620__delegate;
        return G__25620
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
    var G__25622__delegate = function(p1, p2, p3, ps) {
      var ps__25607 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__25417_SHARP_) {
            return p1__25417_SHARP_.call(null, x)
          }, ps__25607)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__25418_SHARP_) {
            var and__3822__auto____25612 = p1__25418_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____25612)) {
              return p1__25418_SHARP_.call(null, y)
            }else {
              return and__3822__auto____25612
            }
          }, ps__25607)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__25419_SHARP_) {
            var and__3822__auto____25613 = p1__25419_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____25613)) {
              var and__3822__auto____25614 = p1__25419_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____25614)) {
                return p1__25419_SHARP_.call(null, z)
              }else {
                return and__3822__auto____25614
              }
            }else {
              return and__3822__auto____25613
            }
          }, ps__25607)
        };
        var epn__4 = function() {
          var G__25623__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____25615 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____25615)) {
                return cljs.core.every_QMARK_.call(null, function(p1__25420_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__25420_SHARP_, args)
                }, ps__25607)
              }else {
                return and__3822__auto____25615
              }
            }())
          };
          var G__25623 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__25623__delegate.call(this, x, y, z, args)
          };
          G__25623.cljs$lang$maxFixedArity = 3;
          G__25623.cljs$lang$applyTo = function(arglist__25624) {
            var x = cljs.core.first(arglist__25624);
            var y = cljs.core.first(cljs.core.next(arglist__25624));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25624)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25624)));
            return G__25623__delegate(x, y, z, args)
          };
          G__25623.cljs$lang$arity$variadic = G__25623__delegate;
          return G__25623
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
    var G__25622 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25622__delegate.call(this, p1, p2, p3, ps)
    };
    G__25622.cljs$lang$maxFixedArity = 3;
    G__25622.cljs$lang$applyTo = function(arglist__25625) {
      var p1 = cljs.core.first(arglist__25625);
      var p2 = cljs.core.first(cljs.core.next(arglist__25625));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25625)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25625)));
      return G__25622__delegate(p1, p2, p3, ps)
    };
    G__25622.cljs$lang$arity$variadic = G__25622__delegate;
    return G__25622
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
        var or__3824__auto____25706 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25706)) {
          return or__3824__auto____25706
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____25707 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25707)) {
          return or__3824__auto____25707
        }else {
          var or__3824__auto____25708 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____25708)) {
            return or__3824__auto____25708
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__25777__delegate = function(x, y, z, args) {
          var or__3824__auto____25709 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____25709)) {
            return or__3824__auto____25709
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__25777 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25777__delegate.call(this, x, y, z, args)
        };
        G__25777.cljs$lang$maxFixedArity = 3;
        G__25777.cljs$lang$applyTo = function(arglist__25778) {
          var x = cljs.core.first(arglist__25778);
          var y = cljs.core.first(cljs.core.next(arglist__25778));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25778)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25778)));
          return G__25777__delegate(x, y, z, args)
        };
        G__25777.cljs$lang$arity$variadic = G__25777__delegate;
        return G__25777
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
        var or__3824__auto____25721 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25721)) {
          return or__3824__auto____25721
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____25722 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25722)) {
          return or__3824__auto____25722
        }else {
          var or__3824__auto____25723 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____25723)) {
            return or__3824__auto____25723
          }else {
            var or__3824__auto____25724 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____25724)) {
              return or__3824__auto____25724
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____25725 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25725)) {
          return or__3824__auto____25725
        }else {
          var or__3824__auto____25726 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____25726)) {
            return or__3824__auto____25726
          }else {
            var or__3824__auto____25727 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____25727)) {
              return or__3824__auto____25727
            }else {
              var or__3824__auto____25728 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____25728)) {
                return or__3824__auto____25728
              }else {
                var or__3824__auto____25729 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____25729)) {
                  return or__3824__auto____25729
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__25779__delegate = function(x, y, z, args) {
          var or__3824__auto____25730 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____25730)) {
            return or__3824__auto____25730
          }else {
            return cljs.core.some.call(null, function(p1__25460_SHARP_) {
              var or__3824__auto____25731 = p1.call(null, p1__25460_SHARP_);
              if(cljs.core.truth_(or__3824__auto____25731)) {
                return or__3824__auto____25731
              }else {
                return p2.call(null, p1__25460_SHARP_)
              }
            }, args)
          }
        };
        var G__25779 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25779__delegate.call(this, x, y, z, args)
        };
        G__25779.cljs$lang$maxFixedArity = 3;
        G__25779.cljs$lang$applyTo = function(arglist__25780) {
          var x = cljs.core.first(arglist__25780);
          var y = cljs.core.first(cljs.core.next(arglist__25780));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25780)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25780)));
          return G__25779__delegate(x, y, z, args)
        };
        G__25779.cljs$lang$arity$variadic = G__25779__delegate;
        return G__25779
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
        var or__3824__auto____25750 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25750)) {
          return or__3824__auto____25750
        }else {
          var or__3824__auto____25751 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____25751)) {
            return or__3824__auto____25751
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____25752 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25752)) {
          return or__3824__auto____25752
        }else {
          var or__3824__auto____25753 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____25753)) {
            return or__3824__auto____25753
          }else {
            var or__3824__auto____25754 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____25754)) {
              return or__3824__auto____25754
            }else {
              var or__3824__auto____25755 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____25755)) {
                return or__3824__auto____25755
              }else {
                var or__3824__auto____25756 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____25756)) {
                  return or__3824__auto____25756
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____25757 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____25757)) {
          return or__3824__auto____25757
        }else {
          var or__3824__auto____25758 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____25758)) {
            return or__3824__auto____25758
          }else {
            var or__3824__auto____25759 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____25759)) {
              return or__3824__auto____25759
            }else {
              var or__3824__auto____25760 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____25760)) {
                return or__3824__auto____25760
              }else {
                var or__3824__auto____25761 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____25761)) {
                  return or__3824__auto____25761
                }else {
                  var or__3824__auto____25762 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____25762)) {
                    return or__3824__auto____25762
                  }else {
                    var or__3824__auto____25763 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____25763)) {
                      return or__3824__auto____25763
                    }else {
                      var or__3824__auto____25764 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____25764)) {
                        return or__3824__auto____25764
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
        var G__25781__delegate = function(x, y, z, args) {
          var or__3824__auto____25765 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____25765)) {
            return or__3824__auto____25765
          }else {
            return cljs.core.some.call(null, function(p1__25461_SHARP_) {
              var or__3824__auto____25766 = p1.call(null, p1__25461_SHARP_);
              if(cljs.core.truth_(or__3824__auto____25766)) {
                return or__3824__auto____25766
              }else {
                var or__3824__auto____25767 = p2.call(null, p1__25461_SHARP_);
                if(cljs.core.truth_(or__3824__auto____25767)) {
                  return or__3824__auto____25767
                }else {
                  return p3.call(null, p1__25461_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__25781 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25781__delegate.call(this, x, y, z, args)
        };
        G__25781.cljs$lang$maxFixedArity = 3;
        G__25781.cljs$lang$applyTo = function(arglist__25782) {
          var x = cljs.core.first(arglist__25782);
          var y = cljs.core.first(cljs.core.next(arglist__25782));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25782)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25782)));
          return G__25781__delegate(x, y, z, args)
        };
        G__25781.cljs$lang$arity$variadic = G__25781__delegate;
        return G__25781
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
    var G__25783__delegate = function(p1, p2, p3, ps) {
      var ps__25768 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__25462_SHARP_) {
            return p1__25462_SHARP_.call(null, x)
          }, ps__25768)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__25463_SHARP_) {
            var or__3824__auto____25773 = p1__25463_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____25773)) {
              return or__3824__auto____25773
            }else {
              return p1__25463_SHARP_.call(null, y)
            }
          }, ps__25768)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__25464_SHARP_) {
            var or__3824__auto____25774 = p1__25464_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____25774)) {
              return or__3824__auto____25774
            }else {
              var or__3824__auto____25775 = p1__25464_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____25775)) {
                return or__3824__auto____25775
              }else {
                return p1__25464_SHARP_.call(null, z)
              }
            }
          }, ps__25768)
        };
        var spn__4 = function() {
          var G__25784__delegate = function(x, y, z, args) {
            var or__3824__auto____25776 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____25776)) {
              return or__3824__auto____25776
            }else {
              return cljs.core.some.call(null, function(p1__25465_SHARP_) {
                return cljs.core.some.call(null, p1__25465_SHARP_, args)
              }, ps__25768)
            }
          };
          var G__25784 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__25784__delegate.call(this, x, y, z, args)
          };
          G__25784.cljs$lang$maxFixedArity = 3;
          G__25784.cljs$lang$applyTo = function(arglist__25785) {
            var x = cljs.core.first(arglist__25785);
            var y = cljs.core.first(cljs.core.next(arglist__25785));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25785)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25785)));
            return G__25784__delegate(x, y, z, args)
          };
          G__25784.cljs$lang$arity$variadic = G__25784__delegate;
          return G__25784
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
    var G__25783 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25783__delegate.call(this, p1, p2, p3, ps)
    };
    G__25783.cljs$lang$maxFixedArity = 3;
    G__25783.cljs$lang$applyTo = function(arglist__25786) {
      var p1 = cljs.core.first(arglist__25786);
      var p2 = cljs.core.first(cljs.core.next(arglist__25786));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25786)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25786)));
      return G__25783__delegate(p1, p2, p3, ps)
    };
    G__25783.cljs$lang$arity$variadic = G__25783__delegate;
    return G__25783
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
      var temp__3974__auto____25805 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25805) {
        var s__25806 = temp__3974__auto____25805;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__25806)) {
          var c__25807 = cljs.core.chunk_first.call(null, s__25806);
          var size__25808 = cljs.core.count.call(null, c__25807);
          var b__25809 = cljs.core.chunk_buffer.call(null, size__25808);
          var n__2558__auto____25810 = size__25808;
          var i__25811 = 0;
          while(true) {
            if(i__25811 < n__2558__auto____25810) {
              cljs.core.chunk_append.call(null, b__25809, f.call(null, cljs.core._nth.call(null, c__25807, i__25811)));
              var G__25823 = i__25811 + 1;
              i__25811 = G__25823;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__25809), map.call(null, f, cljs.core.chunk_rest.call(null, s__25806)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__25806)), map.call(null, f, cljs.core.rest.call(null, s__25806)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__25812 = cljs.core.seq.call(null, c1);
      var s2__25813 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____25814 = s1__25812;
        if(and__3822__auto____25814) {
          return s2__25813
        }else {
          return and__3822__auto____25814
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__25812), cljs.core.first.call(null, s2__25813)), map.call(null, f, cljs.core.rest.call(null, s1__25812), cljs.core.rest.call(null, s2__25813)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__25815 = cljs.core.seq.call(null, c1);
      var s2__25816 = cljs.core.seq.call(null, c2);
      var s3__25817 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____25818 = s1__25815;
        if(and__3822__auto____25818) {
          var and__3822__auto____25819 = s2__25816;
          if(and__3822__auto____25819) {
            return s3__25817
          }else {
            return and__3822__auto____25819
          }
        }else {
          return and__3822__auto____25818
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__25815), cljs.core.first.call(null, s2__25816), cljs.core.first.call(null, s3__25817)), map.call(null, f, cljs.core.rest.call(null, s1__25815), cljs.core.rest.call(null, s2__25816), cljs.core.rest.call(null, s3__25817)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__25824__delegate = function(f, c1, c2, c3, colls) {
      var step__25822 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__25821 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__25821)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__25821), step.call(null, map.call(null, cljs.core.rest, ss__25821)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__25626_SHARP_) {
        return cljs.core.apply.call(null, f, p1__25626_SHARP_)
      }, step__25822.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__25824 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25824__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__25824.cljs$lang$maxFixedArity = 4;
    G__25824.cljs$lang$applyTo = function(arglist__25825) {
      var f = cljs.core.first(arglist__25825);
      var c1 = cljs.core.first(cljs.core.next(arglist__25825));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25825)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25825))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25825))));
      return G__25824__delegate(f, c1, c2, c3, colls)
    };
    G__25824.cljs$lang$arity$variadic = G__25824__delegate;
    return G__25824
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
      var temp__3974__auto____25828 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25828) {
        var s__25829 = temp__3974__auto____25828;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__25829), take.call(null, n - 1, cljs.core.rest.call(null, s__25829)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__25835 = function(n, coll) {
    while(true) {
      var s__25833 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____25834 = n > 0;
        if(and__3822__auto____25834) {
          return s__25833
        }else {
          return and__3822__auto____25834
        }
      }())) {
        var G__25836 = n - 1;
        var G__25837 = cljs.core.rest.call(null, s__25833);
        n = G__25836;
        coll = G__25837;
        continue
      }else {
        return s__25833
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__25835.call(null, n, coll)
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
  var s__25840 = cljs.core.seq.call(null, coll);
  var lead__25841 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__25841) {
      var G__25842 = cljs.core.next.call(null, s__25840);
      var G__25843 = cljs.core.next.call(null, lead__25841);
      s__25840 = G__25842;
      lead__25841 = G__25843;
      continue
    }else {
      return s__25840
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__25849 = function(pred, coll) {
    while(true) {
      var s__25847 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____25848 = s__25847;
        if(and__3822__auto____25848) {
          return pred.call(null, cljs.core.first.call(null, s__25847))
        }else {
          return and__3822__auto____25848
        }
      }())) {
        var G__25850 = pred;
        var G__25851 = cljs.core.rest.call(null, s__25847);
        pred = G__25850;
        coll = G__25851;
        continue
      }else {
        return s__25847
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__25849.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____25854 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____25854) {
      var s__25855 = temp__3974__auto____25854;
      return cljs.core.concat.call(null, s__25855, cycle.call(null, s__25855))
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
      var s1__25860 = cljs.core.seq.call(null, c1);
      var s2__25861 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____25862 = s1__25860;
        if(and__3822__auto____25862) {
          return s2__25861
        }else {
          return and__3822__auto____25862
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__25860), cljs.core.cons.call(null, cljs.core.first.call(null, s2__25861), interleave.call(null, cljs.core.rest.call(null, s1__25860), cljs.core.rest.call(null, s2__25861))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__25864__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__25863 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__25863)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__25863), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__25863)))
        }else {
          return null
        }
      }, null)
    };
    var G__25864 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25864__delegate.call(this, c1, c2, colls)
    };
    G__25864.cljs$lang$maxFixedArity = 2;
    G__25864.cljs$lang$applyTo = function(arglist__25865) {
      var c1 = cljs.core.first(arglist__25865);
      var c2 = cljs.core.first(cljs.core.next(arglist__25865));
      var colls = cljs.core.rest(cljs.core.next(arglist__25865));
      return G__25864__delegate(c1, c2, colls)
    };
    G__25864.cljs$lang$arity$variadic = G__25864__delegate;
    return G__25864
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
  var cat__25875 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____25873 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____25873) {
        var coll__25874 = temp__3971__auto____25873;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__25874), cat.call(null, cljs.core.rest.call(null, coll__25874), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__25875.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__25876__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__25876 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25876__delegate.call(this, f, coll, colls)
    };
    G__25876.cljs$lang$maxFixedArity = 2;
    G__25876.cljs$lang$applyTo = function(arglist__25877) {
      var f = cljs.core.first(arglist__25877);
      var coll = cljs.core.first(cljs.core.next(arglist__25877));
      var colls = cljs.core.rest(cljs.core.next(arglist__25877));
      return G__25876__delegate(f, coll, colls)
    };
    G__25876.cljs$lang$arity$variadic = G__25876__delegate;
    return G__25876
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
    var temp__3974__auto____25887 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____25887) {
      var s__25888 = temp__3974__auto____25887;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__25888)) {
        var c__25889 = cljs.core.chunk_first.call(null, s__25888);
        var size__25890 = cljs.core.count.call(null, c__25889);
        var b__25891 = cljs.core.chunk_buffer.call(null, size__25890);
        var n__2558__auto____25892 = size__25890;
        var i__25893 = 0;
        while(true) {
          if(i__25893 < n__2558__auto____25892) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__25889, i__25893)))) {
              cljs.core.chunk_append.call(null, b__25891, cljs.core._nth.call(null, c__25889, i__25893))
            }else {
            }
            var G__25896 = i__25893 + 1;
            i__25893 = G__25896;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__25891), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__25888)))
      }else {
        var f__25894 = cljs.core.first.call(null, s__25888);
        var r__25895 = cljs.core.rest.call(null, s__25888);
        if(cljs.core.truth_(pred.call(null, f__25894))) {
          return cljs.core.cons.call(null, f__25894, filter.call(null, pred, r__25895))
        }else {
          return filter.call(null, pred, r__25895)
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
  var walk__25899 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__25899.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__25897_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__25897_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__25903__25904 = to;
    if(G__25903__25904) {
      if(function() {
        var or__3824__auto____25905 = G__25903__25904.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____25905) {
          return or__3824__auto____25905
        }else {
          return G__25903__25904.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__25903__25904.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__25903__25904)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__25903__25904)
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
    var G__25906__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__25906 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25906__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__25906.cljs$lang$maxFixedArity = 4;
    G__25906.cljs$lang$applyTo = function(arglist__25907) {
      var f = cljs.core.first(arglist__25907);
      var c1 = cljs.core.first(cljs.core.next(arglist__25907));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25907)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25907))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25907))));
      return G__25906__delegate(f, c1, c2, c3, colls)
    };
    G__25906.cljs$lang$arity$variadic = G__25906__delegate;
    return G__25906
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
      var temp__3974__auto____25914 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25914) {
        var s__25915 = temp__3974__auto____25914;
        var p__25916 = cljs.core.take.call(null, n, s__25915);
        if(n === cljs.core.count.call(null, p__25916)) {
          return cljs.core.cons.call(null, p__25916, partition.call(null, n, step, cljs.core.drop.call(null, step, s__25915)))
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
      var temp__3974__auto____25917 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____25917) {
        var s__25918 = temp__3974__auto____25917;
        var p__25919 = cljs.core.take.call(null, n, s__25918);
        if(n === cljs.core.count.call(null, p__25919)) {
          return cljs.core.cons.call(null, p__25919, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__25918)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__25919, pad)))
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
    var sentinel__25924 = cljs.core.lookup_sentinel;
    var m__25925 = m;
    var ks__25926 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__25926) {
        var m__25927 = cljs.core._lookup.call(null, m__25925, cljs.core.first.call(null, ks__25926), sentinel__25924);
        if(sentinel__25924 === m__25927) {
          return not_found
        }else {
          var G__25928 = sentinel__25924;
          var G__25929 = m__25927;
          var G__25930 = cljs.core.next.call(null, ks__25926);
          sentinel__25924 = G__25928;
          m__25925 = G__25929;
          ks__25926 = G__25930;
          continue
        }
      }else {
        return m__25925
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
cljs.core.assoc_in = function assoc_in(m, p__25931, v) {
  var vec__25936__25937 = p__25931;
  var k__25938 = cljs.core.nth.call(null, vec__25936__25937, 0, null);
  var ks__25939 = cljs.core.nthnext.call(null, vec__25936__25937, 1);
  if(cljs.core.truth_(ks__25939)) {
    return cljs.core.assoc.call(null, m, k__25938, assoc_in.call(null, cljs.core._lookup.call(null, m, k__25938, null), ks__25939, v))
  }else {
    return cljs.core.assoc.call(null, m, k__25938, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__25940, f, args) {
    var vec__25945__25946 = p__25940;
    var k__25947 = cljs.core.nth.call(null, vec__25945__25946, 0, null);
    var ks__25948 = cljs.core.nthnext.call(null, vec__25945__25946, 1);
    if(cljs.core.truth_(ks__25948)) {
      return cljs.core.assoc.call(null, m, k__25947, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__25947, null), ks__25948, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__25947, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__25947, null), args))
    }
  };
  var update_in = function(m, p__25940, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__25940, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__25949) {
    var m = cljs.core.first(arglist__25949);
    var p__25940 = cljs.core.first(cljs.core.next(arglist__25949));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25949)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25949)));
    return update_in__delegate(m, p__25940, f, args)
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
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__25952 = this;
  var h__2223__auto____25953 = this__25952.__hash;
  if(!(h__2223__auto____25953 == null)) {
    return h__2223__auto____25953
  }else {
    var h__2223__auto____25954 = cljs.core.hash_coll.call(null, coll);
    this__25952.__hash = h__2223__auto____25954;
    return h__2223__auto____25954
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__25955 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__25956 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__25957 = this;
  var new_array__25958 = this__25957.array.slice();
  new_array__25958[k] = v;
  return new cljs.core.Vector(this__25957.meta, new_array__25958, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__25989 = null;
  var G__25989__2 = function(this_sym25959, k) {
    var this__25961 = this;
    var this_sym25959__25962 = this;
    var coll__25963 = this_sym25959__25962;
    return coll__25963.cljs$core$ILookup$_lookup$arity$2(coll__25963, k)
  };
  var G__25989__3 = function(this_sym25960, k, not_found) {
    var this__25961 = this;
    var this_sym25960__25964 = this;
    var coll__25965 = this_sym25960__25964;
    return coll__25965.cljs$core$ILookup$_lookup$arity$3(coll__25965, k, not_found)
  };
  G__25989 = function(this_sym25960, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25989__2.call(this, this_sym25960, k);
      case 3:
        return G__25989__3.call(this, this_sym25960, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25989
}();
cljs.core.Vector.prototype.apply = function(this_sym25950, args25951) {
  var this__25966 = this;
  return this_sym25950.call.apply(this_sym25950, [this_sym25950].concat(args25951.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__25967 = this;
  var new_array__25968 = this__25967.array.slice();
  new_array__25968.push(o);
  return new cljs.core.Vector(this__25967.meta, new_array__25968, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__25969 = this;
  var this__25970 = this;
  return cljs.core.pr_str.call(null, this__25970)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__25971 = this;
  return cljs.core.ci_reduce.call(null, this__25971.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__25972 = this;
  return cljs.core.ci_reduce.call(null, this__25972.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__25973 = this;
  if(this__25973.array.length > 0) {
    var vector_seq__25974 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__25973.array.length) {
          return cljs.core.cons.call(null, this__25973.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__25974.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__25975 = this;
  return this__25975.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__25976 = this;
  var count__25977 = this__25976.array.length;
  if(count__25977 > 0) {
    return this__25976.array[count__25977 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__25978 = this;
  if(this__25978.array.length > 0) {
    var new_array__25979 = this__25978.array.slice();
    new_array__25979.pop();
    return new cljs.core.Vector(this__25978.meta, new_array__25979, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__25980 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__25981 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__25982 = this;
  return new cljs.core.Vector(meta, this__25982.array, this__25982.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__25983 = this;
  return this__25983.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__25984 = this;
  if(function() {
    var and__3822__auto____25985 = 0 <= n;
    if(and__3822__auto____25985) {
      return n < this__25984.array.length
    }else {
      return and__3822__auto____25985
    }
  }()) {
    return this__25984.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__25986 = this;
  if(function() {
    var and__3822__auto____25987 = 0 <= n;
    if(and__3822__auto____25987) {
      return n < this__25986.array.length
    }else {
      return and__3822__auto____25987
    }
  }()) {
    return this__25986.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__25988 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__25988.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2341__auto__) {
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
  var cnt__25991 = pv.cnt;
  if(cnt__25991 < 32) {
    return 0
  }else {
    return cnt__25991 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__25997 = level;
  var ret__25998 = node;
  while(true) {
    if(ll__25997 === 0) {
      return ret__25998
    }else {
      var embed__25999 = ret__25998;
      var r__26000 = cljs.core.pv_fresh_node.call(null, edit);
      var ___26001 = cljs.core.pv_aset.call(null, r__26000, 0, embed__25999);
      var G__26002 = ll__25997 - 5;
      var G__26003 = r__26000;
      ll__25997 = G__26002;
      ret__25998 = G__26003;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__26009 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__26010 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__26009, subidx__26010, tailnode);
    return ret__26009
  }else {
    var child__26011 = cljs.core.pv_aget.call(null, parent, subidx__26010);
    if(!(child__26011 == null)) {
      var node_to_insert__26012 = push_tail.call(null, pv, level - 5, child__26011, tailnode);
      cljs.core.pv_aset.call(null, ret__26009, subidx__26010, node_to_insert__26012);
      return ret__26009
    }else {
      var node_to_insert__26013 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__26009, subidx__26010, node_to_insert__26013);
      return ret__26009
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____26017 = 0 <= i;
    if(and__3822__auto____26017) {
      return i < pv.cnt
    }else {
      return and__3822__auto____26017
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__26018 = pv.root;
      var level__26019 = pv.shift;
      while(true) {
        if(level__26019 > 0) {
          var G__26020 = cljs.core.pv_aget.call(null, node__26018, i >>> level__26019 & 31);
          var G__26021 = level__26019 - 5;
          node__26018 = G__26020;
          level__26019 = G__26021;
          continue
        }else {
          return node__26018.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__26024 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__26024, i & 31, val);
    return ret__26024
  }else {
    var subidx__26025 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__26024, subidx__26025, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__26025), i, val));
    return ret__26024
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__26031 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__26032 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__26031));
    if(function() {
      var and__3822__auto____26033 = new_child__26032 == null;
      if(and__3822__auto____26033) {
        return subidx__26031 === 0
      }else {
        return and__3822__auto____26033
      }
    }()) {
      return null
    }else {
      var ret__26034 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__26034, subidx__26031, new_child__26032);
      return ret__26034
    }
  }else {
    if(subidx__26031 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__26035 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__26035, subidx__26031, null);
        return ret__26035
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
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__26038 = this;
  return new cljs.core.TransientVector(this__26038.cnt, this__26038.shift, cljs.core.tv_editable_root.call(null, this__26038.root), cljs.core.tv_editable_tail.call(null, this__26038.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26039 = this;
  var h__2223__auto____26040 = this__26039.__hash;
  if(!(h__2223__auto____26040 == null)) {
    return h__2223__auto____26040
  }else {
    var h__2223__auto____26041 = cljs.core.hash_coll.call(null, coll);
    this__26039.__hash = h__2223__auto____26041;
    return h__2223__auto____26041
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26042 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26043 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26044 = this;
  if(function() {
    var and__3822__auto____26045 = 0 <= k;
    if(and__3822__auto____26045) {
      return k < this__26044.cnt
    }else {
      return and__3822__auto____26045
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__26046 = this__26044.tail.slice();
      new_tail__26046[k & 31] = v;
      return new cljs.core.PersistentVector(this__26044.meta, this__26044.cnt, this__26044.shift, this__26044.root, new_tail__26046, null)
    }else {
      return new cljs.core.PersistentVector(this__26044.meta, this__26044.cnt, this__26044.shift, cljs.core.do_assoc.call(null, coll, this__26044.shift, this__26044.root, k, v), this__26044.tail, null)
    }
  }else {
    if(k === this__26044.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__26044.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__26094 = null;
  var G__26094__2 = function(this_sym26047, k) {
    var this__26049 = this;
    var this_sym26047__26050 = this;
    var coll__26051 = this_sym26047__26050;
    return coll__26051.cljs$core$ILookup$_lookup$arity$2(coll__26051, k)
  };
  var G__26094__3 = function(this_sym26048, k, not_found) {
    var this__26049 = this;
    var this_sym26048__26052 = this;
    var coll__26053 = this_sym26048__26052;
    return coll__26053.cljs$core$ILookup$_lookup$arity$3(coll__26053, k, not_found)
  };
  G__26094 = function(this_sym26048, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26094__2.call(this, this_sym26048, k);
      case 3:
        return G__26094__3.call(this, this_sym26048, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26094
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym26036, args26037) {
  var this__26054 = this;
  return this_sym26036.call.apply(this_sym26036, [this_sym26036].concat(args26037.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__26055 = this;
  var step_init__26056 = [0, init];
  var i__26057 = 0;
  while(true) {
    if(i__26057 < this__26055.cnt) {
      var arr__26058 = cljs.core.array_for.call(null, v, i__26057);
      var len__26059 = arr__26058.length;
      var init__26063 = function() {
        var j__26060 = 0;
        var init__26061 = step_init__26056[1];
        while(true) {
          if(j__26060 < len__26059) {
            var init__26062 = f.call(null, init__26061, j__26060 + i__26057, arr__26058[j__26060]);
            if(cljs.core.reduced_QMARK_.call(null, init__26062)) {
              return init__26062
            }else {
              var G__26095 = j__26060 + 1;
              var G__26096 = init__26062;
              j__26060 = G__26095;
              init__26061 = G__26096;
              continue
            }
          }else {
            step_init__26056[0] = len__26059;
            step_init__26056[1] = init__26061;
            return init__26061
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__26063)) {
        return cljs.core.deref.call(null, init__26063)
      }else {
        var G__26097 = i__26057 + step_init__26056[0];
        i__26057 = G__26097;
        continue
      }
    }else {
      return step_init__26056[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26064 = this;
  if(this__26064.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__26065 = this__26064.tail.slice();
    new_tail__26065.push(o);
    return new cljs.core.PersistentVector(this__26064.meta, this__26064.cnt + 1, this__26064.shift, this__26064.root, new_tail__26065, null)
  }else {
    var root_overflow_QMARK___26066 = this__26064.cnt >>> 5 > 1 << this__26064.shift;
    var new_shift__26067 = root_overflow_QMARK___26066 ? this__26064.shift + 5 : this__26064.shift;
    var new_root__26069 = root_overflow_QMARK___26066 ? function() {
      var n_r__26068 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__26068, 0, this__26064.root);
      cljs.core.pv_aset.call(null, n_r__26068, 1, cljs.core.new_path.call(null, null, this__26064.shift, new cljs.core.VectorNode(null, this__26064.tail)));
      return n_r__26068
    }() : cljs.core.push_tail.call(null, coll, this__26064.shift, this__26064.root, new cljs.core.VectorNode(null, this__26064.tail));
    return new cljs.core.PersistentVector(this__26064.meta, this__26064.cnt + 1, new_shift__26067, new_root__26069, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__26070 = this;
  if(this__26070.cnt > 0) {
    return new cljs.core.RSeq(coll, this__26070.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__26071 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__26072 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__26073 = this;
  var this__26074 = this;
  return cljs.core.pr_str.call(null, this__26074)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__26075 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__26076 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26077 = this;
  if(this__26077.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26078 = this;
  return this__26078.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__26079 = this;
  if(this__26079.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__26079.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__26080 = this;
  if(this__26080.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__26080.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__26080.meta)
    }else {
      if(1 < this__26080.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__26080.meta, this__26080.cnt - 1, this__26080.shift, this__26080.root, this__26080.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__26081 = cljs.core.array_for.call(null, coll, this__26080.cnt - 2);
          var nr__26082 = cljs.core.pop_tail.call(null, coll, this__26080.shift, this__26080.root);
          var new_root__26083 = nr__26082 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__26082;
          var cnt_1__26084 = this__26080.cnt - 1;
          if(function() {
            var and__3822__auto____26085 = 5 < this__26080.shift;
            if(and__3822__auto____26085) {
              return cljs.core.pv_aget.call(null, new_root__26083, 1) == null
            }else {
              return and__3822__auto____26085
            }
          }()) {
            return new cljs.core.PersistentVector(this__26080.meta, cnt_1__26084, this__26080.shift - 5, cljs.core.pv_aget.call(null, new_root__26083, 0), new_tail__26081, null)
          }else {
            return new cljs.core.PersistentVector(this__26080.meta, cnt_1__26084, this__26080.shift, new_root__26083, new_tail__26081, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__26086 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26087 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26088 = this;
  return new cljs.core.PersistentVector(meta, this__26088.cnt, this__26088.shift, this__26088.root, this__26088.tail, this__26088.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26089 = this;
  return this__26089.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__26090 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__26091 = this;
  if(function() {
    var and__3822__auto____26092 = 0 <= n;
    if(and__3822__auto____26092) {
      return n < this__26091.cnt
    }else {
      return and__3822__auto____26092
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26093 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__26093.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__26098 = xs.length;
  var xs__26099 = no_clone === true ? xs : xs.slice();
  if(l__26098 < 32) {
    return new cljs.core.PersistentVector(null, l__26098, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__26099, null)
  }else {
    var node__26100 = xs__26099.slice(0, 32);
    var v__26101 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__26100, null);
    var i__26102 = 32;
    var out__26103 = cljs.core._as_transient.call(null, v__26101);
    while(true) {
      if(i__26102 < l__26098) {
        var G__26104 = i__26102 + 1;
        var G__26105 = cljs.core.conj_BANG_.call(null, out__26103, xs__26099[i__26102]);
        i__26102 = G__26104;
        out__26103 = G__26105;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__26103)
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
  vector.cljs$lang$applyTo = function(arglist__26106) {
    var args = cljs.core.seq(arglist__26106);
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
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__26107 = this;
  if(this__26107.off + 1 < this__26107.node.length) {
    var s__26108 = cljs.core.chunked_seq.call(null, this__26107.vec, this__26107.node, this__26107.i, this__26107.off + 1);
    if(s__26108 == null) {
      return null
    }else {
      return s__26108
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26109 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26110 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__26111 = this;
  return this__26111.node[this__26111.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__26112 = this;
  if(this__26112.off + 1 < this__26112.node.length) {
    var s__26113 = cljs.core.chunked_seq.call(null, this__26112.vec, this__26112.node, this__26112.i, this__26112.off + 1);
    if(s__26113 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__26113
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__26114 = this;
  var l__26115 = this__26114.node.length;
  var s__26116 = this__26114.i + l__26115 < cljs.core._count.call(null, this__26114.vec) ? cljs.core.chunked_seq.call(null, this__26114.vec, this__26114.i + l__26115, 0) : null;
  if(s__26116 == null) {
    return null
  }else {
    return s__26116
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26117 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__26118 = this;
  return cljs.core.chunked_seq.call(null, this__26118.vec, this__26118.node, this__26118.i, this__26118.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__26119 = this;
  return this__26119.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26120 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__26120.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__26121 = this;
  return cljs.core.array_chunk.call(null, this__26121.node, this__26121.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__26122 = this;
  var l__26123 = this__26122.node.length;
  var s__26124 = this__26122.i + l__26123 < cljs.core._count.call(null, this__26122.vec) ? cljs.core.chunked_seq.call(null, this__26122.vec, this__26122.i + l__26123, 0) : null;
  if(s__26124 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__26124
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
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26127 = this;
  var h__2223__auto____26128 = this__26127.__hash;
  if(!(h__2223__auto____26128 == null)) {
    return h__2223__auto____26128
  }else {
    var h__2223__auto____26129 = cljs.core.hash_coll.call(null, coll);
    this__26127.__hash = h__2223__auto____26129;
    return h__2223__auto____26129
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26130 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26131 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__26132 = this;
  var v_pos__26133 = this__26132.start + key;
  return new cljs.core.Subvec(this__26132.meta, cljs.core._assoc.call(null, this__26132.v, v_pos__26133, val), this__26132.start, this__26132.end > v_pos__26133 + 1 ? this__26132.end : v_pos__26133 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__26159 = null;
  var G__26159__2 = function(this_sym26134, k) {
    var this__26136 = this;
    var this_sym26134__26137 = this;
    var coll__26138 = this_sym26134__26137;
    return coll__26138.cljs$core$ILookup$_lookup$arity$2(coll__26138, k)
  };
  var G__26159__3 = function(this_sym26135, k, not_found) {
    var this__26136 = this;
    var this_sym26135__26139 = this;
    var coll__26140 = this_sym26135__26139;
    return coll__26140.cljs$core$ILookup$_lookup$arity$3(coll__26140, k, not_found)
  };
  G__26159 = function(this_sym26135, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26159__2.call(this, this_sym26135, k);
      case 3:
        return G__26159__3.call(this, this_sym26135, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26159
}();
cljs.core.Subvec.prototype.apply = function(this_sym26125, args26126) {
  var this__26141 = this;
  return this_sym26125.call.apply(this_sym26125, [this_sym26125].concat(args26126.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26142 = this;
  return new cljs.core.Subvec(this__26142.meta, cljs.core._assoc_n.call(null, this__26142.v, this__26142.end, o), this__26142.start, this__26142.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__26143 = this;
  var this__26144 = this;
  return cljs.core.pr_str.call(null, this__26144)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__26145 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__26146 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26147 = this;
  var subvec_seq__26148 = function subvec_seq(i) {
    if(i === this__26147.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__26147.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__26148.call(null, this__26147.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26149 = this;
  return this__26149.end - this__26149.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__26150 = this;
  return cljs.core._nth.call(null, this__26150.v, this__26150.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__26151 = this;
  if(this__26151.start === this__26151.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__26151.meta, this__26151.v, this__26151.start, this__26151.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__26152 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26153 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26154 = this;
  return new cljs.core.Subvec(meta, this__26154.v, this__26154.start, this__26154.end, this__26154.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26155 = this;
  return this__26155.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__26156 = this;
  return cljs.core._nth.call(null, this__26156.v, this__26156.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__26157 = this;
  return cljs.core._nth.call(null, this__26157.v, this__26157.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26158 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__26158.meta)
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
  var ret__26161 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__26161, 0, tl.length);
  return ret__26161
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__26165 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__26166 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__26165, subidx__26166, level === 5 ? tail_node : function() {
    var child__26167 = cljs.core.pv_aget.call(null, ret__26165, subidx__26166);
    if(!(child__26167 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__26167, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__26165
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__26172 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__26173 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__26174 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__26172, subidx__26173));
    if(function() {
      var and__3822__auto____26175 = new_child__26174 == null;
      if(and__3822__auto____26175) {
        return subidx__26173 === 0
      }else {
        return and__3822__auto____26175
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__26172, subidx__26173, new_child__26174);
      return node__26172
    }
  }else {
    if(subidx__26173 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__26172, subidx__26173, null);
        return node__26172
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____26180 = 0 <= i;
    if(and__3822__auto____26180) {
      return i < tv.cnt
    }else {
      return and__3822__auto____26180
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__26181 = tv.root;
      var node__26182 = root__26181;
      var level__26183 = tv.shift;
      while(true) {
        if(level__26183 > 0) {
          var G__26184 = cljs.core.tv_ensure_editable.call(null, root__26181.edit, cljs.core.pv_aget.call(null, node__26182, i >>> level__26183 & 31));
          var G__26185 = level__26183 - 5;
          node__26182 = G__26184;
          level__26183 = G__26185;
          continue
        }else {
          return node__26182.arr
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
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__26225 = null;
  var G__26225__2 = function(this_sym26188, k) {
    var this__26190 = this;
    var this_sym26188__26191 = this;
    var coll__26192 = this_sym26188__26191;
    return coll__26192.cljs$core$ILookup$_lookup$arity$2(coll__26192, k)
  };
  var G__26225__3 = function(this_sym26189, k, not_found) {
    var this__26190 = this;
    var this_sym26189__26193 = this;
    var coll__26194 = this_sym26189__26193;
    return coll__26194.cljs$core$ILookup$_lookup$arity$3(coll__26194, k, not_found)
  };
  G__26225 = function(this_sym26189, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26225__2.call(this, this_sym26189, k);
      case 3:
        return G__26225__3.call(this, this_sym26189, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26225
}();
cljs.core.TransientVector.prototype.apply = function(this_sym26186, args26187) {
  var this__26195 = this;
  return this_sym26186.call.apply(this_sym26186, [this_sym26186].concat(args26187.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26196 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26197 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__26198 = this;
  if(this__26198.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__26199 = this;
  if(function() {
    var and__3822__auto____26200 = 0 <= n;
    if(and__3822__auto____26200) {
      return n < this__26199.cnt
    }else {
      return and__3822__auto____26200
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26201 = this;
  if(this__26201.root.edit) {
    return this__26201.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__26202 = this;
  if(this__26202.root.edit) {
    if(function() {
      var and__3822__auto____26203 = 0 <= n;
      if(and__3822__auto____26203) {
        return n < this__26202.cnt
      }else {
        return and__3822__auto____26203
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__26202.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__26208 = function go(level, node) {
          var node__26206 = cljs.core.tv_ensure_editable.call(null, this__26202.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__26206, n & 31, val);
            return node__26206
          }else {
            var subidx__26207 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__26206, subidx__26207, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__26206, subidx__26207)));
            return node__26206
          }
        }.call(null, this__26202.shift, this__26202.root);
        this__26202.root = new_root__26208;
        return tcoll
      }
    }else {
      if(n === this__26202.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__26202.cnt)].join(""));
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
  var this__26209 = this;
  if(this__26209.root.edit) {
    if(this__26209.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__26209.cnt) {
        this__26209.cnt = 0;
        return tcoll
      }else {
        if((this__26209.cnt - 1 & 31) > 0) {
          this__26209.cnt = this__26209.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__26210 = cljs.core.editable_array_for.call(null, tcoll, this__26209.cnt - 2);
            var new_root__26212 = function() {
              var nr__26211 = cljs.core.tv_pop_tail.call(null, tcoll, this__26209.shift, this__26209.root);
              if(!(nr__26211 == null)) {
                return nr__26211
              }else {
                return new cljs.core.VectorNode(this__26209.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____26213 = 5 < this__26209.shift;
              if(and__3822__auto____26213) {
                return cljs.core.pv_aget.call(null, new_root__26212, 1) == null
              }else {
                return and__3822__auto____26213
              }
            }()) {
              var new_root__26214 = cljs.core.tv_ensure_editable.call(null, this__26209.root.edit, cljs.core.pv_aget.call(null, new_root__26212, 0));
              this__26209.root = new_root__26214;
              this__26209.shift = this__26209.shift - 5;
              this__26209.cnt = this__26209.cnt - 1;
              this__26209.tail = new_tail__26210;
              return tcoll
            }else {
              this__26209.root = new_root__26212;
              this__26209.cnt = this__26209.cnt - 1;
              this__26209.tail = new_tail__26210;
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
  var this__26215 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__26216 = this;
  if(this__26216.root.edit) {
    if(this__26216.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__26216.tail[this__26216.cnt & 31] = o;
      this__26216.cnt = this__26216.cnt + 1;
      return tcoll
    }else {
      var tail_node__26217 = new cljs.core.VectorNode(this__26216.root.edit, this__26216.tail);
      var new_tail__26218 = cljs.core.make_array.call(null, 32);
      new_tail__26218[0] = o;
      this__26216.tail = new_tail__26218;
      if(this__26216.cnt >>> 5 > 1 << this__26216.shift) {
        var new_root_array__26219 = cljs.core.make_array.call(null, 32);
        var new_shift__26220 = this__26216.shift + 5;
        new_root_array__26219[0] = this__26216.root;
        new_root_array__26219[1] = cljs.core.new_path.call(null, this__26216.root.edit, this__26216.shift, tail_node__26217);
        this__26216.root = new cljs.core.VectorNode(this__26216.root.edit, new_root_array__26219);
        this__26216.shift = new_shift__26220;
        this__26216.cnt = this__26216.cnt + 1;
        return tcoll
      }else {
        var new_root__26221 = cljs.core.tv_push_tail.call(null, tcoll, this__26216.shift, this__26216.root, tail_node__26217);
        this__26216.root = new_root__26221;
        this__26216.cnt = this__26216.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__26222 = this;
  if(this__26222.root.edit) {
    this__26222.root.edit = null;
    var len__26223 = this__26222.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__26224 = cljs.core.make_array.call(null, len__26223);
    cljs.core.array_copy.call(null, this__26222.tail, 0, trimmed_tail__26224, 0, len__26223);
    return new cljs.core.PersistentVector(null, this__26222.cnt, this__26222.shift, this__26222.root, trimmed_tail__26224, null)
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
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26226 = this;
  var h__2223__auto____26227 = this__26226.__hash;
  if(!(h__2223__auto____26227 == null)) {
    return h__2223__auto____26227
  }else {
    var h__2223__auto____26228 = cljs.core.hash_coll.call(null, coll);
    this__26226.__hash = h__2223__auto____26228;
    return h__2223__auto____26228
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26229 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__26230 = this;
  var this__26231 = this;
  return cljs.core.pr_str.call(null, this__26231)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26232 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__26233 = this;
  return cljs.core._first.call(null, this__26233.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__26234 = this;
  var temp__3971__auto____26235 = cljs.core.next.call(null, this__26234.front);
  if(temp__3971__auto____26235) {
    var f1__26236 = temp__3971__auto____26235;
    return new cljs.core.PersistentQueueSeq(this__26234.meta, f1__26236, this__26234.rear, null)
  }else {
    if(this__26234.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__26234.meta, this__26234.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26237 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26238 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__26238.front, this__26238.rear, this__26238.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26239 = this;
  return this__26239.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26240 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__26240.meta)
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
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26241 = this;
  var h__2223__auto____26242 = this__26241.__hash;
  if(!(h__2223__auto____26242 == null)) {
    return h__2223__auto____26242
  }else {
    var h__2223__auto____26243 = cljs.core.hash_coll.call(null, coll);
    this__26241.__hash = h__2223__auto____26243;
    return h__2223__auto____26243
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26244 = this;
  if(cljs.core.truth_(this__26244.front)) {
    return new cljs.core.PersistentQueue(this__26244.meta, this__26244.count + 1, this__26244.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____26245 = this__26244.rear;
      if(cljs.core.truth_(or__3824__auto____26245)) {
        return or__3824__auto____26245
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__26244.meta, this__26244.count + 1, cljs.core.conj.call(null, this__26244.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__26246 = this;
  var this__26247 = this;
  return cljs.core.pr_str.call(null, this__26247)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26248 = this;
  var rear__26249 = cljs.core.seq.call(null, this__26248.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____26250 = this__26248.front;
    if(cljs.core.truth_(or__3824__auto____26250)) {
      return or__3824__auto____26250
    }else {
      return rear__26249
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__26248.front, cljs.core.seq.call(null, rear__26249), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26251 = this;
  return this__26251.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__26252 = this;
  return cljs.core._first.call(null, this__26252.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__26253 = this;
  if(cljs.core.truth_(this__26253.front)) {
    var temp__3971__auto____26254 = cljs.core.next.call(null, this__26253.front);
    if(temp__3971__auto____26254) {
      var f1__26255 = temp__3971__auto____26254;
      return new cljs.core.PersistentQueue(this__26253.meta, this__26253.count - 1, f1__26255, this__26253.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__26253.meta, this__26253.count - 1, cljs.core.seq.call(null, this__26253.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__26256 = this;
  return cljs.core.first.call(null, this__26256.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__26257 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26258 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26259 = this;
  return new cljs.core.PersistentQueue(meta, this__26259.count, this__26259.front, this__26259.rear, this__26259.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26260 = this;
  return this__26260.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26261 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__26262 = this;
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
  var len__26265 = array.length;
  var i__26266 = 0;
  while(true) {
    if(i__26266 < len__26265) {
      if(k === array[i__26266]) {
        return i__26266
      }else {
        var G__26267 = i__26266 + incr;
        i__26266 = G__26267;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__26270 = cljs.core.hash.call(null, a);
  var b__26271 = cljs.core.hash.call(null, b);
  if(a__26270 < b__26271) {
    return-1
  }else {
    if(a__26270 > b__26271) {
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
  var ks__26279 = m.keys;
  var len__26280 = ks__26279.length;
  var so__26281 = m.strobj;
  var out__26282 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__26283 = 0;
  var out__26284 = cljs.core.transient$.call(null, out__26282);
  while(true) {
    if(i__26283 < len__26280) {
      var k__26285 = ks__26279[i__26283];
      var G__26286 = i__26283 + 1;
      var G__26287 = cljs.core.assoc_BANG_.call(null, out__26284, k__26285, so__26281[k__26285]);
      i__26283 = G__26286;
      out__26284 = G__26287;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__26284, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__26293 = {};
  var l__26294 = ks.length;
  var i__26295 = 0;
  while(true) {
    if(i__26295 < l__26294) {
      var k__26296 = ks[i__26295];
      new_obj__26293[k__26296] = obj[k__26296];
      var G__26297 = i__26295 + 1;
      i__26295 = G__26297;
      continue
    }else {
    }
    break
  }
  return new_obj__26293
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
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__26300 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26301 = this;
  var h__2223__auto____26302 = this__26301.__hash;
  if(!(h__2223__auto____26302 == null)) {
    return h__2223__auto____26302
  }else {
    var h__2223__auto____26303 = cljs.core.hash_imap.call(null, coll);
    this__26301.__hash = h__2223__auto____26303;
    return h__2223__auto____26303
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26304 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26305 = this;
  if(function() {
    var and__3822__auto____26306 = goog.isString(k);
    if(and__3822__auto____26306) {
      return!(cljs.core.scan_array.call(null, 1, k, this__26305.keys) == null)
    }else {
      return and__3822__auto____26306
    }
  }()) {
    return this__26305.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26307 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____26308 = this__26307.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____26308) {
        return or__3824__auto____26308
      }else {
        return this__26307.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__26307.keys) == null)) {
        var new_strobj__26309 = cljs.core.obj_clone.call(null, this__26307.strobj, this__26307.keys);
        new_strobj__26309[k] = v;
        return new cljs.core.ObjMap(this__26307.meta, this__26307.keys, new_strobj__26309, this__26307.update_count + 1, null)
      }else {
        var new_strobj__26310 = cljs.core.obj_clone.call(null, this__26307.strobj, this__26307.keys);
        var new_keys__26311 = this__26307.keys.slice();
        new_strobj__26310[k] = v;
        new_keys__26311.push(k);
        return new cljs.core.ObjMap(this__26307.meta, new_keys__26311, new_strobj__26310, this__26307.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__26312 = this;
  if(function() {
    var and__3822__auto____26313 = goog.isString(k);
    if(and__3822__auto____26313) {
      return!(cljs.core.scan_array.call(null, 1, k, this__26312.keys) == null)
    }else {
      return and__3822__auto____26313
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__26335 = null;
  var G__26335__2 = function(this_sym26314, k) {
    var this__26316 = this;
    var this_sym26314__26317 = this;
    var coll__26318 = this_sym26314__26317;
    return coll__26318.cljs$core$ILookup$_lookup$arity$2(coll__26318, k)
  };
  var G__26335__3 = function(this_sym26315, k, not_found) {
    var this__26316 = this;
    var this_sym26315__26319 = this;
    var coll__26320 = this_sym26315__26319;
    return coll__26320.cljs$core$ILookup$_lookup$arity$3(coll__26320, k, not_found)
  };
  G__26335 = function(this_sym26315, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26335__2.call(this, this_sym26315, k);
      case 3:
        return G__26335__3.call(this, this_sym26315, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26335
}();
cljs.core.ObjMap.prototype.apply = function(this_sym26298, args26299) {
  var this__26321 = this;
  return this_sym26298.call.apply(this_sym26298, [this_sym26298].concat(args26299.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__26322 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__26323 = this;
  var this__26324 = this;
  return cljs.core.pr_str.call(null, this__26324)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26325 = this;
  if(this__26325.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__26288_SHARP_) {
      return cljs.core.vector.call(null, p1__26288_SHARP_, this__26325.strobj[p1__26288_SHARP_])
    }, this__26325.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26326 = this;
  return this__26326.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26327 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26328 = this;
  return new cljs.core.ObjMap(meta, this__26328.keys, this__26328.strobj, this__26328.update_count, this__26328.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26329 = this;
  return this__26329.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26330 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__26330.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__26331 = this;
  if(function() {
    var and__3822__auto____26332 = goog.isString(k);
    if(and__3822__auto____26332) {
      return!(cljs.core.scan_array.call(null, 1, k, this__26331.keys) == null)
    }else {
      return and__3822__auto____26332
    }
  }()) {
    var new_keys__26333 = this__26331.keys.slice();
    var new_strobj__26334 = cljs.core.obj_clone.call(null, this__26331.strobj, this__26331.keys);
    new_keys__26333.splice(cljs.core.scan_array.call(null, 1, k, new_keys__26333), 1);
    cljs.core.js_delete.call(null, new_strobj__26334, k);
    return new cljs.core.ObjMap(this__26331.meta, new_keys__26333, new_strobj__26334, this__26331.update_count + 1, null)
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
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26339 = this;
  var h__2223__auto____26340 = this__26339.__hash;
  if(!(h__2223__auto____26340 == null)) {
    return h__2223__auto____26340
  }else {
    var h__2223__auto____26341 = cljs.core.hash_imap.call(null, coll);
    this__26339.__hash = h__2223__auto____26341;
    return h__2223__auto____26341
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26342 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26343 = this;
  var bucket__26344 = this__26343.hashobj[cljs.core.hash.call(null, k)];
  var i__26345 = cljs.core.truth_(bucket__26344) ? cljs.core.scan_array.call(null, 2, k, bucket__26344) : null;
  if(cljs.core.truth_(i__26345)) {
    return bucket__26344[i__26345 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26346 = this;
  var h__26347 = cljs.core.hash.call(null, k);
  var bucket__26348 = this__26346.hashobj[h__26347];
  if(cljs.core.truth_(bucket__26348)) {
    var new_bucket__26349 = bucket__26348.slice();
    var new_hashobj__26350 = goog.object.clone(this__26346.hashobj);
    new_hashobj__26350[h__26347] = new_bucket__26349;
    var temp__3971__auto____26351 = cljs.core.scan_array.call(null, 2, k, new_bucket__26349);
    if(cljs.core.truth_(temp__3971__auto____26351)) {
      var i__26352 = temp__3971__auto____26351;
      new_bucket__26349[i__26352 + 1] = v;
      return new cljs.core.HashMap(this__26346.meta, this__26346.count, new_hashobj__26350, null)
    }else {
      new_bucket__26349.push(k, v);
      return new cljs.core.HashMap(this__26346.meta, this__26346.count + 1, new_hashobj__26350, null)
    }
  }else {
    var new_hashobj__26353 = goog.object.clone(this__26346.hashobj);
    new_hashobj__26353[h__26347] = [k, v];
    return new cljs.core.HashMap(this__26346.meta, this__26346.count + 1, new_hashobj__26353, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__26354 = this;
  var bucket__26355 = this__26354.hashobj[cljs.core.hash.call(null, k)];
  var i__26356 = cljs.core.truth_(bucket__26355) ? cljs.core.scan_array.call(null, 2, k, bucket__26355) : null;
  if(cljs.core.truth_(i__26356)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__26381 = null;
  var G__26381__2 = function(this_sym26357, k) {
    var this__26359 = this;
    var this_sym26357__26360 = this;
    var coll__26361 = this_sym26357__26360;
    return coll__26361.cljs$core$ILookup$_lookup$arity$2(coll__26361, k)
  };
  var G__26381__3 = function(this_sym26358, k, not_found) {
    var this__26359 = this;
    var this_sym26358__26362 = this;
    var coll__26363 = this_sym26358__26362;
    return coll__26363.cljs$core$ILookup$_lookup$arity$3(coll__26363, k, not_found)
  };
  G__26381 = function(this_sym26358, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26381__2.call(this, this_sym26358, k);
      case 3:
        return G__26381__3.call(this, this_sym26358, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26381
}();
cljs.core.HashMap.prototype.apply = function(this_sym26337, args26338) {
  var this__26364 = this;
  return this_sym26337.call.apply(this_sym26337, [this_sym26337].concat(args26338.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__26365 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__26366 = this;
  var this__26367 = this;
  return cljs.core.pr_str.call(null, this__26367)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26368 = this;
  if(this__26368.count > 0) {
    var hashes__26369 = cljs.core.js_keys.call(null, this__26368.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__26336_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__26368.hashobj[p1__26336_SHARP_]))
    }, hashes__26369)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26370 = this;
  return this__26370.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26371 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26372 = this;
  return new cljs.core.HashMap(meta, this__26372.count, this__26372.hashobj, this__26372.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26373 = this;
  return this__26373.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26374 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__26374.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__26375 = this;
  var h__26376 = cljs.core.hash.call(null, k);
  var bucket__26377 = this__26375.hashobj[h__26376];
  var i__26378 = cljs.core.truth_(bucket__26377) ? cljs.core.scan_array.call(null, 2, k, bucket__26377) : null;
  if(cljs.core.not.call(null, i__26378)) {
    return coll
  }else {
    var new_hashobj__26379 = goog.object.clone(this__26375.hashobj);
    if(3 > bucket__26377.length) {
      cljs.core.js_delete.call(null, new_hashobj__26379, h__26376)
    }else {
      var new_bucket__26380 = bucket__26377.slice();
      new_bucket__26380.splice(i__26378, 2);
      new_hashobj__26379[h__26376] = new_bucket__26380
    }
    return new cljs.core.HashMap(this__26375.meta, this__26375.count - 1, new_hashobj__26379, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__26382 = ks.length;
  var i__26383 = 0;
  var out__26384 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__26383 < len__26382) {
      var G__26385 = i__26383 + 1;
      var G__26386 = cljs.core.assoc.call(null, out__26384, ks[i__26383], vs[i__26383]);
      i__26383 = G__26385;
      out__26384 = G__26386;
      continue
    }else {
      return out__26384
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__26390 = m.arr;
  var len__26391 = arr__26390.length;
  var i__26392 = 0;
  while(true) {
    if(len__26391 <= i__26392) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__26390[i__26392], k)) {
        return i__26392
      }else {
        if("\ufdd0'else") {
          var G__26393 = i__26392 + 2;
          i__26392 = G__26393;
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
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__26396 = this;
  return new cljs.core.TransientArrayMap({}, this__26396.arr.length, this__26396.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26397 = this;
  var h__2223__auto____26398 = this__26397.__hash;
  if(!(h__2223__auto____26398 == null)) {
    return h__2223__auto____26398
  }else {
    var h__2223__auto____26399 = cljs.core.hash_imap.call(null, coll);
    this__26397.__hash = h__2223__auto____26399;
    return h__2223__auto____26399
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26400 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26401 = this;
  var idx__26402 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__26402 === -1) {
    return not_found
  }else {
    return this__26401.arr[idx__26402 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26403 = this;
  var idx__26404 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__26404 === -1) {
    if(this__26403.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__26403.meta, this__26403.cnt + 1, function() {
        var G__26405__26406 = this__26403.arr.slice();
        G__26405__26406.push(k);
        G__26405__26406.push(v);
        return G__26405__26406
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__26403.arr[idx__26404 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__26403.meta, this__26403.cnt, function() {
          var G__26407__26408 = this__26403.arr.slice();
          G__26407__26408[idx__26404 + 1] = v;
          return G__26407__26408
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__26409 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__26441 = null;
  var G__26441__2 = function(this_sym26410, k) {
    var this__26412 = this;
    var this_sym26410__26413 = this;
    var coll__26414 = this_sym26410__26413;
    return coll__26414.cljs$core$ILookup$_lookup$arity$2(coll__26414, k)
  };
  var G__26441__3 = function(this_sym26411, k, not_found) {
    var this__26412 = this;
    var this_sym26411__26415 = this;
    var coll__26416 = this_sym26411__26415;
    return coll__26416.cljs$core$ILookup$_lookup$arity$3(coll__26416, k, not_found)
  };
  G__26441 = function(this_sym26411, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26441__2.call(this, this_sym26411, k);
      case 3:
        return G__26441__3.call(this, this_sym26411, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26441
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym26394, args26395) {
  var this__26417 = this;
  return this_sym26394.call.apply(this_sym26394, [this_sym26394].concat(args26395.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__26418 = this;
  var len__26419 = this__26418.arr.length;
  var i__26420 = 0;
  var init__26421 = init;
  while(true) {
    if(i__26420 < len__26419) {
      var init__26422 = f.call(null, init__26421, this__26418.arr[i__26420], this__26418.arr[i__26420 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__26422)) {
        return cljs.core.deref.call(null, init__26422)
      }else {
        var G__26442 = i__26420 + 2;
        var G__26443 = init__26422;
        i__26420 = G__26442;
        init__26421 = G__26443;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__26423 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__26424 = this;
  var this__26425 = this;
  return cljs.core.pr_str.call(null, this__26425)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26426 = this;
  if(this__26426.cnt > 0) {
    var len__26427 = this__26426.arr.length;
    var array_map_seq__26428 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__26427) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__26426.arr[i], this__26426.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__26428.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26429 = this;
  return this__26429.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26430 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26431 = this;
  return new cljs.core.PersistentArrayMap(meta, this__26431.cnt, this__26431.arr, this__26431.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26432 = this;
  return this__26432.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26433 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__26433.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__26434 = this;
  var idx__26435 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__26435 >= 0) {
    var len__26436 = this__26434.arr.length;
    var new_len__26437 = len__26436 - 2;
    if(new_len__26437 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__26438 = cljs.core.make_array.call(null, new_len__26437);
      var s__26439 = 0;
      var d__26440 = 0;
      while(true) {
        if(s__26439 >= len__26436) {
          return new cljs.core.PersistentArrayMap(this__26434.meta, this__26434.cnt - 1, new_arr__26438, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__26434.arr[s__26439])) {
            var G__26444 = s__26439 + 2;
            var G__26445 = d__26440;
            s__26439 = G__26444;
            d__26440 = G__26445;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__26438[d__26440] = this__26434.arr[s__26439];
              new_arr__26438[d__26440 + 1] = this__26434.arr[s__26439 + 1];
              var G__26446 = s__26439 + 2;
              var G__26447 = d__26440 + 2;
              s__26439 = G__26446;
              d__26440 = G__26447;
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
  var len__26448 = cljs.core.count.call(null, ks);
  var i__26449 = 0;
  var out__26450 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__26449 < len__26448) {
      var G__26451 = i__26449 + 1;
      var G__26452 = cljs.core.assoc_BANG_.call(null, out__26450, ks[i__26449], vs[i__26449]);
      i__26449 = G__26451;
      out__26450 = G__26452;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__26450)
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
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__26453 = this;
  if(cljs.core.truth_(this__26453.editable_QMARK_)) {
    var idx__26454 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__26454 >= 0) {
      this__26453.arr[idx__26454] = this__26453.arr[this__26453.len - 2];
      this__26453.arr[idx__26454 + 1] = this__26453.arr[this__26453.len - 1];
      var G__26455__26456 = this__26453.arr;
      G__26455__26456.pop();
      G__26455__26456.pop();
      G__26455__26456;
      this__26453.len = this__26453.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__26457 = this;
  if(cljs.core.truth_(this__26457.editable_QMARK_)) {
    var idx__26458 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__26458 === -1) {
      if(this__26457.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__26457.len = this__26457.len + 2;
        this__26457.arr.push(key);
        this__26457.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__26457.len, this__26457.arr), key, val)
      }
    }else {
      if(val === this__26457.arr[idx__26458 + 1]) {
        return tcoll
      }else {
        this__26457.arr[idx__26458 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__26459 = this;
  if(cljs.core.truth_(this__26459.editable_QMARK_)) {
    if(function() {
      var G__26460__26461 = o;
      if(G__26460__26461) {
        if(function() {
          var or__3824__auto____26462 = G__26460__26461.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____26462) {
            return or__3824__auto____26462
          }else {
            return G__26460__26461.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__26460__26461.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__26460__26461)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__26460__26461)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__26463 = cljs.core.seq.call(null, o);
      var tcoll__26464 = tcoll;
      while(true) {
        var temp__3971__auto____26465 = cljs.core.first.call(null, es__26463);
        if(cljs.core.truth_(temp__3971__auto____26465)) {
          var e__26466 = temp__3971__auto____26465;
          var G__26472 = cljs.core.next.call(null, es__26463);
          var G__26473 = tcoll__26464.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__26464, cljs.core.key.call(null, e__26466), cljs.core.val.call(null, e__26466));
          es__26463 = G__26472;
          tcoll__26464 = G__26473;
          continue
        }else {
          return tcoll__26464
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__26467 = this;
  if(cljs.core.truth_(this__26467.editable_QMARK_)) {
    this__26467.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__26467.len, 2), this__26467.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__26468 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__26469 = this;
  if(cljs.core.truth_(this__26469.editable_QMARK_)) {
    var idx__26470 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__26470 === -1) {
      return not_found
    }else {
      return this__26469.arr[idx__26470 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__26471 = this;
  if(cljs.core.truth_(this__26471.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__26471.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__26476 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__26477 = 0;
  while(true) {
    if(i__26477 < len) {
      var G__26478 = cljs.core.assoc_BANG_.call(null, out__26476, arr[i__26477], arr[i__26477 + 1]);
      var G__26479 = i__26477 + 2;
      out__26476 = G__26478;
      i__26477 = G__26479;
      continue
    }else {
      return out__26476
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2341__auto__) {
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
    var G__26484__26485 = arr.slice();
    G__26484__26485[i] = a;
    return G__26484__26485
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__26486__26487 = arr.slice();
    G__26486__26487[i] = a;
    G__26486__26487[j] = b;
    return G__26486__26487
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
  var new_arr__26489 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__26489, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__26489, 2 * i, new_arr__26489.length - 2 * i);
  return new_arr__26489
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
    var editable__26492 = inode.ensure_editable(edit);
    editable__26492.arr[i] = a;
    return editable__26492
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__26493 = inode.ensure_editable(edit);
    editable__26493.arr[i] = a;
    editable__26493.arr[j] = b;
    return editable__26493
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
  var len__26500 = arr.length;
  var i__26501 = 0;
  var init__26502 = init;
  while(true) {
    if(i__26501 < len__26500) {
      var init__26505 = function() {
        var k__26503 = arr[i__26501];
        if(!(k__26503 == null)) {
          return f.call(null, init__26502, k__26503, arr[i__26501 + 1])
        }else {
          var node__26504 = arr[i__26501 + 1];
          if(!(node__26504 == null)) {
            return node__26504.kv_reduce(f, init__26502)
          }else {
            return init__26502
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__26505)) {
        return cljs.core.deref.call(null, init__26505)
      }else {
        var G__26506 = i__26501 + 2;
        var G__26507 = init__26505;
        i__26501 = G__26506;
        init__26502 = G__26507;
        continue
      }
    }else {
      return init__26502
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
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__26508 = this;
  var inode__26509 = this;
  if(this__26508.bitmap === bit) {
    return null
  }else {
    var editable__26510 = inode__26509.ensure_editable(e);
    var earr__26511 = editable__26510.arr;
    var len__26512 = earr__26511.length;
    editable__26510.bitmap = bit ^ editable__26510.bitmap;
    cljs.core.array_copy.call(null, earr__26511, 2 * (i + 1), earr__26511, 2 * i, len__26512 - 2 * (i + 1));
    earr__26511[len__26512 - 2] = null;
    earr__26511[len__26512 - 1] = null;
    return editable__26510
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__26513 = this;
  var inode__26514 = this;
  var bit__26515 = 1 << (hash >>> shift & 31);
  var idx__26516 = cljs.core.bitmap_indexed_node_index.call(null, this__26513.bitmap, bit__26515);
  if((this__26513.bitmap & bit__26515) === 0) {
    var n__26517 = cljs.core.bit_count.call(null, this__26513.bitmap);
    if(2 * n__26517 < this__26513.arr.length) {
      var editable__26518 = inode__26514.ensure_editable(edit);
      var earr__26519 = editable__26518.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__26519, 2 * idx__26516, earr__26519, 2 * (idx__26516 + 1), 2 * (n__26517 - idx__26516));
      earr__26519[2 * idx__26516] = key;
      earr__26519[2 * idx__26516 + 1] = val;
      editable__26518.bitmap = editable__26518.bitmap | bit__26515;
      return editable__26518
    }else {
      if(n__26517 >= 16) {
        var nodes__26520 = cljs.core.make_array.call(null, 32);
        var jdx__26521 = hash >>> shift & 31;
        nodes__26520[jdx__26521] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__26522 = 0;
        var j__26523 = 0;
        while(true) {
          if(i__26522 < 32) {
            if((this__26513.bitmap >>> i__26522 & 1) === 0) {
              var G__26576 = i__26522 + 1;
              var G__26577 = j__26523;
              i__26522 = G__26576;
              j__26523 = G__26577;
              continue
            }else {
              nodes__26520[i__26522] = !(this__26513.arr[j__26523] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__26513.arr[j__26523]), this__26513.arr[j__26523], this__26513.arr[j__26523 + 1], added_leaf_QMARK_) : this__26513.arr[j__26523 + 1];
              var G__26578 = i__26522 + 1;
              var G__26579 = j__26523 + 2;
              i__26522 = G__26578;
              j__26523 = G__26579;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__26517 + 1, nodes__26520)
      }else {
        if("\ufdd0'else") {
          var new_arr__26524 = cljs.core.make_array.call(null, 2 * (n__26517 + 4));
          cljs.core.array_copy.call(null, this__26513.arr, 0, new_arr__26524, 0, 2 * idx__26516);
          new_arr__26524[2 * idx__26516] = key;
          new_arr__26524[2 * idx__26516 + 1] = val;
          cljs.core.array_copy.call(null, this__26513.arr, 2 * idx__26516, new_arr__26524, 2 * (idx__26516 + 1), 2 * (n__26517 - idx__26516));
          added_leaf_QMARK_.val = true;
          var editable__26525 = inode__26514.ensure_editable(edit);
          editable__26525.arr = new_arr__26524;
          editable__26525.bitmap = editable__26525.bitmap | bit__26515;
          return editable__26525
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__26526 = this__26513.arr[2 * idx__26516];
    var val_or_node__26527 = this__26513.arr[2 * idx__26516 + 1];
    if(key_or_nil__26526 == null) {
      var n__26528 = val_or_node__26527.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__26528 === val_or_node__26527) {
        return inode__26514
      }else {
        return cljs.core.edit_and_set.call(null, inode__26514, edit, 2 * idx__26516 + 1, n__26528)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26526)) {
        if(val === val_or_node__26527) {
          return inode__26514
        }else {
          return cljs.core.edit_and_set.call(null, inode__26514, edit, 2 * idx__26516 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__26514, edit, 2 * idx__26516, null, 2 * idx__26516 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__26526, val_or_node__26527, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__26529 = this;
  var inode__26530 = this;
  return cljs.core.create_inode_seq.call(null, this__26529.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__26531 = this;
  var inode__26532 = this;
  var bit__26533 = 1 << (hash >>> shift & 31);
  if((this__26531.bitmap & bit__26533) === 0) {
    return inode__26532
  }else {
    var idx__26534 = cljs.core.bitmap_indexed_node_index.call(null, this__26531.bitmap, bit__26533);
    var key_or_nil__26535 = this__26531.arr[2 * idx__26534];
    var val_or_node__26536 = this__26531.arr[2 * idx__26534 + 1];
    if(key_or_nil__26535 == null) {
      var n__26537 = val_or_node__26536.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__26537 === val_or_node__26536) {
        return inode__26532
      }else {
        if(!(n__26537 == null)) {
          return cljs.core.edit_and_set.call(null, inode__26532, edit, 2 * idx__26534 + 1, n__26537)
        }else {
          if(this__26531.bitmap === bit__26533) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__26532.edit_and_remove_pair(edit, bit__26533, idx__26534)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26535)) {
        removed_leaf_QMARK_[0] = true;
        return inode__26532.edit_and_remove_pair(edit, bit__26533, idx__26534)
      }else {
        if("\ufdd0'else") {
          return inode__26532
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__26538 = this;
  var inode__26539 = this;
  if(e === this__26538.edit) {
    return inode__26539
  }else {
    var n__26540 = cljs.core.bit_count.call(null, this__26538.bitmap);
    var new_arr__26541 = cljs.core.make_array.call(null, n__26540 < 0 ? 4 : 2 * (n__26540 + 1));
    cljs.core.array_copy.call(null, this__26538.arr, 0, new_arr__26541, 0, 2 * n__26540);
    return new cljs.core.BitmapIndexedNode(e, this__26538.bitmap, new_arr__26541)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__26542 = this;
  var inode__26543 = this;
  return cljs.core.inode_kv_reduce.call(null, this__26542.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__26544 = this;
  var inode__26545 = this;
  var bit__26546 = 1 << (hash >>> shift & 31);
  if((this__26544.bitmap & bit__26546) === 0) {
    return not_found
  }else {
    var idx__26547 = cljs.core.bitmap_indexed_node_index.call(null, this__26544.bitmap, bit__26546);
    var key_or_nil__26548 = this__26544.arr[2 * idx__26547];
    var val_or_node__26549 = this__26544.arr[2 * idx__26547 + 1];
    if(key_or_nil__26548 == null) {
      return val_or_node__26549.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26548)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__26548, val_or_node__26549], true)
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
  var this__26550 = this;
  var inode__26551 = this;
  var bit__26552 = 1 << (hash >>> shift & 31);
  if((this__26550.bitmap & bit__26552) === 0) {
    return inode__26551
  }else {
    var idx__26553 = cljs.core.bitmap_indexed_node_index.call(null, this__26550.bitmap, bit__26552);
    var key_or_nil__26554 = this__26550.arr[2 * idx__26553];
    var val_or_node__26555 = this__26550.arr[2 * idx__26553 + 1];
    if(key_or_nil__26554 == null) {
      var n__26556 = val_or_node__26555.inode_without(shift + 5, hash, key);
      if(n__26556 === val_or_node__26555) {
        return inode__26551
      }else {
        if(!(n__26556 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__26550.bitmap, cljs.core.clone_and_set.call(null, this__26550.arr, 2 * idx__26553 + 1, n__26556))
        }else {
          if(this__26550.bitmap === bit__26552) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__26550.bitmap ^ bit__26552, cljs.core.remove_pair.call(null, this__26550.arr, idx__26553))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26554)) {
        return new cljs.core.BitmapIndexedNode(null, this__26550.bitmap ^ bit__26552, cljs.core.remove_pair.call(null, this__26550.arr, idx__26553))
      }else {
        if("\ufdd0'else") {
          return inode__26551
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__26557 = this;
  var inode__26558 = this;
  var bit__26559 = 1 << (hash >>> shift & 31);
  var idx__26560 = cljs.core.bitmap_indexed_node_index.call(null, this__26557.bitmap, bit__26559);
  if((this__26557.bitmap & bit__26559) === 0) {
    var n__26561 = cljs.core.bit_count.call(null, this__26557.bitmap);
    if(n__26561 >= 16) {
      var nodes__26562 = cljs.core.make_array.call(null, 32);
      var jdx__26563 = hash >>> shift & 31;
      nodes__26562[jdx__26563] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__26564 = 0;
      var j__26565 = 0;
      while(true) {
        if(i__26564 < 32) {
          if((this__26557.bitmap >>> i__26564 & 1) === 0) {
            var G__26580 = i__26564 + 1;
            var G__26581 = j__26565;
            i__26564 = G__26580;
            j__26565 = G__26581;
            continue
          }else {
            nodes__26562[i__26564] = !(this__26557.arr[j__26565] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__26557.arr[j__26565]), this__26557.arr[j__26565], this__26557.arr[j__26565 + 1], added_leaf_QMARK_) : this__26557.arr[j__26565 + 1];
            var G__26582 = i__26564 + 1;
            var G__26583 = j__26565 + 2;
            i__26564 = G__26582;
            j__26565 = G__26583;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__26561 + 1, nodes__26562)
    }else {
      var new_arr__26566 = cljs.core.make_array.call(null, 2 * (n__26561 + 1));
      cljs.core.array_copy.call(null, this__26557.arr, 0, new_arr__26566, 0, 2 * idx__26560);
      new_arr__26566[2 * idx__26560] = key;
      new_arr__26566[2 * idx__26560 + 1] = val;
      cljs.core.array_copy.call(null, this__26557.arr, 2 * idx__26560, new_arr__26566, 2 * (idx__26560 + 1), 2 * (n__26561 - idx__26560));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__26557.bitmap | bit__26559, new_arr__26566)
    }
  }else {
    var key_or_nil__26567 = this__26557.arr[2 * idx__26560];
    var val_or_node__26568 = this__26557.arr[2 * idx__26560 + 1];
    if(key_or_nil__26567 == null) {
      var n__26569 = val_or_node__26568.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__26569 === val_or_node__26568) {
        return inode__26558
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__26557.bitmap, cljs.core.clone_and_set.call(null, this__26557.arr, 2 * idx__26560 + 1, n__26569))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26567)) {
        if(val === val_or_node__26568) {
          return inode__26558
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__26557.bitmap, cljs.core.clone_and_set.call(null, this__26557.arr, 2 * idx__26560 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__26557.bitmap, cljs.core.clone_and_set.call(null, this__26557.arr, 2 * idx__26560, null, 2 * idx__26560 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__26567, val_or_node__26568, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__26570 = this;
  var inode__26571 = this;
  var bit__26572 = 1 << (hash >>> shift & 31);
  if((this__26570.bitmap & bit__26572) === 0) {
    return not_found
  }else {
    var idx__26573 = cljs.core.bitmap_indexed_node_index.call(null, this__26570.bitmap, bit__26572);
    var key_or_nil__26574 = this__26570.arr[2 * idx__26573];
    var val_or_node__26575 = this__26570.arr[2 * idx__26573 + 1];
    if(key_or_nil__26574 == null) {
      return val_or_node__26575.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__26574)) {
        return val_or_node__26575
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
  var arr__26591 = array_node.arr;
  var len__26592 = 2 * (array_node.cnt - 1);
  var new_arr__26593 = cljs.core.make_array.call(null, len__26592);
  var i__26594 = 0;
  var j__26595 = 1;
  var bitmap__26596 = 0;
  while(true) {
    if(i__26594 < len__26592) {
      if(function() {
        var and__3822__auto____26597 = !(i__26594 === idx);
        if(and__3822__auto____26597) {
          return!(arr__26591[i__26594] == null)
        }else {
          return and__3822__auto____26597
        }
      }()) {
        new_arr__26593[j__26595] = arr__26591[i__26594];
        var G__26598 = i__26594 + 1;
        var G__26599 = j__26595 + 2;
        var G__26600 = bitmap__26596 | 1 << i__26594;
        i__26594 = G__26598;
        j__26595 = G__26599;
        bitmap__26596 = G__26600;
        continue
      }else {
        var G__26601 = i__26594 + 1;
        var G__26602 = j__26595;
        var G__26603 = bitmap__26596;
        i__26594 = G__26601;
        j__26595 = G__26602;
        bitmap__26596 = G__26603;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__26596, new_arr__26593)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__26604 = this;
  var inode__26605 = this;
  var idx__26606 = hash >>> shift & 31;
  var node__26607 = this__26604.arr[idx__26606];
  if(node__26607 == null) {
    var editable__26608 = cljs.core.edit_and_set.call(null, inode__26605, edit, idx__26606, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__26608.cnt = editable__26608.cnt + 1;
    return editable__26608
  }else {
    var n__26609 = node__26607.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__26609 === node__26607) {
      return inode__26605
    }else {
      return cljs.core.edit_and_set.call(null, inode__26605, edit, idx__26606, n__26609)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__26610 = this;
  var inode__26611 = this;
  return cljs.core.create_array_node_seq.call(null, this__26610.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__26612 = this;
  var inode__26613 = this;
  var idx__26614 = hash >>> shift & 31;
  var node__26615 = this__26612.arr[idx__26614];
  if(node__26615 == null) {
    return inode__26613
  }else {
    var n__26616 = node__26615.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__26616 === node__26615) {
      return inode__26613
    }else {
      if(n__26616 == null) {
        if(this__26612.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__26613, edit, idx__26614)
        }else {
          var editable__26617 = cljs.core.edit_and_set.call(null, inode__26613, edit, idx__26614, n__26616);
          editable__26617.cnt = editable__26617.cnt - 1;
          return editable__26617
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__26613, edit, idx__26614, n__26616)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__26618 = this;
  var inode__26619 = this;
  if(e === this__26618.edit) {
    return inode__26619
  }else {
    return new cljs.core.ArrayNode(e, this__26618.cnt, this__26618.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__26620 = this;
  var inode__26621 = this;
  var len__26622 = this__26620.arr.length;
  var i__26623 = 0;
  var init__26624 = init;
  while(true) {
    if(i__26623 < len__26622) {
      var node__26625 = this__26620.arr[i__26623];
      if(!(node__26625 == null)) {
        var init__26626 = node__26625.kv_reduce(f, init__26624);
        if(cljs.core.reduced_QMARK_.call(null, init__26626)) {
          return cljs.core.deref.call(null, init__26626)
        }else {
          var G__26645 = i__26623 + 1;
          var G__26646 = init__26626;
          i__26623 = G__26645;
          init__26624 = G__26646;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__26624
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__26627 = this;
  var inode__26628 = this;
  var idx__26629 = hash >>> shift & 31;
  var node__26630 = this__26627.arr[idx__26629];
  if(!(node__26630 == null)) {
    return node__26630.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__26631 = this;
  var inode__26632 = this;
  var idx__26633 = hash >>> shift & 31;
  var node__26634 = this__26631.arr[idx__26633];
  if(!(node__26634 == null)) {
    var n__26635 = node__26634.inode_without(shift + 5, hash, key);
    if(n__26635 === node__26634) {
      return inode__26632
    }else {
      if(n__26635 == null) {
        if(this__26631.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__26632, null, idx__26633)
        }else {
          return new cljs.core.ArrayNode(null, this__26631.cnt - 1, cljs.core.clone_and_set.call(null, this__26631.arr, idx__26633, n__26635))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__26631.cnt, cljs.core.clone_and_set.call(null, this__26631.arr, idx__26633, n__26635))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__26632
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__26636 = this;
  var inode__26637 = this;
  var idx__26638 = hash >>> shift & 31;
  var node__26639 = this__26636.arr[idx__26638];
  if(node__26639 == null) {
    return new cljs.core.ArrayNode(null, this__26636.cnt + 1, cljs.core.clone_and_set.call(null, this__26636.arr, idx__26638, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__26640 = node__26639.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__26640 === node__26639) {
      return inode__26637
    }else {
      return new cljs.core.ArrayNode(null, this__26636.cnt, cljs.core.clone_and_set.call(null, this__26636.arr, idx__26638, n__26640))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__26641 = this;
  var inode__26642 = this;
  var idx__26643 = hash >>> shift & 31;
  var node__26644 = this__26641.arr[idx__26643];
  if(!(node__26644 == null)) {
    return node__26644.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__26649 = 2 * cnt;
  var i__26650 = 0;
  while(true) {
    if(i__26650 < lim__26649) {
      if(cljs.core.key_test.call(null, key, arr[i__26650])) {
        return i__26650
      }else {
        var G__26651 = i__26650 + 2;
        i__26650 = G__26651;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__26652 = this;
  var inode__26653 = this;
  if(hash === this__26652.collision_hash) {
    var idx__26654 = cljs.core.hash_collision_node_find_index.call(null, this__26652.arr, this__26652.cnt, key);
    if(idx__26654 === -1) {
      if(this__26652.arr.length > 2 * this__26652.cnt) {
        var editable__26655 = cljs.core.edit_and_set.call(null, inode__26653, edit, 2 * this__26652.cnt, key, 2 * this__26652.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__26655.cnt = editable__26655.cnt + 1;
        return editable__26655
      }else {
        var len__26656 = this__26652.arr.length;
        var new_arr__26657 = cljs.core.make_array.call(null, len__26656 + 2);
        cljs.core.array_copy.call(null, this__26652.arr, 0, new_arr__26657, 0, len__26656);
        new_arr__26657[len__26656] = key;
        new_arr__26657[len__26656 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__26653.ensure_editable_array(edit, this__26652.cnt + 1, new_arr__26657)
      }
    }else {
      if(this__26652.arr[idx__26654 + 1] === val) {
        return inode__26653
      }else {
        return cljs.core.edit_and_set.call(null, inode__26653, edit, idx__26654 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__26652.collision_hash >>> shift & 31), [null, inode__26653, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__26658 = this;
  var inode__26659 = this;
  return cljs.core.create_inode_seq.call(null, this__26658.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__26660 = this;
  var inode__26661 = this;
  var idx__26662 = cljs.core.hash_collision_node_find_index.call(null, this__26660.arr, this__26660.cnt, key);
  if(idx__26662 === -1) {
    return inode__26661
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__26660.cnt === 1) {
      return null
    }else {
      var editable__26663 = inode__26661.ensure_editable(edit);
      var earr__26664 = editable__26663.arr;
      earr__26664[idx__26662] = earr__26664[2 * this__26660.cnt - 2];
      earr__26664[idx__26662 + 1] = earr__26664[2 * this__26660.cnt - 1];
      earr__26664[2 * this__26660.cnt - 1] = null;
      earr__26664[2 * this__26660.cnt - 2] = null;
      editable__26663.cnt = editable__26663.cnt - 1;
      return editable__26663
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__26665 = this;
  var inode__26666 = this;
  if(e === this__26665.edit) {
    return inode__26666
  }else {
    var new_arr__26667 = cljs.core.make_array.call(null, 2 * (this__26665.cnt + 1));
    cljs.core.array_copy.call(null, this__26665.arr, 0, new_arr__26667, 0, 2 * this__26665.cnt);
    return new cljs.core.HashCollisionNode(e, this__26665.collision_hash, this__26665.cnt, new_arr__26667)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__26668 = this;
  var inode__26669 = this;
  return cljs.core.inode_kv_reduce.call(null, this__26668.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__26670 = this;
  var inode__26671 = this;
  var idx__26672 = cljs.core.hash_collision_node_find_index.call(null, this__26670.arr, this__26670.cnt, key);
  if(idx__26672 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__26670.arr[idx__26672])) {
      return cljs.core.PersistentVector.fromArray([this__26670.arr[idx__26672], this__26670.arr[idx__26672 + 1]], true)
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
  var this__26673 = this;
  var inode__26674 = this;
  var idx__26675 = cljs.core.hash_collision_node_find_index.call(null, this__26673.arr, this__26673.cnt, key);
  if(idx__26675 === -1) {
    return inode__26674
  }else {
    if(this__26673.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__26673.collision_hash, this__26673.cnt - 1, cljs.core.remove_pair.call(null, this__26673.arr, cljs.core.quot.call(null, idx__26675, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__26676 = this;
  var inode__26677 = this;
  if(hash === this__26676.collision_hash) {
    var idx__26678 = cljs.core.hash_collision_node_find_index.call(null, this__26676.arr, this__26676.cnt, key);
    if(idx__26678 === -1) {
      var len__26679 = this__26676.arr.length;
      var new_arr__26680 = cljs.core.make_array.call(null, len__26679 + 2);
      cljs.core.array_copy.call(null, this__26676.arr, 0, new_arr__26680, 0, len__26679);
      new_arr__26680[len__26679] = key;
      new_arr__26680[len__26679 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__26676.collision_hash, this__26676.cnt + 1, new_arr__26680)
    }else {
      if(cljs.core._EQ_.call(null, this__26676.arr[idx__26678], val)) {
        return inode__26677
      }else {
        return new cljs.core.HashCollisionNode(null, this__26676.collision_hash, this__26676.cnt, cljs.core.clone_and_set.call(null, this__26676.arr, idx__26678 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__26676.collision_hash >>> shift & 31), [null, inode__26677])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__26681 = this;
  var inode__26682 = this;
  var idx__26683 = cljs.core.hash_collision_node_find_index.call(null, this__26681.arr, this__26681.cnt, key);
  if(idx__26683 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__26681.arr[idx__26683])) {
      return this__26681.arr[idx__26683 + 1]
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
  var this__26684 = this;
  var inode__26685 = this;
  if(e === this__26684.edit) {
    this__26684.arr = array;
    this__26684.cnt = count;
    return inode__26685
  }else {
    return new cljs.core.HashCollisionNode(this__26684.edit, this__26684.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__26690 = cljs.core.hash.call(null, key1);
    if(key1hash__26690 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__26690, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___26691 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__26690, key1, val1, added_leaf_QMARK___26691).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___26691)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__26692 = cljs.core.hash.call(null, key1);
    if(key1hash__26692 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__26692, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___26693 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__26692, key1, val1, added_leaf_QMARK___26693).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___26693)
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
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26694 = this;
  var h__2223__auto____26695 = this__26694.__hash;
  if(!(h__2223__auto____26695 == null)) {
    return h__2223__auto____26695
  }else {
    var h__2223__auto____26696 = cljs.core.hash_coll.call(null, coll);
    this__26694.__hash = h__2223__auto____26696;
    return h__2223__auto____26696
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26697 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__26698 = this;
  var this__26699 = this;
  return cljs.core.pr_str.call(null, this__26699)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__26700 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__26701 = this;
  if(this__26701.s == null) {
    return cljs.core.PersistentVector.fromArray([this__26701.nodes[this__26701.i], this__26701.nodes[this__26701.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__26701.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__26702 = this;
  if(this__26702.s == null) {
    return cljs.core.create_inode_seq.call(null, this__26702.nodes, this__26702.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__26702.nodes, this__26702.i, cljs.core.next.call(null, this__26702.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26703 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26704 = this;
  return new cljs.core.NodeSeq(meta, this__26704.nodes, this__26704.i, this__26704.s, this__26704.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26705 = this;
  return this__26705.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26706 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__26706.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__26713 = nodes.length;
      var j__26714 = i;
      while(true) {
        if(j__26714 < len__26713) {
          if(!(nodes[j__26714] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__26714, null, null)
          }else {
            var temp__3971__auto____26715 = nodes[j__26714 + 1];
            if(cljs.core.truth_(temp__3971__auto____26715)) {
              var node__26716 = temp__3971__auto____26715;
              var temp__3971__auto____26717 = node__26716.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____26717)) {
                var node_seq__26718 = temp__3971__auto____26717;
                return new cljs.core.NodeSeq(null, nodes, j__26714 + 2, node_seq__26718, null)
              }else {
                var G__26719 = j__26714 + 2;
                j__26714 = G__26719;
                continue
              }
            }else {
              var G__26720 = j__26714 + 2;
              j__26714 = G__26720;
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
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26721 = this;
  var h__2223__auto____26722 = this__26721.__hash;
  if(!(h__2223__auto____26722 == null)) {
    return h__2223__auto____26722
  }else {
    var h__2223__auto____26723 = cljs.core.hash_coll.call(null, coll);
    this__26721.__hash = h__2223__auto____26723;
    return h__2223__auto____26723
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26724 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__26725 = this;
  var this__26726 = this;
  return cljs.core.pr_str.call(null, this__26726)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__26727 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__26728 = this;
  return cljs.core.first.call(null, this__26728.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__26729 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__26729.nodes, this__26729.i, cljs.core.next.call(null, this__26729.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26730 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26731 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__26731.nodes, this__26731.i, this__26731.s, this__26731.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26732 = this;
  return this__26732.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26733 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__26733.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__26740 = nodes.length;
      var j__26741 = i;
      while(true) {
        if(j__26741 < len__26740) {
          var temp__3971__auto____26742 = nodes[j__26741];
          if(cljs.core.truth_(temp__3971__auto____26742)) {
            var nj__26743 = temp__3971__auto____26742;
            var temp__3971__auto____26744 = nj__26743.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____26744)) {
              var ns__26745 = temp__3971__auto____26744;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__26741 + 1, ns__26745, null)
            }else {
              var G__26746 = j__26741 + 1;
              j__26741 = G__26746;
              continue
            }
          }else {
            var G__26747 = j__26741 + 1;
            j__26741 = G__26747;
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
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__26750 = this;
  return new cljs.core.TransientHashMap({}, this__26750.root, this__26750.cnt, this__26750.has_nil_QMARK_, this__26750.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26751 = this;
  var h__2223__auto____26752 = this__26751.__hash;
  if(!(h__2223__auto____26752 == null)) {
    return h__2223__auto____26752
  }else {
    var h__2223__auto____26753 = cljs.core.hash_imap.call(null, coll);
    this__26751.__hash = h__2223__auto____26753;
    return h__2223__auto____26753
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26754 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26755 = this;
  if(k == null) {
    if(this__26755.has_nil_QMARK_) {
      return this__26755.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__26755.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__26755.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26756 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____26757 = this__26756.has_nil_QMARK_;
      if(and__3822__auto____26757) {
        return v === this__26756.nil_val
      }else {
        return and__3822__auto____26757
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__26756.meta, this__26756.has_nil_QMARK_ ? this__26756.cnt : this__26756.cnt + 1, this__26756.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___26758 = new cljs.core.Box(false);
    var new_root__26759 = (this__26756.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__26756.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___26758);
    if(new_root__26759 === this__26756.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__26756.meta, added_leaf_QMARK___26758.val ? this__26756.cnt + 1 : this__26756.cnt, new_root__26759, this__26756.has_nil_QMARK_, this__26756.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__26760 = this;
  if(k == null) {
    return this__26760.has_nil_QMARK_
  }else {
    if(this__26760.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__26760.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__26783 = null;
  var G__26783__2 = function(this_sym26761, k) {
    var this__26763 = this;
    var this_sym26761__26764 = this;
    var coll__26765 = this_sym26761__26764;
    return coll__26765.cljs$core$ILookup$_lookup$arity$2(coll__26765, k)
  };
  var G__26783__3 = function(this_sym26762, k, not_found) {
    var this__26763 = this;
    var this_sym26762__26766 = this;
    var coll__26767 = this_sym26762__26766;
    return coll__26767.cljs$core$ILookup$_lookup$arity$3(coll__26767, k, not_found)
  };
  G__26783 = function(this_sym26762, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26783__2.call(this, this_sym26762, k);
      case 3:
        return G__26783__3.call(this, this_sym26762, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26783
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym26748, args26749) {
  var this__26768 = this;
  return this_sym26748.call.apply(this_sym26748, [this_sym26748].concat(args26749.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__26769 = this;
  var init__26770 = this__26769.has_nil_QMARK_ ? f.call(null, init, null, this__26769.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__26770)) {
    return cljs.core.deref.call(null, init__26770)
  }else {
    if(!(this__26769.root == null)) {
      return this__26769.root.kv_reduce(f, init__26770)
    }else {
      if("\ufdd0'else") {
        return init__26770
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__26771 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__26772 = this;
  var this__26773 = this;
  return cljs.core.pr_str.call(null, this__26773)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__26774 = this;
  if(this__26774.cnt > 0) {
    var s__26775 = !(this__26774.root == null) ? this__26774.root.inode_seq() : null;
    if(this__26774.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__26774.nil_val], true), s__26775)
    }else {
      return s__26775
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26776 = this;
  return this__26776.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26777 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26778 = this;
  return new cljs.core.PersistentHashMap(meta, this__26778.cnt, this__26778.root, this__26778.has_nil_QMARK_, this__26778.nil_val, this__26778.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26779 = this;
  return this__26779.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__26780 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__26780.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__26781 = this;
  if(k == null) {
    if(this__26781.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__26781.meta, this__26781.cnt - 1, this__26781.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__26781.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__26782 = this__26781.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__26782 === this__26781.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__26781.meta, this__26781.cnt - 1, new_root__26782, this__26781.has_nil_QMARK_, this__26781.nil_val, null)
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
  var len__26784 = ks.length;
  var i__26785 = 0;
  var out__26786 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__26785 < len__26784) {
      var G__26787 = i__26785 + 1;
      var G__26788 = cljs.core.assoc_BANG_.call(null, out__26786, ks[i__26785], vs[i__26785]);
      i__26785 = G__26787;
      out__26786 = G__26788;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__26786)
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
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__26789 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__26790 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__26791 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__26792 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__26793 = this;
  if(k == null) {
    if(this__26793.has_nil_QMARK_) {
      return this__26793.nil_val
    }else {
      return null
    }
  }else {
    if(this__26793.root == null) {
      return null
    }else {
      return this__26793.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__26794 = this;
  if(k == null) {
    if(this__26794.has_nil_QMARK_) {
      return this__26794.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__26794.root == null) {
      return not_found
    }else {
      return this__26794.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26795 = this;
  if(this__26795.edit) {
    return this__26795.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__26796 = this;
  var tcoll__26797 = this;
  if(this__26796.edit) {
    if(function() {
      var G__26798__26799 = o;
      if(G__26798__26799) {
        if(function() {
          var or__3824__auto____26800 = G__26798__26799.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____26800) {
            return or__3824__auto____26800
          }else {
            return G__26798__26799.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__26798__26799.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__26798__26799)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__26798__26799)
      }
    }()) {
      return tcoll__26797.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__26801 = cljs.core.seq.call(null, o);
      var tcoll__26802 = tcoll__26797;
      while(true) {
        var temp__3971__auto____26803 = cljs.core.first.call(null, es__26801);
        if(cljs.core.truth_(temp__3971__auto____26803)) {
          var e__26804 = temp__3971__auto____26803;
          var G__26815 = cljs.core.next.call(null, es__26801);
          var G__26816 = tcoll__26802.assoc_BANG_(cljs.core.key.call(null, e__26804), cljs.core.val.call(null, e__26804));
          es__26801 = G__26815;
          tcoll__26802 = G__26816;
          continue
        }else {
          return tcoll__26802
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__26805 = this;
  var tcoll__26806 = this;
  if(this__26805.edit) {
    if(k == null) {
      if(this__26805.nil_val === v) {
      }else {
        this__26805.nil_val = v
      }
      if(this__26805.has_nil_QMARK_) {
      }else {
        this__26805.count = this__26805.count + 1;
        this__26805.has_nil_QMARK_ = true
      }
      return tcoll__26806
    }else {
      var added_leaf_QMARK___26807 = new cljs.core.Box(false);
      var node__26808 = (this__26805.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__26805.root).inode_assoc_BANG_(this__26805.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___26807);
      if(node__26808 === this__26805.root) {
      }else {
        this__26805.root = node__26808
      }
      if(added_leaf_QMARK___26807.val) {
        this__26805.count = this__26805.count + 1
      }else {
      }
      return tcoll__26806
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__26809 = this;
  var tcoll__26810 = this;
  if(this__26809.edit) {
    if(k == null) {
      if(this__26809.has_nil_QMARK_) {
        this__26809.has_nil_QMARK_ = false;
        this__26809.nil_val = null;
        this__26809.count = this__26809.count - 1;
        return tcoll__26810
      }else {
        return tcoll__26810
      }
    }else {
      if(this__26809.root == null) {
        return tcoll__26810
      }else {
        var removed_leaf_QMARK___26811 = new cljs.core.Box(false);
        var node__26812 = this__26809.root.inode_without_BANG_(this__26809.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___26811);
        if(node__26812 === this__26809.root) {
        }else {
          this__26809.root = node__26812
        }
        if(cljs.core.truth_(removed_leaf_QMARK___26811[0])) {
          this__26809.count = this__26809.count - 1
        }else {
        }
        return tcoll__26810
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__26813 = this;
  var tcoll__26814 = this;
  if(this__26813.edit) {
    this__26813.edit = null;
    return new cljs.core.PersistentHashMap(null, this__26813.count, this__26813.root, this__26813.has_nil_QMARK_, this__26813.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__26819 = node;
  var stack__26820 = stack;
  while(true) {
    if(!(t__26819 == null)) {
      var G__26821 = ascending_QMARK_ ? t__26819.left : t__26819.right;
      var G__26822 = cljs.core.conj.call(null, stack__26820, t__26819);
      t__26819 = G__26821;
      stack__26820 = G__26822;
      continue
    }else {
      return stack__26820
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
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26823 = this;
  var h__2223__auto____26824 = this__26823.__hash;
  if(!(h__2223__auto____26824 == null)) {
    return h__2223__auto____26824
  }else {
    var h__2223__auto____26825 = cljs.core.hash_coll.call(null, coll);
    this__26823.__hash = h__2223__auto____26825;
    return h__2223__auto____26825
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__26826 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__26827 = this;
  var this__26828 = this;
  return cljs.core.pr_str.call(null, this__26828)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__26829 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__26830 = this;
  if(this__26830.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__26830.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__26831 = this;
  return cljs.core.peek.call(null, this__26831.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__26832 = this;
  var t__26833 = cljs.core.first.call(null, this__26832.stack);
  var next_stack__26834 = cljs.core.tree_map_seq_push.call(null, this__26832.ascending_QMARK_ ? t__26833.right : t__26833.left, cljs.core.next.call(null, this__26832.stack), this__26832.ascending_QMARK_);
  if(!(next_stack__26834 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__26834, this__26832.ascending_QMARK_, this__26832.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26835 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__26836 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__26836.stack, this__26836.ascending_QMARK_, this__26836.cnt, this__26836.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__26837 = this;
  return this__26837.meta
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
        var and__3822__auto____26839 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____26839) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____26839
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
        var and__3822__auto____26841 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____26841) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____26841
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
  var init__26845 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__26845)) {
    return cljs.core.deref.call(null, init__26845)
  }else {
    var init__26846 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__26845) : init__26845;
    if(cljs.core.reduced_QMARK_.call(null, init__26846)) {
      return cljs.core.deref.call(null, init__26846)
    }else {
      var init__26847 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__26846) : init__26846;
      if(cljs.core.reduced_QMARK_.call(null, init__26847)) {
        return cljs.core.deref.call(null, init__26847)
      }else {
        return init__26847
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
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26850 = this;
  var h__2223__auto____26851 = this__26850.__hash;
  if(!(h__2223__auto____26851 == null)) {
    return h__2223__auto____26851
  }else {
    var h__2223__auto____26852 = cljs.core.hash_coll.call(null, coll);
    this__26850.__hash = h__2223__auto____26852;
    return h__2223__auto____26852
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__26853 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__26854 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__26855 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__26855.key, this__26855.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__26903 = null;
  var G__26903__2 = function(this_sym26856, k) {
    var this__26858 = this;
    var this_sym26856__26859 = this;
    var node__26860 = this_sym26856__26859;
    return node__26860.cljs$core$ILookup$_lookup$arity$2(node__26860, k)
  };
  var G__26903__3 = function(this_sym26857, k, not_found) {
    var this__26858 = this;
    var this_sym26857__26861 = this;
    var node__26862 = this_sym26857__26861;
    return node__26862.cljs$core$ILookup$_lookup$arity$3(node__26862, k, not_found)
  };
  G__26903 = function(this_sym26857, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26903__2.call(this, this_sym26857, k);
      case 3:
        return G__26903__3.call(this, this_sym26857, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26903
}();
cljs.core.BlackNode.prototype.apply = function(this_sym26848, args26849) {
  var this__26863 = this;
  return this_sym26848.call.apply(this_sym26848, [this_sym26848].concat(args26849.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__26864 = this;
  return cljs.core.PersistentVector.fromArray([this__26864.key, this__26864.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__26865 = this;
  return this__26865.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__26866 = this;
  return this__26866.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__26867 = this;
  var node__26868 = this;
  return ins.balance_right(node__26868)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__26869 = this;
  var node__26870 = this;
  return new cljs.core.RedNode(this__26869.key, this__26869.val, this__26869.left, this__26869.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__26871 = this;
  var node__26872 = this;
  return cljs.core.balance_right_del.call(null, this__26871.key, this__26871.val, this__26871.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__26873 = this;
  var node__26874 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__26875 = this;
  var node__26876 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__26876, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__26877 = this;
  var node__26878 = this;
  return cljs.core.balance_left_del.call(null, this__26877.key, this__26877.val, del, this__26877.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__26879 = this;
  var node__26880 = this;
  return ins.balance_left(node__26880)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__26881 = this;
  var node__26882 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__26882, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__26904 = null;
  var G__26904__0 = function() {
    var this__26883 = this;
    var this__26885 = this;
    return cljs.core.pr_str.call(null, this__26885)
  };
  G__26904 = function() {
    switch(arguments.length) {
      case 0:
        return G__26904__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26904
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__26886 = this;
  var node__26887 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__26887, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__26888 = this;
  var node__26889 = this;
  return node__26889
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__26890 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__26891 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__26892 = this;
  return cljs.core.list.call(null, this__26892.key, this__26892.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__26893 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__26894 = this;
  return this__26894.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__26895 = this;
  return cljs.core.PersistentVector.fromArray([this__26895.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__26896 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__26896.key, this__26896.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26897 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__26898 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__26898.key, this__26898.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__26899 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__26900 = this;
  if(n === 0) {
    return this__26900.key
  }else {
    if(n === 1) {
      return this__26900.val
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
  var this__26901 = this;
  if(n === 0) {
    return this__26901.key
  }else {
    if(n === 1) {
      return this__26901.val
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
  var this__26902 = this;
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
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26907 = this;
  var h__2223__auto____26908 = this__26907.__hash;
  if(!(h__2223__auto____26908 == null)) {
    return h__2223__auto____26908
  }else {
    var h__2223__auto____26909 = cljs.core.hash_coll.call(null, coll);
    this__26907.__hash = h__2223__auto____26909;
    return h__2223__auto____26909
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__26910 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__26911 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__26912 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__26912.key, this__26912.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__26960 = null;
  var G__26960__2 = function(this_sym26913, k) {
    var this__26915 = this;
    var this_sym26913__26916 = this;
    var node__26917 = this_sym26913__26916;
    return node__26917.cljs$core$ILookup$_lookup$arity$2(node__26917, k)
  };
  var G__26960__3 = function(this_sym26914, k, not_found) {
    var this__26915 = this;
    var this_sym26914__26918 = this;
    var node__26919 = this_sym26914__26918;
    return node__26919.cljs$core$ILookup$_lookup$arity$3(node__26919, k, not_found)
  };
  G__26960 = function(this_sym26914, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26960__2.call(this, this_sym26914, k);
      case 3:
        return G__26960__3.call(this, this_sym26914, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26960
}();
cljs.core.RedNode.prototype.apply = function(this_sym26905, args26906) {
  var this__26920 = this;
  return this_sym26905.call.apply(this_sym26905, [this_sym26905].concat(args26906.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__26921 = this;
  return cljs.core.PersistentVector.fromArray([this__26921.key, this__26921.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__26922 = this;
  return this__26922.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__26923 = this;
  return this__26923.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__26924 = this;
  var node__26925 = this;
  return new cljs.core.RedNode(this__26924.key, this__26924.val, this__26924.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__26926 = this;
  var node__26927 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__26928 = this;
  var node__26929 = this;
  return new cljs.core.RedNode(this__26928.key, this__26928.val, this__26928.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__26930 = this;
  var node__26931 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__26932 = this;
  var node__26933 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__26933, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__26934 = this;
  var node__26935 = this;
  return new cljs.core.RedNode(this__26934.key, this__26934.val, del, this__26934.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__26936 = this;
  var node__26937 = this;
  return new cljs.core.RedNode(this__26936.key, this__26936.val, ins, this__26936.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__26938 = this;
  var node__26939 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__26938.left)) {
    return new cljs.core.RedNode(this__26938.key, this__26938.val, this__26938.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__26938.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__26938.right)) {
      return new cljs.core.RedNode(this__26938.right.key, this__26938.right.val, new cljs.core.BlackNode(this__26938.key, this__26938.val, this__26938.left, this__26938.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__26938.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__26939, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__26961 = null;
  var G__26961__0 = function() {
    var this__26940 = this;
    var this__26942 = this;
    return cljs.core.pr_str.call(null, this__26942)
  };
  G__26961 = function() {
    switch(arguments.length) {
      case 0:
        return G__26961__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26961
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__26943 = this;
  var node__26944 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__26943.right)) {
    return new cljs.core.RedNode(this__26943.key, this__26943.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__26943.left, null), this__26943.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__26943.left)) {
      return new cljs.core.RedNode(this__26943.left.key, this__26943.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__26943.left.left, null), new cljs.core.BlackNode(this__26943.key, this__26943.val, this__26943.left.right, this__26943.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__26944, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__26945 = this;
  var node__26946 = this;
  return new cljs.core.BlackNode(this__26945.key, this__26945.val, this__26945.left, this__26945.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__26947 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__26948 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__26949 = this;
  return cljs.core.list.call(null, this__26949.key, this__26949.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__26950 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__26951 = this;
  return this__26951.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__26952 = this;
  return cljs.core.PersistentVector.fromArray([this__26952.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__26953 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__26953.key, this__26953.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__26954 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__26955 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__26955.key, this__26955.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__26956 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__26957 = this;
  if(n === 0) {
    return this__26957.key
  }else {
    if(n === 1) {
      return this__26957.val
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
  var this__26958 = this;
  if(n === 0) {
    return this__26958.key
  }else {
    if(n === 1) {
      return this__26958.val
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
  var this__26959 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__26965 = comp.call(null, k, tree.key);
    if(c__26965 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__26965 < 0) {
        var ins__26966 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__26966 == null)) {
          return tree.add_left(ins__26966)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__26967 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__26967 == null)) {
            return tree.add_right(ins__26967)
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
          var app__26970 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__26970)) {
            return new cljs.core.RedNode(app__26970.key, app__26970.val, new cljs.core.RedNode(left.key, left.val, left.left, app__26970.left, null), new cljs.core.RedNode(right.key, right.val, app__26970.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__26970, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__26971 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__26971)) {
              return new cljs.core.RedNode(app__26971.key, app__26971.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__26971.left, null), new cljs.core.BlackNode(right.key, right.val, app__26971.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__26971, right.right, null))
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
    var c__26977 = comp.call(null, k, tree.key);
    if(c__26977 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__26977 < 0) {
        var del__26978 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____26979 = !(del__26978 == null);
          if(or__3824__auto____26979) {
            return or__3824__auto____26979
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__26978, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__26978, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__26980 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____26981 = !(del__26980 == null);
            if(or__3824__auto____26981) {
              return or__3824__auto____26981
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__26980)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__26980, null)
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
  var tk__26984 = tree.key;
  var c__26985 = comp.call(null, k, tk__26984);
  if(c__26985 === 0) {
    return tree.replace(tk__26984, v, tree.left, tree.right)
  }else {
    if(c__26985 < 0) {
      return tree.replace(tk__26984, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__26984, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__26988 = this;
  var h__2223__auto____26989 = this__26988.__hash;
  if(!(h__2223__auto____26989 == null)) {
    return h__2223__auto____26989
  }else {
    var h__2223__auto____26990 = cljs.core.hash_imap.call(null, coll);
    this__26988.__hash = h__2223__auto____26990;
    return h__2223__auto____26990
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__26991 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__26992 = this;
  var n__26993 = coll.entry_at(k);
  if(!(n__26993 == null)) {
    return n__26993.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__26994 = this;
  var found__26995 = [null];
  var t__26996 = cljs.core.tree_map_add.call(null, this__26994.comp, this__26994.tree, k, v, found__26995);
  if(t__26996 == null) {
    var found_node__26997 = cljs.core.nth.call(null, found__26995, 0);
    if(cljs.core._EQ_.call(null, v, found_node__26997.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__26994.comp, cljs.core.tree_map_replace.call(null, this__26994.comp, this__26994.tree, k, v), this__26994.cnt, this__26994.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__26994.comp, t__26996.blacken(), this__26994.cnt + 1, this__26994.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__26998 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__27032 = null;
  var G__27032__2 = function(this_sym26999, k) {
    var this__27001 = this;
    var this_sym26999__27002 = this;
    var coll__27003 = this_sym26999__27002;
    return coll__27003.cljs$core$ILookup$_lookup$arity$2(coll__27003, k)
  };
  var G__27032__3 = function(this_sym27000, k, not_found) {
    var this__27001 = this;
    var this_sym27000__27004 = this;
    var coll__27005 = this_sym27000__27004;
    return coll__27005.cljs$core$ILookup$_lookup$arity$3(coll__27005, k, not_found)
  };
  G__27032 = function(this_sym27000, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27032__2.call(this, this_sym27000, k);
      case 3:
        return G__27032__3.call(this, this_sym27000, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27032
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym26986, args26987) {
  var this__27006 = this;
  return this_sym26986.call.apply(this_sym26986, [this_sym26986].concat(args26987.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__27007 = this;
  if(!(this__27007.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__27007.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__27008 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__27009 = this;
  if(this__27009.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__27009.tree, false, this__27009.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__27010 = this;
  var this__27011 = this;
  return cljs.core.pr_str.call(null, this__27011)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__27012 = this;
  var coll__27013 = this;
  var t__27014 = this__27012.tree;
  while(true) {
    if(!(t__27014 == null)) {
      var c__27015 = this__27012.comp.call(null, k, t__27014.key);
      if(c__27015 === 0) {
        return t__27014
      }else {
        if(c__27015 < 0) {
          var G__27033 = t__27014.left;
          t__27014 = G__27033;
          continue
        }else {
          if("\ufdd0'else") {
            var G__27034 = t__27014.right;
            t__27014 = G__27034;
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
  var this__27016 = this;
  if(this__27016.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__27016.tree, ascending_QMARK_, this__27016.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__27017 = this;
  if(this__27017.cnt > 0) {
    var stack__27018 = null;
    var t__27019 = this__27017.tree;
    while(true) {
      if(!(t__27019 == null)) {
        var c__27020 = this__27017.comp.call(null, k, t__27019.key);
        if(c__27020 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__27018, t__27019), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__27020 < 0) {
              var G__27035 = cljs.core.conj.call(null, stack__27018, t__27019);
              var G__27036 = t__27019.left;
              stack__27018 = G__27035;
              t__27019 = G__27036;
              continue
            }else {
              var G__27037 = stack__27018;
              var G__27038 = t__27019.right;
              stack__27018 = G__27037;
              t__27019 = G__27038;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__27020 > 0) {
                var G__27039 = cljs.core.conj.call(null, stack__27018, t__27019);
                var G__27040 = t__27019.right;
                stack__27018 = G__27039;
                t__27019 = G__27040;
                continue
              }else {
                var G__27041 = stack__27018;
                var G__27042 = t__27019.left;
                stack__27018 = G__27041;
                t__27019 = G__27042;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__27018 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__27018, ascending_QMARK_, -1, null)
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
  var this__27021 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__27022 = this;
  return this__27022.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__27023 = this;
  if(this__27023.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__27023.tree, true, this__27023.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__27024 = this;
  return this__27024.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__27025 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__27026 = this;
  return new cljs.core.PersistentTreeMap(this__27026.comp, this__27026.tree, this__27026.cnt, meta, this__27026.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__27027 = this;
  return this__27027.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__27028 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__27028.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__27029 = this;
  var found__27030 = [null];
  var t__27031 = cljs.core.tree_map_remove.call(null, this__27029.comp, this__27029.tree, k, found__27030);
  if(t__27031 == null) {
    if(cljs.core.nth.call(null, found__27030, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__27029.comp, null, 0, this__27029.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__27029.comp, t__27031.blacken(), this__27029.cnt - 1, this__27029.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__27045 = cljs.core.seq.call(null, keyvals);
    var out__27046 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__27045) {
        var G__27047 = cljs.core.nnext.call(null, in__27045);
        var G__27048 = cljs.core.assoc_BANG_.call(null, out__27046, cljs.core.first.call(null, in__27045), cljs.core.second.call(null, in__27045));
        in__27045 = G__27047;
        out__27046 = G__27048;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__27046)
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
  hash_map.cljs$lang$applyTo = function(arglist__27049) {
    var keyvals = cljs.core.seq(arglist__27049);
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
  array_map.cljs$lang$applyTo = function(arglist__27050) {
    var keyvals = cljs.core.seq(arglist__27050);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__27054 = [];
    var obj__27055 = {};
    var kvs__27056 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__27056) {
        ks__27054.push(cljs.core.first.call(null, kvs__27056));
        obj__27055[cljs.core.first.call(null, kvs__27056)] = cljs.core.second.call(null, kvs__27056);
        var G__27057 = cljs.core.nnext.call(null, kvs__27056);
        kvs__27056 = G__27057;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__27054, obj__27055)
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
  obj_map.cljs$lang$applyTo = function(arglist__27058) {
    var keyvals = cljs.core.seq(arglist__27058);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__27061 = cljs.core.seq.call(null, keyvals);
    var out__27062 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__27061) {
        var G__27063 = cljs.core.nnext.call(null, in__27061);
        var G__27064 = cljs.core.assoc.call(null, out__27062, cljs.core.first.call(null, in__27061), cljs.core.second.call(null, in__27061));
        in__27061 = G__27063;
        out__27062 = G__27064;
        continue
      }else {
        return out__27062
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
  sorted_map.cljs$lang$applyTo = function(arglist__27065) {
    var keyvals = cljs.core.seq(arglist__27065);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__27068 = cljs.core.seq.call(null, keyvals);
    var out__27069 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__27068) {
        var G__27070 = cljs.core.nnext.call(null, in__27068);
        var G__27071 = cljs.core.assoc.call(null, out__27069, cljs.core.first.call(null, in__27068), cljs.core.second.call(null, in__27068));
        in__27068 = G__27070;
        out__27069 = G__27071;
        continue
      }else {
        return out__27069
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__27072) {
    var comparator = cljs.core.first(arglist__27072);
    var keyvals = cljs.core.rest(arglist__27072);
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
      return cljs.core.reduce.call(null, function(p1__27073_SHARP_, p2__27074_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____27076 = p1__27073_SHARP_;
          if(cljs.core.truth_(or__3824__auto____27076)) {
            return or__3824__auto____27076
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__27074_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__27077) {
    var maps = cljs.core.seq(arglist__27077);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__27085 = function(m, e) {
        var k__27083 = cljs.core.first.call(null, e);
        var v__27084 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__27083)) {
          return cljs.core.assoc.call(null, m, k__27083, f.call(null, cljs.core._lookup.call(null, m, k__27083, null), v__27084))
        }else {
          return cljs.core.assoc.call(null, m, k__27083, v__27084)
        }
      };
      var merge2__27087 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__27085, function() {
          var or__3824__auto____27086 = m1;
          if(cljs.core.truth_(or__3824__auto____27086)) {
            return or__3824__auto____27086
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__27087, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__27088) {
    var f = cljs.core.first(arglist__27088);
    var maps = cljs.core.rest(arglist__27088);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__27093 = cljs.core.ObjMap.EMPTY;
  var keys__27094 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__27094) {
      var key__27095 = cljs.core.first.call(null, keys__27094);
      var entry__27096 = cljs.core._lookup.call(null, map, key__27095, "\ufdd0'user/not-found");
      var G__27097 = cljs.core.not_EQ_.call(null, entry__27096, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__27093, key__27095, entry__27096) : ret__27093;
      var G__27098 = cljs.core.next.call(null, keys__27094);
      ret__27093 = G__27097;
      keys__27094 = G__27098;
      continue
    }else {
      return ret__27093
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
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__27102 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__27102.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__27103 = this;
  var h__2223__auto____27104 = this__27103.__hash;
  if(!(h__2223__auto____27104 == null)) {
    return h__2223__auto____27104
  }else {
    var h__2223__auto____27105 = cljs.core.hash_iset.call(null, coll);
    this__27103.__hash = h__2223__auto____27105;
    return h__2223__auto____27105
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__27106 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__27107 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__27107.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__27128 = null;
  var G__27128__2 = function(this_sym27108, k) {
    var this__27110 = this;
    var this_sym27108__27111 = this;
    var coll__27112 = this_sym27108__27111;
    return coll__27112.cljs$core$ILookup$_lookup$arity$2(coll__27112, k)
  };
  var G__27128__3 = function(this_sym27109, k, not_found) {
    var this__27110 = this;
    var this_sym27109__27113 = this;
    var coll__27114 = this_sym27109__27113;
    return coll__27114.cljs$core$ILookup$_lookup$arity$3(coll__27114, k, not_found)
  };
  G__27128 = function(this_sym27109, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27128__2.call(this, this_sym27109, k);
      case 3:
        return G__27128__3.call(this, this_sym27109, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27128
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym27100, args27101) {
  var this__27115 = this;
  return this_sym27100.call.apply(this_sym27100, [this_sym27100].concat(args27101.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__27116 = this;
  return new cljs.core.PersistentHashSet(this__27116.meta, cljs.core.assoc.call(null, this__27116.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__27117 = this;
  var this__27118 = this;
  return cljs.core.pr_str.call(null, this__27118)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__27119 = this;
  return cljs.core.keys.call(null, this__27119.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__27120 = this;
  return new cljs.core.PersistentHashSet(this__27120.meta, cljs.core.dissoc.call(null, this__27120.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__27121 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__27122 = this;
  var and__3822__auto____27123 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____27123) {
    var and__3822__auto____27124 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____27124) {
      return cljs.core.every_QMARK_.call(null, function(p1__27099_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__27099_SHARP_)
      }, other)
    }else {
      return and__3822__auto____27124
    }
  }else {
    return and__3822__auto____27123
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__27125 = this;
  return new cljs.core.PersistentHashSet(meta, this__27125.hash_map, this__27125.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__27126 = this;
  return this__27126.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__27127 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__27127.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__27129 = cljs.core.count.call(null, items);
  var i__27130 = 0;
  var out__27131 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__27130 < len__27129) {
      var G__27132 = i__27130 + 1;
      var G__27133 = cljs.core.conj_BANG_.call(null, out__27131, items[i__27130]);
      i__27130 = G__27132;
      out__27131 = G__27133;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__27131)
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
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__27151 = null;
  var G__27151__2 = function(this_sym27137, k) {
    var this__27139 = this;
    var this_sym27137__27140 = this;
    var tcoll__27141 = this_sym27137__27140;
    if(cljs.core._lookup.call(null, this__27139.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__27151__3 = function(this_sym27138, k, not_found) {
    var this__27139 = this;
    var this_sym27138__27142 = this;
    var tcoll__27143 = this_sym27138__27142;
    if(cljs.core._lookup.call(null, this__27139.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__27151 = function(this_sym27138, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27151__2.call(this, this_sym27138, k);
      case 3:
        return G__27151__3.call(this, this_sym27138, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27151
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym27135, args27136) {
  var this__27144 = this;
  return this_sym27135.call.apply(this_sym27135, [this_sym27135].concat(args27136.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__27145 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__27146 = this;
  if(cljs.core._lookup.call(null, this__27146.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__27147 = this;
  return cljs.core.count.call(null, this__27147.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__27148 = this;
  this__27148.transient_map = cljs.core.dissoc_BANG_.call(null, this__27148.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__27149 = this;
  this__27149.transient_map = cljs.core.assoc_BANG_.call(null, this__27149.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__27150 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__27150.transient_map), null)
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
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__27154 = this;
  var h__2223__auto____27155 = this__27154.__hash;
  if(!(h__2223__auto____27155 == null)) {
    return h__2223__auto____27155
  }else {
    var h__2223__auto____27156 = cljs.core.hash_iset.call(null, coll);
    this__27154.__hash = h__2223__auto____27156;
    return h__2223__auto____27156
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__27157 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__27158 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__27158.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__27184 = null;
  var G__27184__2 = function(this_sym27159, k) {
    var this__27161 = this;
    var this_sym27159__27162 = this;
    var coll__27163 = this_sym27159__27162;
    return coll__27163.cljs$core$ILookup$_lookup$arity$2(coll__27163, k)
  };
  var G__27184__3 = function(this_sym27160, k, not_found) {
    var this__27161 = this;
    var this_sym27160__27164 = this;
    var coll__27165 = this_sym27160__27164;
    return coll__27165.cljs$core$ILookup$_lookup$arity$3(coll__27165, k, not_found)
  };
  G__27184 = function(this_sym27160, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27184__2.call(this, this_sym27160, k);
      case 3:
        return G__27184__3.call(this, this_sym27160, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27184
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym27152, args27153) {
  var this__27166 = this;
  return this_sym27152.call.apply(this_sym27152, [this_sym27152].concat(args27153.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__27167 = this;
  return new cljs.core.PersistentTreeSet(this__27167.meta, cljs.core.assoc.call(null, this__27167.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__27168 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__27168.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__27169 = this;
  var this__27170 = this;
  return cljs.core.pr_str.call(null, this__27170)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__27171 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__27171.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__27172 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__27172.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__27173 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__27174 = this;
  return cljs.core._comparator.call(null, this__27174.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__27175 = this;
  return cljs.core.keys.call(null, this__27175.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__27176 = this;
  return new cljs.core.PersistentTreeSet(this__27176.meta, cljs.core.dissoc.call(null, this__27176.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__27177 = this;
  return cljs.core.count.call(null, this__27177.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__27178 = this;
  var and__3822__auto____27179 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____27179) {
    var and__3822__auto____27180 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____27180) {
      return cljs.core.every_QMARK_.call(null, function(p1__27134_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__27134_SHARP_)
      }, other)
    }else {
      return and__3822__auto____27180
    }
  }else {
    return and__3822__auto____27179
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__27181 = this;
  return new cljs.core.PersistentTreeSet(meta, this__27181.tree_map, this__27181.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__27182 = this;
  return this__27182.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__27183 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__27183.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__27189__delegate = function(keys) {
      var in__27187 = cljs.core.seq.call(null, keys);
      var out__27188 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__27187)) {
          var G__27190 = cljs.core.next.call(null, in__27187);
          var G__27191 = cljs.core.conj_BANG_.call(null, out__27188, cljs.core.first.call(null, in__27187));
          in__27187 = G__27190;
          out__27188 = G__27191;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__27188)
        }
        break
      }
    };
    var G__27189 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__27189__delegate.call(this, keys)
    };
    G__27189.cljs$lang$maxFixedArity = 0;
    G__27189.cljs$lang$applyTo = function(arglist__27192) {
      var keys = cljs.core.seq(arglist__27192);
      return G__27189__delegate(keys)
    };
    G__27189.cljs$lang$arity$variadic = G__27189__delegate;
    return G__27189
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
  sorted_set.cljs$lang$applyTo = function(arglist__27193) {
    var keys = cljs.core.seq(arglist__27193);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__27195) {
    var comparator = cljs.core.first(arglist__27195);
    var keys = cljs.core.rest(arglist__27195);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__27201 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____27202 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____27202)) {
        var e__27203 = temp__3971__auto____27202;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__27203))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__27201, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__27194_SHARP_) {
      var temp__3971__auto____27204 = cljs.core.find.call(null, smap, p1__27194_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____27204)) {
        var e__27205 = temp__3971__auto____27204;
        return cljs.core.second.call(null, e__27205)
      }else {
        return p1__27194_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__27235 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__27228, seen) {
        while(true) {
          var vec__27229__27230 = p__27228;
          var f__27231 = cljs.core.nth.call(null, vec__27229__27230, 0, null);
          var xs__27232 = vec__27229__27230;
          var temp__3974__auto____27233 = cljs.core.seq.call(null, xs__27232);
          if(temp__3974__auto____27233) {
            var s__27234 = temp__3974__auto____27233;
            if(cljs.core.contains_QMARK_.call(null, seen, f__27231)) {
              var G__27236 = cljs.core.rest.call(null, s__27234);
              var G__27237 = seen;
              p__27228 = G__27236;
              seen = G__27237;
              continue
            }else {
              return cljs.core.cons.call(null, f__27231, step.call(null, cljs.core.rest.call(null, s__27234), cljs.core.conj.call(null, seen, f__27231)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__27235.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__27240 = cljs.core.PersistentVector.EMPTY;
  var s__27241 = s;
  while(true) {
    if(cljs.core.next.call(null, s__27241)) {
      var G__27242 = cljs.core.conj.call(null, ret__27240, cljs.core.first.call(null, s__27241));
      var G__27243 = cljs.core.next.call(null, s__27241);
      ret__27240 = G__27242;
      s__27241 = G__27243;
      continue
    }else {
      return cljs.core.seq.call(null, ret__27240)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____27246 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____27246) {
        return or__3824__auto____27246
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__27247 = x.lastIndexOf("/");
      if(i__27247 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__27247 + 1)
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
    var or__3824__auto____27250 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____27250) {
      return or__3824__auto____27250
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__27251 = x.lastIndexOf("/");
    if(i__27251 > -1) {
      return cljs.core.subs.call(null, x, 2, i__27251)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__27258 = cljs.core.ObjMap.EMPTY;
  var ks__27259 = cljs.core.seq.call(null, keys);
  var vs__27260 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____27261 = ks__27259;
      if(and__3822__auto____27261) {
        return vs__27260
      }else {
        return and__3822__auto____27261
      }
    }()) {
      var G__27262 = cljs.core.assoc.call(null, map__27258, cljs.core.first.call(null, ks__27259), cljs.core.first.call(null, vs__27260));
      var G__27263 = cljs.core.next.call(null, ks__27259);
      var G__27264 = cljs.core.next.call(null, vs__27260);
      map__27258 = G__27262;
      ks__27259 = G__27263;
      vs__27260 = G__27264;
      continue
    }else {
      return map__27258
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
    var G__27267__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__27252_SHARP_, p2__27253_SHARP_) {
        return max_key.call(null, k, p1__27252_SHARP_, p2__27253_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__27267 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__27267__delegate.call(this, k, x, y, more)
    };
    G__27267.cljs$lang$maxFixedArity = 3;
    G__27267.cljs$lang$applyTo = function(arglist__27268) {
      var k = cljs.core.first(arglist__27268);
      var x = cljs.core.first(cljs.core.next(arglist__27268));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27268)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27268)));
      return G__27267__delegate(k, x, y, more)
    };
    G__27267.cljs$lang$arity$variadic = G__27267__delegate;
    return G__27267
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
    var G__27269__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__27265_SHARP_, p2__27266_SHARP_) {
        return min_key.call(null, k, p1__27265_SHARP_, p2__27266_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__27269 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__27269__delegate.call(this, k, x, y, more)
    };
    G__27269.cljs$lang$maxFixedArity = 3;
    G__27269.cljs$lang$applyTo = function(arglist__27270) {
      var k = cljs.core.first(arglist__27270);
      var x = cljs.core.first(cljs.core.next(arglist__27270));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27270)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27270)));
      return G__27269__delegate(k, x, y, more)
    };
    G__27269.cljs$lang$arity$variadic = G__27269__delegate;
    return G__27269
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
      var temp__3974__auto____27273 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____27273) {
        var s__27274 = temp__3974__auto____27273;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__27274), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__27274)))
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
    var temp__3974__auto____27277 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____27277) {
      var s__27278 = temp__3974__auto____27277;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__27278)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__27278), take_while.call(null, pred, cljs.core.rest.call(null, s__27278)))
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
    var comp__27280 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__27280.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__27292 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____27293 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____27293)) {
        var vec__27294__27295 = temp__3974__auto____27293;
        var e__27296 = cljs.core.nth.call(null, vec__27294__27295, 0, null);
        var s__27297 = vec__27294__27295;
        if(cljs.core.truth_(include__27292.call(null, e__27296))) {
          return s__27297
        }else {
          return cljs.core.next.call(null, s__27297)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__27292, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____27298 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____27298)) {
      var vec__27299__27300 = temp__3974__auto____27298;
      var e__27301 = cljs.core.nth.call(null, vec__27299__27300, 0, null);
      var s__27302 = vec__27299__27300;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__27301)) ? s__27302 : cljs.core.next.call(null, s__27302))
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
    var include__27314 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____27315 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____27315)) {
        var vec__27316__27317 = temp__3974__auto____27315;
        var e__27318 = cljs.core.nth.call(null, vec__27316__27317, 0, null);
        var s__27319 = vec__27316__27317;
        if(cljs.core.truth_(include__27314.call(null, e__27318))) {
          return s__27319
        }else {
          return cljs.core.next.call(null, s__27319)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__27314, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____27320 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____27320)) {
      var vec__27321__27322 = temp__3974__auto____27320;
      var e__27323 = cljs.core.nth.call(null, vec__27321__27322, 0, null);
      var s__27324 = vec__27321__27322;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__27323)) ? s__27324 : cljs.core.next.call(null, s__27324))
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
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__27325 = this;
  var h__2223__auto____27326 = this__27325.__hash;
  if(!(h__2223__auto____27326 == null)) {
    return h__2223__auto____27326
  }else {
    var h__2223__auto____27327 = cljs.core.hash_coll.call(null, rng);
    this__27325.__hash = h__2223__auto____27327;
    return h__2223__auto____27327
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__27328 = this;
  if(this__27328.step > 0) {
    if(this__27328.start + this__27328.step < this__27328.end) {
      return new cljs.core.Range(this__27328.meta, this__27328.start + this__27328.step, this__27328.end, this__27328.step, null)
    }else {
      return null
    }
  }else {
    if(this__27328.start + this__27328.step > this__27328.end) {
      return new cljs.core.Range(this__27328.meta, this__27328.start + this__27328.step, this__27328.end, this__27328.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__27329 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__27330 = this;
  var this__27331 = this;
  return cljs.core.pr_str.call(null, this__27331)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__27332 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__27333 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__27334 = this;
  if(this__27334.step > 0) {
    if(this__27334.start < this__27334.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__27334.start > this__27334.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__27335 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__27335.end - this__27335.start) / this__27335.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__27336 = this;
  return this__27336.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__27337 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__27337.meta, this__27337.start + this__27337.step, this__27337.end, this__27337.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__27338 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__27339 = this;
  return new cljs.core.Range(meta, this__27339.start, this__27339.end, this__27339.step, this__27339.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__27340 = this;
  return this__27340.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__27341 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__27341.start + n * this__27341.step
  }else {
    if(function() {
      var and__3822__auto____27342 = this__27341.start > this__27341.end;
      if(and__3822__auto____27342) {
        return this__27341.step === 0
      }else {
        return and__3822__auto____27342
      }
    }()) {
      return this__27341.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__27343 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__27343.start + n * this__27343.step
  }else {
    if(function() {
      var and__3822__auto____27344 = this__27343.start > this__27343.end;
      if(and__3822__auto____27344) {
        return this__27343.step === 0
      }else {
        return and__3822__auto____27344
      }
    }()) {
      return this__27343.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__27345 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__27345.meta)
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
    var temp__3974__auto____27348 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____27348) {
      var s__27349 = temp__3974__auto____27348;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__27349), take_nth.call(null, n, cljs.core.drop.call(null, n, s__27349)))
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
    var temp__3974__auto____27356 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____27356) {
      var s__27357 = temp__3974__auto____27356;
      var fst__27358 = cljs.core.first.call(null, s__27357);
      var fv__27359 = f.call(null, fst__27358);
      var run__27360 = cljs.core.cons.call(null, fst__27358, cljs.core.take_while.call(null, function(p1__27350_SHARP_) {
        return cljs.core._EQ_.call(null, fv__27359, f.call(null, p1__27350_SHARP_))
      }, cljs.core.next.call(null, s__27357)));
      return cljs.core.cons.call(null, run__27360, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__27360), s__27357))))
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
      var temp__3971__auto____27375 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____27375) {
        var s__27376 = temp__3971__auto____27375;
        return reductions.call(null, f, cljs.core.first.call(null, s__27376), cljs.core.rest.call(null, s__27376))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____27377 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____27377) {
        var s__27378 = temp__3974__auto____27377;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__27378)), cljs.core.rest.call(null, s__27378))
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
      var G__27381 = null;
      var G__27381__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__27381__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__27381__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__27381__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__27381__4 = function() {
        var G__27382__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__27382 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__27382__delegate.call(this, x, y, z, args)
        };
        G__27382.cljs$lang$maxFixedArity = 3;
        G__27382.cljs$lang$applyTo = function(arglist__27383) {
          var x = cljs.core.first(arglist__27383);
          var y = cljs.core.first(cljs.core.next(arglist__27383));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27383)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27383)));
          return G__27382__delegate(x, y, z, args)
        };
        G__27382.cljs$lang$arity$variadic = G__27382__delegate;
        return G__27382
      }();
      G__27381 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__27381__0.call(this);
          case 1:
            return G__27381__1.call(this, x);
          case 2:
            return G__27381__2.call(this, x, y);
          case 3:
            return G__27381__3.call(this, x, y, z);
          default:
            return G__27381__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__27381.cljs$lang$maxFixedArity = 3;
      G__27381.cljs$lang$applyTo = G__27381__4.cljs$lang$applyTo;
      return G__27381
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__27384 = null;
      var G__27384__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__27384__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__27384__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__27384__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__27384__4 = function() {
        var G__27385__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__27385 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__27385__delegate.call(this, x, y, z, args)
        };
        G__27385.cljs$lang$maxFixedArity = 3;
        G__27385.cljs$lang$applyTo = function(arglist__27386) {
          var x = cljs.core.first(arglist__27386);
          var y = cljs.core.first(cljs.core.next(arglist__27386));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27386)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27386)));
          return G__27385__delegate(x, y, z, args)
        };
        G__27385.cljs$lang$arity$variadic = G__27385__delegate;
        return G__27385
      }();
      G__27384 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__27384__0.call(this);
          case 1:
            return G__27384__1.call(this, x);
          case 2:
            return G__27384__2.call(this, x, y);
          case 3:
            return G__27384__3.call(this, x, y, z);
          default:
            return G__27384__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__27384.cljs$lang$maxFixedArity = 3;
      G__27384.cljs$lang$applyTo = G__27384__4.cljs$lang$applyTo;
      return G__27384
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__27387 = null;
      var G__27387__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__27387__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__27387__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__27387__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__27387__4 = function() {
        var G__27388__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__27388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__27388__delegate.call(this, x, y, z, args)
        };
        G__27388.cljs$lang$maxFixedArity = 3;
        G__27388.cljs$lang$applyTo = function(arglist__27389) {
          var x = cljs.core.first(arglist__27389);
          var y = cljs.core.first(cljs.core.next(arglist__27389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27389)));
          return G__27388__delegate(x, y, z, args)
        };
        G__27388.cljs$lang$arity$variadic = G__27388__delegate;
        return G__27388
      }();
      G__27387 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__27387__0.call(this);
          case 1:
            return G__27387__1.call(this, x);
          case 2:
            return G__27387__2.call(this, x, y);
          case 3:
            return G__27387__3.call(this, x, y, z);
          default:
            return G__27387__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__27387.cljs$lang$maxFixedArity = 3;
      G__27387.cljs$lang$applyTo = G__27387__4.cljs$lang$applyTo;
      return G__27387
    }()
  };
  var juxt__4 = function() {
    var G__27390__delegate = function(f, g, h, fs) {
      var fs__27380 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__27391 = null;
        var G__27391__0 = function() {
          return cljs.core.reduce.call(null, function(p1__27361_SHARP_, p2__27362_SHARP_) {
            return cljs.core.conj.call(null, p1__27361_SHARP_, p2__27362_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__27380)
        };
        var G__27391__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__27363_SHARP_, p2__27364_SHARP_) {
            return cljs.core.conj.call(null, p1__27363_SHARP_, p2__27364_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__27380)
        };
        var G__27391__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__27365_SHARP_, p2__27366_SHARP_) {
            return cljs.core.conj.call(null, p1__27365_SHARP_, p2__27366_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__27380)
        };
        var G__27391__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__27367_SHARP_, p2__27368_SHARP_) {
            return cljs.core.conj.call(null, p1__27367_SHARP_, p2__27368_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__27380)
        };
        var G__27391__4 = function() {
          var G__27392__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__27369_SHARP_, p2__27370_SHARP_) {
              return cljs.core.conj.call(null, p1__27369_SHARP_, cljs.core.apply.call(null, p2__27370_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__27380)
          };
          var G__27392 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__27392__delegate.call(this, x, y, z, args)
          };
          G__27392.cljs$lang$maxFixedArity = 3;
          G__27392.cljs$lang$applyTo = function(arglist__27393) {
            var x = cljs.core.first(arglist__27393);
            var y = cljs.core.first(cljs.core.next(arglist__27393));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27393)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27393)));
            return G__27392__delegate(x, y, z, args)
          };
          G__27392.cljs$lang$arity$variadic = G__27392__delegate;
          return G__27392
        }();
        G__27391 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__27391__0.call(this);
            case 1:
              return G__27391__1.call(this, x);
            case 2:
              return G__27391__2.call(this, x, y);
            case 3:
              return G__27391__3.call(this, x, y, z);
            default:
              return G__27391__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__27391.cljs$lang$maxFixedArity = 3;
        G__27391.cljs$lang$applyTo = G__27391__4.cljs$lang$applyTo;
        return G__27391
      }()
    };
    var G__27390 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__27390__delegate.call(this, f, g, h, fs)
    };
    G__27390.cljs$lang$maxFixedArity = 3;
    G__27390.cljs$lang$applyTo = function(arglist__27394) {
      var f = cljs.core.first(arglist__27394);
      var g = cljs.core.first(cljs.core.next(arglist__27394));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27394)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27394)));
      return G__27390__delegate(f, g, h, fs)
    };
    G__27390.cljs$lang$arity$variadic = G__27390__delegate;
    return G__27390
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
        var G__27397 = cljs.core.next.call(null, coll);
        coll = G__27397;
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
        var and__3822__auto____27396 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____27396) {
          return n > 0
        }else {
          return and__3822__auto____27396
        }
      }())) {
        var G__27398 = n - 1;
        var G__27399 = cljs.core.next.call(null, coll);
        n = G__27398;
        coll = G__27399;
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
  var matches__27401 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__27401), s)) {
    if(cljs.core.count.call(null, matches__27401) === 1) {
      return cljs.core.first.call(null, matches__27401)
    }else {
      return cljs.core.vec.call(null, matches__27401)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__27403 = re.exec(s);
  if(matches__27403 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__27403) === 1) {
      return cljs.core.first.call(null, matches__27403)
    }else {
      return cljs.core.vec.call(null, matches__27403)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__27408 = cljs.core.re_find.call(null, re, s);
  var match_idx__27409 = s.search(re);
  var match_str__27410 = cljs.core.coll_QMARK_.call(null, match_data__27408) ? cljs.core.first.call(null, match_data__27408) : match_data__27408;
  var post_match__27411 = cljs.core.subs.call(null, s, match_idx__27409 + cljs.core.count.call(null, match_str__27410));
  if(cljs.core.truth_(match_data__27408)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__27408, re_seq.call(null, re, post_match__27411))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__27418__27419 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___27420 = cljs.core.nth.call(null, vec__27418__27419, 0, null);
  var flags__27421 = cljs.core.nth.call(null, vec__27418__27419, 1, null);
  var pattern__27422 = cljs.core.nth.call(null, vec__27418__27419, 2, null);
  return new RegExp(pattern__27422, flags__27421)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__27412_SHARP_) {
    return print_one.call(null, p1__27412_SHARP_, opts)
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
          var and__3822__auto____27432 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____27432)) {
            var and__3822__auto____27436 = function() {
              var G__27433__27434 = obj;
              if(G__27433__27434) {
                if(function() {
                  var or__3824__auto____27435 = G__27433__27434.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____27435) {
                    return or__3824__auto____27435
                  }else {
                    return G__27433__27434.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__27433__27434.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__27433__27434)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__27433__27434)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____27436)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____27436
            }
          }else {
            return and__3822__auto____27432
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____27437 = !(obj == null);
          if(and__3822__auto____27437) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____27437
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__27438__27439 = obj;
          if(G__27438__27439) {
            if(function() {
              var or__3824__auto____27440 = G__27438__27439.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____27440) {
                return or__3824__auto____27440
              }else {
                return G__27438__27439.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__27438__27439.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__27438__27439)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__27438__27439)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__27460 = new goog.string.StringBuffer;
  var G__27461__27462 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__27461__27462) {
    var string__27463 = cljs.core.first.call(null, G__27461__27462);
    var G__27461__27464 = G__27461__27462;
    while(true) {
      sb__27460.append(string__27463);
      var temp__3974__auto____27465 = cljs.core.next.call(null, G__27461__27464);
      if(temp__3974__auto____27465) {
        var G__27461__27466 = temp__3974__auto____27465;
        var G__27479 = cljs.core.first.call(null, G__27461__27466);
        var G__27480 = G__27461__27466;
        string__27463 = G__27479;
        G__27461__27464 = G__27480;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__27467__27468 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__27467__27468) {
    var obj__27469 = cljs.core.first.call(null, G__27467__27468);
    var G__27467__27470 = G__27467__27468;
    while(true) {
      sb__27460.append(" ");
      var G__27471__27472 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__27469, opts));
      if(G__27471__27472) {
        var string__27473 = cljs.core.first.call(null, G__27471__27472);
        var G__27471__27474 = G__27471__27472;
        while(true) {
          sb__27460.append(string__27473);
          var temp__3974__auto____27475 = cljs.core.next.call(null, G__27471__27474);
          if(temp__3974__auto____27475) {
            var G__27471__27476 = temp__3974__auto____27475;
            var G__27481 = cljs.core.first.call(null, G__27471__27476);
            var G__27482 = G__27471__27476;
            string__27473 = G__27481;
            G__27471__27474 = G__27482;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____27477 = cljs.core.next.call(null, G__27467__27470);
      if(temp__3974__auto____27477) {
        var G__27467__27478 = temp__3974__auto____27477;
        var G__27483 = cljs.core.first.call(null, G__27467__27478);
        var G__27484 = G__27467__27478;
        obj__27469 = G__27483;
        G__27467__27470 = G__27484;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__27460
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__27486 = cljs.core.pr_sb.call(null, objs, opts);
  sb__27486.append("\n");
  return[cljs.core.str(sb__27486)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__27505__27506 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__27505__27506) {
    var string__27507 = cljs.core.first.call(null, G__27505__27506);
    var G__27505__27508 = G__27505__27506;
    while(true) {
      cljs.core.string_print.call(null, string__27507);
      var temp__3974__auto____27509 = cljs.core.next.call(null, G__27505__27508);
      if(temp__3974__auto____27509) {
        var G__27505__27510 = temp__3974__auto____27509;
        var G__27523 = cljs.core.first.call(null, G__27505__27510);
        var G__27524 = G__27505__27510;
        string__27507 = G__27523;
        G__27505__27508 = G__27524;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__27511__27512 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__27511__27512) {
    var obj__27513 = cljs.core.first.call(null, G__27511__27512);
    var G__27511__27514 = G__27511__27512;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__27515__27516 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__27513, opts));
      if(G__27515__27516) {
        var string__27517 = cljs.core.first.call(null, G__27515__27516);
        var G__27515__27518 = G__27515__27516;
        while(true) {
          cljs.core.string_print.call(null, string__27517);
          var temp__3974__auto____27519 = cljs.core.next.call(null, G__27515__27518);
          if(temp__3974__auto____27519) {
            var G__27515__27520 = temp__3974__auto____27519;
            var G__27525 = cljs.core.first.call(null, G__27515__27520);
            var G__27526 = G__27515__27520;
            string__27517 = G__27525;
            G__27515__27518 = G__27526;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____27521 = cljs.core.next.call(null, G__27511__27514);
      if(temp__3974__auto____27521) {
        var G__27511__27522 = temp__3974__auto____27521;
        var G__27527 = cljs.core.first.call(null, G__27511__27522);
        var G__27528 = G__27511__27522;
        obj__27513 = G__27527;
        G__27511__27514 = G__27528;
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
  pr_str.cljs$lang$applyTo = function(arglist__27529) {
    var objs = cljs.core.seq(arglist__27529);
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
  prn_str.cljs$lang$applyTo = function(arglist__27530) {
    var objs = cljs.core.seq(arglist__27530);
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
  pr.cljs$lang$applyTo = function(arglist__27531) {
    var objs = cljs.core.seq(arglist__27531);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__27532) {
    var objs = cljs.core.seq(arglist__27532);
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
  print_str.cljs$lang$applyTo = function(arglist__27533) {
    var objs = cljs.core.seq(arglist__27533);
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
  println.cljs$lang$applyTo = function(arglist__27534) {
    var objs = cljs.core.seq(arglist__27534);
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
  println_str.cljs$lang$applyTo = function(arglist__27535) {
    var objs = cljs.core.seq(arglist__27535);
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
  prn.cljs$lang$applyTo = function(arglist__27536) {
    var objs = cljs.core.seq(arglist__27536);
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
  printf.cljs$lang$applyTo = function(arglist__27537) {
    var fmt = cljs.core.first(arglist__27537);
    var args = cljs.core.rest(arglist__27537);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__27538 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__27538, "{", ", ", "}", opts, coll)
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
  var pr_pair__27539 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__27539, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__27540 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__27540, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____27541 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____27541)) {
        var nspc__27542 = temp__3974__auto____27541;
        return[cljs.core.str(nspc__27542), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____27543 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____27543)) {
          var nspc__27544 = temp__3974__auto____27543;
          return[cljs.core.str(nspc__27544), cljs.core.str("/")].join("")
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
  var pr_pair__27545 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__27545, "{", ", ", "}", opts, coll)
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
  var normalize__27547 = function(n, len) {
    var ns__27546 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__27546) < len) {
        var G__27549 = [cljs.core.str("0"), cljs.core.str(ns__27546)].join("");
        ns__27546 = G__27549;
        continue
      }else {
        return ns__27546
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__27547.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__27547.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__27547.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__27547.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__27547.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__27547.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__27548 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__27548, "{", ", ", "}", opts, coll)
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
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__27550 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__27551 = this;
  var G__27552__27553 = cljs.core.seq.call(null, this__27551.watches);
  if(G__27552__27553) {
    var G__27555__27557 = cljs.core.first.call(null, G__27552__27553);
    var vec__27556__27558 = G__27555__27557;
    var key__27559 = cljs.core.nth.call(null, vec__27556__27558, 0, null);
    var f__27560 = cljs.core.nth.call(null, vec__27556__27558, 1, null);
    var G__27552__27561 = G__27552__27553;
    var G__27555__27562 = G__27555__27557;
    var G__27552__27563 = G__27552__27561;
    while(true) {
      var vec__27564__27565 = G__27555__27562;
      var key__27566 = cljs.core.nth.call(null, vec__27564__27565, 0, null);
      var f__27567 = cljs.core.nth.call(null, vec__27564__27565, 1, null);
      var G__27552__27568 = G__27552__27563;
      f__27567.call(null, key__27566, this$, oldval, newval);
      var temp__3974__auto____27569 = cljs.core.next.call(null, G__27552__27568);
      if(temp__3974__auto____27569) {
        var G__27552__27570 = temp__3974__auto____27569;
        var G__27577 = cljs.core.first.call(null, G__27552__27570);
        var G__27578 = G__27552__27570;
        G__27555__27562 = G__27577;
        G__27552__27563 = G__27578;
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
  var this__27571 = this;
  return this$.watches = cljs.core.assoc.call(null, this__27571.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__27572 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__27572.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__27573 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__27573.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__27574 = this;
  return this__27574.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__27575 = this;
  return this__27575.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__27576 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__27590__delegate = function(x, p__27579) {
      var map__27585__27586 = p__27579;
      var map__27585__27587 = cljs.core.seq_QMARK_.call(null, map__27585__27586) ? cljs.core.apply.call(null, cljs.core.hash_map, map__27585__27586) : map__27585__27586;
      var validator__27588 = cljs.core._lookup.call(null, map__27585__27587, "\ufdd0'validator", null);
      var meta__27589 = cljs.core._lookup.call(null, map__27585__27587, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__27589, validator__27588, null)
    };
    var G__27590 = function(x, var_args) {
      var p__27579 = null;
      if(goog.isDef(var_args)) {
        p__27579 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__27590__delegate.call(this, x, p__27579)
    };
    G__27590.cljs$lang$maxFixedArity = 1;
    G__27590.cljs$lang$applyTo = function(arglist__27591) {
      var x = cljs.core.first(arglist__27591);
      var p__27579 = cljs.core.rest(arglist__27591);
      return G__27590__delegate(x, p__27579)
    };
    G__27590.cljs$lang$arity$variadic = G__27590__delegate;
    return G__27590
  }();
  atom = function(x, var_args) {
    var p__27579 = var_args;
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
  var temp__3974__auto____27595 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____27595)) {
    var validate__27596 = temp__3974__auto____27595;
    if(cljs.core.truth_(validate__27596.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__27597 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__27597, new_value);
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
    var G__27598__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__27598 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__27598__delegate.call(this, a, f, x, y, z, more)
    };
    G__27598.cljs$lang$maxFixedArity = 5;
    G__27598.cljs$lang$applyTo = function(arglist__27599) {
      var a = cljs.core.first(arglist__27599);
      var f = cljs.core.first(cljs.core.next(arglist__27599));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27599)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__27599))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__27599)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__27599)))));
      return G__27598__delegate(a, f, x, y, z, more)
    };
    G__27598.cljs$lang$arity$variadic = G__27598__delegate;
    return G__27598
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__27600) {
    var iref = cljs.core.first(arglist__27600);
    var f = cljs.core.first(cljs.core.next(arglist__27600));
    var args = cljs.core.rest(cljs.core.next(arglist__27600));
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
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__27601 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__27601.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__27602 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__27602.state, function(p__27603) {
    var map__27604__27605 = p__27603;
    var map__27604__27606 = cljs.core.seq_QMARK_.call(null, map__27604__27605) ? cljs.core.apply.call(null, cljs.core.hash_map, map__27604__27605) : map__27604__27605;
    var curr_state__27607 = map__27604__27606;
    var done__27608 = cljs.core._lookup.call(null, map__27604__27606, "\ufdd0'done", null);
    if(cljs.core.truth_(done__27608)) {
      return curr_state__27607
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__27602.f.call(null)})
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
    var map__27629__27630 = options;
    var map__27629__27631 = cljs.core.seq_QMARK_.call(null, map__27629__27630) ? cljs.core.apply.call(null, cljs.core.hash_map, map__27629__27630) : map__27629__27630;
    var keywordize_keys__27632 = cljs.core._lookup.call(null, map__27629__27631, "\ufdd0'keywordize-keys", null);
    var keyfn__27633 = cljs.core.truth_(keywordize_keys__27632) ? cljs.core.keyword : cljs.core.str;
    var f__27648 = function thisfn(x) {
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
                var iter__2493__auto____27647 = function iter__27641(s__27642) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__27642__27645 = s__27642;
                    while(true) {
                      if(cljs.core.seq.call(null, s__27642__27645)) {
                        var k__27646 = cljs.core.first.call(null, s__27642__27645);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__27633.call(null, k__27646), thisfn.call(null, x[k__27646])], true), iter__27641.call(null, cljs.core.rest.call(null, s__27642__27645)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2493__auto____27647.call(null, cljs.core.js_keys.call(null, x))
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
    return f__27648.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__27649) {
    var x = cljs.core.first(arglist__27649);
    var options = cljs.core.rest(arglist__27649);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__27654 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__27658__delegate = function(args) {
      var temp__3971__auto____27655 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__27654), args, null);
      if(cljs.core.truth_(temp__3971__auto____27655)) {
        var v__27656 = temp__3971__auto____27655;
        return v__27656
      }else {
        var ret__27657 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__27654, cljs.core.assoc, args, ret__27657);
        return ret__27657
      }
    };
    var G__27658 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__27658__delegate.call(this, args)
    };
    G__27658.cljs$lang$maxFixedArity = 0;
    G__27658.cljs$lang$applyTo = function(arglist__27659) {
      var args = cljs.core.seq(arglist__27659);
      return G__27658__delegate(args)
    };
    G__27658.cljs$lang$arity$variadic = G__27658__delegate;
    return G__27658
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__27661 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__27661)) {
        var G__27662 = ret__27661;
        f = G__27662;
        continue
      }else {
        return ret__27661
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__27663__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__27663 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__27663__delegate.call(this, f, args)
    };
    G__27663.cljs$lang$maxFixedArity = 1;
    G__27663.cljs$lang$applyTo = function(arglist__27664) {
      var f = cljs.core.first(arglist__27664);
      var args = cljs.core.rest(arglist__27664);
      return G__27663__delegate(f, args)
    };
    G__27663.cljs$lang$arity$variadic = G__27663__delegate;
    return G__27663
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
    var k__27666 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__27666, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__27666, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____27675 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____27675) {
      return or__3824__auto____27675
    }else {
      var or__3824__auto____27676 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____27676) {
        return or__3824__auto____27676
      }else {
        var and__3822__auto____27677 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____27677) {
          var and__3822__auto____27678 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____27678) {
            var and__3822__auto____27679 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____27679) {
              var ret__27680 = true;
              var i__27681 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____27682 = cljs.core.not.call(null, ret__27680);
                  if(or__3824__auto____27682) {
                    return or__3824__auto____27682
                  }else {
                    return i__27681 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__27680
                }else {
                  var G__27683 = isa_QMARK_.call(null, h, child.call(null, i__27681), parent.call(null, i__27681));
                  var G__27684 = i__27681 + 1;
                  ret__27680 = G__27683;
                  i__27681 = G__27684;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____27679
            }
          }else {
            return and__3822__auto____27678
          }
        }else {
          return and__3822__auto____27677
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
    var tp__27693 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__27694 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__27695 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__27696 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____27697 = cljs.core.contains_QMARK_.call(null, tp__27693.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__27695.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__27695.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__27693, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__27696.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__27694, parent, ta__27695), "\ufdd0'descendants":tf__27696.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__27695, tag, td__27694)})
    }();
    if(cljs.core.truth_(or__3824__auto____27697)) {
      return or__3824__auto____27697
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
    var parentMap__27702 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__27703 = cljs.core.truth_(parentMap__27702.call(null, tag)) ? cljs.core.disj.call(null, parentMap__27702.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__27704 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__27703)) ? cljs.core.assoc.call(null, parentMap__27702, tag, childsParents__27703) : cljs.core.dissoc.call(null, parentMap__27702, tag);
    var deriv_seq__27705 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__27685_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__27685_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__27685_SHARP_), cljs.core.second.call(null, p1__27685_SHARP_)))
    }, cljs.core.seq.call(null, newParents__27704)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__27702.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__27686_SHARP_, p2__27687_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__27686_SHARP_, p2__27687_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__27705))
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
  var xprefs__27713 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____27715 = cljs.core.truth_(function() {
    var and__3822__auto____27714 = xprefs__27713;
    if(cljs.core.truth_(and__3822__auto____27714)) {
      return xprefs__27713.call(null, y)
    }else {
      return and__3822__auto____27714
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____27715)) {
    return or__3824__auto____27715
  }else {
    var or__3824__auto____27717 = function() {
      var ps__27716 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__27716) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__27716), prefer_table))) {
          }else {
          }
          var G__27720 = cljs.core.rest.call(null, ps__27716);
          ps__27716 = G__27720;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____27717)) {
      return or__3824__auto____27717
    }else {
      var or__3824__auto____27719 = function() {
        var ps__27718 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__27718) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__27718), y, prefer_table))) {
            }else {
            }
            var G__27721 = cljs.core.rest.call(null, ps__27718);
            ps__27718 = G__27721;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____27719)) {
        return or__3824__auto____27719
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____27723 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____27723)) {
    return or__3824__auto____27723
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__27741 = cljs.core.reduce.call(null, function(be, p__27733) {
    var vec__27734__27735 = p__27733;
    var k__27736 = cljs.core.nth.call(null, vec__27734__27735, 0, null);
    var ___27737 = cljs.core.nth.call(null, vec__27734__27735, 1, null);
    var e__27738 = vec__27734__27735;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__27736)) {
      var be2__27740 = cljs.core.truth_(function() {
        var or__3824__auto____27739 = be == null;
        if(or__3824__auto____27739) {
          return or__3824__auto____27739
        }else {
          return cljs.core.dominates.call(null, k__27736, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__27738 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__27740), k__27736, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__27736), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__27740)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__27740
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__27741)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__27741));
      return cljs.core.second.call(null, best_entry__27741)
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
    var and__3822__auto____27746 = mf;
    if(and__3822__auto____27746) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____27746
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2394__auto____27747 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27748 = cljs.core._reset[goog.typeOf(x__2394__auto____27747)];
      if(or__3824__auto____27748) {
        return or__3824__auto____27748
      }else {
        var or__3824__auto____27749 = cljs.core._reset["_"];
        if(or__3824__auto____27749) {
          return or__3824__auto____27749
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____27754 = mf;
    if(and__3822__auto____27754) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____27754
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2394__auto____27755 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27756 = cljs.core._add_method[goog.typeOf(x__2394__auto____27755)];
      if(or__3824__auto____27756) {
        return or__3824__auto____27756
      }else {
        var or__3824__auto____27757 = cljs.core._add_method["_"];
        if(or__3824__auto____27757) {
          return or__3824__auto____27757
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____27762 = mf;
    if(and__3822__auto____27762) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____27762
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2394__auto____27763 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27764 = cljs.core._remove_method[goog.typeOf(x__2394__auto____27763)];
      if(or__3824__auto____27764) {
        return or__3824__auto____27764
      }else {
        var or__3824__auto____27765 = cljs.core._remove_method["_"];
        if(or__3824__auto____27765) {
          return or__3824__auto____27765
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____27770 = mf;
    if(and__3822__auto____27770) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____27770
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2394__auto____27771 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27772 = cljs.core._prefer_method[goog.typeOf(x__2394__auto____27771)];
      if(or__3824__auto____27772) {
        return or__3824__auto____27772
      }else {
        var or__3824__auto____27773 = cljs.core._prefer_method["_"];
        if(or__3824__auto____27773) {
          return or__3824__auto____27773
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____27778 = mf;
    if(and__3822__auto____27778) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____27778
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2394__auto____27779 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27780 = cljs.core._get_method[goog.typeOf(x__2394__auto____27779)];
      if(or__3824__auto____27780) {
        return or__3824__auto____27780
      }else {
        var or__3824__auto____27781 = cljs.core._get_method["_"];
        if(or__3824__auto____27781) {
          return or__3824__auto____27781
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____27786 = mf;
    if(and__3822__auto____27786) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____27786
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2394__auto____27787 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27788 = cljs.core._methods[goog.typeOf(x__2394__auto____27787)];
      if(or__3824__auto____27788) {
        return or__3824__auto____27788
      }else {
        var or__3824__auto____27789 = cljs.core._methods["_"];
        if(or__3824__auto____27789) {
          return or__3824__auto____27789
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____27794 = mf;
    if(and__3822__auto____27794) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____27794
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2394__auto____27795 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27796 = cljs.core._prefers[goog.typeOf(x__2394__auto____27795)];
      if(or__3824__auto____27796) {
        return or__3824__auto____27796
      }else {
        var or__3824__auto____27797 = cljs.core._prefers["_"];
        if(or__3824__auto____27797) {
          return or__3824__auto____27797
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____27802 = mf;
    if(and__3822__auto____27802) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____27802
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2394__auto____27803 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____27804 = cljs.core._dispatch[goog.typeOf(x__2394__auto____27803)];
      if(or__3824__auto____27804) {
        return or__3824__auto____27804
      }else {
        var or__3824__auto____27805 = cljs.core._dispatch["_"];
        if(or__3824__auto____27805) {
          return or__3824__auto____27805
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__27808 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__27809 = cljs.core._get_method.call(null, mf, dispatch_val__27808);
  if(cljs.core.truth_(target_fn__27809)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__27808)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__27809, args)
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
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__27810 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__27811 = this;
  cljs.core.swap_BANG_.call(null, this__27811.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__27811.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__27811.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__27811.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__27812 = this;
  cljs.core.swap_BANG_.call(null, this__27812.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__27812.method_cache, this__27812.method_table, this__27812.cached_hierarchy, this__27812.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__27813 = this;
  cljs.core.swap_BANG_.call(null, this__27813.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__27813.method_cache, this__27813.method_table, this__27813.cached_hierarchy, this__27813.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__27814 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__27814.cached_hierarchy), cljs.core.deref.call(null, this__27814.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__27814.method_cache, this__27814.method_table, this__27814.cached_hierarchy, this__27814.hierarchy)
  }
  var temp__3971__auto____27815 = cljs.core.deref.call(null, this__27814.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____27815)) {
    var target_fn__27816 = temp__3971__auto____27815;
    return target_fn__27816
  }else {
    var temp__3971__auto____27817 = cljs.core.find_and_cache_best_method.call(null, this__27814.name, dispatch_val, this__27814.hierarchy, this__27814.method_table, this__27814.prefer_table, this__27814.method_cache, this__27814.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____27817)) {
      var target_fn__27818 = temp__3971__auto____27817;
      return target_fn__27818
    }else {
      return cljs.core.deref.call(null, this__27814.method_table).call(null, this__27814.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__27819 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__27819.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__27819.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__27819.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__27819.method_cache, this__27819.method_table, this__27819.cached_hierarchy, this__27819.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__27820 = this;
  return cljs.core.deref.call(null, this__27820.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__27821 = this;
  return cljs.core.deref.call(null, this__27821.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__27822 = this;
  return cljs.core.do_dispatch.call(null, mf, this__27822.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__27824__delegate = function(_, args) {
    var self__27823 = this;
    return cljs.core._dispatch.call(null, self__27823, args)
  };
  var G__27824 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__27824__delegate.call(this, _, args)
  };
  G__27824.cljs$lang$maxFixedArity = 1;
  G__27824.cljs$lang$applyTo = function(arglist__27825) {
    var _ = cljs.core.first(arglist__27825);
    var args = cljs.core.rest(arglist__27825);
    return G__27824__delegate(_, args)
  };
  G__27824.cljs$lang$arity$variadic = G__27824__delegate;
  return G__27824
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__27826 = this;
  return cljs.core._dispatch.call(null, self__27826, args)
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
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2340__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__27827 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_27829, _) {
  var this__27828 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__27828.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__27830 = this;
  var and__3822__auto____27831 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____27831) {
    return this__27830.uuid === other.uuid
  }else {
    return and__3822__auto____27831
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__27832 = this;
  var this__27833 = this;
  return cljs.core.pr_str.call(null, this__27833)
};
cljs.core.UUID;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__27909 = s;
      var limit__27910 = limit;
      var parts__27911 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__27910, 1)) {
          return cljs.core.conj.call(null, parts__27911, s__27909)
        }else {
          var temp__3971__auto____27912 = cljs.core.re_find.call(null, re, s__27909);
          if(cljs.core.truth_(temp__3971__auto____27912)) {
            var m__27913 = temp__3971__auto____27912;
            var index__27914 = s__27909.indexOf(m__27913);
            var G__27915 = s__27909.substring(index__27914 + cljs.core.count.call(null, m__27913));
            var G__27916 = limit__27910 - 1;
            var G__27917 = cljs.core.conj.call(null, parts__27911, s__27909.substring(0, index__27914));
            s__27909 = G__27915;
            limit__27910 = G__27916;
            parts__27911 = G__27917;
            continue
          }else {
            return cljs.core.conj.call(null, parts__27911, s__27909)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__27921 = s.length;
  while(true) {
    if(index__27921 === 0) {
      return""
    }else {
      var ch__27922 = cljs.core._lookup.call(null, s, index__27921 - 1, null);
      if(function() {
        var or__3824__auto____27923 = cljs.core._EQ_.call(null, ch__27922, "\n");
        if(or__3824__auto____27923) {
          return or__3824__auto____27923
        }else {
          return cljs.core._EQ_.call(null, ch__27922, "\r")
        }
      }()) {
        var G__27924 = index__27921 - 1;
        index__27921 = G__27924;
        continue
      }else {
        return s.substring(0, index__27921)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__27928 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____27929 = cljs.core.not.call(null, s__27928);
    if(or__3824__auto____27929) {
      return or__3824__auto____27929
    }else {
      var or__3824__auto____27930 = cljs.core._EQ_.call(null, "", s__27928);
      if(or__3824__auto____27930) {
        return or__3824__auto____27930
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__27928)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__27937 = new goog.string.StringBuffer;
  var length__27938 = s.length;
  var index__27939 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__27938, index__27939)) {
      return buffer__27937.toString()
    }else {
      var ch__27940 = s.charAt(index__27939);
      var temp__3971__auto____27941 = cljs.core._lookup.call(null, cmap, ch__27940, null);
      if(cljs.core.truth_(temp__3971__auto____27941)) {
        var replacement__27942 = temp__3971__auto____27941;
        buffer__27937.append([cljs.core.str(replacement__27942)].join(""))
      }else {
        buffer__27937.append(ch__27940)
      }
      var G__27943 = index__27939 + 1;
      index__27939 = G__27943;
      continue
    }
    break
  }
};
goog.provide("gsim.number");
goog.require("cljs.core");
goog.require("goog.string");
gsim.number.number_length = 8;
gsim.number.decimal_QMARK_ = function decimal_QMARK_(num) {
  return goog.string.contains([cljs.core.str(num)].join(""), ".")
};
gsim.number.full_format_QMARK_ = function full_format_QMARK_(num) {
  var and__3822__auto____27880 = cljs.core.not.call(null, gsim.number.decimal_QMARK_.call(null, num));
  if(and__3822__auto____27880) {
    return cljs.core._EQ_.call(null, gsim.number.number_length, cljs.core.count.call(null, [cljs.core.str(num)].join("")))
  }else {
    return and__3822__auto____27880
  }
};
gsim.number.no_leading_QMARK_ = function no_leading_QMARK_(num) {
  var num_str__27883 = [cljs.core.str(num)].join("");
  var and__3822__auto____27884 = cljs.core.count.call(null, num_str__27883) < gsim.number.number_length;
  if(and__3822__auto____27884) {
    return cljs.core.not.call(null, cljs.core.re_find.call(null, /^0/, num_str__27883))
  }else {
    return and__3822__auto____27884
  }
};
gsim.number.no_trailing_QMARK_ = function no_trailing_QMARK_(num) {
  var num_str__27887 = [cljs.core.str(num)].join("");
  var and__3822__auto____27888 = cljs.core.count.call(null, num_str__27887) < gsim.number.number_length;
  if(and__3822__auto____27888) {
    return cljs.core.not.call(null, cljs.core.re_find.call(null, /0$/, num_str__27887))
  }else {
    return and__3822__auto____27888
  }
};
gsim.number.format_multiplier = function format_multiplier(num, system) {
  if(cljs.core.keyword_QMARK_.call(null, system)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'keyword?", "\ufdd1'system"), cljs.core.hash_map("\ufdd0'line", 34))))].join(""));
  }
  var multipliers__27891 = cljs.core.ObjMap.fromObject(["\ufdd0'metric", "\ufdd0'imperial"], {"\ufdd0'metric":cljs.core.ObjMap.fromObject(["\ufdd0'full", "\ufdd0'no-leading", "\ufdd0'no-trailing"], {"\ufdd0'full":0.0010, "\ufdd0'no-leading":0.0010, "\ufdd0'no-trailing":0.01}), "\ufdd0'imperial":cljs.core.ObjMap.fromObject(["\ufdd0'full", "\ufdd0'no-leading", "\ufdd0'no-trailing"], {"\ufdd0'full":1.0E-4, "\ufdd0'no-leading":1.0E-4, "\ufdd0'no-trailing":0.01})});
  var number_format__27892 = cljs.core.truth_(gsim.number.full_format_QMARK_.call(null, num)) ? "\ufdd0'full" : cljs.core.truth_(gsim.number.no_leading_QMARK_.call(null, num)) ? "\ufdd0'no-leading" : cljs.core.truth_(gsim.number.no_trailing_QMARK_.call(null, num)) ? "\ufdd0'no-trailing" : null;
  if(cljs.core.keyword_QMARK_.call(null, number_format__27892)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str("Both leading and trailing zeros: "), cljs.core.str(num)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'keyword?", "\ufdd1'number-format"), cljs.core.hash_map("\ufdd0'line", 40))))].join(""));
  }
  return number_format__27892.call(null, system.call(null, multipliers__27891))
};
gsim.number.parse_dimensional_number = function parse_dimensional_number(num, system) {
  if(cljs.core.truth_(function() {
    var or__3824__auto____27897 = cljs.core._EQ_.call(null, "0", num);
    if(or__3824__auto____27897) {
      return or__3824__auto____27897
    }else {
      return gsim.number.decimal_QMARK_.call(null, num)
    }
  }())) {
    return parseFloat(num)
  }else {
    var n__27898 = parseInt(num, 10);
    var multiplier__27899 = gsim.number.format_multiplier.call(null, num, system);
    if(cljs.core.truth_(function() {
      var and__3822__auto____27900 = cljs.core.not.call(null, isNaN(n__27898));
      if(and__3822__auto____27900) {
        return multiplier__27899
      }else {
        return and__3822__auto____27900
      }
    }())) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str("Not a number: "), cljs.core.str(n__27898)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'and", cljs.core.with_meta(cljs.core.list("\ufdd1'not", cljs.core.with_meta(cljs.core.list("\ufdd1'js/isNaN", "\ufdd1'n"), cljs.core.hash_map("\ufdd0'line", 55))), cljs.core.hash_map("\ufdd0'line", 55)), "\ufdd1'multiplier"), cljs.core.hash_map("\ufdd0'line", 
      55))))].join(""));
    }
    return n__27898 * multiplier__27899
  }
};
gsim.number.parse_metric = function parse_metric(num) {
  return gsim.number.parse_dimensional_number.call(null, num, "\ufdd0'metric")
};
gsim.number.parse_imperial = function parse_imperial(num) {
  return gsim.number.parse_dimensional_number.call(null, num, "\ufdd0'imperial")
};
gsim.number.parse_number = function parse_number(num) {
  var n__27902 = parseInt(num, 10);
  if(cljs.core.not.call(null, isNaN(n__27902))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str("Error parsing: "), cljs.core.str(num)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not", cljs.core.with_meta(cljs.core.list("\ufdd1'js/isNaN", "\ufdd1'n"), cljs.core.hash_map("\ufdd0'line", 73))), cljs.core.hash_map("\ufdd0'line", 73))))].join(""));
  }
  if(cljs.core.not.call(null, gsim.number.decimal_QMARK_.call(null, num))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str("This number shouldn't have a decimal:"), cljs.core.str(num)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not", cljs.core.with_meta(cljs.core.list("\ufdd1'decimal?", "\ufdd1'num"), cljs.core.hash_map("\ufdd0'line", 75))), cljs.core.hash_map("\ufdd0'line", 75))))].join(""));
  }
  return n__27902
};
goog.provide("gsim.parse");
goog.require("cljs.core");
goog.require("gsim.number");
goog.require("goog.string");
goog.require("clojure.string");
gsim.parse.is_comment_QMARK_ = function is_comment_QMARK_(word_str) {
  var and__3822__auto____27835 = goog.string.startsWith(word_str, "(");
  if(cljs.core.truth_(and__3822__auto____27835)) {
    return goog.string.endsWith(word_str, ")")
  }else {
    return and__3822__auto____27835
  }
};
gsim.parse.split_comment = function split_comment(gcode_str) {
  var line_after_split__27839 = clojure.string.split.call(null, gcode_str, /(\(.*\))/);
  var gcode__27840 = cljs.core.first.call(null, line_after_split__27839);
  var comment__27841 = 2 <= cljs.core.count.call(null, line_after_split__27839) ? cljs.core.second.call(null, line_after_split__27839) : null;
  return cljs.core.PersistentVector.fromArray([gcode__27840, comment__27841], true)
};
gsim.parse.tokenize_block = function tokenize_block(line_str) {
  var vec__27847__27848 = gsim.parse.split_comment.call(null, line_str);
  var gcode_str__27849 = cljs.core.nth.call(null, vec__27847__27848, 0, null);
  var comment__27850 = cljs.core.nth.call(null, vec__27847__27848, 1, null);
  var tokens__27851 = cljs.core.remove.call(null, clojure.string.blank_QMARK_, clojure.string.split.call(null, gcode_str__27849, /(\D[+-]*\d*\.?\d*)/));
  return cljs.core.PersistentVector.fromArray([tokens__27851, comment__27850], true)
};
gsim.parse.tokenize_word = function tokenize_word(word_str) {
  return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, clojure.string.lower_case.call(null, cljs.core.first.call(null, word_str))), goog.string.removeAt(word_str, 0, 1)], true)
};
gsim.parse.parse_word = function() {
  var method_table__2568__auto____27852 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2569__auto____27853 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2570__auto____27854 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2571__auto____27855 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2572__auto____27856 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("parse-word", function(x) {
    var allowed_decimal__27857 = cljs.core.PersistentHashSet.fromArray(["\ufdd0'r", "\ufdd0'z", "\ufdd0'y", "\ufdd0'x", "\ufdd0'a", "\ufdd0'c", "\ufdd0'b", "\ufdd0'f", "\ufdd0'e", "\ufdd0'k", "\ufdd0'j", "\ufdd0'i", "\ufdd0'w", "\ufdd0'u", "\ufdd0'q"]);
    if(cljs.core.contains_QMARK_.call(null, allowed_decimal__27857, cljs.core.keyword.call(null, clojure.string.lower_case.call(null, cljs.core.first.call(null, x))))) {
      return"\ufdd0'decimal"
    }else {
      return null
    }
  }, "\ufdd0'default", hierarchy__2572__auto____27856, method_table__2568__auto____27852, prefer_table__2569__auto____27853, method_cache__2570__auto____27854, cached_hierarchy__2571__auto____27855)
}();
cljs.core._add_method.call(null, gsim.parse.parse_word, "\ufdd0'decimal", function(w) {
  var vec__27858__27859 = gsim.parse.tokenize_word.call(null, w);
  var address__27860 = cljs.core.nth.call(null, vec__27858__27859, 0, null);
  var arg__27861 = cljs.core.nth.call(null, vec__27858__27859, 1, null);
  return cljs.core.ObjMap.fromObject(["\ufdd0'address", "\ufdd0'word", "\ufdd0'metric-arg", "\ufdd0'imperial-arg"], {"\ufdd0'address":address__27860, "\ufdd0'word":w, "\ufdd0'metric-arg":gsim.number.parse_metric.call(null, arg__27861), "\ufdd0'imperial-arg":gsim.number.parse_imperial.call(null, arg__27861)})
});
cljs.core._add_method.call(null, gsim.parse.parse_word, "\ufdd0'default", function(w) {
  var vec__27862__27863 = gsim.parse.tokenize_word.call(null, w);
  var address__27864 = cljs.core.nth.call(null, vec__27862__27863, 0, null);
  var arg__27865 = cljs.core.nth.call(null, vec__27862__27863, 1, null);
  var parsed_arg__27866 = gsim.number.parse_number.call(null, arg__27865);
  return cljs.core.ObjMap.fromObject(["\ufdd0'address", "\ufdd0'word", "\ufdd0'arg"], {"\ufdd0'address":address__27864, "\ufdd0'word":cljs.core.keyword.call(null, [cljs.core.str(cljs.core.name.call(null, address__27864)), cljs.core.str(parsed_arg__27866)].join("")), "\ufdd0'arg":parsed_arg__27866})
});
gsim.parse.parse_block = function parse_block(block_str) {
  var vec__27872__27873 = gsim.parse.tokenize_block.call(null, block_str);
  var words__27874 = cljs.core.nth.call(null, vec__27872__27873, 0, null);
  var comment__27875 = cljs.core.nth.call(null, vec__27872__27873, 1, null);
  var parsed__27876 = cljs.core.map.call(null, gsim.parse.parse_word, words__27874);
  return cljs.core.PersistentVector.fromArray([parsed__27876, comment__27875], true)
};
gsim.parse.parse = function parse(gcode_str) {
  var lines__27878 = clojure.string.split.call(null, gcode_str, /\r|\n|\r\n/);
  return cljs.core.map.call(null, gsim.parse.parse_block, lines__27878)
};
goog.provide("gsim.test.parse");
goog.require("cljs.core");
goog.require("gsim.parse");
gsim.test.parse.success = 0;
gsim.test.parse.test_is_comment_QMARK_ = function test_is_comment_QMARK_() {
  var comment__23834 = "(this is a comment)";
  var not_comments__23835 = cljs.core.PersistentVector.fromArray(["this is not a comment)", "(this is also not a comment", "definitely not a comment", "G20"], true);
  if(cljs.core.truth_(gsim.parse.is_comment_QMARK_.call(null, comment__23834))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'parse/is-comment?", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 12))))].join(""));
  }
  var G__23836__23837 = cljs.core.seq.call(null, not_comments__23835);
  if(G__23836__23837) {
    var not_comment__23838 = cljs.core.first.call(null, G__23836__23837);
    var G__23836__23839 = G__23836__23837;
    while(true) {
      if(gsim.parse.is_comment_QMARK_.call(null, not_comment__23838) === false) {
      }else {
        throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'false?", cljs.core.with_meta(cljs.core.list("\ufdd1'parse/is-comment?", "\ufdd1'not-comment"), cljs.core.hash_map("\ufdd0'line", 14))), cljs.core.hash_map("\ufdd0'line", 14))))].join(""));
      }
      var temp__3974__auto____23840 = cljs.core.next.call(null, G__23836__23839);
      if(temp__3974__auto____23840) {
        var G__23836__23841 = temp__3974__auto____23840;
        var G__23842 = cljs.core.first.call(null, G__23836__23841);
        var G__23843 = G__23836__23841;
        not_comment__23838 = G__23842;
        G__23836__23839 = G__23843;
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
  var command__23858 = "G96 M3 S300 ";
  var comment__23859 = "(set the speed, mode, and start the spindle)";
  var vec__23860__23861 = gsim.parse.split_comment.call(null, command__23858);
  var c1__23862 = cljs.core.nth.call(null, vec__23860__23861, 0, null);
  var c2__23863 = cljs.core.nth.call(null, vec__23860__23861, 1, null);
  if(cljs.core._EQ_.call(null, c1__23862, command__23858)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c1", "\ufdd1'command"), cljs.core.hash_map("\ufdd0'line", 20))))].join(""));
  }
  if(c2__23863 == null) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'nil?", "\ufdd1'c2"), cljs.core.hash_map("\ufdd0'line", 21))))].join(""));
  }
  var vec__23864__23865 = gsim.parse.split_comment.call(null, [cljs.core.str(command__23858), cljs.core.str(comment__23859)].join(""));
  var c1__23866 = cljs.core.nth.call(null, vec__23864__23865, 0, null);
  var c2__23867 = cljs.core.nth.call(null, vec__23864__23865, 1, null);
  if(cljs.core._EQ_.call(null, c1__23866, command__23858)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c1", "\ufdd1'command"), cljs.core.hash_map("\ufdd0'line", 23))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__23867, comment__23859)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c2", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 24))))].join(""));
  }
  var vec__23868__23869 = gsim.parse.split_comment.call(null, comment__23859);
  var c1__23870 = cljs.core.nth.call(null, vec__23868__23869, 0, null);
  var c2__23871 = cljs.core.nth.call(null, vec__23868__23869, 1, null);
  if(cljs.core.empty_QMARK_.call(null, c1__23870)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'empty?", "\ufdd1'c1"), cljs.core.hash_map("\ufdd0'line", 26))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__23871, comment__23859)) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "\ufdd1'c2", "\ufdd1'comment"), cljs.core.hash_map("\ufdd0'line", 27))))].join(""));
  }
};
gsim.test.parse.test_tokenize_block = function test_tokenize_block() {
  var commands__23883 = "G03X1.0 G96 s300 ";
  var comment__23884 = "(comment)";
  var vec__23885__23887 = gsim.parse.tokenize_block.call(null, [cljs.core.str(commands__23883), cljs.core.str(comment__23884)].join(""));
  var vec__23886__23888 = cljs.core.nth.call(null, vec__23885__23887, 0, null);
  var G03__23889 = cljs.core.nth.call(null, vec__23886__23888, 0, null);
  var X10__23890 = cljs.core.nth.call(null, vec__23886__23888, 1, null);
  var G96__23891 = cljs.core.nth.call(null, vec__23886__23888, 2, null);
  var s300__23892 = cljs.core.nth.call(null, vec__23886__23888, 3, null);
  var c2__23893 = cljs.core.nth.call(null, vec__23885__23887, 1, null);
  if(cljs.core._EQ_.call(null, "G03", G03__23889)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "G03", "\ufdd1'G03"), cljs.core.hash_map("\ufdd0'line", 33))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "X1.0", X10__23890)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "X1.0", "\ufdd1'X10"), cljs.core.hash_map("\ufdd0'line", 34))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "G96", G96__23891)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "G96", "\ufdd1'G96"), cljs.core.hash_map("\ufdd0'line", 35))))].join(""));
  }
  if(cljs.core._EQ_.call(null, "s300", s300__23892)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'=", "s300", "\ufdd1's300"), cljs.core.hash_map("\ufdd0'line", 36))))].join(""));
  }
  if(cljs.core._EQ_.call(null, c2__23893, comment__23884)) {
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
