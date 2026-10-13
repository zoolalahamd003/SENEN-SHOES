// ==================== CONSTANTS ====================

const API_BASE = "http://localhost:3000";

// Keep in sync with COLOR_PALETTE in server.js / the admin panel's JS.
const COLOR_SWATCHES = {
  BLACK: "#111318",
  WHITE: "#F5F5F5",
  RED: "#D63A2E",
  NAVY: "#1F3358",
  ROYAL_BLUE: "#2A5CDB",
  GREY: "#8B8F98",
  BEIGE: "#D8C4A0",
  BROWN: "#6B4226",
  GREEN: "#2E7D4F",
  OLIVE: "#6B6B2A",
  ORANGE: "#E8722C",
  YELLOW: "#E6C229",
  PINK: "#E38AAE",
  PURPLE: "#6C4A9C",
  MAROON: "#7A2331",
  GOLD: "#C9A227",
  SILVER: "#B9BEC7",
  MULTICOLOR:
    "conic-gradient(from 90deg, #D63A2E, #E6C229, #2E7D4F, #2A5CDB, #6C4A9C, #D63A2E)",
};

const GENDER_LABELS = { MALE: "Men", FEMALE: "Women", UNISEX: "Unisex" };
const CONDITION_LABELS = { NEW: "New", USED: "Used" };

const PAYMENT_LABELS = {
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  CASH_ON_DELIVERY: "Cash on delivery",
};

// ==================== LOADING ====================

const loadingOverlay = document.getElementById("loadingOverlay");
function showLoading() {
  loadingOverlay.style.display = "flex";
}
function hideLoading() {
  loadingOverlay.style.display = "none";
}

// ==================== MESSAGE MODAL ====================

const msgmodaloverlay = document.getElementById("msgmodaloverlay");
const msgmodaltext = document.getElementById("msgmodaltext");
document
  .getElementById("closemsgmodalbtn")
  .addEventListener("click", function () {
    msgmodaloverlay.classList.remove("active");
  });

function showMessage(text) {
  msgmodaltext.textContent = text;
  msgmodaloverlay.classList.add("active");
}

// ==================== PRODUCT STATE ====================

let allShoes = [];
const productscontainer = document.getElementById("productscontainer");

function totalStock(shoe) {
  return (shoe.sizes || []).reduce((sum, row) => sum + row.stock, 0);
}

async function fetchShoes() {
  try {
    showLoading();
    let response = await fetch(`${API_BASE}/shoes`);
    allShoes = await response.json();
    renderProducts(allShoes);
  } catch (error) {
    console.log(error);
    showMessage("Could not load products. Is the server running?");
  } finally {
    hideLoading();
  }
}

function renderProducts(list) {
  productscontainer.innerHTML = "";

  if (list.length === 0) {
    showMessage("No shoes matched your search.");
    return;
  }

  list.forEach(function (shoe) {
    let card = document.createElement("div");
    card.className = "product-card";

    let img = document.createElement("img");
    img.src =
      shoe.images && shoe.images.length > 0
        ? `${API_BASE}/images/${shoe.images[0]}`
        : "";
    img.alt = shoe.shoename;

    let name = document.createElement("p");
    name.className = "product-name";
    name.textContent = shoe.shoename.toUpperCase();

    let brand = document.createElement("p");
    brand.className = "product-details";
    brand.textContent = shoe.company.toUpperCase();

    let price = document.createElement("p");
    price.className = "product-details";
    price.textContent = "Rs " + shoe.price;

    card.append(img, name, brand, price);

    if (totalStock(shoe) === 0) {
      let outTag = document.createElement("span");
      outTag.className = "outofstock-tag";
      outTag.textContent = "Out of stock";
      card.append(outTag);
      card.classList.add("outofstock");
    }

    card.addEventListener("click", function () {
      openDetail(shoe);
    });

    productscontainer.append(card);
  });
}

// ==================== SEARCH ====================

