var myCodeMirror = CodeMirror(document.body, {
    value: "(defn foo [x y z]\n (+ x y (* 2 z)))\n",
    mode:  "clojure"
});