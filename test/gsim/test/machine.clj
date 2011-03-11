(ns gsim.test.machine
  (:use [gsim.machine] :reload)
  (:use [clojure.test]))

(def invalid-words ["1" "a" "1a" "2a " "2 a " " 2a "])

(deftest parsing
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

  (testing "code-name"
	(is (code-name {:word "foo"}) "fooasdfasdf")))