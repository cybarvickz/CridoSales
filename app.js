/* =========================
   CRIDOSALES
   Sales + Debt Manager
========================= */


/* ---------- DATA ---------- */

let sales = JSON.parse(
  localStorage.getItem("crido_sales") || "[]"
);

let payments = JSON.parse(
  localStorage.getItem("crido_payments") || "[]"
);


/* Date currently shown in the Sales History view */
let historyDate = todayKey();


/* Month currently shown in the Reports view (YYYY-MM) */
let reportMonth = todayKey().slice(0, 7);


/* ---------- HELPERS ---------- */

function saveData() {
  localStorage.setItem(
    "crido_sales",
    JSON.stringify(sales)
  );

  localStorage.setItem(
    "crido_payments",
    JSON.stringify(payments)
  );

  render();
}


function money(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}


function todayKey() {
  const d = new Date();

  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}


function formatDate() {
  return new Date().toLocaleDateString(
    "en-NG",
    {
      weekday: "short",
      day: "numeric",
      month: "short"
    }
  );
}


function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------- TOAST ---------- */

function toast(message, type) {

  let container =
    document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const el = document.createElement("div");

  el.className = "toast" + (type ? " " + type : "");

  el.innerText = message;

  container.appendChild(el);

  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 300);
  }, 2200);

}


/* ---------- ADD SALE ---------- */

function addSale(isDebt) {

  const itemInput =
    document.getElementById("itemName");

  const priceInput =
    document.getElementById("itemPrice");

  const customerInput =
    document.getElementById("custName");


  const name = itemInput.value.trim();

  const price = Number(priceInput.value);

  const cust = customerInput.value.trim();


  if (!name) {
    toast("Enter the item name.", "error");
    return;
  }


  if (!price || price <= 0) {
    toast("Enter a valid price.", "error");
    return;
  }


  if (isDebt && !cust) {
    toast("Enter the customer's name for a credit sale.", "error");
    return;
  }


  const sale = {

    id: Date.now(),

    name: name,

    price: price,

    cust: isDebt ? cust : "Cash",

    debt: isDebt,

    date: todayKey(),

    time: new Date().toLocaleTimeString(
      "en-NG",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  };


  sales.push(sale);


  itemInput.value = "";
  priceInput.value = "";
  customerInput.value = "";


  saveData();


  toast(
    isDebt
      ? "Credit sale recorded."
      : "Cash sale recorded.",
    "success"
  );
}


/* ---------- TODAY'S SALES ---------- */

function renderSales() {

  const list =
    document.getElementById("salesList");

  const today =
    todayKey();


  const todaySales =
    sales.filter(s => s.date === today);


  list.innerHTML = "";


  document.getElementById("salesCount")
    .innerText = todaySales.length;


  if (todaySales.length === 0) {

    list.innerHTML =
      `<div class="empty">
        No sales recorded today.
      </div>`;

    return;
  }


  todaySales
    .slice()
    .reverse()
    .forEach(s => {

      const div =
        document.createElement("div");

      div.className = "item";


      const type =
        s.debt
          ? `<span class="badge credit">Credit</span>`
          : `<span class="badge cash">Cash</span>`;


      div.innerHTML = `

        <div class="item-info">

          <div class="item-name">
            ${escapeHTML(s.name)}
            ${type}
          </div>

          <div class="item-customer">
            ${escapeHTML(s.cust)}
            · ${escapeHTML(s.time)}
          </div>

        </div>

        <div class="item-right">

          <div class="item-price">
            ${money(s.price)}
          </div>

          <button
            class="receipt-button"
            onclick="openReceipt(${s.id})"
            title="Receipt">
            🧾
          </button>

          <button
            class="edit-button"
            onclick="openEditSale(${s.id})"
            title="Edit sale">
            ✎
          </button>

          <button
            class="delete-button"
            onclick="deleteSale(${s.id})"
            title="Delete sale">
            ✕
          </button>

        </div>

      `;


      list.appendChild(div);

    });
}


/* ---------- CUSTOMER BALANCES ---------- */

function getCustomerBalance(customer) {

  const normalized =
    customer.trim().toLowerCase();


  const credit =
    sales
      .filter(
        s =>
          s.debt &&
          s.cust.trim().toLowerCase() === normalized
      )
      .reduce(
        (sum, s) => sum + Number(s.price),
        0
      );


  const paid =
    payments
      .filter(
        p =>
          p.customer.trim().toLowerCase() === normalized
      )
      .reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );


  return credit - paid;
}


