// НАЧАЛЬНЫЕ БАЛАНСЫ
const initialBalances = {
    RUB: 100000,
    USD: 1000,
    EUR: 500,
    ARS: 50000,
    BTC: 0.05,
    ETH: 1,
    USDT: 300
};

// СПИСОК ОПЕРАЦИЙ
const operations = [];

// ЭКРАНЫ
const initialScreen = document.getElementById("initialScreen");
const addScreen = document.getElementById("addScreen");
const finalScreen = document.getElementById("finalScreen");

// КНОПКИ
const btnInitial = document.getElementById("btnInitial");
const btnAdd = document.getElementById("btnAdd");
const btnFinal = document.getElementById("btnFinal");

// ДАННЫЕ
const initialBalancesEl = document.getElementById("initialBalances");
const finalBalancesEl = document.getElementById("finalBalances");
const operationsListEl = document.getElementById("operationsList");

const amountInput = document.getElementById("amount");
const currencySelect = document.getElementById("currency");
const typeSelect = document.getElementById("type");
const addButton = document.getElementById("addBtn");

// === НАВИГАЦИЯ ===
function showScreen(screen) {
    initialScreen.classList.add("hidden");
    addScreen.classList.add("hidden");
    finalScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

btnInitial.addEventListener("click", () => showScreen(initialScreen));
btnAdd.addEventListener("click", () => showScreen(addScreen));
btnFinal.addEventListener("click", () => showScreen(finalScreen));

// === РЕНДЕР НАЧАЛЬНЫХ БАЛАНСОВ ===
function renderInitialBalances() {
    initialBalancesEl.innerHTML = "";

    for (let currency in initialBalances) {
        const li = document.createElement("li");
        li.textContent = `${initialBalances[currency]} ${currency}`;
        initialBalancesEl.appendChild(li);
    }
}

// === РЕНДЕР ОПЕРАЦИЙ ===
function renderOperations() {
    operationsListEl.innerHTML = "";

    operations.forEach(op => {
        const li = document.createElement("li");
        li.textContent =
            (op.type === "income" ? "+" : "-") +
            op.amount +
            " " +
            op.currency;
        operationsListEl.appendChild(li);
    });
}

// === РЕНДЕР КОНЕЧНЫХ БАЛАНСОВ ===
function renderFinalBalances() {
    finalBalancesEl.innerHTML = "";

    const finalBalances = { ...initialBalances };

    operations.forEach(op => {
        if (op.type === "income") {
            finalBalances[op.currency] += op.amount;
        } else {
            finalBalances[op.currency] -= op.amount;
        }
    });

    for (let currency in finalBalances) {
        const li = document.createElement("li");
        li.textContent = `${finalBalances[currency]} ${currency}`;
        finalBalancesEl.appendChild(li);
    }
}

// === ДОБАВЛЕНИЕ ОПЕРАЦИИ ===
addButton.addEventListener("click", function () {
    const amount = Number(amountInput.value);
    const currency = currencySelect.value;
    const type = typeSelect.value;

    if (amount <= 0) {
        alert("Введите корректную сумму");
        return;
    }

    operations.push({ amount, currency, type });

    amountInput.value = "";

    renderOperations();
    renderFinalBalances();
});

// === СТАРТ ===
renderInitialBalances();
renderFinalBalances();
// НИЧЕГО НЕ ПОКАЗЫВАЕМ НА СТАРТЕ