const searchinput = document.getElementById("searchinput");
const searchbtn = document.getElementById("searchbtn");
const resetsearch = document.getElementById("resetsearch");
const checkboxname = document.getElementById("checkboxname");
const checkboxcompany = document.getElementById("checkboxcompany");
const checkboxgender = document.getElementById("checkboxgender");
const checkboxcondition = document.getElementById("checkboxcondition");

resetsearch.style.display = "none";

searchbtn.addEventListener("click", function () {
  let query = searchinput.value.trim().toUpperCase();
  let anyChecked =
    checkboxname.checked ||
    checkboxcompany.checked ||
    checkboxgender.checked ||
    checkboxcondition.checked;

  if (!anyChecked) {
    showMessage("Please select at least one search option.");
    return;
  }

  if (query === "") {
    showMessage("Please type something to search for.");
    return;
  }

  let matches = allShoes.filter(function (shoe) {
    if (checkboxname.checked && shoe.shoename.toUpperCase().includes(query))
      return true;
    if (checkboxcompany.checked && shoe.company.toUpperCase().includes(query))
      return true;
    if (checkboxgender.checked && shoe.gender.toUpperCase() === query)
      return true;
    if (
      checkboxcondition.checked &&
      shoe.condition.toUpperCase() === query
    )
      return true;
    return false;
  });

  renderProducts(matches);
  resetsearch.style.display = "inline-flex";
});

resetsearch.addEventListener("click", function () {
  searchinput.value = "";
  renderProducts(allShoes);
  resetsearch.style.display = "none";
});

// ==================== PRODUCT DETAIL MODAL ====================

const detailoverlay = document.getElementById("detailoverlay");
const detailslider = document.getElementById("detailslider");
const detailbrand = document.getElementById("detailbrand");
const detailname = document.getElementById("detailname");
const detailprice = document.getElementById("detailprice");
const detailmeta = document.getElementById("detailmeta");
const detailcolors = document.getElementById("detailcolors");
const detailsizes = document.getElementById("detailsizes");
const detailqty = document.getElementById("detailqty");
const detailaddbtn = document.getElementById("detailaddbtn");

let activeShoe = null;
let activeSize = null;
let activeColor = null;

document
  .getElementById("closedetailbtn")
  .addEventListener("click", function () {
    detailoverlay.classList.remove("active");
  });

function openDetail(shoe) {
  activeShoe = shoe;
  activeSize = null;
  activeColor=null

  // ---- image slider ----
  detailslider.innerHTML = "";
  if (shoe.images && shoe.images.length > 0) {
    let currentIndex = 0;
    let img = document.createElement("img");
    img.src = `${API_BASE}/images/${shoe.images[currentIndex]}`;

    let prevBtn = document.createElement("button");
    prevBtn.textContent = "‹";
    let nextBtn = document.createElement("button");
    nextBtn.textContent = "›";

    function show() {
      img.src = `${API_BASE}/images/${shoe.images[currentIndex]}`;
    }
    prevBtn.addEventListener("click", function () {
      currentIndex =
        (currentIndex - 1 + shoe.images.length) % shoe.images.length;
      show();
    });
    nextBtn.addEventListener("click", function () {
      currentIndex = (currentIndex + 1) % shoe.images.length;
      show();
    });

    detailslider.append(prevBtn, img, nextBtn);
  } else {
    detailslider.textContent = "No photo";
  }

  // ---- info ----
  detailbrand.textContent = shoe.company.toUpperCase();
  detailname.textContent = shoe.shoename.toUpperCase();
  detailprice.textContent = "Rs " + shoe.price;
  detailmeta.textContent =
    (GENDER_LABELS[shoe.gender.toUpperCase()] || shoe.gender) +
    " · " +
    (CONDITION_LABELS[shoe.condition.toUpperCase()] || shoe.condition);

  // ---- colors (display only) ----
detailcolors.innerHTML = "";

(shoe.colors || []).forEach(function (value) {
  let dot = document.createElement("button");

  dot.type = "button";
  dot.className = "colordot";
  dot.title = value;
  dot.style.background = COLOR_SWATCHES[value] || "#999";

  dot.addEventListener("click", function () {
    activeColor = value;

    [...detailcolors.children].forEach(function (item) {
      item.classList.remove("selected");
    });

    dot.classList.add("selected");
     if (activeSize) {
  detailaddbtn.disabled = false;
  detailaddbtn.textContent = "Add to cart";
  
}
else {
  detailaddbtn.disabled = true;
  detailaddbtn.textContent = "Select a color and Select a size ";
}
  });

  detailcolors.append(dot);
 
});

  // ---- sizes ----
  detailsizes.innerHTML = "";
  (shoe.sizes || []).forEach(function (row) {
    let sizeBtn = document.createElement("button");
    sizeBtn.type = "button";
    sizeBtn.className = "sizebtn";
    sizeBtn.textContent = "UK " + row.size;

    if (row.stock <= 0) {
      sizeBtn.disabled = true;
      sizeBtn.classList.add("sizebtn-disabled");
    } else {
      sizeBtn.addEventListener("click", function () {
        activeSize = row;
        detailqty.value = 1;
        detailqty.max = row.stock;
        [...detailsizes.children].forEach((b) => b.classList.remove("selected"));
        sizeBtn.classList.add("selected");
       
        if (activeColor) {
  detailaddbtn.disabled = false;
  detailaddbtn.textContent = "Add to cart";
}
      });
    }

    detailsizes.append(sizeBtn);
  });

  detailqty.value = 1;
  detailaddbtn.disabled = true;
  detailaddbtn.textContent = "Select a size and Select a color";

  detailoverlay.classList.add("active");
}

