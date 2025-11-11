/*
  Student Management System (Demo)
  - Single-page app using localStorage for persistence
  - No frameworks, modular vanilla JS
  - Features: Search, sort, filter, add/edit/delete, profile view, CSV export, reset
*/

// Utilities
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2,9);

const STORAGE_KEY = 'sms.students.v1';

const DemoData = [
  { id: 'S-1001', name: 'Ava Johnson', class: '10A', email: 'ava.johnson@example.com', status: 'active', avatar: 'assets/avatars/ava.jpg', history: ['Joined class 10A', 'Math quiz: 92%'] },
  { id: 'S-1002', name: 'Noah Chen', class: '10B', email: 'noah.chen@example.com', status: 'active', avatar: 'assets/avatars/noah.jpg', history: ['Joined class 10B', 'Science fair participant'] },
  { id: 'S-1003', name: 'Sophia Patel', class: '10A', email: 'sophia.patel@example.com', status: 'alumni', avatar: 'assets/avatars/sophia.jpg', history: ['Graduated 2024'] },
  { id: 'S-1004', name: 'Liam Garcia', class: '9C', email: 'liam.garcia@example.com', status: 'inactive', avatar: 'assets/avatars/liam.jpg', history: ['On leave since Jan'] },
];

function readStudents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function writeStudents(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function ensureData() {
  let data = readStudents();
  if (!data) { writeStudents(DemoData); data = DemoData; }
  return data;
}

// State
let students = ensureData();
let filters = { search: '', cls: '', status: '', sortBy: 'name' };
let profileOpen = false;

// Elements
const grid = $('#studentGrid');
const emptyState = $('#emptyState');
const loadingState = $('#loadingState');
const searchInput = $('#search');
const filterClass = $('#filterClass');
const filterStatus = $('#filterStatus');
const sortBy = $('#sortBy');
const addStudentBtn = $('#addStudentBtn');
const addStudentBtnEmpty = $('#addStudentBtnEmpty');
const exportCsvBtn = $('#exportCsvBtn');
const resetDemoBtn = $('#resetDemoBtn');
const toast = $('#toast');

// Dialog elements
const dialog = $('#studentDialog');
const form = $('#studentForm');
const dialogTitle = $('#dialogTitle');
const studentIdHidden = $('#studentIdHidden');
const nameInput = $('#nameInput');
const idInput = $('#idInput');
const classInput = $('#classInput');
const emailInput = $('#emailInput');
const statusInput = $('#statusInput');
const avatarInput = $('#avatarInput');
const deleteStudentBtn = $('#deleteStudentBtn');
const cancelBtn = $('#cancelBtn');
const closeDialogBtn = $('#closeDialogBtn');

// Profile elements
const profilePanel = $('#profilePanel');
const closeProfile = $('#closeProfile');
const profileAvatar = $('#profileAvatar');
const profileName = $('#profileName');
const profileId = $('#profileId');
const profileClass = $('#profileClass');
const profileEmail = $('#profileEmail');
const profileStatus = $('#profileStatus');
const profileHistory = $('#profileHistory');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function toCSV(rows) {
  const header = ['id','name','class','email','status'];
  const lines = [header.join(',')].concat(rows.map(r => header.map(h => '"' + String(r[h]??'').replaceAll('"','""') + '"').join(',')));
  return lines.join('\n');
}

function uniqueClasses(list) {
  return Array.from(new Set(list.map(x => x.class))).sort();
}

function populateFilters() {
  const classes = uniqueClasses(students);
  filterClass.innerHTML = '<option value="">All</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function applyFilters(list) {
  let out = list.slice();
  const q = filters.search.trim().toLowerCase();
  if (q) out = out.filter(s => [s.name,s.id,s.class,s.email].some(v => String(v).toLowerCase().includes(q)));
  if (filters.cls) out = out.filter(s => s.class === filters.cls);
  if (filters.status) out = out.filter(s => s.status === filters.status);
  const s = filters.sortBy;
  out.sort((a,b) => String(a[s]).localeCompare(String(b[s])));
  return out;
}

function renderList() {
  const data = applyFilters(students);
  emptyState.classList.toggle('hidden', data.length !== 0);
  grid.innerHTML = data.map(s => cardTemplate(s)).join('');
  $$('.card', grid).forEach(card => {
    card.addEventListener('click', () => openProfile(card.dataset.id));
  });
}

function cardTemplate(s) {
  return `
  <article class="card" role="listitem" tabindex="0" data-id="${s.id}">
    <div class="row">
      <div class="row" style="gap:12px">
        <img class="avatar" src="${s.avatar || 'assets/avatars/default.jpg'}" alt="${s.name} avatar" />
        <div>
          <h3 class="title">${s.name}</h3>
          <div class="muted">${s.id} • ${s.class}</div>
        </div>
      </div>
      <span class="badge">${s.status}</span>
    </div>
    <div class="muted">${s.email}</div>
    <div class="row">
      <button class="btn ghost" data-action="edit" onclick="event.stopPropagation(); window.SMS.edit('${s.id}')">Edit</button>
      <button class="btn danger" data-action="delete" onclick="event.stopPropagation(); window.SMS.remove('${s.id}')">Delete</button>
    </div>
  </article>`;
}

function openDialog(mode, student=null) {
  dialogTitle.textContent = mode === 'edit' ? 'Edit student' : 'Add student';
  deleteStudentBtn.hidden = mode !== 'edit';
  if (student) {
    studentIdHidden.value = student.id;
    nameInput.value = student.name;
    idInput.value = student.id;
    classInput.value = student.class;
    emailInput.value = student.email;
    statusInput.value = student.status;
    avatarInput.value = '';
  } else {
    studentIdHidden.value = '';
    form.reset();
    statusInput.value = 'active';
  }
  if (!dialog.open) dialog.showModal();
  nameInput.focus();
}

function dataURLFromFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

async function collectFormData() {
  const name = nameInput.value.trim();
  const sid = idInput.value.trim();
  const cls = classInput.value.trim();
  const email = emailInput.value.trim();
  const status = statusInput.value;
  if (!name || !sid || !cls || !email) throw new Error('Please fill all required fields.');
  let avatar = null;
  if (avatarInput.files && avatarInput.files[0]) {
    try { avatar = await dataURLFromFile(avatarInput.files[0]); } catch {}
  }
  return { id: sid, name, class: cls, email, status, avatar };
}

function upsertStudent(stu) {
  const index = students.findIndex(s => s.id === stu.id);
  if (index >= 0) {
    students[index] = { ...students[index], ...stu };
    students[index].history = [ `Updated ${new Date().toLocaleString()}`, ...(students[index].history||[]) ];
  } else {
    students.push({ ...stu, history: [ `Created ${new Date().toLocaleString()}` ] });
  }
  writeStudents(students);
  populateFilters();
  renderList();
}

function removeStudent(id) {
  const idx = students.findIndex(s => s.id === id);
  if (idx < 0) return;
  if (!confirm('Delete this student?')) return;
  const [removed] = students.splice(idx, 1);
  writeStudents(students);
  renderList();
  if (profileOpen && profileId.textContent === removed.id) toggleProfile(false);
  showToast('Student deleted');
}

function openProfile(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  profileAvatar.src = s.avatar || 'assets/avatars/default.jpg';
  profileName.textContent = s.name;
  profileId.textContent = s.id;
  profileClass.textContent = s.class;
  profileEmail.textContent = s.email;
  profileEmail.href = `mailto:${s.email}`;
  profileStatus.textContent = s.status;
  profileHistory.innerHTML = (s.history||[]).map(h => `<li>${h}</li>`).join('') || '<li>No activity yet</li>';
  toggleProfile(true);
}

function toggleProfile(open) {
  profileOpen = open;
  profilePanel.classList.toggle('open', open);
  profilePanel.setAttribute('aria-hidden', String(!open));
}

function resetDemo() {
  if (!confirm('Reset demo data to defaults?')) return;
  writeStudents(DemoData);
  students = ensureData();
  populateFilters();
  renderList();
  showToast('Demo data restored');
}

function exportCsv() {
  const csv = toCSV(applyFilters(students));
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'students.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Wire up events
document.addEventListener('DOMContentLoaded', () => {
  populateFilters();
  renderList();

  searchInput.addEventListener('input', e => { filters.search = e.target.value; renderList(); });
  filterClass.addEventListener('change', e => { filters.cls = e.target.value; renderList(); });
  filterStatus.addEventListener('change', e => { filters.status = e.target.value; renderList(); });
  sortBy.addEventListener('change', e => { filters.sortBy = e.target.value; renderList(); });

  addStudentBtn.addEventListener('click', () => openDialog('add'));
  addStudentBtnEmpty.addEventListener('click', () => openDialog('add'));
  exportCsvBtn.addEventListener('click', exportCsv);
  resetDemoBtn.addEventListener('click', resetDemo);

  deleteStudentBtn.addEventListener('click', () => {
    const id = studentIdHidden.value;
    if (!id) return;
    dialog.close();
    setTimeout(() => removeStudent(id), 50);
  });

  cancelBtn.addEventListener('click', () => dialog.close());
  closeDialogBtn.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await collectFormData();
      upsertStudent(data);
      dialog.close();
      showToast('Saved');
    } catch (err) {
      alert(err.message || 'Validation failed');
    }
  });

  closeProfile.addEventListener('click', () => toggleProfile(false));
});

// Expose imperative handlers for inline card buttons
window.SMS = {
  edit(id) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    openDialog('edit', s);
  },
  remove: removeStudent
};

// 3D toggle
const toggle3d = document.getElementById('toggle3d');
const hero = document.getElementById('three-header');
if (toggle3d) {
  toggle3d.addEventListener('change', () => {
    const enabled = toggle3d.checked;
    if (enabled) {
      hero.classList.remove('fallback');
      window.ThreeBG && window.ThreeBG.enable();
    } else {
      window.ThreeBG && window.ThreeBG.disable();
      hero.classList.add('fallback');
    }
  });
}
