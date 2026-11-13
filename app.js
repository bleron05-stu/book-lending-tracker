/* BOOKTRACK JAVASCRIPT LIBRARY */

(() => {

    'use strict';

    const STORAGE_KEY = 'bookTrackLoans';

    const form = document.getElementById('loan-form');
    const tableBody = document.getElementById('loans-table-body');

    const totalLoansElement = document.getElementById('total-loans');
    const overdueLoansElement = document.getElementById('overdue-loans');
    const recordCountElement = document.getElementById('record-count');

    const successMessage = document.getElementById('form-success');

    const fields = {
        title: document.getElementById('title'),
        author: document.getElementById('author'),
        borrower: document.getElementById('borrower'),
        dueDate: document.getElementById('due-date'),
        genre: document.getElementById('genre')
    };

    let loans = loadLoans();

    // Load saved books from localStorage
    function loadLoans() {

        try {
            const savedLoans = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

            return Array.isArray(savedLoans) ? savedLoans : [];

        } catch (error) {
            console.warn('Could not load saved loans:', error);
            return [];
        }
    }

    // Save books in localStorage
    function saveLoans() {

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(loans)
            );

        } catch (error) {
            console.warn('Could not save loans:', error);
        }
    }

    // Display validation errors
    function showError(fieldName, message) {

        const field = fields[fieldName];

        const errorElement = document.getElementById(
            `${field.id}-error`
        );

        field.setAttribute(
            'aria-invalid',
            message ? 'true' : 'false'
        );

        errorElement.textContent = message;
    }

    // Validate form fields
    function validateForm() {

        let isValid = true;

        successMessage.textContent = '';

        const requiredFields = [
            ['title', 'Please enter the book title.'],
            ['borrower', 'Please enter the borrower\'s name.'],
            ['dueDate', 'Please choose a due date.']
        ];

        requiredFields.forEach(([fieldName, message]) => {

            const value = fields[fieldName].value.trim();

            if (!value) {
                showError(fieldName, message);
                isValid = false;
            } else {
                showError(fieldName, '');
            }

        });

        // Check if due date is in the past
        if (fields.dueDate.value) {

            const today = new Date();

            const localToday = new Date(
                today.getTime() - today.getTimezoneOffset() * 60000
            ).toISOString().slice(0, 10);

            if (fields.dueDate.value < localToday) {

                showError(
                    'dueDate',
                    'The due date cannot be in the past.'
                );

                isValid = false;
            }
        }

        return isValid;
    }

    // Check whether a book is overdue
    function isOverdue(loan) {

        const today = new Date();

        const localToday = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 10);

        return loan.dueDate < localToday;
    }

    // Format dates
    function formatDate(dateString) {

        const [year, month, day] = dateString.split('-').map(Number);

        return new Date(year, month - 1, day)
            .toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
    }

    // Create a table cell
    function createCell(text) {

        const cell = document.createElement('td');

        cell.textContent = text;

        return cell;
    }

    // Display all loans
    function renderLoans() {

        tableBody.replaceChildren();

        if (loans.length === 0) {

            const row = document.createElement('tr');

            row.className = 'empty-row';

            const cell = document.createElement('td');

            cell.colSpan = 7;

            const icon = document.createElement('span');
            icon.className = 'empty-icon';
            icon.textContent = '📚';

            const title = document.createElement('strong');
            title.textContent = 'No lent books yet';

            const hint = document.createElement('span');
            hint.textContent = 'Add your first book using the form above.';

            cell.append(icon, title, hint);

            row.appendChild(cell);

            tableBody.appendChild(row);

        } else {

            loans.forEach((loan) => {

                const row = document.createElement('tr');

                row.append(
                    createCell(loan.title),
                    createCell(loan.author || '—'),
                    createCell(loan.borrower),
                    createCell(formatDate(loan.dueDate)),
                    createCell(loan.genre)
                );

                // Status column
                const statusCell = document.createElement('td');

                const status = document.createElement('span');

                const overdue = isOverdue(loan);

                status.className = overdue
                    ? 'status overdue'
                    : 'status';

                status.textContent = overdue
                    ? 'Overdue'
                    : 'On loan';

                statusCell.appendChild(status);

                row.appendChild(statusCell);

                // Action column
                const actionCell = document.createElement('td');

                const deleteButton = document.createElement('button');

                deleteButton.type = 'button';
                deleteButton.className = 'delete-button';
                deleteButton.textContent = 'Remove';

                deleteButton.setAttribute(
                    'aria-label',
                    `Remove ${loan.title}`
                );

                deleteButton.addEventListener('click', () => {
                    removeLoan(loan.id);
                });

                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);

                tableBody.appendChild(row);

            });
        }

        // Update summary
        const overdueCount = loans.filter(isOverdue).length;

        totalLoansElement.textContent = String(loans.length);

        overdueLoansElement.textContent = String(overdueCount);

        recordCountElement.textContent =
            `${loans.length} ${loans.length === 1 ? 'record' : 'records'}`;
    }

    // Remove a book
    function removeLoan(id) {

        loans = loans.filter((loan) => loan.id !== id);

        saveLoans();

        renderLoans();

        successMessage.textContent =
            'Book removed from the tracker.';
    }

    // Add a new book
    form.addEventListener('submit', (event) => {

        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const newLoan = {

            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,

            title: fields.title.value.trim(),

            author: fields.author.value.trim(),

            borrower: fields.borrower.value.trim(),

            dueDate: fields.dueDate.value,

            genre: fields.genre.value

        };

        loans.push(newLoan);

        saveLoans();

        renderLoans();

        form.reset();

        Object.keys(fields).forEach((fieldName) => {
            showError(fieldName, '');
        });

        successMessage.textContent =
            'Book added successfully!';

        fields.title.focus();

    });

    // Clear error messages when fields are corrected
    Object.entries(fields).forEach(([fieldName, field]) => {

        field.addEventListener('input', () => {

            if (field.value.trim()) {
                showError(fieldName, '');
            }

        });

        field.addEventListener('change', () => {

            if (field.value.trim()) {
                showError(fieldName, '');
            }

        });

    });

    // Initial display
    renderLoans();

})();
