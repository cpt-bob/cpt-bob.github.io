let shoppingList = JSON.parse(localStorage.getItem("shoppingList")) || [];

renderShoppingList();

function renderShoppingList() {
  let shoppingListHTML = "";

  shoppingList.forEach((shoppingItem, index) => {
    const { item, quantity, name } = shoppingItem;
    const html = `
    <input type="checkbox" class="chk js-check-box"/>
    <div>${item}</div>
    <div>${quantity}</div>
    <div>Added by ${name}</div>
    `;
    shoppingListHTML += html;
  });

  document.querySelector(".js-shopping-list").innerHTML = shoppingListHTML;

  document.querySelectorAll(".js-check-box").forEach((checkbox, index) => {
    checkbox.addEventListener("click", () => {
      shoppingList.splice(index, 1);
      saveToStorage();
      renderShoppingList();
    });
  });
}

document
  .querySelector(".js-add-to-shopping-list-button")
  .addEventListener("click", () => {
    addToShoppingList();
    document.getElementById("input1").focus();
  });

function addToShoppingList() {
  const inputElement = document.querySelector(".js-item-input");
  const item = inputElement.value;

  const quantityElement = document.querySelector(".js-quantity-input");
  const quantity = quantityElement.value;

  const nameElement = document.querySelector(".js-who-added");
  const name = nameElement.value;

  shoppingList.push({
    item,
    quantity,
    name,
  });
  inputElement.value = "";
  quantityElement.value = "";
  nameElement.value = "";

  saveToStorage();
  renderShoppingList();
}

function saveToStorage() {
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
}
