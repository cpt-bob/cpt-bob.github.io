import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  child, // Import child function
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js";

// Initialize Firebase with your project's Realtime Database URL
const firebaseConfig = {
  authDomain: "shopping-list-e939f.firebaseapp.com",
  databaseURL: "https://shopping-list-e939f-default-rtdb.firebaseio.com/",
  projectId: "shopping-list-e939f",
  storageBucket: "shopping-list-e939f.appspot.com",
  // Add your other Firebase config keys here if needed
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const shoppingListRef = ref(database, "shoppingList");

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const auth = getAuth();
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in successfully
      const user = userCredential.user;
      console.log("User logged in:", user.uid);

      // Optionally close the login popup or redirect to another page
      closePopup();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Login error:", errorMessage);
      alert(errorMessage);
    });
}

function showPopup() {
  console.log("showing popup");
  document.getElementById("loginPopup").style.display = "block";
}

function closePopup() {
  document.getElementById("loginPopup").style.display = "none";
}

// Function to get the current user
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        reject("No user logged in.");
      }
    });
  });
}

// Render the entire shopping list
function renderShoppingList() {
  // Clear the existing shopping list before rendering
  document.querySelector(".js-shopping-list").innerHTML = "";
}

// Render a single shopping list item
function renderShoppingItem(key, shoppingItem) {
  const { item, quantity, addedBy } = shoppingItem;
  const html = `
    <div class="shopping-item" data-key="${key}">
      <input type="checkbox" class="chk js-check-box"/>
      <div>${item}</div>
      <div>${quantity}</div>
      <div>Added by ${addedBy}</div>
    </div>
  `;
  document
    .querySelector(".js-shopping-list")
    .insertAdjacentHTML("beforeend", html);
}

// Render shopping list on page load
document.addEventListener("DOMContentLoaded", () => {
  // Show login popup on page load
  showPopup();

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

  // Add event listener for login button
  document.querySelector(".js-login-button").addEventListener("click", login);

  // Function to add an item to the shopping list in Firebase
  async function addToShoppingList() {
    try {
      const user = await getCurrentUser();
      const item = document.querySelector(".js-item-input").value;
      const quantity = document.querySelector(".js-quantity-input").value;

      // Push the new item to the Firebase database, associating it with the user's UID
      push(shoppingListRef, {
        item,
        quantity,
        addedBy: user.displayName, // Use user's display name (or adjust as per your user structure)
      });

      // Clear input fields after adding item
      document.querySelector(".js-item-input").value = "";
      document.querySelector(".js-quantity-input").value = "";
    } catch (error) {
      console.error("Error adding item:", error);
    }
  }

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
