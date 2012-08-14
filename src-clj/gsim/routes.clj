(ns gsim.routes
  (:use compojure.core
        gsim.views
	[gsim.storage.storage :only [save fetch list-files]]
	[gsim.storage.mongo :only [new-storage]]
	[gsim.users :only [load-user-record]]
	[ring.util.response :only [redirect]]
	[ring.middleware.params :only [wrap-params]]
        [hiccup.middleware :only [wrap-base-url]])
  (:require [compojure.route :as route]
	    [gsim.storage.mongo :only [new-storage]]
	    [compojure.core :as compojure]
            [compojure.handler :as handler]
            [compojure.response :as response]
	    [cemerick.friend :as friend]
            [cemerick.friend [workflows :as workflows]
	                     [credentials :as creds]]))

(def storage (atom (new-storage)))

(defn edit-file [request]
  (let [{filename :filename} request
	contents (fetch @storage "jeff" filename)]
    (edit-page filename contents)))

(defn view-files [request]
  (let [filenames (list-files @storage "jeff")]
    (files-page filenames)))

(defn login-page [request]
  "<form method='post' action='/login'>
   Username <input type='text' name='username' />
   Password <input type='text' name='password' />
   <input type='submit' /></form>")

(defroutes user-routes
  (GET "/edit/:filename" {p :params} (edit-file p)))

(defroutes main-routes
  (GET "/" {p :params} (view-files p))
  (GET "/login" request (login-page request))
  (GET "/admin" request (friend/authorize #{:admin} "admin page."))
  (GET "/edit/:filename" {p :params} (friend/authorize #{:user} (edit-file p)))
  (friend/logout (ANY "/logout" request (redirect "/")))
  (route/resources "/")
  (route/not-found "Page not found"))

(def app
  (-> main-routes
      (wrap-base-url)
      (friend/authenticate
       {:credential-fn (partial creds/bcrypt-credential-fn load-user-record)
	:unauthorized-redirect-uri "/login"
	:login-uri "/login"
	:workflows [(workflows/interactive-form)]})
      (handler/site)))
