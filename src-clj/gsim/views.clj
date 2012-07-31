(ns gsim.views
  (:use [gsim.demo :only [gcode-demo-1 gcode-demo-2]])
  (:require
   [hiccup
    [page :refer [html5]]
    [element :refer [javascript-tag]]
    [page :refer [include-js include-css]]]))

(defn- run-clojurescript [path init]
  (list
    (javascript-tag "var CLOSURE_NO_DEPS = true;")
    (include-js path)
    (javascript-tag init)))

(defn draw-page []
  (html5
   [:head
    [:title "code!"]
    (include-css "/css/codemirror.css")
    (include-css "/css/ngc.css")
    (include-js "/js/codemirror.js")
    (include-js "/js/ngc.js")
    (include-js "/js/Three.js")]
   [:body
    [:div {:id "main"}
     [:div {:id "canvas"}
      [:div {:id "console"}]]
     [:div {:id "editor"}
      [:textarea {:name "code" :id "code"}
       gcode-demo-2]]
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.editor.init('code')")
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.three.init('canvas')")
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.repl.connect()")]]))

(defn index-page []
  (html5
    [:head
      [:title "fyyff!"]]
    [:body
      [:h1 "fyyff!"]
     (include-js "/js/Three.js")
     (include-js "/js/codemirror.js")
     (run-clojurescript
        "/js/main-debug.js"
        "example.hello.say_hello()")]))

(defn repl-demo-page []
  (html5
    [:head
      [:title "REPL Demo"]
      (include-js "/js/Three.js")]
    [:body
     [:div {:id "canvas"}]
     (run-clojurescript
        "/js/main-debug.js"
        "gsim.repl.connect()")]))
