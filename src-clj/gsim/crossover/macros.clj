;*CLJSBUILD-MACRO-FILE*;
(ns gsim.crossover.macros)

;; (defmacro def-code [name args & body]
;;   `(do (defn ~name
;;          ~'[m args e]
;;          (let [f# (fn ~'[m args e]
;;                     (if (or (not (empty? ~'args)) ~'e)
;;                       (do ~@body)
;;                       ~'m))
;;                new-m# (-> ~'m
;;                           (f# ~'args ~'e)
;;                           ((modal-fn (keyword ~name)) ~'args ~'e))]
;;            (message ((message-fn (keyword ~name)) new-m# ~'args ~'e))
;;            new-m#))
;;        (add-code! (keyword ~name) ~'args ~name)))

;; (defmacro def-code [name args & body]
;;   `(defn ~name ~'[m args e]
;;      ~'m))

;; (def-code g99 [x y z] (assoc m :foo 1)))
;; (macroexpand '(def-code g1 [x y z] (assoc m :foo 1)))
;; (def-code g1
;;   [x y z f]
;;   (let [new-m (update-location (merge (location m) args))]
;;     (line (location m) (location new-m) "color" 0x00ff00) ;; put these two together?
;;     (redraw-location (:location new-m))
;;     new-m))
;; (defn- g1 
;;   [m args e]
;;   (let [f (fn [m args e]
;;             (if (or (not (empty? args)) e)
;;               (let [new-m (update-location (merge (location m) args))]
;;                 (line (location m) (location new-m) "color" 0x00ff00) ;; put these two together?
;;                 (redraw-location (:location new-m))
;;                 new-m)
;;               m))]
;;     (let [new-m (-> m 
;;                     (f args e)
;;                     ((modal-fn :g1) args e))]
;;       (message ((message-fn :g1 args e) new-m args e))
;;       new-m)))
;; (add-code! :g1 [:f :x :y :z] g1) 

