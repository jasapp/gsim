(ns gsim.routes
  (:use compojure.core
        gsim.views
	[gsim.storage.storage :only [save fetch list-files]]
	[gsim.storage.mongo :only [new-storage]]
        [hiccup.middleware :only [wrap-base-url]])
  (:require [compojure.route :as route]
	    [gsim.storage.mongo :only [new-storage]]
            [compojure.handler :as handler]
            [compojure.response :as response]))

(def storage (atom (new-storage)))

(defn edit-file [request]
  (let [{filename :filename} request
	contents (fetch @storage "jeff" filename)]
    (edit-page filename contents)))

(defn view-files [request]
  (let [filenames (list-files @storage "jeff")]
    (files-page filenames)))

(defroutes main-routes
  (GET "/" {p :params} (view-files p))
  (GET "/edit/:filename" {p :params} (edit-file p))
  (GET "/repl-demo" [] (repl-demo-page))
  (route/resources "/")
  (route/not-found "Page not found"))

(def app
  (-> (handler/site main-routes)
      (wrap-base-url)))
