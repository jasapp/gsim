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
         (gsim.console/message 
          ((gsim.machine.gcode/message-fn ~(keyword (name code))) new-m# args# e#))
         new-m#))
     (gsim.machine.gcode/add-code! ~(keyword (name code)) 0 0 "DOC" nil ~code)))
