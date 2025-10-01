let notes = [];
let editingNoteId = null;

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';  // 

// Buscar notas do servidor (MySQL)
async function loadNotes() {
    try {
        const res = await fetch(`${API_URL}/notas`);  // ← MUDANÇA AQUI
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (error) {
        console.error("Erro ao carregar notas:", error);
        return [];
    }
}

//Salvar nota (POST ou PUT)
async function saveNoteToServer(note) {
    const method = note.id ? 'PUT' : 'POST';
    const url = note.id 
        ? `${API_URL}/notas/${note.id}`      
        : `${API_URL}/notas`;                

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: note.titulo, conteudo: note.conteudo })
    });
}

//Excluir nota no servidor
async function deleteNoteFromServer(id) {
    await fetch(`${API_URL}/notas/${id}`, { method: 'DELETE' }); 
}

//Abrir modal para criar/editar nota
function openNoteDialog(noteId = null) {
    const dialog = document.getElementById('noteDialog');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');

    if (noteId) {
        const noteToEdit = notes.find(note => note.id === noteId);
        editingNoteId = noteId;
        document.getElementById('dialogTitle').textContent = 'Editar Nota';
        titleInput.value = noteToEdit.titulo;
        contentInput.value = noteToEdit.conteudo;
    } else {
        editingNoteId = null;
        document.getElementById('dialogTitle').textContent = 'Adicionar Nova Nota';
        titleInput.value = '';
        contentInput.value = '';
    }

    dialog.showModal();
    titleInput.focus();
}

// Fechar modal
function closeNoteDialog() {
    document.getElementById('noteDialog').close();
}

//Salvar nova nota ou atualizar existente
async function saveNote(event) {
    event.preventDefault();

    const titulo = document.getElementById('noteTitle').value.trim();
    const conteudo = document.getElementById('noteContent').value.trim();

    if (!titulo || !conteudo) return;

    if (editingNoteId) {
        await saveNoteToServer({ id: editingNoteId, titulo, conteudo });
    } else {
        await saveNoteToServer({ titulo, conteudo });
    }

    closeNoteDialog();
    notes = await loadNotes();
    renderNotes();
}

// Excluir nota
async function deleteNote(noteId) {
    await deleteNoteFromServer(noteId);
    notes = await loadNotes();
    renderNotes();
}

// Renderizar as notas no front-end
function renderNotes() {
    const notesContainer = document.getElementById('mainContent');

    if (notes.length === 0) {
        notesContainer.innerHTML = `<div class="empty-state">
            <h2>Nenhuma nota disponível</h2>
            <p>Adicione uma nova nota clicando no botão "+" acima.</p>
            <button class="add-note-btn" onclick="openNoteDialog()">+</button>
        </div>`;
        return;
    }

    notesContainer.innerHTML = notes.map(note => `
        <div class="note-card">
            <h3 class="note-title">${note.titulo}</h3>
            <p class="note-content">${note.conteudo}</p>
            <div class="note-actions">
                <button class="edit-btn" onclick="openNoteDialog(${note.id})">✏</button>
                <button class="delete-btn" onclick="deleteNote(${note.id})">🗑</button>
            </div>
        </div>      
    `).join('');
}

//Tema claro/escuro
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggleBtn').textContent = isDark ? '☀️' : '🌙';
}

function applySavedTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggleBtn').textContent = '☀️';
    }
}

//Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    applySavedTheme();
    notes = await loadNotes();
    renderNotes();

    document.getElementById('noteForm').addEventListener('submit', saveNote);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    document.getElementById('noteDialog').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
            closeNoteDialog();
        }
    });
});
