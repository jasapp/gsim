(ns gsim.storage.storage)

(defprotocol FileStorage
  "The file storage protocol."
  (save [owner filename file-str])
  (fetch [owner filename]))
  