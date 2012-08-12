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

(defn edit-page [filename contents]
  (html5
   [:head
    [:title (format "Editing - %s" filename)]
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
      [:textarea {:name "code" :id "code"} contents]]
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.editor.init('code')")
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.draw.init('canvas')")
     (run-clojurescript
      "/js/main-debug.js"
      "gsim.repl.connect()")]]))

(defn files-page [filenames]
  (html5
   [:head
    [:title "view files"]]
   [:body
    (for [filename filenames]
      [:li [:a {:href (str "/edit/" filename)} filename]])]))

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
