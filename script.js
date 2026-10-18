
// NAWIGACJA

const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

navButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        const selectedView = button.dataset.view;

        views.forEach(function(view) {
            view.classList.remove("active");
        });

        navButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        document.getElementById(selectedView).classList.add("active");
        button.classList.add("active");
    });
});

// DANE PROJEKTÓW

const STORAGE_KEY = "biurkoPisarzaProjects";

let projects = [];

try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    projects = Array.isArray(saved) ? saved : [];
} catch (error) {
    console.error("Błąd odczytu projektów:", error);
}


function saveProjects() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(projects)
        );

        return true;
    } catch (error) {
        console.error("Błąd zapisywania projektów:", error);

        alert(
            "Nie udało się zapisać danych. " +
            "Pamięć przeglądarki może być pełna. " +
            "Spróbuj użyć mniejszej okładki."
        );

        return false;
    }
}

// FORMULARZ

const showFormBtn = document.getElementById("showFormBtn");
const projectForm = document.getElementById("projectForm");
const projectsList = document.getElementById("projectsList");

showFormBtn.addEventListener("click", function() {
    projectForm.classList.toggle("hidden");
});

projectForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = document.getElementById("projectTitle").value.trim();
    const type = document.getElementById("projectType").value;
const genre = document.getElementById("projectGenre").value;


const coverMode = document.querySelector(
    'input[name="newCoverMode"]:checked'
).value;

let cover = "";

if (coverMode === "ai") {
    cover = document.getElementById("projectCover").value;
}

if (coverMode === "own") {
    if (!uploadedNewCover) {
        alert("Najpierw wybierz własną okładkę.");
        return;
    }

    cover = uploadedNewCover;
}

    const goal = Number(document.getElementById("projectGoal").value);
    const words = Number(document.getElementById("projectWords").value);

    if (!title || !Number.isSafeInteger(goal) || goal <= 0 ||
        !Number.isSafeInteger(words) || words < 0) {
        alert("Wprowadź poprawne dane utworu.");
        return;
    }

    const project = {
        id: crypto.randomUUID(),
        title: title,
        type: type,
	genre: genre,
	cover: cover,
        goal: goal,
        words: words,
        sessions: []
    };

   
projects.push(project);

if (!saveProjects()) {
    projects.pop();
    return;
}

renderProjects();
updateDashboard();


/* RESET OKLADKI PO UTWORZENIU PROJEKTU */

uploadedNewCover = "";

newCoverFile.value = "";
newCoverPreview.removeAttribute("src");
newCoverPreview.classList.add("hidden");
newCoverError.textContent = "";

document.querySelector(
    'input[name="newCoverMode"][value="ai"]'
).checked = true;

updateNewCoverMode();
renderCoverGallery();


    projectForm.reset();
    projectForm.classList.add("hidden");
    alert("Utwór został dodany!");
});

// BEZPIECZNE WYŚWIETLANIE TEKSTU

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

// WYŚWIETLANIE PROJEKTÓW

function renderProjects() {
    projectsList.innerHTML = "";

    if (projects.length === 0) {
        projectsList.innerHTML =
            '<p class="empty-projects">Nie masz jeszcze żadnych utworów.</p>';
        return;
    }

    projects.forEach(function(project) {
        const percent = Math.min(
            (project.words / project.goal) * 100, 100
        );

        const card = document.createElement("div");
        card.className = "project-card";

        card.innerHTML = `
    <div class="project-cover">
        ${project.cover
            ? `<img src="${escapeHTML(project.cover)}"
                    alt="Okładka utworu ${escapeHTML(project.title)}">`
            : `<div class="project-cover-placeholder">
                    <span>✒</span>
                    <p>Biurko Pisarza</p>
               </div>`
        }
    </div>

    <div class="project-tags">
       
<div class="project-tags">
    <span class="project-type">${escapeHTML(project.type)}</span>
    <span class="project-genre">${escapeHTML(project.genre || "Nieokreślony")}</span>
</div>
<h3>${escapeHTML(project.title)}</h3>


            <p>${project.words.toLocaleString("pl-PL")} /
               ${project.goal.toLocaleString("pl-PL")} słów</p>

            <div class="progress-bar">
                <div class="progress-fill"
                     style="width: ${percent}%"></div>
            </div>

            <p>Postęp: ${Math.round(percent)}%</p>

            <div class="project-actions">

<button class="small-btn" data-action="edit">
    ✎ Edytuj
</button>

                <button class="small-btn" data-action="set">
                    Ustaw stan
                </button>
                <button class="small-btn" data-action="add">
                    + Sesja
                </button>
                <button class="small-btn danger-btn" data-action="delete">
                    Usuń
                </button>
            </div>
        `;

        card.querySelectorAll("[data-action]").forEach(function(button) {
            button.addEventListener("click", function() {
                const action = button.dataset.action;

	if (action === "edit") editProject(project.id);
                if (action === "set") setWordCount(project.id);
                if (action === "add") addWritingSession(project.id);
                if (action === "delete") deleteProject(project.id);
            });
        });

        projectsList.appendChild(card);
    });
}

