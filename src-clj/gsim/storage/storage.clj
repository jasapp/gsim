(ns gsim.storage.storage)

(defprotocol FileStorage
  "The file storage protocol."
  (list-files [this owner])
  (save [this owner filename file-str])
  (fetch [this owner filename]))
