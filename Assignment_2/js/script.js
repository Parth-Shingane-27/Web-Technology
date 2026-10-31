// Library Book Manager
// The books are kept in an array of objects (books).
// The array is saved as JSON text in localStorage so it is still there after reload.

var STORAGE_KEY = 'libraryBooks';
var books = [];
var editIsbn = null;      // ISBN of the book being edited (null = adding a new book)

// ---------- Get the elements ----------
var form = document.getElementById('book-form');
var formTitle = document.getElementById('form-title');
var saveBtn = document.getElementById('save-btn');
var clearBtn = document.getElementById('clear-btn');
var cancelBtn = document.getElementById('cancel-btn');
var messageBox = document.getElementById('message');
var bookList = document.getElementById('book-list');
var emptyText = document.getElementById('empty');
var bookTable = document.getElementById('book-table');
var countText = document.getElementById('count');
var searchInput = document.getElementById('search');
var sortSelect = document.getElementById('sort');

// the fields which have an error message under them
var fields = ['isbn', 'title', 'author', 'year', 'copies', 'category', 'type'];


// ---------- Save and load (JSON) ----------
function saveBooks() {
  var text = JSON.stringify(books);          // array -> JSON text
  localStorage.setItem(STORAGE_KEY, text);
}

function loadBooks() {
  var text = localStorage.getItem(STORAGE_KEY);
  if (text === null) {
    books = [];
    return;
  }
  try {
    books = JSON.parse(text);                // JSON text -> array
    if (!Array.isArray(books)) {
      books = [];
    }
    // books saved by an older version may miss some fields, so give them defaults
    books.forEach(function (book) {
      if (!book.category) book.category = 'Other';
      if (!book.type) book.type = 'Borrowable';
    });
  } catch (error) {
    books = [];                              // saved text was damaged
  }
}


// ---------- Read values from the form ----------
function getValue(name) {
  if (name === 'type') {
    var chosen = form.querySelector('input[name="type"]:checked');
    return chosen ? chosen.value : '';
  }
  return document.getElementById(name).value.trim();
}

function getIsbn() {
  return getValue('isbn').replace(/-/g, '');   // hyphens are allowed
}


// ---------- Validation: one function for each field ----------
// Each function returns an error message, or '' if the value is correct.

function checkIsbn() {
  var isbn = getIsbn();
  if (isbn === '') return 'ISBN is required.';
  if (!/^[0-9]+$/.test(isbn)) return 'ISBN can only have digits.';
  if (isbn.length !== 10 && isbn.length !== 13) {
    return 'ISBN must be 10 or 13 digits (you typed ' + isbn.length + ').';
  }
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn === isbn && books[i].isbn !== editIsbn) {
      return 'A book with this ISBN is already saved.';
    }
  }
  return '';
}

function checkTitle() {
  var title = getValue('title');
  if (title === '') return 'Title is required.';
  if (title.length < 2) return 'Title must have at least 2 characters.';
  if (title.length > 100) return 'Title can have at most 100 characters.';
  return '';
}