// RĘCZNE USTAWIANIE LICZBY SŁÓW

function setWordCount(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const answer = prompt(
        "Podaj aktualną liczbę słów:",
        project.words
    );

    if (answer === null) return;

    const value = Number(answer);

    if (answer.trim() === "" || !Number.isSafeInteger(value) || value < 0) {
        alert("Wpisz poprawną liczbę słów.");
        return;
    }

    project.words = value;
    saveProjects();
    renderProjects();
    updateDashboard();

    alert("Licznik został zaktualizowany.");
}

// SESJA PISARSKA

function addWritingSession(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const answer = prompt("Ile słów napisałeś podczas sesji?");

    if (answer === null) return;

    const amount = Number(answer);

    if (answer.trim() === "" || !Number.isSafeInteger(amount) ||
        amount <= 0 || !Number.isSafeInteger(project.words + amount)) {
        alert("Wpisz poprawną dodatnią liczbę słów.");
        return;
    }

    project.words += amount;
project.lastEdited = new Date().toISOString();

    if (!Array.isArray(project.sessions)) project.sessions = [];

    project.sessions.push({
        date: new Date().toLocaleDateString("pl-PL"),
        amount: amount
    });

    saveProjects();
    renderProjects();
    updateDashboard();

    alert("Sesja została zapisana!");
}

// USUWANIE PROJEKTU

function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (!confirm("Czy na pewno usunąć utwór: " + project.title + "?")) {
        return;
    }

    projects = projects.filter(p => p.id !== id);
    saveProjects();
    renderProjects();
    updateDashboard();

    alert("Utwór został usunięty.");
}

// STATYSTYKI PULPITU

function updateDashboard() {
    const totalWords = projects.reduce(function(sum, project) {
        return sum + project.words;
    }, 0);

    const statValues = document.querySelectorAll(".stat-card h2");

    statValues[0].textContent = totalWords.toLocaleString("pl-PL");
    statValues[1].textContent = projects.length;

    // Statystyka rozdziałów zostanie dodana w etapie redakcji.
    statValues[2].textContent = "0";

    const dashboardPanel = document.querySelector("#dashboard .panel");

    if (projects.length === 0) {
        dashboardPanel.innerHTML = `
            <h2>Ostatnie projekty</h2>
            <p class="empty-state">Nie masz jeszcze żadnych projektów.</p>
        `;
    } else {
        const recent = projects.slice(-3).reverse();

        dashboardPanel.innerHTML = `
            <h2>Ostatnie projekty</h2>
            ${recent.map(function(p) {
                return `<p><strong>${escapeHTML(p.title)}</strong>
                    — ${p.words.toLocaleString("pl-PL")} słów</p>`;
            }).join("")}
        `;
    }
}

// START APLIKACJI

renderProjects();
updateDashboard();


// ========================================
// MODUŁ REDAKCJI
// ========================================

const editingProject = document.getElementById("editingProject");
const editingWorkspace = document.getElementById("editingWorkspace");
const editingMessage = document.getElementById("editingMessage");
const chapterForm = document.getElementById("chapterForm");
const chaptersList = document.getElementById("chaptersList");

// Aktualizacja listy utworów

function refreshEditingProjects() {
    const selected = editingProject.value;

    editingProject.innerHTML =
        '<option value="">-- Wybierz utwór --</option>';

    projects.forEach(function(project) {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.title;
        editingProject.appendChild(option);
    });

    if (projects.some(p => p.id === selected)) {
        editingProject.value = selected;
    }

    renderChapters();
}

