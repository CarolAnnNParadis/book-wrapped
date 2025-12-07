async function loadBooks() {
    try {
        const response = await fetch("data.json");
        const books = await response.json();

        const container = document.getElementById("book-container");

        books.forEach(book => {
            const card = document.createElement("div");
            card.classList.add("book-card");

            card.innerHTML = `
                <h2>${book.title}</h2>
                <p>by ${book.author}</p>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading books:", error);
    }
}

loadBooks();
