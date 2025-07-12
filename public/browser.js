function itemTemplate(item) {
 return  `
        <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
        <span class="item-text">${item.text}</span>
        <div>
          <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
          <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
        </div>
      </li>
        `
}

// initial Page load
let ourHtml = items.map( function(item) {
  return itemTemplate(item);
}).join('');
document.getElementById('item-list').insertAdjacentHTML('beforeend', ourHtml)

// Create logic
let createField = document.getElementById('create-field');
document.getElementById('create-form').addEventListener('submit', function(e) {
  e.preventDefault();
  if (createField.value.trim() === "") {
    alert("Please enter a valid item.");
    return;
  }
  axios.post('/create-item', {text: createField.value}).then(function (response) {
   
   // Create a new list item in the DOM
      document.getElementById('item-list').insertAdjacentHTML('beforeend', itemTemplate(response.data))
      createField.value = ""; // Clear the input field
      createField.focus(); // Focus back on the input field
      }).catch(function () {
      console.log('There was an error');
     })
})

document.addEventListener('click', function(e) {
  // Delete logic
  if (e.target.classList.contains('delete-me')) {
    if(confirm("Are you sure you want to delete this item?")) {
      // Send the delete request to the server
       axios.post('/delete-item', {id: e.target.getAttribute("data-id")}).then(function () {
      // remove the text in the DOM
      e.target.parentElement.parentElement.remove();
      }).catch(function () {
      console.log('There was an error');
     })
    }
  }
  // Edit logic
 if (e.target.classList.contains('edit-me')) {
 // Prompt the user for new text
  let userInput = prompt('Enter your desired new text', e.target.closest('li').querySelector('.item-text').textContent);
  // If userInput is not null or empty, send the update request
  if(userInput){
   // Send the updated text to the server
   axios.post('/update-item', {textInput: userInput, id: e.target.getAttribute("data-id")}).then(function () {
   // Update the text in the DOM
   e.target.closest('li').querySelector('.item-text').textContent = userInput;
 }).catch(function () {
  console.log('There was an error');
 })
   }
 }
})

