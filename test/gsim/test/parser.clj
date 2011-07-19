(ns gsim.test.parser
  (:use [gsim parser]
		[clojure.test]))

(def invalid-words ["1" "a" "1a" "2a " "2 a " " 2a "])

(deftest parsing
  (testing "tokenize-block"
	(is (= (tokenize-block "") []))
	(is (= (tokenize-block " ") []))
	(is (= (tokenize-block "  ") []))
	(is (= (tokenize-block "    ") []))
	(is (= (tokenize-block "g0 g0    g0    ") ["g0" "g0" "g0"])))
  (testing "valid-word?"
	(is (not (valid-word? "1")))
	(is (not (valid-word? "a")))
	(is (not (valid-word? "1a")))
	(is (not (valid-word? "2a ")))
	(is (not (valid-word? "2 a ")))
	(is (not (valid-word? "  2a "))))

  )