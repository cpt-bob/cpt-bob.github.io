import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  child, // Import child function
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";

// Initialize Firebase with your project's Realtime Database URL
const firebaseConfig = {
  databaseURL: "https://shopping-list-e939f-default-rtdb.firebaseio.com/",
};
const firebaseApp = initializeApp(firebaseConfig);

// Get a reference to the database service
const database = getDatabase(firebaseApp);
const shoppingListRef = ref(database, "shoppingList");

// Render the entire shopping list
function renderShoppingList() {
  // Clear the existing shopping list before rendering
  // document.querySelector(".js-shopping-list").innerHTML = "";
}

// Render a single shopping list item
function renderShoppingItem(key, shoppingItem) {
  const { item, quantity, name } = shoppingItem;
  const html = `
    <div class="shopping-item" data-key="${key}">
      <input type="checkbox" class="chk js-check-box"/>
      <div>${item}</div>
      <div>${quantity}</div>
      <div>Added by ${name}</div>
    </div>
  `;
  document
    .querySelector(".js-shopping-list")
    .insertAdjacentHTML("beforeend", html);
}

// Render shopping list on page load
document.addEventListener("DOMContentLoaded", () => {
  // Listen for changes to the shopping list in Firebase
  onChildAdded(shoppingListRef, (snapshot) => {
    const shoppingItem = snapshot.val();
    renderShoppingItem(snapshot.key, shoppingItem);
  });
  renderShoppingList();

  // Add event listener for the add button
  document
    .querySelector(".js-add-to-shopping-list-button")
    .addEventListener("click", addToShoppingList);

  // Add event listener for checkbox clicks
  document
    .querySelector(".js-shopping-list")
    .addEventListener("change", (event) => {
      // Check if the clicked element is a checkbox
      if (event.target.matches(".js-check-box")) {
        // Get the key of the clicked item from its parent div
        const key = event.target.parentNode.getAttribute("data-key");
        // Call the delete function with the key
        deleteItem(key);
      }
    });
  // Function to add an item to the shopping list in Firebase
  function addToShoppingList() {
    const item = document.querySelector(".js-item-input").value;
    const quantity = document.querySelector(".js-quantity-input").value;
    const name = document.querySelector(".js-who-added").value;

    // Push the new item to the Firebase database
    push(shoppingListRef, {
      item,
      quantity,
      name,
    });

    // Clear input fields after adding item
    document.querySelector(".js-item-input").value = "";
    document.querySelector(".js-quantity-input").value = "";
    document.querySelector(".js-who-added").value = "";
  }

  // Function to delete an item from the shopping list in Firebase
  function deleteItem(key) {
    // Remove the item from the database
    remove(child(shoppingListRef, key))
      .then(() => {
        // Remove the corresponding HTML element from the DOM
        const itemElement = document.querySelector(
          `.shopping-item[data-key="${key}"]`
        );
        if (itemElement) {
          itemElement.remove();
        }
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
      });
  }
});