detailaddbtn.addEventListener("click", function () {
  if (!activeShoe || !activeSize) return;

  let quantity = Number(detailqty.value);
  if (!quantity || quantity < 1) quantity = 1;
  if (quantity > activeSize.stock) quantity = activeSize.stock;

  addToCart({
    shoeId: activeShoe._id,
    company: activeShoe.company,
    shoename: activeShoe.shoename,
    price: activeShoe.price,
    size: activeSize.size,
    color:activeColor,
    quantity: quantity,
    image:
      activeShoe.images && activeShoe.images.length > 0
        ? activeShoe.images[0]
        : null,
  });

  detailoverlay.classList.remove("active");
  openCart();
});

// ==================== CART (localStorage) ====================

const cartcount = document.getElementById("cartcount");

function getCart() {
  let cart = JSON.parse(localStorage.getItem("cartproducts"));
  return cart || [];
}

function saveCart(cart) {
  localStorage.setItem("cartproducts", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  let cart = getCart();
  let count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartcount.textContent = count;
}

function addToCart(newItem) {
  let cart = getCart();
  let existing = cart.find(
    (item) => item.shoeId === newItem.shoeId && item.size === newItem.size &&
    item.color===newItem.color
  );

  if (existing) {
    existing.quantity += newItem.quantity;
  } else {
    cart.push(newItem);
  }

  saveCart(cart);
}

updateCartCount();

// ==================== CART DRAWER ====================

const cartdrawer = document.getElementById("cartdrawer");
const cartoverlay = document.getElementById("cartoverlay");
const cartdrawerbody = document.getElementById("cartdrawer-body");
const cartdrawertitle = document.getElementById("cartdrawer-title");

document.getElementById("cartbtn").addEventListener("click", openCart);
document
  .getElementById("closecartbtn")
  .addEventListener("click", closeCart);
cartoverlay.addEventListener("click", closeCart);

function openCart() {
  cartdrawertitle.textContent = "Your cart";
  renderCartView();
  cartdrawer.classList.add("open");
  cartoverlay.classList.add("open");
}

function closeCart() {
  cartdrawer.classList.remove("open");
  cartoverlay.classList.remove("open");
}

function renderCartView() {
  let cart = getCart();
  cartdrawerbody.innerHTML = "";

  if (cart.length === 0) {
    let empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Your cart is empty.";
    cartdrawerbody.append(empty);
    return;
  }

  let list = document.createElement("div");
  list.id = "cartitems";

  let total = 0;

  cart.forEach(function (item, index) {
    total += item.price * item.quantity;

    let row = document.createElement("div");
    row.className = "cart-row";

    let img = document.createElement("img");
    img.src = item.image ? `${API_BASE}/images/${item.image}` : "";

    let info = document.createElement("div");
    info.className = "cart-row-info";

    let name = document.createElement("p");
    name.className = "cart-row-name";
    name.textContent = item.company.toUpperCase() + " — " + item.shoename.toUpperCase();

    let meta = document.createElement("p");
    meta.className = "cart-row-meta";
    meta.textContent ="Color: "+item.color+ " Size UK: " + item.size + " · Qty " + item.quantity;

    let price = document.createElement("p");
    price.className = "cart-row-meta";
    price.textContent = "Rs " + item.price * item.quantity;

    let removeBtn = document.createElement("button");
    removeBtn.className = "cart-row-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      cart.splice(index, 1);
      saveCart(cart);
      renderCartView();
    });

    info.append(name, meta, price, removeBtn);
    row.append(img, info);
    list.append(row);
  });

  let totalLine = document.createElement("div");
  totalLine.id = "cart-total";
  totalLine.textContent = "Total: Rs " + total;

  let checkoutBtn = document.createElement("button");
  checkoutBtn.id = "checkoutbtn";
  checkoutBtn.textContent = "Proceed to checkout";
  checkoutBtn.addEventListener("click", renderCheckoutView);

  cartdrawerbody.append(list, totalLine, checkoutBtn);
}

