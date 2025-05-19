let transactions = [];
let editingTransactionId = null;

function formatNumber(v) {
  return v.toLocaleString('es-CO');
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved);
  }
}

document.getElementById('transaction-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const raw = document.getElementById('amount').value;
  const amount = parseInt(raw.replace(/\D/g, ''), 10);

  if (!description || !type || !category || isNaN(amount) || amount <= 0) {
    Swal.fire('Error', 'Por favor completa todos los campos correctamente.', 'error');
    return;
  }

  const tx = {
    id: editingTransactionId || Date.now(),
    type,
    category,
    description,
    amount,
    date: new Date().toISOString().split('T')[0]
  };

  if (editingTransactionId) {
    const i = transactions.findIndex(t => t.id === editingTransactionId);
    transactions[i] = tx;
    editingTransactionId = null;
    Swal.fire('Editado', 'Transacción actualizada.', 'success');
  } else {
    transactions.push(tx);
    Swal.fire('Agregado', 'Transacción creada.', 'success');
  }

  saveTransactions();
  this.reset();
  renderTransactions();
  updateSummary();
  updateChart();
});

// Actualiza gráfico cuando cambia el filtro de tipo de gráfico
document.getElementById('chart-type').addEventListener('change', updateChart);

// Cambios en filtros que afectan la lista y resumen
['filter-type', 'filter-category', 'filter-date'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => {
    renderTransactions();
    updateSummary();
    updateChart();
  })
);

