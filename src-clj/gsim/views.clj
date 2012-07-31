(ns gsim.views
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
       "O1234\nN100\nG0 X1.0 Z1.0 Y1.0\nM3"]]
     (include-js "/js/draw-init.js")
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
