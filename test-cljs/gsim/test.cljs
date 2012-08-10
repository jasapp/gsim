(ns gsim.test
  (:require [gsim.test.machine :as machine]
	    [gsim.test.parse :as parse]))

(def success 0)

(defn ^:export run []
  (.log js/console "Testing machine.")
  (machine/run)
  (parse/run)
  success)