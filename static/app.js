document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
  
    // Load tasks from the server
    loadTasks();
  
    addTaskButton.addEventListener('click', () => {
      if (taskInput.value.trim()) {
        addTask(taskInput.value.trim());
        taskInput.value = '';
      }
    });

    taskInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        // Enter key was pressed
        if (taskInput.value.trim()) {
          addTask(taskInput.value.trim());
          taskInput.value = '';
        }
      }
    });
  
    taskList.addEventListener('click', (event) => {
      const listItem = event.target.parentElement.parentElement;
      const taskId = listItem.dataset.taskId;
  
      if (event.target.classList.contains('delete-task')) {
        removeTask(taskId);
      } else if (event.target.classList.contains('mark-task')) {
        toggleTaskDone(taskId);
      }
    });
  
    async function loadTasks() {
      const response = await fetch('/tasks');
      const tasks = await response.json();
      tasks.forEach((task) => {
        const listItem = createListItem(task);
        taskList.appendChild(listItem);
      });
    }
  
    async function addTask(taskText) {
        const task = { title: taskText, done: false };
        const response = await fetch('/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        });
        if (response.status === 200) {
          const newTask = await response.json();
          const listItem = createListItem(newTask);
          taskList.appendChild(listItem);
        } else {
          console.error('Error adding task:', response.statusText);
        }
      }
      
  
    function createListItem(task) {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
      listItem.dataset.taskId = task.id;
      if (task.done) {
        listItem.classList.add('done');
        listItem.classList.add('list-group-item-success');
      }
      listItem.innerHTML = `
        ${task.title}
        <div>
          <button class="btn btn-success btn-sm mark-task">${task.done ? 'Not Done' : 'Done'}</button>
          <button class="btn btn-danger btn-sm delete-task">Delete</button>
        </div>
      `;
      return listItem;
    }
  
    async function removeTask(taskId) {
      await fetch(`/tasks/${taskId}`, { method: 'DELETE' });
      const listItem = taskList.querySelector(`[data-task-id="${taskId}"]`);
      taskList.removeChild(listItem);
    }
  
    async function toggleTaskDone(taskId) {
      const listItem = taskList.querySelector(`[data-task-id="${taskId}"]`);
      listItem.classList.toggle('done');
      listItem.classList.toggle('list-group-item-success');
      const markTaskButton = listItem.querySelector('.mark-task');
      if (listItem.classList.contains('done')) {
        markTaskButton.textContent = 'Not Done';
      } else {
        markTaskButton.textContent = 'Done';
      }
      await fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: listItem.classList.contains('done') })
      });
    }
  });
  