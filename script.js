import { startStudyMode, stopStudyMode, handleCardFlip, handleNextCard } from './studyMode.js';

let cardGroups = JSON.parse(localStorage.getItem('cardGroups')) || [];
let currentGroupId = null;

function initializeStudyMode() {
    if (!currentGroupId) {
        alert('Please select a card group first!');
        return;
    }
    startStudyMode(currentGroupId);
}

document.getElementById('startStudyBtn').addEventListener('click', initializeStudyMode);
document.getElementById('stopStudyBtn').addEventListener('click', stopStudyMode);
document.querySelector('.study-card').addEventListener('click', handleCardFlip);
document.getElementById('nextCardBtn').addEventListener('click', handleNextCard);

// Action buttons
const createCardBtn = document.getElementById('createCardBtn');
const createGroupBtn = document.getElementById('createGroupBtn');
const importCardsBtn = document.getElementById('importCardsBtn');
const deleteGroupBtn = document.getElementById('deleteGroupBtn');
const saveCardBtn = document.getElementById('saveCardBtn');
const saveGroupBtn = document.getElementById('saveGroupBtn');

// Modal elements
const cardModal = document.getElementById('createCardModal');
const groupModal = document.getElementById('createGroupModal');
const importModal = document.getElementById('importCardsModal');
const closeCardModal = document.querySelector('.close-modal');
const closeGroupModal = document.querySelector('.close-group-modal');
const closeImportModal = document.querySelector('.close-import-modal');

// Group related elements
const groupNameInput = document.getElementById('groupName');
const groupList = document.querySelector('.group-list');
const currentGroupName = document.getElementById('currentGroupName');

// Card container and stats
const cardsContainer = document.getElementById('cards-container');
const cardCount = document.getElementById('cardCount');

// Study mode elements
const startStudyBtn = document.getElementById('startStudyBtn');
const stopStudyBtn = document.getElementById('stopStudyBtn');
const studyCard = document.querySelector('.study-card');
const normalView = document.getElementById('normalView');
const studyView = document.getElementById('studyView');

// Study statistics
const totalStudyTime = document.getElementById('totalStudyTime');
const lastStudied = document.getElementById('lastStudied');
const cardsStudiedElement = document.getElementById('cardsStudied');
const studyTimeElement = document.getElementById('studyTime');

// Add event listeners for action buttons
createCardBtn.addEventListener('click', openCardModal);
createGroupBtn.addEventListener('click', openGroupModal);
importCardsBtn.addEventListener('click', openImportModal);
deleteGroupBtn.addEventListener('click', deleteCurrentGroup);

// Add event listeners for modal controls
closeCardModal.addEventListener('click', () => closeModal(cardModal));
closeGroupModal.addEventListener('click', () => closeModal(groupModal));
closeImportModal.addEventListener('click', () => closeModal(importModal));
saveCardBtn.addEventListener('click', saveCard);
saveGroupBtn.addEventListener('click', saveGroup);
document.getElementById('saveImportBtn').addEventListener('click', importCards);
document.querySelector('.close-import-modal').addEventListener('click', () => closeModal(importModal));
studyCard.addEventListener('click', handleCardFlip);

window.addEventListener('click', (e) => {
    if (e.target === cardModal) {
        closeModal(cardModal);
    } else if (e.target === groupModal) {
        closeModal(groupModal);
    } else if (e.target === importModal) {
        closeModal(importModal);
    }
});

function openImportModal() {
    if (!currentGroupId) {
        alert('Please select a group first!');
        return;
    }
    importModal.style.display = 'block';
}

function importCards() {
    if (!currentGroupId) {
        alert('Please select a group first!');
        return;
    }

    const importText = document.getElementById('importContent').value.trim();
    if (!importText) {
        alert('Please enter some content to import!');
        return;
    }

    const rows = importText.split('\n');
    let importedCards = [];
    let errorLines = [];

    rows.forEach((row, index) => {
        if (!row.trim()) return; // Skip empty lines
        
        const sides = row.split('//').map(side => side.trim());
        if (sides.length !== 2 || !sides[0] || !sides[1]) {
            errorLines.push(index + 1);
            return;
        }

        importedCards.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            front: sides[0],
            back: sides[1],
            knownLevel: 0
        });
    });

    if (errorLines.length > 0) {
        alert(`Warning: Lines ${errorLines.join(', ')} were skipped due to invalid format`);
    }

    if (importedCards.length > 0) {
        const groups = JSON.parse(localStorage.getItem('cardGroups')) || [];
        const groupIndex = groups.findIndex(g => g.id === currentGroupId);
        
        if (groupIndex !== -1) {
            groups[groupIndex].cards = groups[groupIndex].cards || [];
            groups[groupIndex].cards.push(...importedCards);
            localStorage.setItem('cardGroups', JSON.stringify(groups));
            document.getElementById('importContent').value = '';
            alert(`Successfully imported ${importedCards.length} cards!`);
            closeModal(importModal);
        }
    }
}

function openCardModal() {
    if (!currentGroupId) {
        alert('Please select a group first!');
        return;
    }
    cardModal.style.display = 'block';
    document.getElementById('cardFront').value = '';
    document.getElementById('cardBack').value = '';
}

