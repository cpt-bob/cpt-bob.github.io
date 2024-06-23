import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  child,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";

// Initialize Firebase with your project's Realtime Database URL
const firebaseConfig = {
  apiKey: "AIzaSyBpKsDGhucKO_QbNgjXG3vX1vuduYl8xy4",
  authDomain: "shopping-list-e939f.firebaseapp.com",
  databaseURL: "https://shopping-list-e939f-default-rtdb.firebaseio.com/",
  projectId: "shopping-list-e939f",
  storageBucket: "shopping-list-e939f.appspot.com",
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const database = getDatabase(firebaseApp);
const shoppingListRef = ref(database, "shoppingList");

// Function to update UI based on user login status
function updateUI(user) {
  const loginStatusElement = document.querySelector(".js-login-status");

  if (user) {
    // User is logged in
    const displayName = user.username || user.email; //backup email login name

    loginStatusElement.innerHTML = `
      <div class="user-login-container">
      Logged in as: ${displayName}
      </div>
      <div class="logout-button-container">
      <button class="js-logout-button logout-button">Logout</button>
      </div>`;
    document
      .querySelector(".js-logout-button")
      .addEventListener("click", logout);
    renderShoppingList();
  } else {
    // User is not logged in
    loginStatusElement.innerHTML = `<a href="#" class="js-login-link">Login</a>`;
    document
      .querySelector(".js-login-link")
      .addEventListener("click", showPopup);
  }
}

function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const auth = getAuth();
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      // get username from the firestore database
      let username = user.email; //backup in case the fetch from firestore fails
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          username = userData.user;
        }
      } catch (error) {
        console.error("Error fetching the username:", error);
      }
      closePopup();
      updateUI({ ...user, username });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Login error:", errorMessage);
      alert(errorMessage);
    });
}

function logout() {
  const auth = getAuth();
  auth
    .signOut()
    .then(() => {
      updateUI(null); // Update UI to show login link
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

function showPopup(event) {
  event.preventDefault();
  const loginPopup = document.getElementById("loginPopup");
  if (loginPopup) {
    loginPopup.style.display = "block";
  }

  // Remove the login link while the popup is visible
  const loginLink = document.querySelector(".js-login-link");
  if (loginLink) {
    loginLink.style.display = "none";
  }
}

function closePopup() {
  const loginPopup = document.getElementById("loginPopup");
  if (loginPopup) {
    loginPopup.style.display = "none";

    // Restore the login link after closing the popup
    const loginLink = document.querySelector(".js-login-link");
    if (loginLink) {
      loginLink.style.display = "block";
    }
  }
}

// Function to check current user status on page load
function checkUserStatus() {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      updateUI(user);
    } else {
      // No user is signed in
      updateUI(null);
    }
  });
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
  const shoppingListElement = document.querySelector(".js-shopping-list");
  shoppingListElement.innerHTML = ""; // Clear existing items

  // Fetch and render each item from Firebase
  onChildAdded(shoppingListRef, (snapshot) => {
    const shoppingItem = snapshot.val();
    const key = snapshot.key;
    const existingItem = document.querySelector(
      `.shopping-item[data-key="${key}"]`
    );
    // render the item only once
    if (!existingItem) {
      renderShoppingItem(snapshot.key, shoppingItem);
    }
  });
}

// render shopping item
async function renderShoppingItem(key, shoppingItem) {
  const { item, quantity, addedBy } = shoppingItem;

  try {
    const userDoc = await getDoc(doc(firestore, "users", addedBy));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const username = userData.user;
      const existingItem = document.querySelector(
        `.shopping-item[data-key="${key}"]`
      );

      if (!existingItem) {
        const html = `
          <div class="shopping-item" data-key="${key}">
            <input type="checkbox" class="chk js-check-box"/>
            <div>${item}</div>
            <div>${quantity}</div>
            <div>Added by ${username}</div>
          </div>
        `;

        document
          .querySelector(".js-shopping-list")
          .insertAdjacentHTML("beforeend", html);
      }
    } else {
      console.error(`User document not found for UID: ${addedBy}`);
    }
  } catch (error) {
    console.error("Error fetching the username", error);
  }
}

// Render login and shopping list on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check user status on page load
  checkUserStatus();
  // renderShoppingList();

  // Listen for changes to the shopping list in Firebase
  // onChildAdded(shoppingListRef, (snapshot) => {
  //   const shoppingItem = snapshot.val();
  //   renderShoppingItem(snapshot.key, shoppingItem);
  //   console.log(shoppingItem);
  // });

  //renderShoppingList();

  // Add event listener for the add button
  document
    .querySelector(".js-add-to-shopping-list-button")
    .addEventListener("click", addToShoppingList);

  // Event listener for login form submission
  document.getElementById("loginForm").addEventListener("submit", login);

  // Event listener to close popup when clicking outside of it
  document.getElementById("loginPopup").addEventListener("click", (event) => {
    if (event.target === document.getElementById("loginPopup")) {
      closePopup();
    }
  });

  // Function to add an item to the shopping list in Firebase
  async function addToShoppingList(event) {
    event.preventDefault();

    try {
      const user = await getCurrentUser();
      const item = document.querySelector(".js-item-input").value;
      const quantity = document.querySelector(".js-quantity-input").value;

      // Push the new item to the Firebase database, associating it with the user's UID
      await push(shoppingListRef, {
        item,
        quantity,
        addedBy: user.uid,
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