// Wybranie utworu

editingProject.addEventListener("change", renderChapters);

// Dodawanie rozdziału

chapterForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const project = projects.find(
        p => p.id === editingProject.value
    );

    if (!project) {
        alert("Najpierw wybierz utwór.");
        return;
    }

    const title = document.getElementById("chapterTitle").value.trim();

    if (!title) {
        alert("Podaj nazwę rozdziału.");
        return;
    }

    if (!Array.isArray(project.chapters)) {
        project.chapters = [];
    }

    project.chapters.push({
        id: crypto.randomUUID(),
        title: title,
        status: "Do redakcji",
        history: []
    });

    saveProjects();
    chapterForm.reset();
    renderChapters();
    updateDashboard();

    alert("Rozdział został dodany!");
});

// Wyświetlanie rozdziałów

function renderChapters() {
    const project = projects.find(
        p => p.id === editingProject.value
    );

    chaptersList.innerHTML = "";

    if (!project) {
        editingWorkspace.classList.add("hidden");
        editingMessage.classList.remove("hidden");
        editingMessage.textContent =
            "Wybierz utwór, aby rozpocząć redakcję.";
        return;
    }

    editingWorkspace.classList.remove("hidden");
    editingMessage.classList.add("hidden");

    if (!Array.isArray(project.chapters)) {
        project.chapters = [];
    }

    if (project.chapters.length === 0) {
        chaptersList.innerHTML =
            '<p class="empty-projects">Nie dodano jeszcze rozdziałów.</p>';
        return;
    }

    project.chapters.forEach(function(chapter) {
        const card = document.createElement("div");
        card.className = "chapter-card";

        const history = Array.isArray(chapter.history)
            ? chapter.history : [];

        card.innerHTML = `
            <div class="chapter-header">
                <h3>${escapeHTML(chapter.title)}</h3>

                <select class="chapter-status">
                    <option value="Do redakcji">Do redakcji</option>
                    <option value="W trakcie">W trakcie</option>
                    <option value="Ukończony">Ukończony</option>
                </select>
            </div>

            <div class="chapter-actions">
                <button class="small-btn add-edit-btn">
                    + Sesja redakcyjna
                </button>

                <button class="small-btn danger-btn delete-chapter-btn">
                    Usuń rozdział
                </button>
            </div>

            <form class="edit-session-form hidden">
                <h4>Nowa sesja redakcyjna</h4>

                <label>Dodane słowa</label>
                <input type="number" name="added"
                       min="0" step="1" value="0" required>

                <label>Usunięte słowa</label>
                <input type="number" name="removed"
                       min="0" step="1" value="0" required>

                <label>Co zostało poprawione?</label>
                <textarea name="note" maxlength="1000"
                          placeholder="Opisz wykonane zmiany..."></textarea>

                <button type="submit" class="primary-btn">
                    Zapisz sesję
                </button>
            </form>

            <div class="edit-history">
                <h4>Historia redakcji</h4>

                ${history.length === 0
                    ? '<p class="empty-state">Brak sesji redakcyjnych.</p>'
                    : history.slice().reverse().map(function(entry) {
                        return `
                            <div class="history-item">
                                <p class="history-date">
                                    ${escapeHTML(entry.date)}
                                </p>
                                <p>Dodano: ${entry.added} słów |
                                   Usunięto: ${entry.removed} słów</p>
                                <p>${escapeHTML(entry.note || "")}</p>
                            </div>
                        `;
                    }).join("")
                }
            </div>
        `;

        // Status rozdziału

        const statusSelect = card.querySelector(".chapter-status");
        statusSelect.value = chapter.status;

        statusSelect.addEventListener("change", function() {
            chapter.status = statusSelect.value;
            saveProjects();
            updateDashboard();
        });

        // Pokazywanie formularza sesji

        const sessionForm = card.querySelector(".edit-session-form");

        card.querySelector(".add-edit-btn").addEventListener(
            "click", function() {
                sessionForm.classList.toggle("hidden");
            }
        );

        // Zapisywanie sesji redakcyjnej

        sessionForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const added = Number(sessionForm.elements.added.value);
            const removed = Number(sessionForm.elements.removed.value);
            const note = sessionForm.elements.note.value.trim();

            if (!Number.isSafeInteger(added) ||
                !Number.isSafeInteger(removed) ||
                added < 0 || removed < 0) {
                alert("Podaj poprawne liczby słów.");
                return;
            }

            if (!Array.isArray(chapter.history)) {
                chapter.history = [];
            }

            chapter.history.push({
                date: new Date().toLocaleString("pl-PL"),
                added: added,
                removed: removed,
                note: note
            });

            saveProjects();
            renderChapters();

            alert("Sesja redakcyjna została zapisana!");
        });

        // Usuwanie rozdziału

        card.querySelector(".delete-chapter-btn").addEventListener(
            "click", function() {
                if (!confirm(
                    "Czy na pewno usunąć rozdział: " + chapter.title + "?"
                )) {
                    return;
                }

                project.chapters = project.chapters.filter(
                    c => c.id !== chapter.id
                );

                saveProjects();
                renderChapters();
                updateDashboard();

                alert("Rozdział został usunięty.");
            }
        );

        chaptersList.appendChild(card);
    });
}

