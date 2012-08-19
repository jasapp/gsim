(ns gsim.ngc)

(defn token [stream]
  (if (.eatSpace stream)
    nil))
  
  