let transactions = [];
let editingTransactionId = null;

// formateo 200000 → "200.000"
function formatNumber(v) {
  return v.toLocaleString('es-CO');
}

document.getElementById('transaction-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const raw = document.getElementById('amount').value;
  const amount = parseInt(raw.replace(/\D/g, ''), 10);

  if (!description || isNaN(amount) || amount <= 0) {
    Swal.fire('Error', 'Por favor completa todos los campos correctamente.', 'error');
    return;
  }

  const tx = {
    id: editingTransactionId || Date.now(),
    type, category, description, amount,
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

  this.reset();
  renderTransactions();
  updateSummary();
  updateChart();
});

['filter-type','filter-category','filter-date'].forEach(id =>
  document.getElementById(id).addEventListener('change', renderTransactions)
);

function renderTransactions() {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  const fType = document.getElementById('filter-type').value;
  const fCat  = document.getElementById('filter-category').value;
  const fDate = document.getElementById('filter-date').value;

  transactions.filter(t =>
    (!fType  || t.type === fType) &&
    (!fCat   || t.category === fCat) &&
    (!fDate  || t.date === fDate)
  ).forEach(t => {
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
      renderTransactions();
      updateSummary();
      updateChart();
      Swal.fire('Eliminado', 'Transacción borrada.', 'success');
    }
  });
}

function updateSummary() {
  const ingreso = transactions.filter(t=>t.type==='ingreso').reduce((s,t)=>s+t.amount,0);
  const gasto   = transactions.filter(t=>t.type==='gasto').reduce((s,t)=>s+t.amount,0);
  const saldo   = ingreso - gasto;
  document.getElementById('category-summary').innerHTML = `
    <p><strong>Ingresos:</strong> ${formatNumber(ingreso)}</p>
    <p><strong>Gastos:</strong> ${formatNumber(gasto)}</p>
    <p><strong>Saldo:</strong> ${formatNumber(saldo)}</p>`;
}

function updateChart() {
  const grp = transactions.filter(t=>t.type==='gasto').reduce((a,t)=>{
    a[t.category]=(a[t.category]||0)+t.amount; return a;
  },{});
  const labels = Object.keys(grp), data = Object.values(grp);
  const ctx = document.getElementById('category-chart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();
  window.chartInstance = new Chart(ctx,{type:'pie',data:{labels,datasets:[{data,backgroundColor:['#FF6384','#36A2EB','#FFCE56','#7DCEA0','#E59866']}]}});  
}

// Inicial
renderTransactions();
updateSummary();
updateChart();
