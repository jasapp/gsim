(ns gsim.test.machine
  (:use [gsim.machine] :reload)
  (:use [clojure.test]))

(testing "tokenize-block"
  (is (tokenize-block "") [])
  (is (tokenize-block " ") [])
  (is (tokenize-block "  ") [])
  (is (tokenize-block "    ") [])
  (is (tokenize-block "g0 g0    g0    ") ["g0" "g0" "g0"]))

(testing "valid-word?"
  (not (valid-word? "1"))
  (not (valid-word? "a"))
  (not (valid-word? "1a"))
  (not (valid-word? "2a "))
  (not (valid-word? "2 a "))
  (not (valid-word? "  2a ")))
