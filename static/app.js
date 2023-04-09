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

    document.addEventListener('keydown', handleKeyPress);

    taskInput.addEventListener('focus', () => {
      deselectTaskItems();
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
      
      
      function handleKeyPress(event) {
        if (event.key === 'Tab') {
          event.preventDefault(); // Prevent default tab behavior
          if (document.activeElement === taskInput) {
            // Move focus to the first task item
            taskInput.blur();
            const firstItem = taskList.querySelector('li');
            if (firstItem) {
              firstItem.classList.add('selected');
              firstItem.focus();
            }
          } else {
            // Move focus back to the input box
            taskInput.focus();
            deselectTaskItems();
          }
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const currentItem = document.querySelector('.selected');
          let nextItem = null;
          if (event.key === 'ArrowUp') {
            nextItem = currentItem.previousElementSibling || taskList.lastElementChild;
          } else {
            nextItem = currentItem.nextElementSibling || taskList.firstElementChild;
          }
          currentItem.classList.remove('selected');
          currentItem.blur();
          nextItem.classList.add('selected');
          nextItem.focus();
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
          const currentItem = document.querySelector('.selected');
          const nextItem = currentItem.nextElementSibling || taskList.firstElementChild;
          const taskId = currentItem.dataset.taskId;
          removeTask(taskId);
          if (nextItem) {
            nextItem.classList.add('selected');
            nextItem.focus();
          }
        }

        if (event.key === 'Enter') {

          if (document.activeElement === taskInput) {
            // Enter key was pressed
            if (taskInput.value.trim()) {
              addTask(taskInput.value.trim());
              taskInput.value = '';
            }
          }
          else {
            const currentItem = document.querySelector('.selected');
            const taskId = currentItem.dataset.taskId;
            toggleTaskDone(taskId);
          }
        }
        
      }

    function deselectTaskItems() {
      const selectedItems = document.querySelectorAll('.selected');
      selectedItems.forEach((item) => {
        item.classList.remove('selected');
        item.blur();
      });
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
      listItem.addEventListener('click', (event) => {
        // Don't trigger when clicking on buttons inside the list item
        if (!event.target.classList.contains('btn')) {
          deselectTaskItems();
          taskInput.blur();
          listItem.classList.add('selected');
          listItem.focus();
        }
      });
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
  