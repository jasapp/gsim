(ns gsim.sample.parse
  (:require [clojure.string :as s]
	    [goog.string :as gstr]
	    [gsim.sample.number :as n]))

;;
;; take any kind of string and split it into words
;;
(defn- tokenize [gcode-str]
  (remove s/blank? (s/split gcode-str #"(\D[+-]*\d*\.?\d*)")))

;;
;; read a file and 
;;
;;
(defn parse-file [file]
  nil)

(defn parse [str]
  nil)

(defn- parse-block [block-str]
  nil)

(defn- parse-word [word-str]
  nil)


