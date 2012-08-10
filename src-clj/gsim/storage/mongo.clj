(ns gsim.storage.mongo
  (:use [gsim.storage.storage :only [FileStorage]]
	[gsim.config :only [mongo-server]])
  (:require [somnium.congomongo :as m]))

(def db (atom nil))

(defn fetch-latest-file [owner filename]
  (m/with-mongo mongo-connection
    (let [files (m/fetch-files :file :where {:filename filename :metadata.owner owner})]
      (first (sort #(compare (:uploadDate %2) (:uploadDate %1)) files)))))

(defn init-db [name]
  (swap! db
	 (fn [_] (m/make-connection name
				    :host (:host mongo-server)
				    :port (:port mongo-server)))))

  (deftype MongoFileStorage [db] FileStorage
	   (defn fetch [owner filename]
	     ;; look at just streaming this out maybe?
	     (let [f (fetch-latest-file owner filename)]
	       (slurp (m/stream-from :file f))))
	   (defn save [owner filename file-str]
	     (m/insert-file! :file (.getBytes file-str)
			     :filename filename
			     :metadata {:owner owner}))))