// ==================== CHECKOUT VIEW (same drawer) ====================

const paymentmethodline =
  document.getElementById("paymentmethodline");

const paymentamountline =
  document.getElementById("paymentamountline");

const paymentnumberline =
  document.getElementById("paymentnumberline");

const paymentscreenshot =
  document.getElementById("paymentscreenshot");

const paynowbtn =
  document.getElementById("paynowbtn");

const cancelpaymentbtn =
  document.getElementById("cancelpaymentbtn");


let pendingorder = null;

paynowbtn.addEventListener("click", async function () {

  if (!pendingorder) {
    return;
  }

  try {

    showLoading();

    let formData = new FormData();

    if (paymentscreenshot.files.length > 0) {

      formData.append(
        "paymentscreenshot",
        paymentscreenshot.files[0]
      );

    }

    let response = await fetch(
      `${API_BASE}/orders/${pendingorder._id}/payment-proof`,
      {
        method: "POST",
        body: formData,
      }
    );

    let data = await response.json();

    if (!response.ok) {

      showMessage(
        data.message ||
        "Could not submit payment information."
      );

      return;
    }

    paymentmodaloverlay.classList.remove("active");

    localStorage.removeItem("cartproducts");

    updateCartCount();

    closeCart();

    document.getElementById("orderidline").textContent =
      "Order ID: " + pendingorder._id;

    document.getElementById(
      "ordermodaloverlay"
    ).classList.add("active");

    fetchShoes();

    pendingorder = null;

  } catch (error) {

    console.log(error);

    showMessage(
      "Could not submit your payment information. Please try again."
    );

  } finally {

    hideLoading();

  }

});


// ==================== CANCEL PAYMENT ====================

cancelpaymentbtn.addEventListener("click", function () {

  paymentmodaloverlay.classList.remove("active");

});


// ==================== CHECKOUT VIEW ====================