function renderTransactions() {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  const fType = document.getElementById('filter-type').value;
  const fCat = document.getElementById('filter-category').value;
  const fDate = document.getElementById('filter-date').value;

  transactions
    .filter(t =>
      (!fType || t.type === fType) &&
      (!fCat || t.category === fCat) &&
      (!fDate || t.date === fDate)
    )
    .forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${t.description}</td>
      <td>${t.category}</td>
      <td>${t.type}</td>
      <td>${formatNumber(t.amount)}</td>
      <td>${t.date}</td>
      <td>
        <button onclick="viewTransaction(${t.id})">Ver</button>
        <button onclick="editTransaction(${t.id})">Editar</button>
        <button onclick="deleteTransaction(${t.id})">Eliminar</button>
      </td>`;
      tbody.appendChild(tr);
    });
}
function exportToCSV() {
  if (transactions.length === 0) {
    Swal.fire('Atención', 'No hay transacciones para exportar.', 'info');
    return;
  }

  let csvContent = "Reporte de Transacciones\n\n";

  // Sección: Ingresos
  csvContent += "Ingresos\n";
  csvContent += "ID,Tipo,Categoría,Descripción,Monto,Fecha\n";
  const ingresos = transactions.filter(t => t.type === 'ingreso');
  ingresos.forEach(t => {
    csvContent += `${t.id},${t.type},${t.category},"${t.description}",${parseFloat(t.amount).toFixed(2)},${t.date}\n`;
  });

  csvContent += "\n";

  // Sección: Gastos
  csvContent += "Gastos\n";
  csvContent += "ID,Tipo,Categoría,Descripción,Monto,Fecha\n";
  const gastos = transactions.filter(t => t.type === 'gasto');
  gastos.forEach(t => {
    csvContent += `${t.id},${t.type},${t.category},"${t.description}",${parseFloat(t.amount).toFixed(2)},${t.date}\n`;
  });

  csvContent += "\n";

  // Sección: Resumen
  const totalIngresos = ingresos.reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalGastos = gastos.reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const balance = totalIngresos - totalGastos;

  csvContent += "Resumen\n";
  csvContent += `Total Ingresos:,${totalIngresos.toFixed(2)}\n`;
  csvContent += `Total Gastos:,${totalGastos.toFixed(2)}\n`;
  csvContent += `Balance:,${balance.toFixed(2)}\n`;

  // Generar archivo y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_financiero.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}



document.getElementById('import-csv').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const lines = event.target.result.split('\n').map(l => l.trim()).filter(l => l);
    const [header, ...data] = lines;

    const imported = [];

    for (const line of data) {
      const [id, type, category, description, amount, date] = line.split(',');

      if (!type || !category || !description || isNaN(parseInt(amount))) continue;

      imported.push({
        id: parseInt(id) || Date.now() + Math.floor(Math.random() * 1000),
        type,
        category,
        description,
        amount: parseInt(amount),
        date: date || new Date().toISOString().split('T')[0]
      });
    }

    transactions = [...transactions, ...imported];
    Swal.fire('Importado', `${imported.length} transacciones añadidas.`, 'success');
    renderTransactions();
    updateSummary();
    updateChart();
  };

  reader.readAsText(file);
});


function viewTransaction(id) {
  const t = transactions.find(x => x.id === id);
  Swal.fire({
    title: 'Detalle',
    html: `
      <p><strong>Desc.:</strong> ${t.description}</p>
      <p><strong>Cat.:</strong> ${t.category}</p>
      <p><strong>Tipo:</strong> ${t.type}</p>
      <p><strong>Monto:</strong> ${formatNumber(t.amount)}</p>
      <p><strong>Fecha:</strong> ${t.date}</p>`
  });
}

function editTransaction(id) {
  const t = transactions.find(x => x.id === id);
  document.getElementById('type').value = t.type;
  document.getElementById('category').value = t.category;
  document.getElementById('description').value = t.description;
  document.getElementById('amount').value = formatNumber(t.amount);
  editingTransactionId = id;
}

function deleteTransaction(id) {
  Swal.fire({
    title: '¿Eliminar?',
    text: '¡No podrás revertir esto!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (res.isConfirmed) {
      transactions = transactions.filter(x => x.id !== id);
      saveTransactions();
      renderTransactions();
      updateSummary();
      updateChart();
      Swal.fire('Eliminado', 'Transacción borrada.', 'success');
    }
  });
}

function updateSummary() {
  const ingreso = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const gasto = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const saldo = ingreso - gasto;
  document.getElementById('category-summary').innerHTML = `
    <p><strong>Ingresos:</strong> ${formatNumber(ingreso)}</p>
    <p><strong>Gastos:</strong> ${formatNumber(gasto)}</p>
    <p><strong>Saldo:</strong> ${formatNumber(saldo)}</p>`;
}

function updateChart() {
  const chartType = document.getElementById('chart-type').value;
  const filterCategory = document.getElementById('filter-category').value;

  const ctx = document.getElementById('category-chart').getContext('2d');

  if (window.chartInstance) {
    window.chartInstance.destroy();
  }

  // Para tamaño controlado más pequeño
  ctx.canvas.width = 400;
  ctx.canvas.height = 300;

  if (chartType === 'todos') {
    // Agrupar ingresos y gastos por categoría, tomando en cuenta filtro de categoría
    const ingresos = transactions
      .filter(t => t.type === 'ingreso' && (!filterCategory || t.category === filterCategory))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const gastos = transactions
      .filter(t => t.type === 'gasto' && (!filterCategory || t.category === filterCategory))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Unión de categorías de ingresos y gastos para labels
    const labelsSet = new Set([...Object.keys(ingresos), ...Object.keys(gastos)]);
    const labels = Array.from(labelsSet);

    // Datos para cada tipo
    const ingresosData = labels.map(cat => ingresos[cat] || 0);
    const gastosData = labels.map(cat => gastos[cat] || 0);

    if (labels.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    window.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            backgroundColor: '#36A2EB'
          },
          {
            label: 'Gastos',
            data: gastosData,
            backgroundColor: '#FF6384'
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 14 } } }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  } else {
    // Caso ingreso o gasto: gráfico pie con categorías sumadas
    let filteredTx = transactions.filter(t => t.type === chartType);
    if (filterCategory) {
      filteredTx = filteredTx.filter(t => t.category === filterCategory);
    }

    const grouped = filteredTx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    if (labels.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    window.chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#7DCEA0', '#E59866', '#9B59B6', '#3498DB', '#E74C3C'
          ]
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 14 } } }
        }
      }
    });
  }
}

// Carga datos y dibuja al iniciar
loadTransactions();
renderTransactions();
updateSummary();
updateChart();