function checkAuthor() {
  var author = getValue('author');
  if (author === '') return 'Author name is required.';
  if (author.length < 2) return 'Author name must have at least 2 characters.';
  if (!/^[A-Za-z .'-]+$/.test(author)) {
    return 'Author name can only have letters, spaces and dots.';
  }
  return '';
}

function checkYear() {
  var year = getValue('year');
  var thisYear = new Date().getFullYear();
  if (year === '') return 'Year is required.';
  if (!/^[0-9]+$/.test(year)) return 'Year must be a whole number.';
  if (Number(year) < 1000 || Number(year) > thisYear) {
    return 'Year must be between 1000 and ' + thisYear + '.';
  }
  return '';
}

function checkCopies() {
  var copies = getValue('copies');
  if (copies === '') return 'Number of copies is required.';
  if (!/^[0-9]+$/.test(copies)) return 'Copies must be a whole number.';
  if (Number(copies) < 1 || Number(copies) > 100) {
    return 'Copies must be between 1 and 100.';
  }
  // while editing, copies cannot be less than the books already issued
  if (editIsbn !== null) {
    var book = findBook(editIsbn);
    var issued = book.copies - book.available;
    if (Number(copies) < issued) {
      return 'Copies cannot be less than the ' + issued + ' copies already issued.';
    }
  }
  return '';
}

function checkCategory() {
  if (getValue('category') === '') return 'Please select a category.';
  return '';
}

function checkType() {
  if (getValue('type') === '') return 'Please select the type of the book.';
  return '';
}

// all the checks in one object, so a field name gives its function
var checks = {
  isbn: checkIsbn,
  title: checkTitle,
  author: checkAuthor,
  year: checkYear,
  copies: checkCopies,
  category: checkCategory,
  type: checkType
};


// ---------- Show and clear the errors ----------
function showFieldResult(name, errorText) {
  document.getElementById(name + '-error').textContent = errorText;

  if (name === 'type') return;               // radio buttons have no border to colour

  var input = document.getElementById(name);
  input.classList.remove('invalid', 'valid');
  input.classList.add(errorText === '' ? 'valid' : 'invalid');
}

function validateField(name) {
  var errorText = checks[name]();
  showFieldResult(name, errorText);
  return errorText === '';
}

// checks every field, shows all the errors and goes to the first wrong field
function validateAll() {
  var firstWrong = null;

  for (var i = 0; i < fields.length; i++) {
    if (!validateField(fields[i]) && firstWrong === null) {
      firstWrong = fields[i];
    }
  }

  if (firstWrong !== null && firstWrong !== 'type') {
    document.getElementById(firstWrong).focus();
  }
  return firstWrong === null;
}

function clearErrors() {
  for (var i = 0; i < fields.length; i++) {
    document.getElementById(fields[i] + '-error').textContent = '';
    if (fields[i] !== 'type') {
      document.getElementById(fields[i]).classList.remove('invalid', 'valid');
    }
  }
}

function showMessage(text, kind) {
  messageBox.textContent = text;
  messageBox.className = kind;
}


// ---------- Check a field when the user leaves it ----------
fields.forEach(function (name) {
  if (name === 'type') {
    var radios = form.querySelectorAll('input[name="type"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () { validateField('type'); });
    }
  } else {
    var input = document.getElementById(name);
    var eventName = (name === 'category') ? 'change' : 'blur';
    input.addEventListener(eventName, function () { validateField(name); });

    // when the box is already red, re-check while typing so the message goes away
    input.addEventListener('input', function () {
      if (input.classList.contains('invalid')) {
        validateField(name);
      }
    });
  }
});

// ISBN box: remove letters while typing (keep digits and hyphens)
document.getElementById('isbn').addEventListener('input', function (event) {
  event.target.value = event.target.value.replace(/[^0-9-]/g, '');
});


// ---------- Save a book (add or update) ----------
form.addEventListener('submit', function (event) {
  event.preventDefault();                    // do not reload the page

  if (!validateAll()) {
    showMessage('Please correct the errors shown in red. Nothing was saved.', 'fail');
    return;
  }

  var copies = Number(getValue('copies'));

  if (editIsbn === null) {
    // new book: all copies are in the library
    books.push({
      isbn: getIsbn(),
      title: getValue('title').replace(/\s+/g, ' '),
      author: getValue('author').replace(/\s+/g, ' '),
      year: Number(getValue('year')),
      copies: copies,
      available: copies,
      category: getValue('category'),
      type: getValue('type')
    });
    showMessage('Book saved successfully.', 'success');
  } else {
    // old book: keep the number of issued copies the same
    var book = findBook(editIsbn);
    var issued = book.copies - book.available;
    book.isbn = getIsbn();
    book.title = getValue('title').replace(/\s+/g, ' ');
    book.author = getValue('author').replace(/\s+/g, ' ');
    book.year = Number(getValue('year'));
    book.copies = copies;
    book.available = copies - issued;
    book.category = getValue('category');
    book.type = getValue('type');
    showMessage('Book updated successfully.', 'success');
  }

  saveBooks();
  resetForm(false);
  showBooks();
});

clearBtn.addEventListener('click', function () {
  resetForm(true);
});

// goes back from edit mode to add mode without saving
cancelBtn.addEventListener('click', function () {
  resetForm(true);
});

// empties the form and goes back to "add" mode
function resetForm(clearMessage) {
  form.reset();
  clearErrors();
  editIsbn = null;
  formTitle.textContent = 'Register a book';
  saveBtn.textContent = 'Save book';
  cancelBtn.classList.remove('show');
  if (clearMessage) {
    showMessage('', '');
  }
}


// ---------- Edit, issue, return and delete ----------
function findBook(isbn) {
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn === isbn) {
      return books[i];
    }
  }
  return null;
}

