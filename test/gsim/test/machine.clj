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
	   :6 20
	   :7 40
	   :5 93
	   :1 0
	   :3 90
	   :2 17
	   :8 43
	   :10 98
	   :12 54
	   :13 61)
      (are [mode default] (= (mode m-modals) default)
	   :4 0
	   :6 6
	   :7 3
	   :8 7
	   :9 48))))

;; (deftest switching-modals
;;   (testing "modal change from eval"
;; 	(let [m (new-machine)
;; 		  m1 (machine-eval m (parse-block "G01"))
;; 		  m2 (machine-eval m1 (parse-block "G02"))
;; 		  m3 (machine-eval m2 (parse-block "G03"))
;; 		  m80 (machine-eval m3 (parse-block "G80"))
;; 		  m82 (machine-eval m80 (parse-block "G82"))]
;; 	  (is (= :g0 (:code (:g1-modal (get-machine-modals m)))))
;; 	  (is (= :g1 (:code (:g1-modal (get-machine-modals m1)))))
;; 	  (is (= :g2 (:code (:g1-modal (get-machine-modals m2)))))
;; 	  (is (= :g3 (:code (:g1-modal (get-machine-modals m3)))))
;; 	  (is (= :g80 (:code (:g1-modal (get-machine-modals m80)))))
;; 	  (is (= :g82 (:code (:g1-modal (get-machine-modals m82))))))))