// Uzupełnienie statystyk ukończonych rozdziałów

const originalUpdateDashboard = updateDashboard;

updateDashboard = function() {
    originalUpdateDashboard();

    const completedChapters = projects.reduce(function(total, project) {
        const chapters = Array.isArray(project.chapters)
            ? project.chapters : [];

        return total + chapters.filter(
            chapter => chapter.status === "Ukończony"
        ).length;
    }, 0);

    document.querySelectorAll(".stat-card h2")[2].textContent =
        completedChapters;
};

// Odświeżanie listy po dodaniu lub usunięciu utworu

const originalRenderProjects = renderProjects;

renderProjects = function() {
    originalRenderProjects();
    refreshEditingProjects();
};

// Uruchomienie modułu redakcji

refreshEditingProjects();
updateDashboard();

function renderRecentProjects() {
    const container = document.getElementById("recentProjects");

    if (!container) return;

    container.innerHTML = "";

    const recent = [...projects].slice(-3).reverse();

    if (recent.length === 0) {
        container.innerHTML =
            '<p class="empty-state">Nie masz jeszcze żadnych utworów.</p>';
        return;
    }

    recent.forEach(function(project) {
        const card = document.createElement("div");
        card.className = "recent-card";

        const percent = project.goal > 0
            ? Math.min((project.words / project.goal) * 100, 100)
            : 0;

        card.innerHTML = `
            <p class="project-type">${escapeHTML(project.type)}</p>
            <h3>${escapeHTML(project.title)}</h3>
            <p>${project.words.toLocaleString("pl-PL")} słów</p>

            <div class="progress-bar">
                <div class="progress-fill"
                     style="width: ${percent}%"></div>
            </div>

            <p>Postęp: ${Math.round(percent)}%</p>
        `;

        container.appendChild(card);
    });
}

renderRecentProjects();


/* DRZEWKO PROJEKTÓW */

function renderProjectTree() {
    const tree = document.getElementById("projectTree");

    if (!tree) return;

    tree.innerHTML = "";

    if (projects.length === 0) {
        tree.innerHTML = '<p class="tree-empty">Brak projektów</p>';
        return;
    }

    projects.forEach(function(project) {
        const details = document.createElement("details");
        details.className = "tree-item";

        const summary = document.createElement("summary");
        summary.className = "tree-project";
        summary.textContent = project.title;

        details.appendChild(summary);

        const chapters = document.createElement("div");
        chapters.className = "tree-chapters";

        const projectChapters = Array.isArray(project.chapters)
            ? project.chapters
            : [];

        if (projectChapters.length === 0) {
            const empty = document.createElement("p");
            empty.className = "tree-empty";
            empty.textContent = "Brak rozdziałów";
            chapters.appendChild(empty);
        }

        projectChapters.forEach(function(chapter) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tree-chapter";
            button.textContent = chapter.title;

button.addEventListener("click", function() {
    // Otwórz zakładkę Redakcja
    const editingButton = document.querySelector(
        '[data-view="editing"]'
    );

    editingButton.click();

    // Wybierz właściwy projekt
 const projectSelect = document.getElementById(
    "editingProject"
);

    projectSelect.value = project.id;
    projectSelect.dispatchEvent(
        new Event("change", { bubbles: true })
    );
});

            chapters.appendChild(button);
        });

        details.appendChild(chapters);
        tree.appendChild(details);
    });
}


