(ns gsim.logging
  (:use [gsim.config :only [mongo-server db-name]])
  (:require [somnium.congomongo :as m]
            [cemerick.friend :as f]))

(def db (atom nil))

(defn init-db []
  (if (nil? @db)
    (swap! db
	   (fn [_] (m/make-connection db-name
				      :host (:host mongo-server)
				      :port (:port mongo-server))))))

(defn format-request [request]
  (format "%s - %s %s - %s"
	  (java.util.Date.)
	  (:remote-addr request)
	  (:uri request)
	  (:current (f/identity request))))

(defn log [request]
  (init-db)
  (println (format-request request))
  (m/with-mongo @db
    (m/insert! :http_log
	       (assoc 
		   (select-keys request
			    [:host :remote-addr :scheme :request-method :uri
			     :query-params :server-name :headers :server-port])
		 :username (:current (f/identity request))
		 :time (java.util.Date.)))))

(defn log-json [json]
  (init-db)
  (m/with-mongo @db
    (m/insert! :json_log json)))

(defn logging-middleware [app]
  (fn [req]
    (log req)
    (app req)))

