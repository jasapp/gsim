(ns gsim.users
  (:use [gsim.config :only [mongo-server db-name]]
	[cemerick.friend.credentials :only [hash-bcrypt bcrypt-credential-fn]])
  (:require [somnium.congomongo :as m]))

(def db (atom nil))

(defn init-db []
  (if (nil? @db)
    (swap! db
	   (fn [_] (m/make-connection db-name
				      :host (:host mongo-server)
				      :port (:port mongo-server))))))

(defn add-user [username password roles]
  (init-db)
  (m/with-mongo @db
    (m/insert! :users {:username username
		       :password (hash-bcrypt password)
		       :roles (into [] roles)})))

(defn load-user-record [username]
  (init-db)  
  (m/with-mongo @db
    (let [record (m/fetch-one :users 
			      :where {:username username}
			      :only [:username :password :roles])]
      (-> record
	  (update-in [:roles] #(set (map keyword %)))
	  (dissoc :_id)))))