/* ---------- DEBTORS ---------- */

function renderDebtors() {

  const debtDiv =
    document.getElementById("debtList");

  const search =
    document.getElementById("searchCustomer")
      .value
      .trim()
      .toLowerCase();


  debtDiv.innerHTML = "";


  const customers = {};


  sales
    .filter(s => s.debt)
    .forEach(s => {

      const key =
        s.cust.trim().toLowerCase();

      if (!customers[key]) {
        customers[key] = s.cust.trim();
      }

    });


  const debtorNames =
    Object.values(customers)
      .filter(name => {

        const balance =
          getCustomerBalance(name);

        return balance > 0;

      })
      .filter(name =>
        name.toLowerCase().includes(search)
      );


  document.getElementById("debtorCount")
    .innerText = debtorNames.length;


  if (debtorNames.length === 0) {

    debtDiv.innerHTML =
      `<div class="empty">
        No outstanding debts found.
      </div>`;

    return;
  }


  debtorNames.forEach(customer => {

    const balance =
      getCustomerBalance(customer);


    const div =
      document.createElement("div");

    div.className = "debtor";


    div.innerHTML = `

      <div class="debtor-top">

        <span class="debtor-name">
          ${escapeHTML(customer)}
        </span>

        <span class="owing">
          ${money(balance)}
        </span>

      </div>

      <div class="debtor-actions">

        <button
          class="small-button"
          onclick='fillPayment("${escapeHTML(customer)}")'>
          Record Payment
        </button>

        <button
          class="small-button view-button"
          onclick='openCustomer("${escapeHTML(customer)}")'>
          View
        </button>

      </div>

    `;


    debtDiv.appendChild(div);

  });
}


/* ---------- RECORD PAYMENT ---------- */

