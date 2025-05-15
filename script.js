let transactions = [];
let editingTransactionId = null;

// Enviar formulario
document.getElementById('transaction-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (!description || isNaN(amount) || amount <= 0) {
    alert('Por favor completa correctamente todos los campos.');
    return;
  }

  if (editingTransactionId) {
    // Editar transacción existente
    const txIndex = transactions.findIndex(tx => tx.id === editingTransactionId);
    transactions[txIndex] = {
      id: editingTransactionId,
      type,
      category,
      description,
      amount,
      date: new Date().toLocaleDateString()
    };
    editingTransactionId = null;
  } else {
    // Agregar nueva transacción
    const transaction = {
      id: Date.now(),
      type,
      category,
      description,
      amount,
      date: new Date().toLocaleDateString()
    };
    transactions.push(transaction);
  }

  document.getElementById('transaction-form').reset();
  renderTransactions();
  updateSummary();
  updateChart();
});

// Renderizar tablas
function renderTransactions() {
  const tableBody = document.querySelector('#transactions-table tbody');
  tableBody.innerHTML = '';

  transactions.forEach(tx => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tx.description}</td>
      <td>${tx.category}</td>
      <td>${tx.type}</td>
      <td>${tx.amount.toFixed(2)}</td>
      <td>${tx.date}</td>
      <td>
        <button class="view" onclick="viewTransaction(${tx.id})">Ver</button>
        <button class="edit" onclick="editTransaction(${tx.id})">Editar</button>
        <button class="delete" onclick="deleteTransaction(${tx.id})">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}


// Ver transacción
function viewTransaction(id) {
  const tx = transactions.find(tx => tx.id === id);
  alert(`Descripción: ${tx.description}\nCategoría: ${tx.category}\nMonto: $${tx.amount.toFixed(2)}\nFecha: ${tx.date}`);
}

// Editar transacción
function editTransaction(id) {
  const tx = transactions.find(tx => tx.id === id);
  document.getElementById('type').value = tx.type;
  document.getElementById('category').value = tx.category;
  document.getElementById('description').value = tx.description;
  document.getElementById('amount').value = tx.amount;
  editingTransactionId = id;
}

// Eliminar transacción
function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  renderTransactions();
  updateSummary();
  updateChart();
}

// Actualizar resumen
function updateSummary() {
  const total = transactions.reduce((acc, tx) => {
    return tx.type === 'ingreso' ? acc + tx.amount : acc - tx.amount;
  }, 0);
  document.getElementById('category-summary').innerHTML = `<p><strong>Saldo Total:</strong> $${total.toFixed(2)}</p>`;
}

// Actualizar gráfico
function updateChart() {
  const gastosPorCategoria = transactions
    .filter(tx => tx.type === 'gasto')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

  const labels = Object.keys(gastosPorCategoria);
  const data = Object.values(gastosPorCategoria);
  const ctx = document.getElementById('category-chart').getContext('2d');

  if (window.chartInstance) window.chartInstance.destroy();

  window.chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#7DCEA0', '#E59866'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}
