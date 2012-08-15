(ns gsim.storage.storage)

(defprotocol FileStorage
  "The file storage protocol."
  (list-files [this owner])
  (save [this owner filename file-str])
  (delete [this owner filename])
  (fetch [this owner filename]))
