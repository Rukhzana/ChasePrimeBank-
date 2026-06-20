const appointmentForm = document.querySelector("#appointment-form");
const contactForm = document.querySelector("#contact-form");
const appointmentsList = document.querySelector("#appointments-list");
const toast = document.querySelector("#toast");
const notes = document.querySelector("#notes");
const message = document.querySelector("#c-message");
const authScreen = document.querySelector("#auth-screen");
const protectedViews = document.querySelectorAll(".protected");
const loginForm = document.querySelector("#login-form");
const createAccountForm = document.querySelector("#create-account-form");
const forgotPasswordForm = document.querySelector("#forgot-password-form");
const toggleAuth = document.querySelector("#toggle-auth");
const authTitle = document.querySelector("#auth-title");
const authText = document.querySelector("#auth-text");
const authSwitchText = document.querySelector("#auth-switch-text");
const logoutButton = document.querySelector("#logout-button");
const forgotPasswordButton = document.querySelector("#forgot-password-button");
const loginEmail = document.querySelector("#login-email");
const loginPassword = document.querySelector("#login-password");
const rememberLogin = document.querySelector("#remember-login");
const languageSelects = document.querySelectorAll(".language-select");
const whatsappNumber = "5978847775";

const storageKey = "chase-prime-appointments";
const usersKey = "chase-prime-users";
const sessionKey = "chase-prime-session";
const rememberedKey = "chase-prime-remembered-login";
let appointments = JSON.parse(localStorage.getItem(storageKey) || "[]");
let users = JSON.parse(localStorage.getItem(usersKey) || "[]");
let isCreatingAccount = false;
let isResettingPassword = false;

function updateCounter(field, counterId) {
    const counter = document.querySelector(counterId);
    if (!field || !counter) return;
    counter.textContent = `${field.value.length} / ${field.maxLength} tekens`;
}

function showToast(text) {
    toast.textContent = text;
    toast.classList.remove("hidden");
    requestAnimationFrame(() => toast.classList.add("show"));

    window.setTimeout(() => {
        toast.classList.remove("show");
        window.setTimeout(() => toast.classList.add("hidden"), 220);
    }, 2800);
}

function saveUsers() {
    localStorage.setItem(usersKey, JSON.stringify(users));
}

function setAuthMode(createMode, resetMode = false) {
    isCreatingAccount = createMode;
    isResettingPassword = resetMode;
    loginForm.classList.toggle("hidden", createMode || resetMode);
    createAccountForm.classList.toggle("hidden", !createMode || resetMode);
    forgotPasswordForm.classList.toggle("hidden", !resetMode);

    if (resetMode) {
        authTitle.textContent = "Wachtwoord vergeten?";
        authText.textContent = "Vul uw e-mail in en kies een nieuw wachtwoord.";
        authSwitchText.textContent = "Terug naar";
        toggleAuth.textContent = "Inloggen";
        forgotPasswordButton.classList.add("hidden");
        return;
    }

    authTitle.textContent = createMode ? "Maak uw account aan" : "Log in om verder te gaan";
    authText.textContent = createMode
        ? "Maak een account om toegang te krijgen tot de afsprakenwebsite."
        : "Gebruik uw e-mail en wachtwoord om uw afspraken veilig te beheren.";
    authSwitchText.textContent = createMode ? "Heeft u al een account?" : "Nog geen account?";
    toggleAuth.textContent = createMode ? "Inloggen" : "Maak een account aan";
    forgotPasswordButton.classList.toggle("hidden", createMode);
}

function setLoggedIn(email) {
    localStorage.setItem(sessionKey, email);
    document.body.classList.remove("auth-active");
    authScreen.classList.add("hidden");
    protectedViews.forEach((view) => view.classList.remove("hidden"));
}

function setLoggedOut() {
    localStorage.removeItem(sessionKey);
    document.body.classList.add("auth-active");
    authScreen.classList.remove("hidden");
    protectedViews.forEach((view) => view.classList.add("hidden"));
    setAuthMode(false);
}

function rememberCredentials(email, password, remember) {
    if (remember) {
        localStorage.setItem(rememberedKey, JSON.stringify({ email, password }));
        return;
    }

    localStorage.removeItem(rememberedKey);
}

function fillRememberedLogin() {
    const remembered = JSON.parse(localStorage.getItem(rememberedKey) || "null");
    if (!remembered) return;

    loginEmail.value = remembered.email || "";
    loginPassword.value = remembered.password || "";
    rememberLogin.checked = true;
}

