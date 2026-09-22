const API_BASE = '/api/v1/orders';

const createForm = document.getElementById('create-form');
const viewForm = document.getElementById('view-form');
const cancelBtn = document.getElementById('cancel-btn');
const resultEl = document.getElementById('result');
const orderTypeSelect = document.getElementById('create-orderType');
const priceInput = document.getElementById('create-price');

function showResult(data) {
  resultEl.textContent = JSON.stringify(data, null, 2);
}

function togglePriceField() {
  const isMarket = orderTypeSelect.value === 'MARKET';
  priceInput.disabled = isMarket;
  if (isMarket) {
    priceInput.value = '';
  }
}

orderTypeSelect.addEventListener('change', togglePriceField);
togglePriceField();

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const orderType = orderTypeSelect.value;
  const payload = {
    clientId: document.getElementById('create-clientId').value,
    symbol: document.getElementById('create-symbol').value,
    side: document.getElementById('create-side').value,
    orderType,
    quantity: Number(document.getElementById('create-quantity').value),
  };
  if (orderType === 'LIMIT') {
    payload.price = Number(priceInput.value);
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    showResult(data);
    if (response.ok) {
      document.getElementById('order-orderId').value = data.orderId;
      document.getElementById('order-clientId').value = data.clientId;
    }
  } catch (err) {
    showResult({ code: 'CLIENT_ERROR', message: err.message });
  }
});

viewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const orderId = document.getElementById('order-orderId').value;
  const clientId = document.getElementById('order-clientId').value;
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(orderId)}?clientId=${encodeURIComponent(clientId)}`);
    const data = await response.json();
    showResult(data);
  } catch (err) {
    showResult({ code: 'CLIENT_ERROR', message: err.message });
  }
});

cancelBtn.addEventListener('click', async () => {
  const orderId = document.getElementById('order-orderId').value;
  const clientId = document.getElementById('order-clientId').value;
  try {
    const response = await fetch(
      `${API_BASE}/${encodeURIComponent(orderId)}/cancel?clientId=${encodeURIComponent(clientId)}`,
      { method: 'POST' },
    );
    const data = await response.json();
    showResult(data);
  } catch (err) {
    showResult({ code: 'CLIENT_ERROR', message: err.message });
  }
});
