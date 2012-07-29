(ns gsim.views
  (:require
    [hiccup
      [page :refer [html5]]
      [element :refer [javascript-tag]]
      [page :refer [include-js]]]))

(defn- run-clojurescript [path init]
  (list
    (javascript-tag "var CLOSURE_NO_DEPS = true;")
    (include-js path)
    (javascript-tag init)))

(defn draw-page []
  (html5
   [:head
    [:title "fyyff!"]]
   [:body
    (include-js "/js/codemirror.js")
    [:link {:rel "stylesheet" :href "/css/xq-dark.css"}]
    (include-js "/js/clojure.js")
    (include-js "/js/draw-init.js")
    (include-js "/js/Three.js")]))

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
