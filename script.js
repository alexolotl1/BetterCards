let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];

const createCardBtn = document.getElementById('createCardBtn');
const modal = document.getElementById('createCardModal');
const closeModal = document.querySelector('.close-modal');
const saveCardBtn = document.getElementById('saveCardBtn');
const cardsContainer = document.getElementById('cards-container');

createCardBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalHandler);
saveCardBtn.addEventListener('click', saveCard);

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalHandler();
    }
});

function openModal() {
    modal.style.display = 'block';
    document.getElementById('cardFront').value = '';
    document.getElementById('cardBack').value = '';
}

function closeModalHandler() {
    modal.style.display = 'none';
}

function saveCard() {
    const frontText = document.getElementById('cardFront').value.trim();
    const backText = document.getElementById('cardBack').value.trim();

    if (!frontText || !backText) {
        alert('Please fill in both sides of the flashcard');
        return;
    }

    const newCard = {
        id: Date.now(), 
        front: frontText,
        back: backText
    };

    flashcards.push(newCard);
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
    
    displayCards();
    closeModalHandler();
}

function displayCards() {
    cardsContainer.innerHTML = '';
    
    if (flashcards.length === 0) {
        cardsContainer.innerHTML = '<div class="placeholder-text">No flashcards yet. Create one to get started!</div>';
        return;
    }

    flashcards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard';
        cardElement.innerHTML = `
            <div class="card-side front-side">
                <strong>Front:</strong><br>
                ${card.front}
            </div>
            <div class="card-side back-side">
                <strong>Back:</strong><br>
                ${card.back}
            </div>
        `;
        cardsContainer.appendChild(cardElement);
    });
}

displayCards();