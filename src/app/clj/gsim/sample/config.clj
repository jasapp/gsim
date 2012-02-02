(ns gsim.sample.config
  "Contains configuration for the sample application."
  (:require [net.cgrand.enlive-html :as html]))

(defn- production-transform [h]
  (html/transform h
                  [:ul#navigation]
                  (html/substitute (html/html-snippet ""))))

(def ^{:doc "Configuration for the sample application."}
  config {:src-root "src"
          :app-root "src/app/cljs"
          :top-level-package "gsim"
          :js "public/javascripts"
          :dev-js-file-name "main.js"
          :prod-js-file-name "mainp.js"
          :dev-js ["goog.require('gsim.sample.core');"
                   "goog.require('gsim.sample.model');"
                   "goog.require('gsim.sample.controller');"
                   "goog.require('gsim.sample.history');"
                   "goog.require('gsim.sample.logging');"
                   "gsim.sample.core.start();gsim.sample.core.repl();"]
          :prod-js ["gsim.sample.core.start();"]
          :reload-clj ["/gsim/host_page"
                       "/gsim/reload"
                       "/gsim/templates"
                       "/gsim/sample/api"
                       "/gsim/sample/config"
                       "/gsim/sample/dev_server"]
          :prod-transform production-transform})
