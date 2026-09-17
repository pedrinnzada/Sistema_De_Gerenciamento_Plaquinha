(function() {
  var STORAGE_KEY = 'plaquinhas-nfc-state-v1';

  var defaultState = {
    unitPrice: 25,
    stock: 100,
    goal: 3000,
    sellers: [
      { name: 'Pedro', sales: 0 },
      { name: 'José', sales: 0 }
    ],
    expenses: []
  };

  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultState));
      var parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(defaultState)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable, continue silently */ }
  }

  function brl(n) {
    if (isNaN(n)) n = 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function totalSales() {
    return state.sellers.reduce(function(sum, s) { return sum + (Number(s.sales) || 0); }, 0);
  }

  function faturamento() {
    return totalSales() * (Number(state.unitPrice) || 0);
  }

  function totalExpenses() {
    return state.expenses.reduce(function(sum, e) { return sum + (Number(e.value) || 0); }, 0);
  }

  function render() {
    var fat = faturamento();
    var gastos = totalExpenses();
    var lucro = fat - gastos;

    document.getElementById('faturamentoDisplay').textContent = brl(fat);
    document.getElementById('goalText').textContent = 'Meta: ' + brl(state.goal);
    var pct = state.goal > 0 ? Math.min(100, (fat / state.goal) * 100) : 0;
    document.getElementById('progressFill').style.width = pct + '%';

    document.getElementById('stockRemainingDisplay').textContent =
      (state.stock - totalSales()) + ' de ' + state.stock;
    document.getElementById('stockInput').value = state.stock;

    document.getElementById('unitPriceDisplay').textContent = brl(state.unitPrice);
    document.getElementById('unitPriceInput').value = state.unitPrice;

    renderSellers();
    renderExpenses();

    document.getElementById('expensesTotalDisplay').textContent = brl(gastos);
    document.getElementById('resumoFaturamento').textContent = brl(fat);
    document.getElementById('resumoGastos').textContent = '- ' + brl(gastos);
    var lucroEl = document.getElementById('resumoLucro');
    lucroEl.textContent = brl(lucro);
    lucroEl.className = 'val ' + (lucro >= 0 ? 'pos' : 'neg');
  }

  function renderSellers() {
    var grid = document.getElementById('sellersGrid');
    grid.innerHTML = '';
    state.sellers.forEach(function(seller, idx) {
      var card = document.createElement('div');
      card.className = 'card seller-card';

      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'seller-name';
      nameInput.value = seller.name;
      nameInput.addEventListener('change', function() {
        state.sellers[idx].name = nameInput.value || ('Vendedor ' + (idx + 1));
        saveState();
        render();
      });

      var row = document.createElement('div');
      row.className = 'counter-row';

      var minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'counter-btn';
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', function() {
        state.sellers[idx].sales = Math.max(0, (Number(state.sellers[idx].sales) || 0) - 1);
        saveState();
        render();
      });

      var countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.min = '0';
      countInput.step = '1';
      countInput.value = seller.sales;
      countInput.addEventListener('change', function() {
        var v = Math.max(0, Number(countInput.value) || 0);
        state.sellers[idx].sales = v;
        saveState();
        render();
      });

      var plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'counter-btn';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', function() {
        state.sellers[idx].sales = (Number(state.sellers[idx].sales) || 0) + 1;
        saveState();
        render();
      });

      row.appendChild(minusBtn);
      row.appendChild(countInput);
      row.appendChild(plusBtn);

      var subtotal = document.createElement('div');
      subtotal.className = 'seller-subtotal';
      var sub = (Number(seller.sales) || 0) * (Number(state.unitPrice) || 0);
      subtotal.innerHTML = 'Subtotal: <strong>' + brl(sub) + '</strong>';

      card.appendChild(nameInput);
      card.appendChild(row);
      card.appendChild(subtotal);
      grid.appendChild(card);
    });
  }

  function renderExpenses() {
    var list = document.getElementById('expensesList');
    list.innerHTML = '';
    if (state.expenses.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'Nenhum gasto adicionado ainda.';
      list.appendChild(empty);
      return;
    }
    state.expenses.forEach(function(exp, idx) {
      var row = document.createElement('div');
      row.className = 'expense-row';

      var desc = document.createElement('span');
      desc.className = 'expense-desc';
      desc.textContent = exp.desc;

      var val = document.createElement('span');
      val.className = 'expense-value';
      val.textContent = brl(exp.value);

      var del = document.createElement('button');
      del.className = 'expense-del';
      del.type = 'button';
      del.setAttribute('aria-label', 'Remover gasto');
      del.textContent = '✕';
      del.addEventListener('click', function() {
        state.expenses.splice(idx, 1);
        saveState();
        render();
      });

      row.appendChild(desc);
      row.appendChild(val);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  // Static field listeners
  document.getElementById('stockInput').addEventListener('change', function(e) {
    state.stock = Math.max(0, Number(e.target.value) || 0);
    saveState();
    render();
  });

  document.getElementById('unitPriceInput').addEventListener('change', function(e) {
    state.unitPrice = Math.max(0, Number(e.target.value) || 0);
    saveState();
    render();
  });

  var goalEditBox = document.getElementById('goalEdit');
  document.getElementById('toggleGoalEdit').addEventListener('click', function() {
    goalEditBox.classList.toggle('open');
    document.getElementById('goalInput').value = state.goal;
    if (goalEditBox.classList.contains('open')) {
      document.getElementById('goalInput').focus();
    }
  });
  document.getElementById('saveGoal').addEventListener('click', function() {
    var v = Number(document.getElementById('goalInput').value);
    if (!isNaN(v) && v >= 0) {
      state.goal = v;
      saveState();
      render();
      goalEditBox.classList.remove('open');
    }
  });

  document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var descEl = e.target.elements['desc'];
    var valueEl = e.target.elements['value'];
    var desc = descEl.value.trim();
    var value = Number(valueEl.value);
    if (!desc || isNaN(value) || value < 0) return;
    state.expenses.push({ desc: desc, value: value });
    saveState();
    render();
    e.target.reset();
    descEl.focus();
  });

  render();
})();