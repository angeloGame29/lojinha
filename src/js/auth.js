const ADMIN = {
  user: "admin",
  pass: "1234"
};

// ⏱ sessão (1 hora)
const SESSION_TIME = 1000 * 60 * 60;

function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === ADMIN.user && pass === ADMIN.pass) {
    const session = {
      auth: true,
      time: Date.now()
    };

    localStorage.setItem("adminSession", JSON.stringify(session));

    window.location.href = "admin.html";
  } else {
    alert("Usuário ou senha inválidos");
  }
}

function checkAdmin() {
  const session = localStorage.getItem("adminSession");

  if (!session) {
    redirect();
    return;
  }

  try {
    const data = JSON.parse(session);

    const SESSION_TIME = 1000 * 60 * 60; // 1h
    const now = Date.now();

    if (!data.auth || (now - data.time > SESSION_TIME)) {
      logout();
      return;
    }

  } catch (e) {
    // se corromper o localStorage
    logout();
  }
}

function logout() {
  localStorage.removeItem("adminSession");

  if (window.location.pathname !== "/login.html") {
    window.location.href = "login.html";
  }
}