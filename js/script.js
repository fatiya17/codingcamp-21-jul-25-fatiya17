// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDateInput = document.getElementById('taskDate');
const taskTableBody = document.getElementById('taskTableBody');
const filterButton = document.querySelector('.filter-button');
const deleteButton = document.querySelector('.delete-button');
const statusButton = document.querySelector('.status-button');

// Task data storage
let tasks = [];
let filterStatus = 'all'; // 'all', 'pending', 'ongoing', 'done'
let editingTaskId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load tasks from localStorage if available
    loadTasksFromStorage();
    renderTasks();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    taskDateInput.value = today;
    
    // Create edit modal
    createEditModal();
});

// Form submission handler
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    const date = taskDateInput.value;
    
    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select a due date', 'error');
        return;
    }
    
    // Add new task or update existing
    if (editingTaskId) {
        updateTask(editingTaskId, title, date);
        editingTaskId = null;
    } else {
        addTask(title, date);
    }
    
    // Reset form
    taskForm.reset();
    
    // Set today's date as default again
    const today = new Date().toISOString().split('T')[0];
    taskDateInput.value = today;
    
    showNotification('Task saved successfully!', 'success');
});

// Add new task function
function addTask(title, date) {
    const newTask = {
        id: Date.now(),
        title: title,
        date: date,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
}

// Update existing task
function updateTask(taskId, title, date) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.title = title;
        task.date = date;
        saveTasksToStorage();
        renderTasks();
    }
}

// Save tasks to localStorage
function saveTasksToStorage() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem('todoTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Render tasks to the table
function renderTasks() {
    // Hancurkan instance Choices yang lama jika ada (jika Anda menggunakannya)
    if (window.choiceInstances && choiceInstances.length > 0) {
        choiceInstances.forEach(instance => instance.destroy());
        choiceInstances = [];
    }

    taskTableBody.innerHTML = '';

    // 1. Urutkan tugas berdasarkan tanggal (dari yang paling dekat ke paling jauh)
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Filter tugas dari array yang SUDAH diurutkan
    let filteredTasks = sortedTasks;
    if (filterStatus !== 'all') {
        filteredTasks = sortedTasks.filter(task => task.status === filterStatus);
    }

    // 3. Render tugas yang sudah diurutkan dan difilter
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = getEmptyStateMessage();
        taskTableBody.appendChild(emptyState);
    } else {
        filteredTasks.forEach(task => {
            const taskRow = createTaskRow(task);
            taskTableBody.appendChild(taskRow);
        });
    }
}

// Get appropriate empty state message
function getEmptyStateMessage() {
    if (tasks.length === 0) {
        return 'No tasks yet! Add your first task above.';
    } else if (filterStatus === 'pending') {
        return 'No pending tasks. Great job!';
    } else if (filterStatus === 'ongoing') {
        return 'No ongoing tasks.';
    } else if (filterStatus === 'done') {
        return 'No completed tasks yet.';
    }
    return 'No tasks found.';
}

// Create task row element
function createTaskRow(task) {
    const row = document.createElement('div');
    row.className = 'task-row'; // Just the class name, no inline style

    // Task title
    const titleCell = document.createElement('div');
    titleCell.textContent = task.title;
    titleCell.className = 'task-cell';
    titleCell.setAttribute('data-label', 'Task'); // Data label for mobile view

    // Due date
    const dateCell = document.createElement('div');
    dateCell.textContent = formatDate(task.date);
    dateCell.className = 'task-cell';
    dateCell.setAttribute('data-label', 'Due Date'); // Data label for mobile view

    // Status dropdown
    const statusCell = document.createElement('div');
    statusCell.className = 'task-cell task-cell--status';
    statusCell.setAttribute('data-label', 'Status'); // Data label for mobile view
    const statusSelect = document.createElement('select');
    statusSelect.value = task.status;
    statusSelect.className = `status-select ${task.status}`;
    statusSelect.addEventListener('change', function() {
        const oldStatus = task.status;
        updateTaskStatus(task.id, this.value);
        if (this.parentElement) {
            this.className = `status-select ${this.value}`;
        }
    });
    const statusOptions = [
        { value: 'pending', text: 'Pending' },
        { value: 'ongoing', text: 'Ongoing' },
        { value: 'done', text: 'Done' }
    ];
    statusOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        statusSelect.appendChild(opt);
    });
    statusCell.appendChild(statusSelect);

    // Action buttons
    const actionCell = document.createElement('div');
    actionCell.className = 'task-cell task-cell--actions';
    actionCell.setAttribute('data-label', 'Action'); // Data label for mobile view

    // Delete button (red X)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => showDeleteConfirmation(task.id));

    // Edit button (pencil)
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
    editBtn.title = 'Edit task';
    editBtn.addEventListener('click', () => openEditModal(task));

    // Done button (checkmark)
    const doneBtn = document.createElement('button');
    doneBtn.className = 'action-btn done-btn';
    doneBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    doneBtn.title = 'Mark as done';
    doneBtn.addEventListener('click', () => showDoneConfirmation(task.id));

    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(editBtn);
    actionCell.appendChild(doneBtn);

    // Add cells to row
    row.appendChild(titleCell);
    row.appendChild(dateCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);
    return row;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// Update task status
function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const oldStatus = task.status;
        task.status = newStatus;
        saveTasksToStorage();

        if (filterStatus !== 'all' && oldStatus !== newStatus) {
            renderTasks(); // Re-render if the task should disappear from the current filter
        }
        
        showNotification(`Task status updated to ${newStatus}`, 'success');
    }
}

