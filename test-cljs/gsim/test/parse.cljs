(ns gsim.test.parse
  (:require [gsim.parse :as parse]))

(def success 0)

(defn run []
  (assert true)
  (.log js/console "Testing parse.")
  success)
