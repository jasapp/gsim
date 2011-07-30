(ns gsim.test.machine
  (:use [gsim.machine]
	[gsim.gcode]
	[clojure.test]))

(def invalid-words ["1" "a" "1a" "2a " "2 a " " 2a "])

(deftest machine-default-modals
  (testing "machine default G modals"
    (let [g-modals (:g (default-modals))
	  m-modals (:m (default-modals))]
      (are [mode default] (= (mode g-modals) default)
	   :6 20 :7 40 :5 93 :1 0 :3 90 :2 17 :8 43 :10 98 :12 54 :13 61)
      (are [mode default] (= (mode m-modals) default)
	   :4 0 :6 6 :7 3 :8 7 :9 48))))

(deftest new-machine-internals
  (let [m (new-machine)]
    (testing "new config"
      (is (= (:config m) { } )))
    (testing "new registers"
      (is (= (:registers m) { })))
    (testing "verbose exists"
      (is (:verbose m)))
    (testing "modals"
      (is (= (:modals m) (default-modals))))))
  
