(ns gsim.storage.mongo
  (:use [gsim.storage.storage]
	[gsim.config :only [mongo-server]])
  (:require [somnium.congomongo :as m]))

(def db-name (atom "dev"))
(def db (atom nil))

(defn init-db [name]
  (if (nil? @db)
    (swap! db
	   (fn [_] (m/make-connection name
				      :host (:host mongo-server)
				      :port (:port mongo-server))))))

(defn fetch-latest-file [owner filename]
  (m/with-mongo @db
    (let [files (m/fetch-files :file :where {:filename filename :metadata.owner owner})
	  file (first (sort #(compare (:uploadDate %2) (:uploadDate %1)) files))]
      (slurp (m/stream-from :file file)))))

(defn list-mongo-files [owner]
  (m/with-mongo @db
    (->> (m/fetch-files :file :where {:metadata.owner owner})
	 (map :filename)
	 set)))

(deftype MongoFileStorage [db-name]
  FileStorage
  (list-files [this owner]
    (init-db db-name)
    (list-mongo-files owner))
  (fetch [this owner filename]
    ;; look at just streaming this out maybe?
    (init-db db-name)
    (fetch-latest-file owner filename))
  (save [this owner filename file-str]
    (init-db db-name)	   
    (m/with-mongo @db
      (m/insert-file! :file (.getBytes file-str)
		      :filename filename
		      :metadata {:owner owner}))))

;; this seems a little wrong. 
(defn new-storage []
  (MongoFileStorage. @db-name))