function renderAppointments() {
    appointmentsList.innerHTML = "";

    if (!appointments.length) {
        appointmentsList.innerHTML = '<p class="empty-state">Nog geen afspraken gepland.</p>';
        return;
    }

    appointments.forEach((appointment) => {
        const card = document.createElement("article");
        card.className = "appointment-card";

        const title = document.createElement("strong");
        title.textContent = `${appointment.service} - ${appointment.date} om ${appointment.time}`;

        const name = document.createElement("p");
        name.textContent = appointment.name;

        const contact = document.createElement("p");
        contact.textContent = `${appointment.email} | ${appointment.phone}`;

        card.append(title, name, contact);

        if (appointment.notes) {
            const notesLine = document.createElement("p");
            notesLine.textContent = appointment.notes;
            card.appendChild(notesLine);
        }

        appointmentsList.appendChild(card);
    });
}

appointmentForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(appointmentForm);

    appointments = [
        {
            name: data.get("name"),
            email: data.get("email"),
            phone: data.get("phone"),
            service: data.get("service"),
            date: data.get("date"),
            time: data.get("time"),
            notes: data.get("notes")
        },
        ...appointments
    ];

    localStorage.setItem(storageKey, JSON.stringify(appointments));
    appointmentForm.reset();
    updateCounter(notes, "#notes-counter");
    renderAppointments();
    showToast("Uw afspraak is toegevoegd.");
});

loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    const user = users.find((account) => account.email === email && account.password === password);

    if (!user) {
        showToast("E-mail of wachtwoord klopt niet.");
        return;
    }

    rememberCredentials(email, password, data.get("remember") === "on");
    setLoggedIn(email);
    loginForm.reset();
    fillRememberedLogin();
    showToast(`Welkom terug, ${user.name}.`);
});

createAccountForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(createAccountForm);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));

    if (users.some((account) => account.email === email)) {
        showToast("Er bestaat al een account met deze e-mail.");
        return;
    }

    users.push({ name, email, password });
    saveUsers();
    rememberCredentials(email, password, data.get("remember") === "on");
    setLoggedIn(email);
    createAccountForm.reset();
    fillRememberedLogin();
    showToast(`Account gemaakt. Welkom, ${name}.`);
});

toggleAuth?.addEventListener("click", () => {
    if (isResettingPassword) {
        setAuthMode(false);
        return;
    }

    setAuthMode(!isCreatingAccount);
});

forgotPasswordButton?.addEventListener("click", () => {
    setAuthMode(false, true);
});

forgotPasswordForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(forgotPasswordForm);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    const user = users.find((account) => account.email === email);

    if (!user) {
        showToast("Geen account gevonden met deze e-mail.");
        return;
    }

    user.password = password;
    saveUsers();
    forgotPasswordForm.reset();
    setAuthMode(false);
    showToast("Uw wachtwoord is gewijzigd. U kunt nu inloggen.");
});

logoutButton?.addEventListener("click", () => {
    setLoggedOut();
    showToast("U bent uitgelogd.");
});

contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim();
    const messageText = String(data.get("message")).trim();
    const whatsappText = [
        "Nieuw bericht via Chase Prime Bank website:",
        `Naam: ${name}`,
        `E-mail: ${email}`,
        `Bericht: ${messageText}`
    ].join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

    window.open(whatsappUrl, "_blank", "noopener");
    contactForm.reset();
    updateCounter(message, "#message-counter");
    showToast("WhatsApp wordt geopend om uw bericht te versturen.");
});

notes?.addEventListener("input", () => updateCounter(notes, "#notes-counter"));
message?.addEventListener("input", () => updateCounter(message, "#message-counter"));

function setLanguage(language) {
    languageSelects.forEach((select) => {
        select.value = language;
    });

    const combo = document.querySelector(".goog-te-combo");
    if (!combo) {
        if (language) {
            window.setTimeout(() => setLanguage(language), 600);
        }
        return;
    }

    combo.value = language;
    combo.dispatchEvent(new Event("change"));
}

languageSelects.forEach((select) => {
    select.addEventListener("change", () => {
        setLanguage(select.value);
    });
});

updateCounter(notes, "#notes-counter");
updateCounter(message, "#message-counter");
renderAppointments();
fillRememberedLogin();

if (localStorage.getItem(sessionKey)) {
    setLoggedIn(localStorage.getItem(sessionKey));
} else {
    setLoggedOut();
}