function recordPayment() {

  const customerInput =
    document.getElementById("paymentCustomer");

  const amountInput =
    document.getElementById("paymentAmount");


  const customer =
    customerInput.value.trim();

  const amount =
    Number(amountInput.value);


  if (!customer) {

    toast("Enter the customer's name.", "error");

    return;
  }


  if (!amount || amount <= 0) {

    toast("Enter a valid payment amount.", "error");

    return;
  }


  const balance =
    getCustomerBalance(customer);


  if (balance <= 0) {

    toast("This customer does not have an outstanding debt.", "error");

    return;
  }


  if (amount > balance) {

    toast(
      `Customer currently owes ${money(balance)}.`,
      "error"
    );

    return;
  }


  payments.push({

    id: Date.now(),

    customer: customer,

    amount: amount,

    date: todayKey(),

    time: new Date().toLocaleTimeString(
      "en-NG",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  });


  customerInput.value = "";
  amountInput.value = "";


  saveData();


  toast("Payment recorded.", "success");

}


/* ---------- FILL PAYMENT FORM ---------- */

function fillPayment(customer) {

  document.getElementById(
    "paymentCustomer"
  ).value = customer;


  document.getElementById(
    "paymentAmount"
  ).focus();

}


/* ---------- SUMMARY ---------- */

function renderSummary() {

  const today =
    todayKey();


  const todaySales =
    sales.filter(
      s => s.date === today
    );


  const total =
    todaySales.reduce(
      (sum, s) => sum + Number(s.price),
      0
    );


  const credit =
    todaySales
      .filter(s => s.debt)
      .reduce(
        (sum, s) => sum + Number(s.price),
        0
      );


  let totalOwed = 0;


  const customers = {};


  sales
    .filter(s => s.debt)
    .forEach(s => {

      const key =
        s.cust.trim().toLowerCase();

      customers[key] = s.cust.trim();

    });


  Object.values(customers)
    .forEach(customer => {

      const balance =
        getCustomerBalance(customer);

      if (balance > 0) {
        totalOwed += balance;
      }

    });


  document.getElementById(
    "todayTotal"
  ).innerText = money(total);


  document.getElementById(
    "todayDebt"
  ).innerText = money(credit);


  document.getElementById(
    "totalOwed"
  ).innerText = money(totalOwed);

}


/* ---------- DELETE SALE ---------- */

function deleteSale(id) {

  const sale =
    sales.find(s => s.id === id);

  if (!sale) return;


  const answer =
    confirm(
      `Delete "${sale.name}" (${money(sale.price)})? This cannot be undone.`
    );

  if (!answer) return;


  sales = sales.filter(s => s.id !== id);

  saveData();

}


/* ---------- SALES HISTORY ---------- */

function dateKeyFrom(dateObj) {
  return dateObj.getFullYear() + "-" +
    String(dateObj.getMonth() + 1).padStart(2, "0") + "-" +
    String(dateObj.getDate()).padStart(2, "0");
}


function formatHistoryDate(key) {

  const parts = key.split("-");

  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return d.toLocaleDateString(
    "en-NG",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


function changeHistoryDay(offset) {

  const parts = historyDate.split("-");

  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  d.setDate(d.getDate() + offset);

  historyDate = dateKeyFrom(d);

  renderHistory();

}


function jumpToDate(value) {

  const jumpInput =
    document.getElementById("jumpDate");

  if (!value) {

    historyDate = todayKey();

    if (jumpInput) jumpInput.value = "";

  } else {

    historyDate = value;

  }

  /* Clear any active search so the chosen day shows fully */
  const searchInput =
    document.getElementById("searchHistory");

  if (searchInput) searchInput.value = "";

  renderHistory();

}


function renderHistory() {

  const list =
    document.getElementById("historyList");

  const searchInput =
    document.getElementById("searchHistory");

  const query =
    searchInput ? searchInput.value.trim().toLowerCase() : "";


  let daySales;

  if (query) {

    daySales =
      sales.filter(s => {

        return (
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.cust && s.cust.toLowerCase().includes(query))
        );

      });

    document.getElementById("historyDate")
      .innerText = `Results for "${searchInput.value.trim()}"`;

  } else {

    daySales =
      sales.filter(s => s.date === historyDate);

    document.getElementById("historyDate")
      .innerText = formatHistoryDate(historyDate);

  }


  document.getElementById("historyCount")
    .innerText = daySales.length;


  const total =
    daySales.reduce(
      (sum, s) => sum + Number(s.price),
      0
    );


  const credit =
    daySales
      .filter(s => s.debt)
      .reduce(
        (sum, s) => sum + Number(s.price),
        0
      );


  document.getElementById("historyTotal")
    .innerText = money(total);

  document.getElementById("historyDebt")
    .innerText = money(credit);

  document.getElementById("historyCash")
    .innerText = money(total - credit);


  list.innerHTML = "";


  if (daySales.length === 0) {

    list.innerHTML =
      `<div class="empty">
        No sales recorded on this day.
      </div>`;

    return;
  }


  daySales
    .slice()
    .reverse()
    .forEach(s => {

      const div =
        document.createElement("div");

      div.className = "item";


      const type =
        s.debt
          ? `<span class="badge credit">Credit</span>`
          : `<span class="badge cash">Cash</span>`;


      div.innerHTML = `

        <div class="item-info">

          <div class="item-name">
            ${escapeHTML(s.name)}
            ${type}
          </div>

          <div class="item-customer">
            ${escapeHTML(s.cust)}
            · ${formatHistoryDate(s.date)}
            · ${escapeHTML(s.time)}
          </div>

        </div>

        <div class="item-right">

          <div class="item-price">
            ${money(s.price)}
          </div>

          <button
            class="receipt-button"
            onclick="openReceipt(${s.id})"
            title="Receipt">
            🧾
          </button>

          <button
            class="edit-button"
            onclick="openEditSale(${s.id})"
            title="Edit sale">
            ✎
          </button>

          <button
            class="delete-button"
            onclick="deleteSale(${s.id})"
            title="Delete sale">
            ✕
          </button>

        </div>

      `;


      list.appendChild(div);

    });
}


/* ---------- PAYMENT HISTORY ---------- */

function renderPayments() {

  const list =
    document.getElementById("paymentList");

  if (!list) return;

  list.innerHTML = "";

  document.getElementById("paymentCount")
    .innerText = payments.length;

  if (payments.length === 0) {

    list.innerHTML =
      `<div class="empty">
        No payments recorded yet.
      </div>`;

    return;
  }

  payments
    .slice()
    .reverse()
    .forEach(p => {

      const div =
        document.createElement("div");

      div.className = "item payment-item";

      div.innerHTML = `

        <div class="item-info">

          <div class="item-name">
            ${escapeHTML(p.customer)}
            <span class="badge paid-badge">Payment</span>
          </div>

          <div class="item-customer">
            ${formatHistoryDate(p.date)}
            · ${escapeHTML(p.time)}
          </div>

        </div>

        <div class="item-right">

          <div class="item-price paid">
            ${money(p.amount)}
          </div>

          <button
            class="delete-button"
            onclick="deletePayment(${p.id})"
            title="Delete payment">
            ✕
          </button>

        </div>

      `;

      list.appendChild(div);

    });
}


/* ---------- DELETE PAYMENT ---------- */

function deletePayment(id) {

  const payment =
    payments.find(p => p.id === id);

  if (!payment) return;

  const answer =
    confirm(
      `Delete payment of ${money(payment.amount)} from "${payment.customer}"? This cannot be undone.`
    );

  if (!answer) return;

  payments = payments.filter(p => p.id !== id);

  saveData();

}


/* ---------- CUSTOMER DETAIL VIEW ---------- */

let activeCustomer = null;
let activeCustomerTab = "credit";


function openCustomer(customer) {

  activeCustomer = customer;
  activeCustomerTab = "credit";

  document.getElementById("customerModalName")
    .innerText = customer;

  document.getElementById("customerModalBalance")
    .innerText = money(getCustomerBalance(customer));

  switchCustomerTab("credit");

  document.getElementById("customerModal")
    .classList.add("open");

}


function closeCustomer(event) {

  if (event && event.target !== event.currentTarget) {
    return;
  }

  document.getElementById("customerModal")
    .classList.remove("open");

  activeCustomer = null;

}


function switchCustomerTab(tab) {

  activeCustomerTab = tab;

  document.getElementById("tabCredit")
    .classList.toggle("active", tab === "credit");

  document.getElementById("tabPayments")
    .classList.toggle("active", tab === "payments");

  renderCustomerModal();

}


function renderCustomerModal() {

  if (!activeCustomer) return;

  const body =
    document.getElementById("customerModalBody");

  const normalized =
    activeCustomer.trim().toLowerCase();

  body.innerHTML = "";

  if (activeCustomerTab === "credit") {

    const creditSales =
      sales.filter(
        s =>
          s.debt &&
          s.cust.trim().toLowerCase() === normalized
      );


    if (creditSales.length === 0) {

      body.innerHTML =
        `<div class="empty">
          No credit sales for this customer.
        </div>`;

      return;
    }


    creditSales
      .slice()
      .reverse()
      .forEach(s => {

        const div =
          document.createElement("div");

        div.className = "item";

        div.innerHTML = `

          <div class="item-info">

            <div class="item-name">
              ${escapeHTML(s.name)}
            </div>

            <div class="item-customer">
              ${formatHistoryDate(s.date)}
              · ${escapeHTML(s.time)}
            </div>

          </div>

          <div class="item-right">

            <div class="item-price">
              ${money(s.price)}
            </div>

          </div>

        `;

        body.appendChild(div);

      });

    return;
  }


  /* payments tab */

  const customerPayments =
    payments.filter(
      p =>
        p.customer.trim().toLowerCase() === normalized
    );


  if (customerPayments.length === 0) {

    body.innerHTML =
      `<div class="empty">
        No payments recorded for this customer.
      </div>`;

    return;
  }


  customerPayments
    .slice()
    .reverse()
    .forEach(p => {

      const div =
        document.createElement("div");

      div.className = "item";

      div.innerHTML = `

        <div class="item-info">

          <div class="item-name">
            Payment
          </div>

          <div class="item-customer">
            ${formatHistoryDate(p.date)}
            · ${escapeHTML(p.time)}
          </div>

        </div>

        <div class="item-right">

          <div class="item-price paid">
            ${money(p.amount)}
          </div>

        </div>

      `;

      body.appendChild(div);

    });

}


/* ---------- BACKUP & RESTORE ---------- */

function exportData() {

  const backup = {

    app: "CridoSales",

    version: 1,

    exportedAt: new Date().toISOString(),

    sales: sales,

    payments: payments

  };


  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );


  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download =
    "cridosales-backup-" + todayKey() + ".json";

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);


  toast("Backup downloaded.", "success");

}