/* AUTOMATYCZNA AKTUALIZACJA DRZEWKA */

const originalRenderChapters = renderChapters;

renderChapters = function() {
    originalRenderChapters();
    renderProjectTree();
};

const originalRenderProjectsForTree = renderProjects;

renderProjects = function() {
    originalRenderProjectsForTree();
    renderProjectTree();
};

renderProjectTree();


/* DZISIEJSZA AKTYWNOSC */

function updateTodayStats() {
   const today = new Date().toLocaleDateString("pl-PL");

    let todayWords = 0;
    let todaySessions = 0;
    let todayEditingSessions = 0;

    projects.forEach(function(project) {

        // Sesje pisarskie
        const sessions = Array.isArray(project.sessions)
            ? project.sessions
            : [];

        sessions.forEach(function(session) {
            if (session.date === today) {
                todayWords += Number(session.amount) || 0;
                todaySessions++;
            }
        });

        // Sesje redakcyjne
        const chapters = Array.isArray(project.chapters)
            ? project.chapters
            : [];

        chapters.forEach(function(chapter) {
            const history = Array.isArray(chapter.history)
                ? chapter.history
                : [];


history.forEach(function(entry) {
    if (typeof entry.date === "string" &&
        entry.date.split(",")[0].trim() === today) {
        todayEditingSessions++;
    }
});

        });
    });

    document.getElementById("todayWords").textContent =
        todayWords.toLocaleString("pl-PL");

    document.getElementById("todaySessions").textContent =
        todaySessions;

    document.getElementById("todayEditingSessions").textContent =
        todayEditingSessions;
}

// Aktualizacja licznika po zmianach w projektach
const originalRenderProjectsForToday = renderProjects;

renderProjects = function() {
    originalRenderProjectsForToday();
    updateTodayStats();
};

// Aktualizacja licznika po zmianach w redakcji
const originalRenderChaptersForToday = renderChapters;

renderChapters = function() {
    originalRenderChaptersForToday();
    updateTodayStats();
};

// Pierwsze wyświetlenie statystyk
updateTodayStats();


/* GŁÓWNY PROJEKT */

const mainProjectSelect =
    document.getElementById("mainProjectSelect");

const mainProjectInfo =
    document.getElementById("mainProjectInfo");

function updateMainProject() {
    const savedId =
        localStorage.getItem("biurkoPisarzaMainProject");

    // Odśwież listę dostępnych projektów
    mainProjectSelect.innerHTML =
        '<option value="">-- Wybierz utwór --</option>';

    projects.forEach(function(project) {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.title;
        mainProjectSelect.appendChild(option);
    });

    const selectedProject = projects.find(function(project) {
        return String(project.id) === savedId;
    });

    if (!selectedProject) {
        mainProjectSelect.value = "";
        mainProjectInfo.innerHTML =
            '<p class="daily-description">Nie wybrano jeszcze głównego projektu.</p>';
        return;
    }

    mainProjectSelect.value = String(selectedProject.id);

    const percent = selectedProject.goal > 0
        ? Math.min(
            (selectedProject.words / selectedProject.goal) * 100,
            100
        )
        : 0;

    mainProjectInfo.innerHTML = `
        <h3>${escapeHTML(selectedProject.title)}</h3>

        <p class="daily-description">
            ${selectedProject.words.toLocaleString("pl-PL")}
            /
            ${selectedProject.goal.toLocaleString("pl-PL")}
            słów
        </p>

        <div class="progress-bar">
            <div class="progress-fill"
                 style="width: ${percent}%"></div>
        </div>

        <p class="daily-meta">
            Postęp: ${Math.round(percent)}%
        </p>
    `;
}

mainProjectSelect.addEventListener("change", function() {
    if (mainProjectSelect.value) {
        localStorage.setItem(
            "biurkoPisarzaMainProject",
            mainProjectSelect.value
        );
    } else {
        localStorage.removeItem("biurkoPisarzaMainProject");
    }

    updateMainProject();
});

