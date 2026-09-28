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
    alert("Enter the item name.");
    return;
  }


  if (!price || price <= 0) {
    alert("Enter a valid price.");
    return;
  }


  if (isDebt && !cust) {
    alert("Enter the customer's name for a credit sale.");
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


  alert(
    isDebt
      ? "Credit sale recorded."
      : "Cash sale recorded."
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

        <div class="item-price">
          ${money(s.price)}
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

    alert("Enter the customer's name.");

    return;
  }


  if (!amount || amount <= 0) {

    alert("Enter a valid payment amount.");

    return;
  }


  const balance =
    getCustomerBalance(customer);


  if (balance <= 0) {

    alert("This customer does not have an outstanding debt.");

    return;
  }


  if (amount > balance) {

    alert(
      `Customer currently owes ${money(balance)}.`
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


  alert("Payment recorded.");

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

}


/* ---------- START APP ---------- */

document.getElementById(
  "todayDate"
).innerText = formatDate();


render();