function importData(event) {

  const file =
    event.target.files && event.target.files[0];

  if (!file) return;


  const reader = new FileReader();


  reader.onload = function (e) {

    try {

      const data =
        JSON.parse(e.target.result);

      const importedSales =
        Array.isArray(data) ? data : data.sales;

      const importedPayments =
        Array.isArray(data) ? [] : (data.payments || []);


      if (!Array.isArray(importedSales)) {
        throw new Error("Invalid backup file.");
      }


      const answer =
        confirm(
          `Restore backup with ${importedSales.length} sale(s) and ${importedPayments.length} payment(s)? This will replace your current data.`
        );

      if (!answer) return;


      sales = importedSales;

      payments = importedPayments;

      saveData();

      toast("Backup restored.", "success");

    } catch (err) {

      toast("Could not read this backup file.", "error");

    }


    event.target.value = "";

  };


  reader.readAsText(file);

}


/* ---------- EDIT SALE ---------- */

let editingSaleId = null;


function openEditSale(id) {

  const sale =
    sales.find(s => s.id === id);

  if (!sale) return;

  editingSaleId = id;

  document.getElementById("editItemName").value = sale.name;
  document.getElementById("editItemPrice").value = sale.price;
  document.getElementById("editCustName").value =
    sale.debt ? sale.cust : "";

  document.getElementById("editModal")
    .classList.add("open");

}


