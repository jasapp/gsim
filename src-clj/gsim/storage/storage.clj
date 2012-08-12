(ns gsim.storage.storage)

(defprotocol FileStorage
  "The file storage protocol."
  (save [this owner filename file-str])
  (fetch [this owner filename]))