// Aktualizuj po zmianach w bibliotece
const originalRenderProjectsForMain = renderProjects;

renderProjects = function() {
    originalRenderProjectsForMain();
    updateMainProject();
};

// Pierwsze wyświetlenie
updateMainProject();


/* SZYBKIE PRZEJSCIE DO GLOWNEGO PROJEKTU */

const continueWritingBtn =
    document.getElementById("continueWritingBtn");

function updateContinueButton() {
    const projectId =
        localStorage.getItem("biurkoPisarzaMainProject");

    const projectExists = projects.some(function(project) {
        return String(project.id) === projectId;
    });

    continueWritingBtn.disabled = !projectExists;
}

continueWritingBtn.addEventListener("click", function() {
    const projectId =
        localStorage.getItem("biurkoPisarzaMainProject");

    const projectExists = projects.some(function(project) {
        return String(project.id) === projectId;
    });

    if (!projectExists) return;

    // Otwórz zakładkę Redakcja
    document.querySelector('[data-view="editing"]').click();

    // Wybierz główny projekt
    const select = document.getElementById("editingProject");
    select.value = projectId;

    select.dispatchEvent(
        new Event("change", { bubbles: true })
    );
});

// Odśwież przycisk po wyborze głównego projektu
mainProjectSelect.addEventListener("change", updateContinueButton);

// Odśwież przycisk po zmianach w bibliotece
const originalRenderProjectsForContinue = renderProjects;

renderProjects = function() {
    originalRenderProjectsForContinue();
    updateContinueButton();
};

updateContinueButton();


/* GALERIA OKLADEK WEDLUG GATUNKU */

const genreSelect = document.getElementById("projectGenre");
const coverGallery = document.getElementById("coverGallery");
const projectCoverInput = document.getElementById("projectCover");


const coverGenres = {
    "Fantasy": "fantasy",
    "Thriller": "thriller",
    "Romans": "romans",
    "Horror": "horror",
    "Science fiction": "science_fiction",
    "Kryminał": "kryminal",
    "Dramat": "dramat",
    "Obyczajowy": "obyczajowy",
    "Inne": "inne"
};

function renderCoverGallery() {
    const folder = coverGenres[genreSelect.value];

    coverGallery.innerHTML = "";
    projectCoverInput.value = "";

    if (!folder) {
        coverGallery.textContent =
            "Okładki dla tego gatunku dodamy wkrótce.";
        return;
    }

    for (let i = 1; i <= 5; i++) {
        const path =
            "images/covers/" + folder + "/" +
            folder + "_" + i + ".png";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "cover-option";

        const img = document.createElement("img");
        img.src = path;
        img.alt = "Okładka " + i + " — " + genreSelect.value;
        img.loading = "lazy";

        button.appendChild(img);

        button.addEventListener("click", function() {
            document.querySelectorAll(".cover-option")
                .forEach(function(option) {
                    option.classList.remove("selected");
                });

            button.classList.add("selected");
            projectCoverInput.value = path;
        });

        coverGallery.appendChild(button);
    }
}

genreSelect.addEventListener("change", renderCoverGallery);

renderCoverGallery();


/* EDYCJA UTWORU */


/* OTWIERANIE OKNA EDYCJI */

let editingProjectId = null;

function editProject(id) {
    const project = projects.find(function(p) {
        return p.id === id;
    });

    if (!project) return;

    editingProjectId = id;


uploadedEditCover = "";
document.getElementById("editCoverFile").value = "";
document.getElementById("editCoverPreview").classList.add("hidden");
document.getElementById("editCoverError").textContent = "";


/* ROZPOZNAWANIE AKTUALNEJ OKLADKI */

let currentCoverMode = "none";

if (project.cover) {
    if (project.cover.startsWith("data:image/")) {
        currentCoverMode = "own";
    } else {
        currentCoverMode = "ai";
    }
}

document.querySelector(
    'input[name="editCoverMode"][value="' + currentCoverMode + '"]'
).checked = true;

updateEditCoverMode();

if (currentCoverMode === "own") {
    uploadedEditCover = project.cover;
    editCoverPreview.src = project.cover;
    editCoverPreview.classList.remove("hidden");
}


    document.getElementById("editProjectTitle").value =
        project.title;

    document.getElementById("editProjectGenre").value =
        project.genre || "Inne";

    document.getElementById("editProjectModal")
        .classList.remove("hidden");

selectedEditCover = project.cover || "";
renderEditCoverGallery();


}