function closeEditSale(event) {

  if (event && event.target !== event.currentTarget) {
    return;
  }

  document.getElementById("editModal")
    .classList.remove("open");

  editingSaleId = null;

}


function saveEditSale() {

  const sale =
    sales.find(s => s.id === editingSaleId);

  if (!sale) return;


  const name =
    document.getElementById("editItemName").value.trim();

  const price =
    Number(document.getElementById("editItemPrice").value);

  const cust =
    document.getElementById("editCustName").value.trim();


  if (!name) {
    toast("Enter the item name.", "error");
    return;
  }

  if (!price || price <= 0) {
    toast("Enter a valid price.", "error");
    return;
  }

  if (sale.debt && !cust) {
    toast("Enter the customer's name for a credit sale.", "error");
    return;
  }


  sale.name = name;

  sale.price = price;

  if (sale.debt) {
    sale.cust = cust;
  }


  saveData();

  closeEditSale();

  toast("Sale updated.", "success");

}


/* ---------- CUSTOMER STATEMENT ---------- */

function shareStatement() {

  if (!activeCustomer) return;

  const customer = activeCustomer;

  const normalized =
    customer.trim().toLowerCase();


  const creditSales =
    sales
      .filter(
        s =>
          s.debt &&
          s.cust.trim().toLowerCase() === normalized
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));


  const customerPayments =
    payments
      .filter(
        p => p.customer.trim().toLowerCase() === normalized
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));


  const lines = [];

  lines.push("CRIDOSALES STATEMENT");
  lines.push("Customer: " + customer);
  lines.push("Date: " + formatDate());
  lines.push("----------------------------");

  lines.push("");
  lines.push("CREDIT SALES:");
  if (creditSales.length === 0) {
    lines.push("  (none)");
  } else {
    creditSales.forEach(s => {
      lines.push(
        "  " + formatHistoryDate(s.date) +
        " - " + s.name +
        " - " + money(s.price)
      );
    });
  }

  lines.push("");
  lines.push("PAYMENTS:");
  if (customerPayments.length === 0) {
    lines.push("  (none)");
  } else {
    customerPayments.forEach(p => {
      lines.push(
        "  " + formatHistoryDate(p.date) +
        " - " + money(p.amount)
      );
    });
  }

  lines.push("");
  lines.push("----------------------------");
  lines.push("OUTSTANDING BALANCE: " + money(getCustomerBalance(customer)));
  lines.push("");
  lines.push("Built @ Cridonix Technologies");

  const text = lines.join("\n");


  if (navigator.share) {

    navigator.share({
      title: "CridoSales Statement - " + customer,
      text: text
    }).catch(() => {});

  } else if (navigator.clipboard) {

    navigator.clipboard.writeText(text)
      .then(() => toast("Statement copied to clipboard.", "success"))
      .catch(() => toast("Could not copy statement.", "error"));

  } else {

    toast("Sharing is not supported on this device.", "error");

  }

}