function openGroupModal() {
    groupModal.style.display = 'block';
    groupNameInput.value = '';
    groupNameInput.focus();
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function saveGroup() {
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    const newGroup = {
        id: Date.now().toString(),
        name: groupName,
        cards: [],
        totalTimeStudied: 0,
        totalCardsStudied: 0,
        lastStudied: null,
        created: new Date().toISOString()
    };

    cardGroups.push(newGroup);
    localStorage.setItem('cardGroups', JSON.stringify(cardGroups));
    closeModal(groupModal);
    displayGroups();
    selectGroup(newGroup.id);
}

function saveCard() {
    const frontText = document.getElementById('cardFront').value.trim();
    const backText = document.getElementById('cardBack').value.trim();

    if (!frontText || !backText) {
        alert('Please fill in both sides of the flashcard');
        return;
    }

    if (!currentGroupId) {
        alert('Please select a group first!');
        return;
    }

    const groupIndex = cardGroups.findIndex(g => g.id === currentGroupId);
    if (groupIndex === -1) return;

    const newCard = {
        id: Date.now().toString(),
        front: frontText,
        back: backText,
        confidenceLevel: 0,
        timesReviewed: 0,
        created: new Date().toISOString()
    };

    if (!cardGroups[groupIndex].cards) {
        cardGroups[groupIndex].cards = [];
    }
    
    cardGroups[groupIndex].cards.push(newCard);
    localStorage.setItem('cardGroups', JSON.stringify(cardGroups));
    
    displayCards(cardGroups[groupIndex]);
    closeModal(cardModal);
    
    cardCount.textContent = cardGroups[groupIndex].cards.length;
}

function getMainGroup() {
    const mainGroup = cardGroups.find(g => g.name === 'Main');
    if (!mainGroup) {
        const newMainGroup = {
            id: 'main',
            name: 'Main',
            cards: [],
            totalTimeStudied: 0,
            totalCardsStudied: 0,
            lastStudied: null,
            created: new Date().toISOString()
        };
        cardGroups.unshift(newMainGroup);
        localStorage.setItem('cardGroups', JSON.stringify(cardGroups));
        return newMainGroup;
    }
    return mainGroup;
}

function selectGroup(groupId) {
    currentGroupId = groupId;
    const group = cardGroups.find(g => g.id === groupId);
    if (!group) return;

    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.groupId === groupId) {
            item.classList.add('active');
        }
    });

    currentGroupName.textContent = group.name;
    cardCount.textContent = group.cards ? group.cards.length : 0;
    totalStudyTime.textContent = formatStudyTime(group.totalTimeStudied || 0);
    lastStudied.textContent = group.lastStudied ? formatDate(group.lastStudied) : 'Never';

    displayCards(group);
}

function displayGroups() {
    groupList.innerHTML = '';
    
    cardGroups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.dataset.groupId = group.id;
        if (group.id === currentGroupId) {
            groupElement.classList.add('active');
        }
        groupElement.textContent = group.name;
        
        groupElement.addEventListener('click', () => selectGroup(group.id));
        groupList.appendChild(groupElement);
    });
}

function displayCards(group) {
    cardsContainer.innerHTML = '';
    
    if (!group.cards || group.cards.length === 0) {
        cardsContainer.innerHTML = '<div class="placeholder-text">No flashcards in this group yet. Create one to get started!</div>';
        return;
    }

    group.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard';

        const content = document.createElement('div');
        content.className = 'card-content';

        const front = document.createElement('div');
        front.className = 'card-side front-side';
        front.textContent = card.front;

        const back = document.createElement('div');
        back.className = 'card-side back-side';
        back.textContent = card.back;

        content.appendChild(front);
        content.appendChild(back);

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete this flashcard?')) {
                deleteCard(card.id);
            }
        });

        actions.appendChild(deleteBtn);
        cardElement.appendChild(content);
        cardElement.appendChild(actions);
        cardsContainer.appendChild(cardElement);
    });
}

function deleteCard(cardId) {
    const groupIndex = cardGroups.findIndex(g => g.id === currentGroupId);
    if (groupIndex === -1) return;

    cardGroups[groupIndex].cards = cardGroups[groupIndex].cards.filter(c => c.id !== cardId);
    localStorage.setItem('cardGroups', JSON.stringify(cardGroups));
    displayCards(cardGroups[groupIndex]);
    
    cardCount.textContent = cardGroups[groupIndex].cards.length;
}

function deleteCurrentGroup() {
    if (!currentGroupId) return;
    
    const mainGroup = getMainGroup();
    if (currentGroupId === mainGroup.id) {
        alert('Cannot delete the Main group!');
        return;
    }

    if (!confirm('Are you sure you want to delete this group and all its cards?')) return;

    cardGroups = cardGroups.filter(g => g.id !== currentGroupId);
    localStorage.setItem('cardGroups', JSON.stringify(cardGroups));
    selectGroup(mainGroup.id);
    displayGroups();
}

function formatStudyTime(seconds) {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1min' : `${minutes}min`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

if (cardGroups.length === 0) {
    getMainGroup();
}
displayGroups();
selectGroup(getMainGroup().id);