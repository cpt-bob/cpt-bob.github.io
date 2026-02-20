<script lang="ts">
  import { db, auth, firestore, authUser } from "$lib/firebase";
  import { ref, onValue, push, set, remove } from "firebase/database";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { onMount } from "svelte";
  import { doc, getDoc } from "firebase/firestore";

  interface ShoppingItem {
    itemId: string;
    item: string;
    quantity: string;
    user: string;
    checked?: boolean;
  }

  interface UserDoc {
    user: string;
  }

  let loading = false;
  let items: Record<string, ShoppingItem> = {};
  let selectedItems: string[] = [];
  let showDeleteAll = false;
  let showConfirmDelete = false;
  let showLogin = false;
  let deleting = false;
  let itemsLoading = true;
  let error = "";
  let lastUid: string | null = null;
  let authReady = false;
  let showEditModal = false;
  let editingItem: ShoppingItem | null = null;

  onMount(() => {
    const itemsRef = ref(db, "items");
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      items = { ...(snapshot.val() || {}) };
      itemsLoading = false;
    });

    return () => unsubscribe();
  });

  let email = "";
  let password = "";
  let userName = "";
  let itemInput = "";
  let quantityInput = "";
  let displayName = "";

  $: loggedIn = !!$authUser;

  $: displayName = $authUser
    ? $authUser.displayName || $authUser.email || "User"
    : "";

  const toggleItem = async (itemId: string) => {
    const item = items[itemId];
    if (!item) return;

    const itemRef = ref(db, `items/${itemId}`);
    await set(itemRef, { ...item, checked: !item.checked });
  };

  const addItem = async () => {
    if (!itemInput.trim() || !quantityInput.trim()) {
      alert("Item name and quantity cannot be empty.");
      return;
    }

    loading = true;
    error = "";
    try {
      const newRef = push(ref(db, "items"));
      await set(newRef, {
        itemId: newRef.key,
        item: itemInput.trim(),
        quantity: quantityInput.trim(),
        user: userName,
        checked: false,
      });
      itemInput = "";
      quantityInput = "";
      const itemInputEl = document.querySelector(
        'input[type="text"]:first-of-type',
      ) as HTMLInputElement;
      itemInputEl?.focus();
    } catch (error) {
      console.error("Add failed:", error);
    } finally {
      loading = false;
    }
  };

  const getUserName = async (uid: string): Promise<string> => {
    const userDocRef = doc(firestore, "users", uid);

    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      throw new Error("User document does not exist");
    }

    const data = snap.data() as UserDoc;

    if (!data.user) {
      throw new Error("User name missing in user document");
    }

    return data.user;
  };

  $: if ($authUser !== undefined) {
    authReady = true;
  }

  $: if (authReady && $authUser) {
    if ($authUser.uid !== lastUid) {
      lastUid = $authUser.uid;
    }

    getUserName($authUser.uid)
      .then((name) => {
        userName = name;
      })
      .catch(() => {
        userName = $authUser.displayName || $authUser.email || "User";
      });
  } else {
    userName = "";
  }

  $: if (authReady && $authUser === null) {
    lastUid = null;
    userName = "";
  }

  const login = async () => {
    if (!email || !password) return;

    loading = true;
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      showLogin = false;
    } catch (error: any) {
      alert("Login failed: " + error.message);
    } finally {
      loading = false;
    }
  };

  const logout = async () => {
    await auth.signOut();
    userName = "";
  };

  const confirmDelete = async () => {
    deleting = true;
    try {
      await Promise.all(
        selectedItems.map((id) => remove(ref(db, `items/${id}`))),
      );
      selectedItems = [];
      showConfirmDelete = false;
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      deleting = false;
    }
  };

  $: selectedItems = Object.values(items)
    .filter((item) => item.checked)
    .map((item) => item.itemId);
  $: singleSelectedItem =
    selectedItems.length === 1
      ? (Object.values(items).find((i) => i.itemId === selectedItems[0]) ??
        null)
      : null;
  $: showEditButton = singleSelectedItem !== null;
  $: showDeleteAll = selectedItems.length > 0;

  const startEdit = () => {
    if (!singleSelectedItem) return;
    editingItem = singleSelectedItem;
    showEditModal = true;
  };

  const saveEdit = async () => {
    if (!editingItem || !editingItem.itemId) return;

    if (!editingItem.item || !editingItem.quantity) {
      alert("Item name and quantity cannot be empty.");
      return;
    }

    const itemRef = ref(db, `items/${editingItem.itemId}`);
    error = "";
    try {
      await set(itemRef, {
        itemId: editingItem.itemId,
        item: editingItem.item.trim(),
        quantity: editingItem.quantity.trim(),
        user: editingItem.user,
        checked: false,
      });
    } catch (err) {
      console.error("Edit failed:", err);
    } finally {
      showEditModal = false;
      editingItem = null;
    }
  };

  const cancelEdit = () => {
    showEditModal = false;
    editingItem = null;
  };

  function handleKeydown(event: KeyboardEvent) {
    const target = event.currentTarget as HTMLInputElement;

    // Login modal event
    if (!loggedIn && target.id === "email-input") {
      if (event.key === "Enter") {
        event.preventDefault();
        (
          document.getElementById("password-input") as HTMLInputElement
        )?.focus();
      }
    }

    if (!loggedIn && target.id === "password-input" && email && password) {
      if (event.key === "Enter") {
        event.preventDefault();
        login();
      }
    }

    // shopping list event
    if (loggedIn && target.id === "item-input") {
      if (event.key === "Enter") {
        event.preventDefault();
        (
          document.getElementById("quantity-input") as HTMLInputElement
        )?.focus();
      }
    }

    if (
      loggedIn &&
      target.id === "quantity-input" &&
      itemInput &&
      quantityInput
    ) {
      if (event.key === "Enter" && !loading) {
        event.preventDefault();
        addItem();
      }
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Playwrite+US+Modern:wght@100&display=swap"
    rel="stylesheet"
  />
  <title>Shopping List</title>
</svelte:head>

<slot />

<div class="login-box" class:show={showLogin}>
  <div class="modal">
    <h3 class="login-title">Login</h3>
    <div class="modal-input-container">
      <div class="input-container">
        <input
          id="email-input"
          bind:value={email}
          type="email"
          placeholder="Email Address"
          on:keydown={handleKeydown}
        />
      </div>
      <div class="input-container">
        <input
          id="password-input"
          bind:value={password}
          type="password"
          placeholder="Password"
          on:keydown={handleKeydown}
        />
      </div>
      <div class="button-container">
        <button class="js-login-button" on:click={login}>Login</button>
      </div>
    </div>
  </div>
</div>

<div class="container">
  <div class="shopping-app">
    <div class="user-login-container">
      <p
        class="login-link"
        class:hidden={loggedIn}
        on:click={() => (showLogin = true)}
      >
        Login
      </p>
      {#if loggedIn}
        <p class="user-name show">{userName}</p>
        <p class="logout-link show" on:click={logout}>Logout</p>
      {/if}
    </div>

    <h2>
      Shopping List
      <img src="/icons/shopping-list.png" alt="" />
    </h2>

    {#if loggedIn}
      <div class="row">
        <div class="input-container">
          <input
            id="item-input"
            type="text"
            bind:value={itemInput}
            placeholder="Item to buy"
            on:keydown={handleKeydown}
          />
        </div>
        <div class="input-container">
          <input
            id="quantity-input"
            type="text"
            bind:value={quantityInput}
            placeholder="Quantity to buy"
            on:keydown={handleKeydown}
          />
        </div>
        <div class="button-container">
          <button
            class="js-add-button"
            on:click={addItem}
            disabled={loading || !itemInput.trim() || !quantityInput.trim()}
            >{loading ? "Adding..." : "Add"}</button
          >
        </div>
      </div>
      <ul class="list-container">
        {#each Object.values(items) as item (item.itemId)}
          <li
            class:checked={item.checked}
            on:click={() => toggleItem(item.itemId)}
            data-item-id={item.itemId}
          >
            <span class="item">{item.item}</span>
            <span class="quantity">{item.quantity}</span>
            <span class="user">{item.user}</span>
          </li>
        {/each}
        {#if itemsLoading}
          <p class="empty-list">Loading shopping list...</p>
        {:else if Object.keys(items).length === 0}
          <p class="empty-list">Shopping List is Empty</p>
        {/if}
      </ul>
      {#if showDeleteAll && !itemsLoading}
        <div class="delete-all-container">
          {#if showEditButton}
            <button class="edit-btn" on:click={startEdit}
              >Edit selected item</button
            >
          {/if}
          <button
            class="delete-all-btn"
            on:click={() => (showConfirmDelete = true)}
            >Delete {selectedItems.length} selected item{selectedItems.length ===
            1
              ? ""
              : "s"}</button
          >
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if showConfirmDelete}
  <div
    class="confirm-delete-overlay"
    on:click={() => (showConfirmDelete = false)}
  >
    <div class="confirm-delete-modal">
      <h3>Delete selected items?</h3>
      <p>
        This will delete {selectedItems.length} item{selectedItems.length === 1
          ? ""
          : "s"}
      </p>
      <div class="confirm-buttons">
        <button class="confirm-yes" on:click={confirmDelete} disabled={deleting}
          >{deleting ? "Deleting..." : "Yes, Delete"}</button
        >
        <button class="confirm-no" on:click={() => (showConfirmDelete = false)}
          >Cancel</button
        >
      </div>
    </div>
  </div>
{/if}

{#if showEditModal && editingItem}
  <div class="edit-overlay" on:click={cancelEdit}>
    <div class="edit-modal" on:click|stopPropagation>
      <h3>Edit Item</h3>

      <div class="input-container">
        <input
          type="text"
          bind:value={editingItem.item}
          placeholder="Item name"
          autofocus
        />
      </div>

      <div class="input-container">
        <input
          type="text"
          bind:value={editingItem.quantity}
          placeholder="Quantity"
        />
      </div>

      <div class="confirm-buttons">
        <button
          class="confirm-yes"
          on:click={saveEdit}
          disabled={loading ||
            !editingItem?.item?.trim() ||
            !editingItem?.quantity?.trim()}
          >{loading ? "Saving..." : "Save"}</button
        >
        <button class="confirm-no" on:click={cancelEdit}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

{#if error}
  <div class="error-banner">
    Something went wrong: {error}
    <button class="error-close" on:click={() => (error = "")}>x</button>
  </div>
{/if}

<footer>
  <a
    href="https://www.flaticon.com/free-icons/checklist"
    title="checklist icons">Icons created by Freepik - Flaticon</a
  >
</footer>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    background: #222;
    font-family: "Playwrite US Modern", cursive;
    font-optical-sizing: auto;
    font-weight: 100;
    font-style: normal;
  }

  footer {
    position: fixed;
    bottom: 0;
    right: 10px;
  }

  footer a {
    color: lightgrey;
  }

  .login-box {
    display: none;
  }

  .login-box.show {
    display: block;
    background-color: rgba(0, 0, 0, 0.75);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
  }

  .modal {
    background-color: lightslategray;
    margin: 15% auto;
    width: 450px;
    padding: 15px;
    border-radius: 10px;
    z-index: 1000;
  }

  .user-login-container {
    display: flex;
    justify-content: space-between;
  }

  .login-title {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    color: black;
  }

  .login-link,
  .logout-link {
    color: white;
    cursor: pointer;
  }

  .logout-link {
    display: none;
    z-index: -100;
  }

  .logout-link.show {
    display: flex;
    z-index: 1;
  }

  .login-link.hidden {
    display: none;
    z-index: -100;
  }

  .login-link:hover,
  .logout-link:hover {
    color: darkorange;
  }

  .user-name.show {
    color: greenyellow;
  }

  .shopping-app {
    width: 100%;
    max-width: 600px;
    background: linear-gradient(135deg, #5b548a, #301934);
    margin: 100px auto 20px;
    padding: 40px 30px 70px;
    border-radius: 10px;
  }

  .shopping-app h2 {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .list-container {
    margin-top: 6px;
  }

  .shopping-app h2 img {
    width: 30px;
    margin-left: 10px;
  }

  .input-container {
    display: flex;
    align-items: center;
    border-radius: 30px;
    background: lightgray;
    padding-left: 20px;
    margin-bottom: 20px;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 10px;
  }

  .button-container {
    display: flex;
    justify-content: center;
  }

  button {
    display: flex;
    flex: 1;
    justify-content: center;
    border: none;
    outline: none;
    padding: 10px;
    background: rgb(0, 119, 255);
    color: white;
    font-size: 16px;
    cursor: pointer;
    border-radius: 40px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  ul li {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: 2.5fr 2fr 1fr;
    justify-content: space-between;
    gap: 10px;
    color: white;
    cursor: pointer;
  }

  ul li.checked .item,
  ul li.checked .quantity,
  ul li.checked .user {
    text-decoration: line-through;
    color: #726f6f;
  }

  .quantity,
  .user {
    white-space: nowrap;
  }

  .empty-list {
    font-size: 20px;
    color: aliceblue;
    text-align: center;
    margin-top: 20px;
  }

  .delete-all-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin: 20px 0;
    padding: 0 30px;
  }

  .delete-all-btn {
    background: darkred;
    color: white;
    padding: 10px 20px;
    border-radius: 40px;
    font-size: 16px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 100;
    transition: background 0.2s;
  }

  .delete-all-btn:hover {
    background: #880000;
  }

  .confirm-delete-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confirm-delete-modal {
    background: linear-gradient(135deg, #5b548a, #301934);
    margin: 20px;
    padding: 30px;
    border-radius: 15px;
    color: white;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .confirm-delete-modal h3 {
    margin-bottom: 15px;
    font-size: 24px;
  }

  .confirm-delete-modal p {
    margin-bottom: 25px;
    font-size: 16px;
    opacity: 0.9;
  }

  .confirm-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .confirm-yes {
    background: darkred;
    padding: 12px 24px;
    border-radius: 25px;
  }

  .confirm-no {
    background: #666;
    padding: 12px 24px;
    border-radius: 25px;
  }

  .confirm-yes:hover,
  .confirm-no:hover {
    opacity: 0.8;
  }

  .error-banner {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4444;
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 400;
  }

  .error-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media screen and (max-width: 600px) {
    .modal {
      width: 100%;
      margin: 10% auto;
    }

    ul li {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 10px;
      white-space: normal;
    }

    ul li.checked .quantity,
    ul li.checked .user {
      padding: auto;
    }

    footer {
      position: absolute;
      top: 0;
      left: 0;
      max-height: fit-content;
    }

    .delete-all-container {
      padding: 0 15px;
    }
  }
  .edit-btn {
    background: #0066cc;
    color: white;
    padding: 10px 20px;
    border-radius: 40px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 12px;
    font-family: inherit;
    font-weight: 100;
    transition: background 0.2s;
  }

  .edit-btn:hover {
    background: #0055aa;
  }

  .edit-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-modal {
    background: linear-gradient(135deg, #5b548a, #301934);
    margin: 20px;
    padding: 30px;
    border-radius: 15px;
    color: white;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .edit-modal h3 {
    margin-bottom: 20px;
    font-size: 24px;
  }

  .edit-modal .input-container {
    margin-bottom: 16px;
  }
</style>
