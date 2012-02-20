goog.addDependency("../cljs/core.js", ['cljs.core'], ['goog.string', 'goog.string.StringBuffer', 'goog.object', 'goog.array']);
goog.addDependency("../clojure/browser/event.js", ['clojure.browser.event'], ['cljs.core', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency("../clojure/browser/dom.js", ['clojure.browser.dom'], ['cljs.core', 'goog.dom']);
goog.addDependency("../domina.js", ['domina'], ['cljs.core', 'goog.dom', 'goog.dom.xml', 'goog.dom.classes', 'goog.dom.forms', 'goog.style', 'goog.string', 'cljs.core']);
goog.addDependency("../domina/xpath.js", ['domina.xpath'], ['cljs.core', 'domina', 'goog.dom']);
goog.addDependency("../gsim/core.js", ['gsim.core'], ['cljs.core', 'goog.style']);
goog.addDependency("../gsim/color.js", ['gsim.color'], ['cljs.core', 'goog.string', 'goog.color', 'gsim.core', 'goog.color.alpha', 'goog.style']);
goog.addDependency("../gsim/browser/animation.js", ['gsim.browser.animation'], ['clojure.browser.event', 'cljs.core', 'goog.fx.easing', 'goog.string', 'clojure.browser.dom', 'goog.async.Delay', 'goog.fx.dom', 'goog.fx.AnimationQueue', 'domina.xpath', 'domina', 'gsim.core', 'goog.style', 'gsim.color']);
goog.addDependency("../gsim/logging.js", ['gsim.logging'], ['cljs.core', 'goog.debug.Logger', 'goog.debug.FancyWindow', 'goog.debug.Console']);
goog.addDependency("../gsim/dispatch.js", ['gsim.dispatch'], ['cljs.core']);
goog.addDependency("../gsim/sample/model.js", ['gsim.sample.model'], ['cljs.core', 'gsim.dispatch']);
goog.addDependency("../clojure/browser/net.js", ['clojure.browser.net'], ['cljs.core', 'clojure.browser.event', 'goog.net.XhrIo', 'goog.net.EventType', 'goog.net.xpc.CfgFields', 'goog.net.xpc.CrossPageChannel', 'goog.json']);
goog.addDependency("../cljs/reader.js", ['cljs.reader'], ['cljs.core', 'goog.string']);
goog.addDependency("../gsim/browser/remote.js", ['gsim.browser.remote'], ['clojure.browser.event', 'clojure.browser.net', 'goog.net.XhrManager', 'cljs.core', 'cljs.reader']);
goog.addDependency("../gsim/sample/animation.js", ['gsim.sample.animation'], ['cljs.core', 'gsim.browser.animation', 'domina.xpath', 'domina', 'gsim.core', 'goog.style', 'goog.dom.forms']);
goog.addDependency("../gsim/sample/view.js", ['gsim.sample.view'], ['clojure.browser.event', 'cljs.core', 'gsim.dispatch', 'goog.events.KeyCodes', 'gsim.sample.animation', 'gsim.browser.animation', 'domina.xpath', 'domina', 'goog.events.KeyHandler']);
goog.addDependency("../gsim/sample/number.js", ['gsim.sample.number'], ['cljs.core', 'goog.string']);
goog.addDependency("../gsim/browser/history.js", ['gsim.browser.history'], ['clojure.browser.event', 'cljs.core', 'goog.history.Html5History', 'goog.History']);
goog.addDependency("../clojure/string.js", ['clojure.string'], ['cljs.core', 'goog.string', 'goog.string.StringBuffer']);
goog.addDependency("../clojure/browser/repl.js", ['clojure.browser.repl'], ['cljs.core', 'clojure.browser.net', 'clojure.browser.event']);
goog.addDependency("../gsim/sample/controller.js", ['gsim.sample.controller'], ['clojure.browser.event', 'cljs.core', 'gsim.dispatch', 'cljs.reader', 'goog.uri.utils', 'gsim.browser.remote', 'gsim.sample.model']);
goog.addDependency("../gsim/sample/core.js", ['gsim.sample.core'], ['cljs.core', 'gsim.dispatch', 'gsim.sample.view', 'clojure.browser.repl', 'goog.uri.utils']);
goog.addDependency("../gsim/sample/parse.js", ['gsim.sample.parse'], ['cljs.core', 'gsim.sample.number', 'clojure.string']);
goog.addDependency("../gsim/sample/history.js", ['gsim.sample.history'], ['cljs.core', 'gsim.browser.history', 'gsim.dispatch']);
goog.addDependency("../gsim/sample/logging.js", ['gsim.sample.logging'], ['cljs.core', 'gsim.dispatch', 'gsim.logging']);