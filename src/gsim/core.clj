(ns gsim.core
  (:use [compojure core]
		[hiccup [page-helpers]])
  (:require [gsim.html :as html]
			[clj-json.core :as json]
			[compojure.route :as route]
            [compojure.handler :as handler]
			[ring.util.serve :as serve]
 			[gsim.middleware :as mdw]
			[gsim.parser :as parser]
 			[gsim.machine :as machine]))

(defn index-page []
  (html5
    [:head
	 [:title "Hello World"]
	 (include-js "/js/processing.js")
	 (include-js "/js/jquery.js")
	 (include-css "/css/shThemeDefault.css")
	 (include-css "/css/shCore.css")]
	[:body
	 [:table {:class "main-table" :width "100%"}
	  [:tr
	   [:td {:align "left" :valign "top"}
		[:p {:class "canvas1"} [:canvas {:id "canvas1" :width 500 :height 500 }]]
		[:div {:class "message"} ]]
	   [:td {:align "left" :valign "top"}
		[:div {:class "code"}
		 (html/sample-table)]]
		(include-js "/js/example.js")]]]))

(defn run-block [block dir]
  (binding [*out* *err*]
	(let [m (machine/new-machine)
		  {responses :responses} (machine/machine-eval m (parser/parse-block block))]
	  {:responses responses})))
  
(defn json-response [data & [status]]
  {:status (or status 200)
   :headers {"Content-Type" "application/json"}
   :body (json/generate-string data)})

(defroutes main-routes
  (GET "/" [] (index-page))
  (GET "/json" [dir block] (json-response (run-block block dir)))
  (route/resources "/")
  (route/not-found "Page not found"))

(def app
  (handler/site main-routes))

(defn start []
  (serve/serve-headless app))