/* ZAMYKANIE OKNA EDYCJI */

function closeEditProjectModal() {
    document.getElementById("editProjectModal")
        .classList.add("hidden");

    editingProjectId = null;
}

document.getElementById("closeEditModal")
    .addEventListener("click", closeEditProjectModal);

document.getElementById("cancelEditModal")
    .addEventListener("click", closeEditProjectModal);


/* WYBOR SPOSOBU EDYCJI OKLADKI */

const editCoverGallery = document.getElementById("editCoverGallery");
const editCoverUpload = document.getElementById("editCoverUpload");

function updateEditCoverMode() {
    const selectedMode = document.querySelector(
        'input[name="editCoverMode"]:checked'
    ).value;

    editCoverGallery.classList.add("hidden");
    editCoverUpload.classList.add("hidden");

    if (selectedMode === "ai") {
        editCoverGallery.classList.remove("hidden");
    }

    if (selectedMode === "own") {
        editCoverUpload.classList.remove("hidden");
    }
}

document.querySelectorAll('input[name="editCoverMode"]')
    .forEach(function(radio) {
        radio.addEventListener("change", updateEditCoverMode);
    });

updateEditCoverMode();


/* GALERIA AI PODCZAS EDYCJI UTWORU */

let selectedEditCover = "";

function renderEditCoverGallery() {
    const genre = document.getElementById("editProjectGenre").value;
    const folder = coverGenres[genre];

    editCoverGallery.innerHTML = "";

    if (!folder) {
        editCoverGallery.textContent =
            "Dla tego gatunku nie dodaliśmy jeszcze okładek AI.";
        return;
    }

    for (let i = 1; i <= 5; i++) {
        const path = "images/covers/" + folder + "/" +
                     folder + "_" + i + ".png";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "cover-option";

        const img = document.createElement("img");
        img.src = path;
        img.alt = "Okładka " + i + " — " + genre;
        img.loading = "lazy";

        button.appendChild(img);

        if (selectedEditCover === path) {
            button.classList.add("selected");
        }

        button.addEventListener("click", function() {
            selectedEditCover = path;

            editCoverGallery.querySelectorAll(".cover-option")
                .forEach(function(option) {
                    option.classList.remove("selected");
                });

            button.classList.add("selected");
        });

        editCoverGallery.appendChild(button);
    }
}

/* ZMIANA GATUNKU W OKNIE EDYCJI */

document.getElementById("editProjectGenre")
    .addEventListener("change", function() {
        selectedEditCover = "";
        renderEditCoverGallery();
    });


/* PODGLAD WLASNEJ OKLADKI */

let uploadedEditCover = "";

const editCoverFile = document.getElementById("editCoverFile");
const editCoverPreview = document.getElementById("editCoverPreview");
const editCoverError = document.getElementById("editCoverError");

editCoverFile.addEventListener("change", function() {
    const file = editCoverFile.files[0];

    uploadedEditCover = "";
    editCoverPreview.classList.add("hidden");
    editCoverPreview.removeAttribute("src");
    editCoverError.textContent = "";

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        editCoverError.textContent =
            "Wybierz obraz JPG, PNG lub WebP.";
        editCoverFile.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        editCoverError.textContent =
            "Plik jest za duży. Maksymalnie 5 MB.";
        editCoverFile.value = "";
        return;
    }

    const reader = new FileReader();

   
reader.onload = function() {
    const image = new Image();

    image.onload = function() {
        const maxWidth = 600;
        const maxHeight = 800;

        const scale = Math.min(
            1,
            maxWidth / image.width,
            maxHeight / image.height
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(
            1,
            Math.round(image.width * scale)
        );

        canvas.height = Math.max(
            1,
            Math.round(image.height * scale)
        );

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        uploadedEditCover = canvas.toDataURL(
            "image/jpeg",
            0.75
        );

        editCoverPreview.src = uploadedEditCover;
        editCoverPreview.classList.remove("hidden");
    };

    image.onerror = function() {
        editCoverError.textContent =
            "Nie udało się przetworzyć obrazu.";
    };

    image.src = reader.result;
};

    reader.onerror = function() {
        uploadedEditCover = "";
        editCoverError.textContent =
            "Nie udało się odczytać pliku.";
    };

    reader.readAsDataURL(file);
});



