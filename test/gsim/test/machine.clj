(ns gsim.test.machine
  (:use [gsim.machine]
		[gsim.gcode]
		[clojure.test]))

(def invalid-words ["1" "a" "1a" "2a " "2 a " " 2a "])

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
