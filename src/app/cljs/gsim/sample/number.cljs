(ns gsim.sample.number
  (:require [goog.string :as gstr]))

(def number-length 8)

(defn decimal?
  "Does a string have a decimal?"
  [num]
  (gstr/contains (str num) "."))

(defn- full-format?
  "Is a string in full format?"
  [num]
  (and (not (decimal? num))
       (= number-length (count (str num))))) ;; gotta have 8 digits?

(defn- no-leading?
  "Are there leading zeros?"
  [num]
  (let [num-str (str num)]
    (and (< (count num-str) number-length) ;; if we have more than 7 digits, it's full-format.
	 (not (re-find #"^0" num-str)))))

(defn- no-trailing?
  "Are there trailing zeros?"
  [num]
  (let [num-str (str num)]
    (and (< (count num-str) number-length)
	 (not (re-find #"0$" num-str)))))

(defn- format-multiplier
  "Take a number and a system, and return the appropriate multiplier."
  [num system]
  (assert (keyword? system))
  (let [multipliers {:metric {:full .001 :no-leading .001 :no-trailing .01}
		     :imperial {:full .0001 :no-leading .0001 :no-trailing .01}}
	number-format (cond (full-format? num) :full
			    (no-leading? num) :no-leading
			    (no-trailing? num) :no-trailing)]
    (assert (keyword? number-format)
	    (str "Both leading and trailing zeros: " num))
    (-> multipliers system number-format)))

;; Is this right?
;; (parse-dimensional-number 1 :imperial) -> .0001
;; This is what the book says, but not how I remember the HAAS working

(defn- parse-dimensional-number
  "Parse a number, taking format into account."
  [num system]
  (if (decimal? num)
    (js/parseFloat num)
    (let [n (js/parseInt num 10)
	  multiplier (format-multiplier num system)]
      (assert (and (not (js/isNaN n)) multiplier)
	      (str "Not a number: " n))
      (* n multiplier))))

(defn parse-metric
  "Parse a metric number."
  [num]
  (parse-dimensional-number num :metric))

(defn parse-imperial
  "Parse an imperial number."
  [num]
  (parse-dimensional-number num :imperial))

(defn parse-number
  "Parse a number. Do not use this for dimensional numbers."
  [num]
  (let [n (js/parseInt num 10)]
    (assert (not (js/isNaN n))
            (str "Error parsing: " num))
    (assert (not (decimal? num))
	    (str "This number shouldn't have a decimal:" num))
    n))