/* ---------- RECEIPT ---------- */

let receiptSaleId = null;


function openReceipt(id) {

  const sale =
    sales.find(s => s.id === id);

  if (!sale) return;

  receiptSaleId = id;

  const body =
    document.getElementById("receiptBody");

  const type =
    sale.debt ? "Credit" : "Cash";

  body.innerHTML = `

    <div class="receipt" id="receiptPrint">

      <div class="receipt-head">
        <h2>CridoSales</h2>
        <p>Sales Receipt</p>
      </div>

      <div class="receipt-line">
        <span>Item</span>
        <strong>${escapeHTML(sale.name)}</strong>
      </div>

      <div class="receipt-line">
        <span>Customer</span>
        <strong>${escapeHTML(sale.cust)}</strong>
      </div>

      <div class="receipt-line">
        <span>Type</span>
        <strong>${type}</strong>
      </div>

      <div class="receipt-line">
        <span>Date</span>
        <strong>${formatHistoryDate(sale.date)} · ${escapeHTML(sale.time)}</strong>
      </div>

      <div class="receipt-total">
        <span>Amount</span>
        <strong>${money(sale.price)}</strong>
      </div>

      <p class="receipt-foot">
        Thank you for your business!<br>
        Built @ Cridonix Technologies
      </p>

    </div>

  `;

  document.getElementById("receiptModal")
    .classList.add("open");

}


function closeReceipt(event) {

  if (event && event.target !== event.currentTarget) {
    return;
  }

  document.getElementById("receiptModal")
    .classList.remove("open");

  receiptSaleId = null;

}


function printReceipt() {

  const node =
    document.getElementById("receiptPrint");

  if (!node) return;

  const win = window.open("", "_blank", "width=380,height=600");

  if (!win) {
    toast("Allow pop-ups to print the receipt.", "error");
    return;
  }

  win.document.write(`

    <html>
      <head>
        <title>CridoSales Receipt</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; color: #222; }
          h2 { margin: 0; color: #0a3d2e; }
          p { margin: 4px 0; }
          .receipt-head { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; }
          .receipt-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .receipt-line span { color: #666; }
          .receipt-total { display: flex; justify-content: space-between; padding: 14px 0; font-size: 20px; font-weight: bold; color: #0a3d2e; }
          .receipt-foot { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        </style>
      </head>
      <body>${node.innerHTML}</body>
    </html>

  `);

  win.document.close();
  win.focus();
  win.print();

}


/* ---------- MONTHLY REPORTS ---------- */

function formatReportMonth(key) {

  const parts = key.split("-");

  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    1
  );

  return d.toLocaleDateString(
    "en-NG",
    {
      month: "long",
      year: "numeric"
    }
  );
}


function changeReportMonth(offset) {

  const parts = reportMonth.split("-");

  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    1
  );

  d.setMonth(d.getMonth() + offset);

  reportMonth =
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0");

  renderReports();

}