/* ZAPISYWANIE EDYCJI UTWORU */

document.getElementById("editProjectForm")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const project = projects.find(function(p) {
            return p.id === editingProjectId;
        });

        if (!project) {
            alert("Nie znaleziono utworu.");
            return;
        }

        const title = document.getElementById("editProjectTitle").value.trim();
        const genre = document.getElementById("editProjectGenre").value;

        const coverMode = document.querySelector(
            'input[name="editCoverMode"]:checked'
        ).value;

        if (!title) {
            alert("Wpisz tytuł utworu.");
            return;
        }

        let cover = project.cover || "";

        if (coverMode === "ai" && selectedEditCover) {
            cover = selectedEditCover;
        }

        if (coverMode === "own") {
            if (!uploadedEditCover) {
                alert("Najpierw wybierz własną okładkę.");
                return;
            }

            cover = uploadedEditCover;
        }

        if (coverMode === "none") {
            cover = "";
        }

        const previousTitle = project.title;
        const previousGenre = project.genre;
        const previousCover = project.cover;

        project.title = title;
        project.genre = genre;
        project.cover = cover;

        try {
            localStorage.setItem(
                "biurkoPisarzaProjects",
                JSON.stringify(projects)
            );
        } catch (error) {
            project.title = previousTitle;
            project.genre = previousGenre;
            project.cover = previousCover;

            alert("Nie udało się zapisać. Pamięć przeglądarki może być pełna.");
            return;
        }

        closeEditProjectModal();
        renderProjects();
        updateDashboard();

        alert("Zmiany zostały zapisane!");
    });


/* WYBOR OKLADKI PRZY TWORZENIU UTWORU */

const newCoverGallery = document.getElementById("coverGallery");
const newCoverUpload = document.getElementById("newCoverUpload");

function updateNewCoverMode() {
    const mode = document.querySelector(
        'input[name="newCoverMode"]:checked'
    ).value;

    newCoverGallery.classList.add("hidden");
    newCoverUpload.classList.add("hidden");

    if (mode === "ai") {
        newCoverGallery.classList.remove("hidden");
    }

    if (mode === "own") {
        newCoverUpload.classList.remove("hidden");
    }
}

document.querySelectorAll('input[name="newCoverMode"]')
    .forEach(function(radio) {
        radio.addEventListener("change", updateNewCoverMode);
    });

updateNewCoverMode();


/* WLASNA OKLADKA NOWEGO UTWORU */

let uploadedNewCover = "";

const newCoverFile = document.getElementById("newCoverFile");
const newCoverPreview = document.getElementById("newCoverPreview");
const newCoverError = document.getElementById("newCoverError");

newCoverFile.addEventListener("change", function() {
    const file = newCoverFile.files[0];

    uploadedNewCover = "";
    newCoverPreview.classList.add("hidden");
    newCoverPreview.removeAttribute("src");
    newCoverError.textContent = "";

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        newCoverError.textContent =
            "Wybierz obraz JPG, PNG lub WebP.";
        newCoverFile.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        newCoverError.textContent =
            "Plik jest za duży. Maksymalnie 5 MB.";
        newCoverFile.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        const image = new Image();

        image.onload = function() {
            const maxWidth = 600;
            const maxHeight = 800;

            const scale = Math.min(
                1,
                maxWidth / image.width,
                maxHeight / image.height
            );

            const canvas = document.createElement("canvas");

            canvas.width = Math.max(
                1,
                Math.round(image.width * scale)
            );

            canvas.height = Math.max(
                1,
                Math.round(image.height * scale)
            );

            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

            uploadedNewCover = canvas.toDataURL(
                "image/jpeg",
                0.75
            );

            newCoverPreview.src = uploadedNewCover;
            newCoverPreview.classList.remove("hidden");
        };

        image.onerror = function() {
            newCoverError.textContent =
                "Nie udało się przetworzyć obrazu.";
        };

        image.src = reader.result;
    };

    reader.onerror = function() {
        newCoverError.textContent =
            "Nie udało się odczytać pliku.";
    };

    reader.readAsDataURL(file);
});

