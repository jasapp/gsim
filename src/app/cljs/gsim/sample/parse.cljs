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
(defn- tokenize-block [line-str]
  (let [[gcode-str comment] (split-comment line-str)
	tokens (remove s/blank? (s/split gcode-str #"(\D[+-]*\d*\.?\d*)"))]
    [tokens comment]))

(defn- tokenize-word [word-str]
  [(keyword (s/lower-case (first word-str)))
   (gstr/removeAt word-str 0 1)])

(defmulti parse-word
  (fn [x]
    (let [allowed-decimal #{:a :b :c :e :f :i :j :k :q :r :u :w :x :y :z}]
      (if (contains? allowed-decimal (keyword (s/lower-case (first x))))
	:decimal))))

(defmethod parse-word :decimal [w]
  (let [[address arg] (tokenize-word w)]
    {:address address
     :word w
     :metric-arg (n/parse-metric arg)
     :imperial-arg (n/parse-imperial arg)}))

(defmethod parse-word :default [w]
  (let [[address arg] (tokenize-word w)
	parsed-arg (n/parse-number arg)]
    {:address address
     :word (keyword (str address parsed-arg))
     :arg parsed-arg}))

(defn- parse-block [block-str]
  (let [[words comment] (tokenize-block block-str)
	parsed (map parse-word words)]
    [parsed comment]))

(defn parse [gcode-str]
  (let [lines (s/split gcode-str #"\r|\n|\r\n")]
    (map parse-block lines)))
