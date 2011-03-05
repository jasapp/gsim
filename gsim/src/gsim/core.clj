(ns gsim.core
  (:use [compojure.core]
        [ring.adapter.jetty]
		[ring.middleware.reload])
  (:require [compojure.route :as route]
			[gsim.middleware :as mdw]
			[gsim.machine :as machine]
			[clj-json.core :as json]
			[ring.util.response :as r]))

(defroutes gsim-routes
  (GET "/" params (machine/machine-eval params))
  (POST "/" params (r/response (machine/machine-eval params)))
  (route/not-found "<h1>Page not found</h1>"))

(defonce server (future (run-jetty #'gsim-routes {:port 8080})))
