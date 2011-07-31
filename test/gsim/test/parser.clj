(ns gsim.test.parser
  (:use [gsim parser]
	[clojure.test]))

(deftest word-contents
  
  (testing "word-types"
    (let [word (parse-word "g00")]
      (is (= (type (:word word)) java.lang.String))
      (is (= (type (:code word)) clojure.lang.Keyword))
      (is (= (type (:key word)) clojure.lang.Keyword))
      (is (= (type (:explicit word)) java.lang.Boolean))
      (is (= (type (:fn word)) clojure.lang.Var))
      (is (= (type (:precedence word)) java.lang.Double))
      (is (= (type (:group (:modal word))) clojure.lang.Keyword))
      (is (= (type (:type (:modal word))) clojure.lang.Keyword)))))

(deftest functions

  (testing "modal-group"
    (let [word (parse-word "g00")
	  modal-group (modal-group word)]
      (is (= (:type modal-group) :g)
      (is (= (:group modal-group) :1)))))

  (testing "code-name"
    (is (= (code-name {:word "foo"}) "foo")))
  
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

  (testing "code-var"
    (is (= #'gsim.gcode/g0 (code-var "g0")))
    (is (= #'gsim.gcode/g0 (code-var "G0"))))

  (testing "parse-gcode-number"
    (is (= 1 (parse-gcode-number "01")))
    (is (= 1 (parse-gcode-number "1")))
    (is (= 10 (parse-gcode-number "10"))))

  (testing "parse-word"
    (is (= "g0" (:word (parse-word "g00"))))
    (is (= "g0" (:word (parse-word "g0"))))
    (is (= "g0" (:word (parse-word "G0"))))
    (is (= "g0" (:word (parse-word "G00"))))
    (is (= :g20 (:code (parse-word "G20"))))
    (is (= :g (:key (parse-word "G00"))))
    (is (= 20 (:arg (parse-word "g20"))))
    (is (= true (:explicit (parse-word "g20"))))
    (is (= false (:explicit (parse-word "g20" false)))))

  (testing "parse-block"
    (is (= (parse-word "g20") (first (parse-block "g20"))))
    (is (= (parse-word "g30") (last (parse-block "g10 g20 g30"))))
    (is (= 5 (count (parse-block "g20 g20 g20 g20 g20"))))))

(deftest parsing-files
  (testing "parse-output"
    (let [filename "test/data/simple.gc"
	  blocks (parse-file filename)
	  first-block (first (nth blocks 0))
	  last-line (last blocks)]
      (is (= (:line-number first-block) 1))
      (is (= (:code first-block) :g20)))))

