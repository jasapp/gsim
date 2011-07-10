(ns gsim.test.machine
  (:use [gsim.machine] :reload)
  (:use [gsim.gcode] :reload)
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
	(is (code-name {:word "foo"}) "fooasdfasdf"))

  (testing "get-code-var"
	(is (get-code-var "g0"))
	(is (get-code-var "G0")))

  (testing "parse-word"
	(is "g0" (:word (parse-word "g00")))
	(is "g0" (:word (parse-word "g0")))
	(is "g0" (:word (parse-word "G0")))
	(is "g0" (:word (parse-word "G00")))))

(deftest switching-modals
  (testing "modal change from eval"
	(let [m (new-machine)
		  m1 (machine-eval m (parse-block "G01"))
		  m2 (machine-eval m1 (parse-block "G02"))
		  m3 (machine-eval m2 (parse-block "G03"))
		  m80 (machine-eval m3 (parse-block "G80"))
		  m82 (machine-eval m80 (parse-block "G82"))]
	  (is :g0 (:code ((get-machine-modals m) 1)))
	  (is :g1 (:code ((get-machine-modals m1) 1)))
	  (is :g2 (:code ((get-machine-modals m2) 1)))
	  (is :g3 (:code ((get-machine-modals m3) 1)))
	  (is :g80 (:code ((get-machine-modals m80) 1)))
	  (is :g82 (:code ((get-machine-modals m82) 1))))))