function renderCheckoutView() {

  let cart = getCart();

  if (cart.length === 0) {
    return;
  }

  cartdrawertitle.textContent = "Checkout";

  cartdrawerbody.innerHTML = "";

  let form = document.createElement("div");

  form.id = "checkoutform";

  form.innerHTML = `

    <label for="name">Full name</label>

    <input type="text" id="name" />


    <label for="email">Email</label>

    <input type="email" id="email" />


    <label for="phone-number">Phone number</label>

    <input type="text" id="phone-number" />


    <label for="address">Address</label>

    <textarea id="address"></textarea>


    <label>Payment method</label>


    <div id="payment-box">

      <div>

        <input
          type="radio"
          id="easypaisa"
          name="cash"
        />

        <label for="easypaisa">
          Easypaisa
        </label>

      </div>


      <div>

        <input
          type="radio"
          id="jazzcash"
          name="cash"
        />

        <label for="jazzcash">
          JazzCash
        </label>

      </div>


      <div>

        <input
          type="radio"
          id="cash-on-delivery"
          name="cash"
        />

        <label for="cash-on-delivery">
          Cash on delivery
        </label>

      </div>

    </div>

  `;


  let backBtn = document.createElement("button");

  backBtn.className = "ghostbtn";

  backBtn.textContent = "← Back to cart";

  backBtn.addEventListener(
    "click",
    renderCartView
  );


  let placeOrderBtn = document.createElement("button");

  placeOrderBtn.id = "place-order";

  placeOrderBtn.textContent = "Place order";

  placeOrderBtn.addEventListener(
    "click",
    placeOrder
  );


  cartdrawerbody.append(
    backBtn,
    form,
    placeOrderBtn
  );

}


// ==================== PLACE ORDER ====================

async function placeOrder() {

  let cart = getCart();

  let name =
    document.getElementById("name").value.trim();

  let email =
    document.getElementById("email").value.trim();

  let phone =
    document.getElementById("phone-number").value.trim();

  let address =
    document.getElementById("address").value.trim();


  if (
    name === "" ||
    email === "" ||
    phone === "" ||
    address === ""
  ) {

    showMessage(
      "Please fill in all your details."
    );

    return;
  }


  let paymentInput =
    document.querySelector(
      'input[name="cash"]:checked'
    );


  if (!paymentInput) {

    showMessage(
      "Please select a payment method."
    );

    return;
  }


  let paymentMap = {

    easypaisa: "EASYPAISA",

    jazzcash: "JAZZCASH",

    "cash-on-delivery": "CASH_ON_DELIVERY",

  };


  let payload = {

    customer: {

      name,

      email,

      phone,

      address,

    },


    items: cart.map(function (item) {

      return {

        shoeId: item.shoeId,

        company: item.company,

        shoename: item.shoename,

        size: item.size,

        color: item.color,

        quantity: item.quantity,

        price: item.price,

      };

    }),


    paymentMethod:
      paymentMap[paymentInput.id],

  };


  try {

    showLoading();


    let response = await fetch(
      `${API_BASE}/orders`,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify(payload),

      }
    );


    if (!response.ok) {

      let errorbody =
        await response
          .json()
          .catch(() => ({}));


      showMessage(
        errorbody.message ||
        "Could not place your order."
      );

      return;
    }


    let order =
      await response.json();


    // ==================== DIGITAL PAYMENT ====================

    if (
      order.paymentMethod === "EASYPAISA" ||
      order.paymentMethod === "JAZZCASH"
    ) {

      pendingorder = order;


      paymentmethodline.textContent =
        "Payment method: " +
        PAYMENT_LABELS[
          order.paymentMethod
        ];


      paymentamountline.textContent =
        "Amount to pay: Rs. " +
        order.totalCost;


      paymentnumberline.textContent =
        "Send payment to: " +
        order.paymentNumber;


      paymentscreenshot.value = "";


      paymentmodaloverlay.classList.add(
        "active"
      );


      return;
    }


    // ==================== CASH ON DELIVERY ====================

    localStorage.removeItem(
      "cartproducts"
    );

    updateCartCount();

    closeCart();


    document.getElementById(
      "orderidline"
    ).textContent =
      "Order ID: " + order._id;


    document.getElementById(
      "ordermodaloverlay"
    ).classList.add("active");


  


  } catch (error) {

    console.log(error);

    showMessage(
      "Could not reach the server. Please try again."
    );

  } finally {

    hideLoading();

  }


}
  fetchShoes();

const continueshoppingbtn =
  document.getElementById("continueshoppingbtn");

continueshoppingbtn.addEventListener("click", function () {
  document
    .getElementById("ordermodaloverlay")
    .classList.remove("active");

  fetchShoes();
});