function renderReports() {

  const monthEl =
    document.getElementById("reportMonth");

  if (!monthEl) return;

  monthEl.innerText = formatReportMonth(reportMonth);


  const monthSales =
    sales.filter(
      s => s.date && s.date.slice(0, 7) === reportMonth
    );

  const monthPayments =
    payments.filter(
      p => p.date && p.date.slice(0, 7) === reportMonth
    );


  const total =
    monthSales.reduce(
      (sum, s) => sum + Number(s.price),
      0
    );

  const credit =
    monthSales
      .filter(s => s.debt)
      .reduce(
        (sum, s) => sum + Number(s.price),
        0
      );

  const paymentsIn =
    monthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );


  document.getElementById("reportCount")
    .innerText = monthSales.length + " sales";

  document.getElementById("reportTotal")
    .innerText = money(total);

  document.getElementById("reportDebt")
    .innerText = money(credit);

  document.getElementById("reportCash")
    .innerText = money(total - credit);

  document.getElementById("reportPayments")
    .innerText = money(paymentsIn);


  renderReportInsights(monthSales, monthPayments);

}


/* ---------- REPORT INSIGHTS ---------- */

function renderReportInsights(monthSales, monthPayments) {

  const box =
    document.getElementById("reportInsights");

  if (!box) return;

  box.innerHTML = "";


  /* Best-selling items (by revenue) */
  const itemTotals = {};

  monthSales.forEach(s => {

    const key =
      (s.name || "").trim().toLowerCase();

    if (!key) return;

    if (!itemTotals[key]) {
      itemTotals[key] = {
        name: s.name.trim(),
        amount: 0,
        count: 0
      };
    }

    itemTotals[key].amount += Number(s.price);
    itemTotals[key].count += 1;

  });


  const topItems =
    Object.values(itemTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);


  /* Top debtors added this month (by credit given) */
  const debtorTotals = {};

  monthSales
    .filter(s => s.debt)
    .forEach(s => {

      const key =
        (s.cust || "").trim().toLowerCase();

      if (!key) return;

      if (!debtorTotals[key]) {
        debtorTotals[key] = {
          name: s.cust.trim(),
          amount: 0
        };
      }

      debtorTotals[key].amount += Number(s.price);

    });


  const topDebtors =
    Object.values(debtorTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);


  box.appendChild(
    buildInsightCard(
      "Top Items This Month",
      topItems.map(i => ({
        label: i.name,
        meta: i.count + " sale" + (i.count > 1 ? "s" : ""),
        value: money(i.amount)
      })),
      "No sales yet this month."
    )
  );


  box.appendChild(
    buildInsightCard(
      "Top Debtors This Month",
      topDebtors.map(d => ({
        label: d.name,
        meta: "credit given",
        value: money(d.amount)
      })),
      "No credit sales this month."
    )
  );

}


function buildInsightCard(title, rows, emptyText) {

  const card =
    document.createElement("div");

  card.className = "card insight-card";


  let html =
    `<h3>${escapeHTML(title)}</h3>`;


  if (rows.length === 0) {

    html += `<div class="empty">${escapeHTML(emptyText)}</div>`;

  } else {

    html += `<div class="insight-list">`;

    rows.forEach(r => {

      html += `

        <div class="insight-row">

          <div class="insight-info">

            <div class="insight-label">
              ${escapeHTML(r.label)}
            </div>

            <div class="insight-meta">
              ${escapeHTML(r.meta)}
            </div>

          </div>

          <div class="insight-value">
            ${r.value}
          </div>

        </div>

      `;

    });

    html += `</div>`;

  }


  card.innerHTML = html;

  return card;

}


/* ---------- DELETE EVERYTHING ---------- */

function clearAll() {

  const answer =
    confirm(
      "Delete ALL sales, debts and payments? This cannot be undone."
    );


  if (!answer) return;


  sales = [];

  payments = [];


  localStorage.removeItem(
    "crido_sales"
  );

  localStorage.removeItem(
    "crido_payments"
  );


  render();
}


/* ---------- RENDER EVERYTHING ---------- */

function render() {

  renderSales();

  renderDebtors();

  renderSummary();

  renderHistory();

  renderPayments();

  renderReports();

}


/* ---------- START APP ---------- */

document.getElementById(
  "todayDate"
).innerText = formatDate();


render();