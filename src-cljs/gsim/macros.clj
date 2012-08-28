(ns gsim.macros)

(defmacro def-code [code args & body]
  `(do 
     (defn ~code ~'[m args e]
       (let [m# ~'m
             args# ~'args
             e# ~'e
             f# (fn ~'[m args e]
                  (if (or (not (empty? args#)) e#)
                    (do ~@body)
                    m#))
             new-m# (-> m#
                        (f# args# e#))]
         (if (or (not (empty? args#)) e#)
           (gsim.console/message 
            ((gsim.machine.gcode/message-fn ~(keyword (name code))) new-m# args# e#)))
         new-m#))
     (gsim.machine.gcode/add-code! ~(keyword (name code)) ~code ~args)))

;; (with-modal-group ;; group is automatically created
;;   (def-code g0 ... ) ;; order determines precedence
;;   (def-code g1 ... ) ;; function is automatically wrapped in a modal update function
;;   (def-code g2 ... )
;;   (def-code g3 ... )

;;
;; Where does parsing take place?
;;

;; (defcode g0 
;;   "OHAI %s" ;; turns into a message some how, 
;;   [x y z a b c f] ;; used for determining which args this function eats
;;   (defmethod find-args ...) ???
;;   (defmethod consume-args ...) ;; might be a default fn, and call find-args
;;   (defmethod split-args ...)
;;   (defmethod precedence ...)
;;   (defmethod message "OHAI %s" ...)
;;   (defmethod update-modal ...)
;;   (defmethod word-type ...)
;;   (defmethod instruction [m args e] ...)
;;   ...)

;; ;; maybe
;; {:fn :g0 :x 1 :y 1}
;; ;; or
;; {:fn :t :address 1010}
;; {:fn :g97 :s 300}
;; (instruction :g0 machine {:x 1 :y 1} true)


;; (defcode g0 [:x :y :z :f]
;;   (let [new-m (-> m
;;                   (g0-inside (select-keys args [:x]))
;;                   (g0-inside (select-keys args [:y]))
;;                   (g0-inside (select-keys args [:z])))]
;;     (redraw-location (location new-m))
;;     new-m

