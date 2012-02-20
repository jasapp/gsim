(ns gsim.sample.parse
  (:require [clojure.string :as s]
	    [goog.string :as gstr]
	    [gsim.sample.number :as n]))

(defn- is-comment? [word-str]
  (and (gstr/startsWith word-str "(")
       (gstr/endsWith word-str ")")))

(defn- split-comment [gcode-str]
  (let [line-after-split (s/split gcode-str #"(\(.*\))")
	gcode (first line-after-split)
	comment (if (<= 2 (count line-after-split))
		  (second line-after-split))]
    [gcode comment]))
  
;;
;; take any kind of string and split it into words
;;
(defn- tokenize [line-str]
  (let [[gcode-str comment] (split-comment line-str)
	tokens (remove s/blank? (s/split gcode-str #"(\D[+-]*\d*\.?\d*)"))]
    (if comment
      (concat tokens [comment])
      tokens)))

(defn- tokenize-word [word-str]
  [(keyword (first word-str))
   (gstr/removeAt word-str 0 1)])

(defmulti parse-word
  (fn [x]
    (let [allowed-decimal #{:a :b :c :e :f :i :j :k :q :r :u :w :x :y :z}]
      (if (contains? allowed-decimal (keyword (first x)))
	:decimal))))

(defmethod parse-word :decimal [w]
  (let [[address arg] (tokenize-word w)]
    {:address address
     :word w
     :metric-arg (n/parse-metric arg)
     :imperial-arg (n/parse-imperial arg)}))

(defmethod parse-word :default [w]
  (let [[address arg] (tokenize-word w)]
    {:address address
     :word w
     :arg (n/parse-number arg)}))

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
