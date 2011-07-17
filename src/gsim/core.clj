(ns gsim.core
  (:use [compojure core]
		[hiccup [page-helpers]])
  (:require [clj-json.core :as json]
			[compojure.route :as route]
            [compojure.handler :as handler]
			[ring.util.serve :as serve]
 			[gsim.middleware :as mdw]
 			[gsim.machine :as machine]))

(defn index-page []
  (html5
    [:head
	 [:title "Hello World"]
	 (include-js "/js/processing.js")
	 (include-js "/js/jquery.js")]
	[:body
	 [:p {:class "canvas1"} [:canvas {:id "canvas1" :width 200 :height 200 }]]
	 [:div {:class "contentToChange"}
	  [:h1 {:class "addedtext"} ]]
	 (include-js "/js/example.js")]))

(defn run-block [block dir]
  (binding [*out* *err*]
	(println dir ":" block))
  {:fn "foo bar" :args "1234"})
  
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
