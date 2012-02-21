(ns gsim.sample.gcode)

;; (defmacro def-gcode [ name modal precedence doc args & body ]
;;   `(add-code! ~name ~modal ~precedence ~doc ~args
;; 	      (fn [ ~'m { :keys ~args } ~'e ] ~@body)))

(defmacro def-gcode [name modal precedence doc args & body]
  `(let [f# (fn [~'m {:keys ~args } ~'e] ~@body)]
     (add-code! (keyword ~name) ~modal ~precedence ~doc
		(map keyword ~args)
		~name)))

;;     (def ~name f#)

;; (defmacro def-modal-gcode [ name modal precedence doc args & body ]
;;   `(defn
;;      ^{ :doc ~doc :modal ~modal :precedence ~precedence }
;;      ~name [ ~'m { :keys ~args } ~'e ]
;;      (if (and ~'e (:verbose ~'m))
;;        (if (not (= "" ~doc)) (println ~doc) (println ~name)))
;;      ~@body))