// Create edit modal
function createEditModal() {
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal-overlay';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="add-task-container" style="margin-bottom: 0; border: none;">
                <form id="editTaskForm">
                    <div class="form-group-horizontal">
                        <div class="icon-wrapper">
                            <i class="fa-solid fa-pen-to-square form-icon"></i>
                        </div>
                        <div class="input-wrapper">
                            <label for="editTaskTitle" class="form-label">Edit Task</label>
                            <input type="text" id="editTaskTitle" class="form-input" placeholder="Enter task title..." required>
                        </div>
                    </div>

                    <div class="form-group-horizontal">
                        <div class="icon-wrapper">
                            <i class="fa-solid fa-calendar-days form-icon"></i>
                        </div>
                        <div class="input-wrapper">
                            <label for="editTaskDate" class="form-label">Date</label>
                            <input type="date" id="editTaskDate" class="form-input">
                        </div>
                    </div>

                    <button type="submit" class="add-button">Update Task</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const editTaskForm = document.getElementById('editTaskForm');
    editTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateTaskFromModal();
    });
}

// Open edit modal
function openEditModal(task) {
    const modal = document.getElementById('editModal');
    const titleInput = document.getElementById('editTaskTitle');
    const dateInput = document.getElementById('editTaskDate');
    
    titleInput.value = task.title;
    dateInput.value = task.date;
    editingTaskId = task.id;
    
    modal.classList.add('is-visible');
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('is-visible');
    editingTaskId = null;
}

// Update task from modal
function updateTaskFromModal() {
    const titleInput = document.getElementById('editTaskTitle');
    const dateInput = document.getElementById('editTaskDate');
    
    const title = titleInput.value.trim();
    const date = dateInput.value;
    
    if (!title || !date) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    updateTask(editingTaskId, title, date);
    closeEditModal();
    showNotification('Task updated successfully!', 'success');
}

// Show delete confirmation
function showDeleteConfirmation(taskId) {
    showConfirmationModal(
        'Delete Confirmation',
        `Are you sure you want to delete this task?`,
        '<i class="fa-solid fa-triangle-exclamation"></i>',
        'Delete',
        'Cancel',
        () => deleteTask(taskId)
    );
}

// Show done confirmation
function showDoneConfirmation(taskId) {
    showConfirmationModal(
        'Done Task',
        `Ready to check it off?`,
        '<i class="fa-solid fa-clipboard-check"></i>',
        'Done',
        'Not yet',
        () => markTaskAsDone(taskId)
    );
}

// Generic confirmation modal
function showConfirmationModal(title, message, icon, confirmText, cancelText, onConfirm) {
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal-overlay is-visible';
    modal.innerHTML = `
        <div class="confirmation-modal">
            <div class="confirmation-header">
                <span class="confirmation-icon">${icon}</span>
                <h3>${title}</h3>
            </div>
            <p class="confirmation-message">${message}</p>
            <div class="confirmation-buttons">
                <button id="confirmBtn" class="confirm-btn">${confirmText}</button>
                <button id="cancelBtn" class="cancel-btn">${cancelText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById('confirmBtn').onclick = () => {
        onConfirm();
        closeConfirmationModal();
    };
    document.getElementById('cancelBtn').onclick = closeConfirmationModal;
}

// Close confirmation modal
function closeConfirmationModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.remove();
    }
}

// Mark task as done
function markTaskAsDone(taskId) {
    updateTaskStatus(taskId, 'done');
    showNotification('Task completed, Nice work!', 'success', '<i class="fa-regular fa-face-smile"></i>');
}

// Delete task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToStorage();
    renderTasks();
    showNotification('Successfully removed from your list', 'success', '<i class="fa-solid fa-triangle-exclamation"></i>');
}

// Delete All Tasks
function deleteAllTasks() { 
    if (tasks.length === 0) {
        showNotification('There are no tasks to delete', 'info');
        return;
    }
    
    showConfirmationModal(
        'Delete All Tasks', 
        `Are you sure you want to delete all ${tasks.length} tasks? This action cannot be undone.`,
        '<i class="fa-solid fa-triangle-exclamation"></i>',
        'Delete All',
        'Cancel',
        () => {
            tasks = []; 
            saveTasksToStorage();
            renderTasks();
            showNotification('All tasks have been successfully deleted', 'success', '<i class="fa-solid fa-trash-can"></i>');
        }
    );
}

// Filter tasks
function toggleFilter() {
    const filterCycle = ['all', 'pending', 'ongoing', 'done'];
    let currentIndex = filterCycle.indexOf(filterStatus);
    filterStatus = filterCycle[(currentIndex + 1) % filterCycle.length];

    if (filterStatus === 'all') {
        filterButton.innerHTML = '<span>Filter</span><i class="fa-solid fa-filter" style="margin-left: 8px;"></i>';
    } else {
        const capitalized = filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1);
        filterButton.innerHTML = `<span>${capitalized}</span><i class="fa-solid fa-filter" style="margin-left: 8px;"></i>`;
    }
    
    renderTasks();
}

// Show notification
function showNotification(message, type, customIcon = null) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    let icon = customIcon || getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-text">${message}</span>
        </div>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get icon based on notification type
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '<i class="fa-solid fa-check"></i>';
        case 'error': return '<i class="fa-solid fa-triangle-exclamation"></i>';
        case 'info': return '<i class="fa-solid fa-circle-info"></i>';
        default: return '<i class="fa-solid fa-bell"></i>';
    }
}

// Click outside to close modals
document.addEventListener('click', function(e) {
    if (e.target.matches('.modal-overlay')) {
        closeEditModal();
        closeConfirmationModal();
    }
});