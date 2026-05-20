export const webRoutes = [
  { method: "GET", path: "/", controller: "authController", action: "landing" },
  { method: "POST", path: "/login", controller: "authController", action: "login" },
  { method: "GET", path: "/register", controller: "authController", action: "register" },
  { method: "POST", path: "/register", controller: "authController", action: "store" },
  { method: "GET", path: "/tutor-pending", controller: "authController", action: "pending" },

  // REMOVED VERIFY EMAIL ROUTE

  { method: "GET", path: "/forgot-password", controller: "authController", action: "forgot" },
  { method: "POST", path: "/forgot-password", controller: "authController", action: "sendReset" },
  { method: "GET", path: "/reset-password/:token", controller: "authController", action: "resetForm" },
  { method: "POST", path: "/reset-password/:token", controller: "authController", action: "reset" },
  { method: "POST", path: "/logout", controller: "authController", action: "logout" },

  { method: "GET", path: "/dashboard", controller: "learnLinkController", action: "dashboard" },
  { method: "GET", path: "/posts", controller: "learnLinkController", action: "posts" },
  { method: "GET", path: "/posts/create", controller: "learnLinkController", action: "createPost" },
  { method: "POST", path: "/posts", controller: "learnLinkController", action: "storePost" },
  { method: "GET", path: "/posts/:post", controller: "learnLinkController", action: "showPost" },
  { method: "GET", path: "/posts/:post/edit", controller: "learnLinkController", action: "editPost" },
  { method: "PUT", path: "/posts/:post", controller: "learnLinkController", action: "updatePost" },
  { method: "DELETE", path: "/posts/:post", controller: "learnLinkController", action: "deletePost" },
  { method: "POST", path: "/posts/:post/request", controller: "learnLinkController", action: "sendRequest" },

  { method: "GET", path: "/profile/edit", controller: "learnLinkController", action: "editProfile" },
  { method: "PUT", path: "/profile/edit", controller: "learnLinkController", action: "updateProfile" },
  { method: "GET", path: "/profile/:user", controller: "learnLinkController", action: "profile" },

  { method: "POST", path: "/report", controller: "learnLinkController", action: "report" },

  { method: "GET", path: "/transactions", controller: "learnLinkController", action: "transactions" },
  { method: "GET", path: "/transactions/:transaction", controller: "learnLinkController", action: "showTransaction" },
  { method: "POST", path: "/transactions/:transaction/accept", controller: "learnLinkController", action: "acceptTransaction" },
  { method: "POST", path: "/transactions/:transaction/decline", controller: "learnLinkController", action: "declineTransaction" },
  { method: "POST", path: "/transactions/:transaction/cancel", controller: "learnLinkController", action: "cancelTransaction" },
  { method: "POST", path: "/transactions/:transaction/complete", controller: "learnLinkController", action: "completeTransaction" },
  { method: "POST", path: "/transactions/:transaction/review", controller: "learnLinkController", action: "review" },

  { method: "GET", path: "/notifications", controller: "learnLinkController", action: "notifications" },
  { method: "POST", path: "/notifications/read", controller: "learnLinkController", action: "markRead" },
  { method: "DELETE", path: "/notifications", controller: "learnLinkController", action: "deleteNotifications" },
  { method: "DELETE", path: "/notifications/:id", controller: "learnLinkController", action: "deleteNotification" },

  { method: "GET", path: "/about", controller: "staticController", action: "about" },
  { method: "GET", path: "/faq", controller: "staticController", action: "faq" },
  { method: "GET", path: "/contact", controller: "staticController", action: "contact" },
  { method: "POST", path: "/contact", controller: "staticController", action: "contactSend" },

  { method: "POST", path: "/ai/chat", controller: "geminiController", action: "chat" }
];