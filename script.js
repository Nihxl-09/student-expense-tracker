const STORAGE_KEY = "spendly-expenses";

const expenseForm = document.querySelector("#expenseForm");
const expenseTitle = document.querySelector("#expenseTitle");
const expenseAmount = document.querySelector("#expenseAmount");
const expenseCategory = document.querySelector("#expenseCategory");
const expenseDate = document.querySelector("#expenseDate");
const expenseList = document.querySelector("#expenseList");
const totalAmount = document.querySelector("#totalAmount");
const transactionCount = document.querySelector("#transactionCount");
const topCategory = document.querySelector("#topCategory");
const clearAllButton = document.querySelector("#clearAllButton");

let expenses = loadExpenses();

expenseDate.value = getToday();
render();

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = expenseTitle.value.trim();
  const amount = Number(expenseAmount.value);
  const category = expenseCategory.value;
  const date = expenseDate.value;

  if (!title || !amount || amount <= 0 || !category || !date) {
    return;
  }

  const newExpense = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title,
    amount,
    category,
    date
  };

  expenses.unshift(newExpense);
  saveExpenses();
  render();

  expenseForm.reset();
  expenseDate.value = getToday();
  expenseTitle.focus();
});

clearAllButton.addEventListener("click", () => {
  if (expenses.length === 0) {
    return;
  }

  const confirmed = window.confirm("Delete all expenses?");
  if (!confirmed) {
    return;
  }

  expenses = [];
  saveExpenses();
  render();
});

function loadExpenses() {
  try {
    const savedExpenses = localStorage.getItem(STORAGE_KEY);
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  } catch (error) {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function render() {
  updateSummary();
  renderExpenseList();
}

function updateSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  totalAmount.textContent = formatCurrency(total);
  transactionCount.textContent = expenses.length;
  topCategory.textContent = getTopCategory();
}

function getTopCategory() {
  if (expenses.length === 0) {
    return "—";
  }

  const categoryCounts = expenses.reduce((counts, expense) => {
    counts[expense.category] = (counts[expense.category] || 0) + 1;
    return counts;
  }, {});

  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

function renderExpenseList() {
  if (expenses.length === 0) {
    expenseList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">₹</div>
        <h3>No expenses yet</h3>
        <p>Add your first expense to start tracking.</p>
      </div>
    `;
    return;
  }

  expenseList.innerHTML = expenses
    .map((expense) => `
      <article class="expense-item">
        <div class="expense-info">
          <div class="category-icon">${getCategoryInitial(expense.category)}</div>
          <div>
            <p class="expense-name">${escapeHTML(expense.title)}</p>
            <p class="expense-meta">
              ${escapeHTML(expense.category)} · ${formatDate(expense.date)}
            </p>
          </div>
        </div>

        <div class="expense-right">
          <span class="expense-amount">${formatCurrency(expense.amount)}</span>
          <button
            class="delete-button"
            type="button"
            data-id="${expense.id}"
          >
            Delete
          </button>
        </div>
      </article>
    `)
    .join("");

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      deleteExpense(button.dataset.id);
    });
  });
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function getToday() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function getCategoryInitial(category) {
  return category.charAt(0).toUpperCase();
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return characters[character];
  });
}