function editBook(isbn) {
  var book = findBook(isbn);
  resetForm(true);

  document.getElementById('isbn').value = book.isbn;
  document.getElementById('title').value = book.title;
  document.getElementById('author').value = book.author;
  document.getElementById('year').value = book.year;
  document.getElementById('copies').value = book.copies;
  document.getElementById('category').value = book.category;
  form.querySelector('input[name="type"][value="' + book.type + '"]').checked = true;

  editIsbn = isbn;
  formTitle.textContent = 'Edit book';
  saveBtn.textContent = 'Update book';
  cancelBtn.classList.add('show');
  document.getElementById('title').focus();
}

function issueBook(isbn) {
  var book = findBook(isbn);
  if (book.type === 'Reference only') {
    alert('This is a reference book and cannot be issued.');
  } else if (book.available === 0) {
    alert('All copies of this book are already issued.');
  } else {
    book.available = book.available - 1;
    saveBooks();
    showBooks();
  }
}

function returnBook(isbn) {
  var book = findBook(isbn);
  if (book.available >= book.copies) {
    alert('All copies are already in the library.');
  } else {
    book.available = book.available + 1;
    saveBooks();
    showBooks();
  }
}

function deleteBook(isbn) {
  if (!confirm('Delete this book?')) {
    return;
  }
  // keep every book except this one
  books = books.filter(function (book) {
    return book.isbn !== isbn;
  });
  if (editIsbn === isbn) {
    resetForm(true);
  }
  saveBooks();
  showBooks();
  showMessage('Book deleted successfully.', 'success');
}


// ---------- Show the books in the table ----------
// A small helper which makes a button for a table row
function makeButton(text, className, onClick) {
  var button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

function showBooks() {
  var searchText = searchInput.value.toLowerCase().trim();
  var sortBy = sortSelect.value;

  // 1. search
  var list = books.filter(function (book) {
    return book.title.toLowerCase().includes(searchText) ||
           book.author.toLowerCase().includes(searchText) ||
           book.isbn.includes(searchText);
  });

  // 2. sort
  list.sort(function (a, b) {
    if (sortBy === 'year') {
      return a.year - b.year;
    }
    return a[sortBy].localeCompare(b[sortBy]);
  });

  // 3. build the rows (textContent is used, so typed text is never run as HTML)
  bookList.innerHTML = '';

  list.forEach(function (book) {
    var row = document.createElement('tr');

    var titleCell = document.createElement('td');
    titleCell.textContent = book.title;
    var small = document.createElement('span');
    small.className = 'small';
    small.textContent = 'ISBN ' + book.isbn + ' | ' + book.category + ' | ' + book.type;
    titleCell.appendChild(small);

    var authorCell = document.createElement('td');
    authorCell.textContent = book.author;

    var yearCell = document.createElement('td');
    yearCell.textContent = book.year;

    var availCell = document.createElement('td');
    availCell.textContent = book.available + ' / ' + book.copies;
    availCell.className = book.available > 0 ? 'in-stock' : 'out-stock';

    var actionCell = document.createElement('td');
    actionCell.appendChild(makeButton('Edit', 'edit', function () { editBook(book.isbn); }));
    actionCell.appendChild(makeButton('Issue', 'issue', function () { issueBook(book.isbn); }));
    actionCell.appendChild(makeButton('Return', 'return', function () { returnBook(book.isbn); }));
    actionCell.appendChild(makeButton('Delete', 'delete', function () { deleteBook(book.isbn); }));

    row.appendChild(titleCell);
    row.appendChild(authorCell);
    row.appendChild(yearCell);
    row.appendChild(availCell);
    row.appendChild(actionCell);
    bookList.appendChild(row);
  });

  countText.textContent = books.length;

  // show a message when there is nothing to display
  if (list.length === 0) {
    bookTable.style.display = 'none';
    emptyText.style.display = 'block';
    emptyText.textContent = books.length === 0 ? 'No books saved yet.' : 'No book matches your search.';
  } else {
    bookTable.style.display = 'table';
    emptyText.style.display = 'none';
  }
}


// ---------- Start ----------
searchInput.addEventListener('input', showBooks);
sortSelect.addEventListener('change', showBooks);

loadBooks();
showBooks();
