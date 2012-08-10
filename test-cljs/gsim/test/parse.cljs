(ns gsim.test.parse
  (:require [gsim.parse :as parse]))

(def success 0)

;; a comment should start with an open paren, and end with a close paren
;; nothing else is a comment. 
(defn test-is-comment? []
  (let [comment "(this is a comment)"
	not-comments ["this is not a comment)" "(this is also not a comment"
		       "definitely not a comment" "G20"]]
    (assert (parse/is-comment? comment))
    (doseq [not-comment not-comments]
      (assert (false? (parse/is-comment? not-comment))))))

(defn test-split-comment []
  (let [command "G96 M3 S300 "
	comment "(set the speed, mode, and start the spindle)"]
    (let [[c1 c2] (parse/split-comment command)]
      (assert (= c1 command))
      (assert (nil? c2)))
    (let [[c1 c2] (parse/split-comment (str command comment))]
      (assert (= c1 command))
      (assert (= c2 comment)))
    (let [[c1 c2] (parse/split-comment comment)]
      (assert (empty? c1))
      (assert (= c2 comment)))))

(defn test-tokenize-block []
  (let [commands "G03X1.0 G96 s300 "
	comment "(comment)"]
    (let [[[G03 X10 G96 s300] c2] (parse/tokenize-block (str commands comment))]
      (assert (= "G03" G03))
      (assert (= "X1.0" X10))
      (assert (= "G96" G96))
      (assert (= "s300" s300))
      (assert (= c2 comment)))))

(defn run []
  (.log js/console "Testing parse.")
  (test-is-comment?)
  (test-split-comment)
  (test-tokenize-block)
  success)
