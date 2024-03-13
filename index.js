let debitBalance = 0.0;
let creditBalance = 0.0;

let arrayTransactions = [];

function renderTransaction(transactionData) {
  console.log("Array transaction:" + transactionData);
  const transaction = document.createElement("div");
  transaction.classList.add("transaction");
  transaction.id = `transaction-${transactionData.id}`;

  const name = document.createElement("input");
  name.classList.add("input-transaction-list");
  name.id = "i-transaction-name";
  name.value = transactionData.name;

  const value = document.createElement("input");
  value.classList.add("input-transaction-list");
  value.id = "i-transaction-value";
  value.value = transactionData.value;

  const type = document.createElement("input");
  type.classList.add("input-transaction-list");
  type.id = "i-transaction-type";
  if (transactionData.type == "entrada") {
    type.value = "entrada";
    creditBalance += parseFloat(transactionData.value);
  } else {
    type.value = "saida";
    debitBalance += parseFloat(transactionData.value);
  }

  const buttonD = document.createElement("button");
  buttonD.classList.add("button-content");
  buttonD.classList.add("form-button");
  buttonD.id = "b-delete";
  buttonD.textContent = "Deletar";
  buttonD.addEventListener("click", deleteTransaction);

  const buttonAt = document.createElement("button");
  buttonAt.classList.add("button-content");
  buttonAt.classList.add("form-button");
  buttonAt.id = "b-att";
  buttonAt.textContent = "Atualizar";
  buttonAt.addEventListener("click", attTransaction);

  transaction.append(name, value, type, buttonD, buttonAt);

  document.querySelector(".all-transactions").appendChild(transaction);

  const debitText = document.querySelector("#debit-balance");
  debitText.innerText = `R$ ${debitBalance.toFixed(2)}`;

  const creditBalanceText = document.querySelector("#credit-balance");
  creditBalanceText.innerText = `R$ ${creditBalance.toFixed(2)}`;

  const totalBalance = document.querySelector("#total-balance");
  totalBalance.innerText = `R$ ${(creditBalance - debitBalance).toFixed(2)}`;
}

async function fetchTransaction() {
  const transactions = await fetch("http://localhost:3000/transactions").then(
    (res) => res.json()
  );
  arrayTransactions.push(...transactions);
  console.log(arrayTransactions);
  arrayTransactions.forEach(renderTransaction);
}
document.addEventListener("DOMContentLoaded", () => {
  fetchTransaction();
});

const form = document.querySelector("form");

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const transactionData = {
    name: document.querySelector("#input-name").value,
    type: document.querySelector("#select-type").value,
    value: document.querySelector("#input-value").value,
  };

  const response = await fetch("http://localhost:3000/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transactionData),
  });

  const savedTransiction = await response.json();
  arrayTransactions.push(savedTransiction);
  form.reset();
  renderTransaction(savedTransiction);
  console.log(arrayTransactions);
});

async function deleteTransaction(ev) {
  const transactionId = ev.target.parentElement.id.split("-")[1];

  try {
    const response = await fetch(
      `http://localhost:3000/transactions/${transactionId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      const transactionElement = document.getElementById(
        `transaction-${transactionId}`
      );
      transactionElement.remove();
      const removedTransactionType = transactionElement.querySelector(
        "#i-transaction-type"
      ).value;

      const removedTransactionValue = parseFloat(
        transactionElement.querySelector("#i-transaction-value").value
      );
      if (removedTransactionType == "entrada") {
        creditBalance -= removedTransactionValue;
      } else {
        debitBalance -= removedTransactionValue;
      }

      const debitText = document.querySelector("#debit-balance");
      debitText.innerText = `R$ ${debitBalance.toFixed(2)}`;

      const creditBalanceText = document.querySelector("#credit-balance");
      creditBalanceText.innerText = `R$ ${creditBalance.toFixed(2)}`;

      const totalBalance = document.querySelector("#total-balance");
      totalBalance.innerText = `R$ ${(creditBalance - debitBalance).toFixed(
        2
      )}`;
      const indexToRemove = arrayTransactions.findIndex((t) => t.id === id);
      arrayTransactions.splice(indexToRemove, 1);
      console.log(arrayTransactions);
    } else {
      alert("Erro ao deletar transação:", response.statusText);
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

function validateTransactionData(data) {
  if (!data.name || !data.type || !data.value) {
    throw new Error("Dados da transação incompletos!");
  }

  if (isNaN(data.value)) {
    throw new Error("Valor da transação inválido!");
  }

  return true;
}

async function updateTransactionAPI(transactionId, data) {
  const response = await fetch(
    `http://localhost:3000/transactions/${transactionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao atualizar transação: ${response.statusText}`);
  }

  return await response.json();
}

async function attTransaction(ev) {
  try {
    const transactionId = ev.target.parentElement.id.split("-")[1];
    const transactionData = {
      name: document
        .getElementById(`transaction-${transactionId}`)
        .querySelector("#i-transaction-name").value,
      type: document
        .getElementById(`transaction-${transactionId}`)
        .querySelector("#i-transaction-type").value,
      value: document
        .getElementById(`transaction-${transactionId}`)
        .querySelector("#i-transaction-value").value,
    };

    validateTransactionData(transactionData);

    const updatedTransaction = await updateTransactionAPI(
      transactionId,
      transactionData
    );
    const OldTransaction = arrayTransactions.find(
      (element) => element.id === transactionId
    );
    arrayTransactions.splice(transactionData, 1, transactionData);
    document.querySelector(`#transaction-${transactionId}`).remove();

    if (OldTransaction.type !== transactionData.type) {
      if (transactionData.type == "entrada") {
        debitBalance -= parseFloat(OldTransaction.value);
      } else {
        creditBalance -= parseFloat(OldTransaction.value);
      }
    }

    renderTransaction(updatedTransaction);
  } catch (error) {
    console.error("Erro:", error);
    alert(error.message);
  }
}

const buttonDeleteAll = document.querySelector(".header-button");
buttonDeleteAll.addEventListener("click", deleteAllTransactions);

async function deleteAllTransactions(ev) {
  console.log("clicou em deletar tudo!");
  try {
    // Loop para percorrer o array allTransactions
    for (const transaction of arrayTransactions) {
      const response = await fetch(
        `http://localhost:3000/transactions/${transaction.id}`,
        {
          method: "DELETE",
        }
      );

      // Verificação do status da resposta
      if (!response.ok) {
        console.error(
          `Erro ao excluir transação ${transaction.id}:`,
          response.statusText
        );
        // Retorna para interromper a execução do loop
        return;
      }
    }

    console.log("Todas as transações foram excluídas com sucesso!");
    arrayTransactions.length = 0;
    window.location.reload();
  } catch (error) {
    console.error("Erro:", error);
  }
}
