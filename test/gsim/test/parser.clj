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

  (testing "code-name"
	(is (= (code-name {:word "foo"}) "foo")))

  (testing "get-code-var"
	(is (= (get-code-var "g0")))
	(is (= (get-code-var "G0"))))

  (testing "parse-word"
	(is (= "g0" (:word (parse-word "g00"))))
	(is (= "g0" (:word (parse-word "g0"))))
	(is (= "g0" (:word (parse-word "G0"))))
	(is (= "g0" (:word (parse-word "G00"))))))

(deftest parsing-files
  (testing "parse-output"
	(let [filename "test/data/simple.gc"
		  blocks (parse-file filename)
		  first-block (first (nth blocks 0))
		  last-line (last blocks)]
	  (is (= (:line-number first-block) 1))
	  (is (= (:code first-block) :g20)))))

