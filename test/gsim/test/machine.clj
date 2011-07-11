(ns gsim.test.machine
  (:use [gsim.machine] :reload)
  (:use [gsim.gcode] :reload)
  (:use [clojure.test]))

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

(deftest default-modals
  (testing "machine default G modals"
	(let [modals (get-machine-modals (new-machine))]
	  (is (= :g0 (:code (:g1-modal modals))))
	  (is (= :g17 (:code (:g2-modal modals))))
	  (is (= :g90 (:code (:g3-modal modals))))
	  (is (= :g93 (:code (:g5-modal modals))))
	  (is (= :g20 (:code (:g6-modal modals))))
	  (is (= :g40 (:code (:g7-modal modals))))
	  (is (= :g43 (:code (:g8-modal modals))))
	  (is (= :g98 (:code (:g10-modal modals))))
	  (is (= :g54 (:code (:g12-modal modals))))
	  (is (= :g61 (:code (:g13-modal modals))))))
  (testing "machine default M modals"
	(let [modals (get-machine-modals (new-machine))]
	  (is (= :m0 (:code (:m4-modal modals))))
	  (is (= :m6 (:code (:m6-modal modals))))
	  (is (= :m3 (:code (:m7-modal modals))))
	  (is (= :m7 (:code (:m8-modal modals))))
	  (is (= :m48 (:code (:m9-modal modals)))))))

(deftest switching-modals
  (testing "modal change from eval"
	(let [m (new-machine)
		  m1 (machine-eval m (parse-block "G01"))
		  m2 (machine-eval m1 (parse-block "G02"))
		  m3 (machine-eval m2 (parse-block "G03"))
		  m80 (machine-eval m3 (parse-block "G80"))
		  m82 (machine-eval m80 (parse-block "G82"))]
	  (is (= :g0 (:code (:g1-modal (get-machine-modals m)))))
	  (is (= :g1 (:code (:g1-modal (get-machine-modals m1)))))
	  (is (= :g2 (:code (:g1-modal (get-machine-modals m2)))))
	  (is (= :g3 (:code (:g1-modal (get-machine-modals m3)))))
	  (is (= :g80 (:code (:g1-modal (get-machine-modals m80)))))
	  (is (= :g82 (:code (:g1-modal (get-machine-modals m82))))))))
