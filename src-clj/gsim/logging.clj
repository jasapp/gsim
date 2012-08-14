(ns gsim.logging
  (:use [gsim.config :only [mongo-server db-name]])
  (:require [somnium.congomongo :as m]))

(def db (atom nil))

(defn init-db []
  (if (nil? @db)
    (swap! db
	   (fn [_] (m/make-connection db-name
				      :host (:host mongo-server)
				      :port (:port mongo-server))))))

(defn log [request]
  (init-db)
  (m/with-mongo @db
    (m/insert! :http_log
	       (select-keys request
			    [:host :remote-addr :scheme :request-method :uri
			     :query-params :server-name :headers :server-port]))))

(defn log-json [json]
  (init-db)
  (m/with-mongo @db
    (m/insert! :json_log json)))

(defn logging-middleware [app]
  (fn [req]
    (log req)
    (app req)))

