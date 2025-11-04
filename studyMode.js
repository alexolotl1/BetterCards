let studyMode = false;
let currentCardIndex = -1;
let studyStartTime = null;
let cardsStudied = 0;
let timerInterval = null;
let currentGroupId = null;

export function startStudyMode(groupId) {
    const group = getGroupById(groupId);
    if (!group || !group.cards || group.cards.length === 0) {
        alert('Add some flashcards to this group first!');
        return;
    }

    currentGroupId = groupId;
    studyMode = true;
    cardsStudied = 0;
    studyStartTime = new Date();
    updateStudyStats();
    
    timerInterval = setInterval(updateStudyStats, 1000);
    
    document.getElementById('normalView').classList.add('hidden');
    document.getElementById('studyView').classList.remove('hidden');
    
    showNextStudyCard();
}

export function stopStudyMode() {
    if (!studyMode || !currentGroupId) return;

    const studyEndTime = new Date();
    const studyDuration = Math.floor((studyEndTime - studyStartTime) / 1000); 
    
    updateGroupStudyStats(currentGroupId, studyDuration, cardsStudied);
    
    studyMode = false;
    clearInterval(timerInterval);
    currentGroupId = null;

    document.getElementById('normalView').classList.remove('hidden');
    document.getElementById('studyView').classList.add('hidden');
    
    document.querySelector('.study-card').classList.remove('flipped');
}

export function handleCardFlip() {
    if (!studyMode) return;
    document.querySelector('.study-card').classList.toggle('flipped');
}

export function handleNextCard() {
    if (!studyMode) return;
    
    cardsStudied++;
    updateStudyStats();
    showNextStudyCard();
}

function showNextStudyCard() {
    const group = getGroupById(currentGroupId);
    if (!group || !group.cards) return;
    
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * group.cards.length);
    } while (newIndex === currentCardIndex && group.cards.length > 1);
    
    currentCardIndex = newIndex;
    const card = group.cards[currentCardIndex];
    
    const studyCard = document.querySelector('.study-card');
    studyCard.classList.remove('flipped');
    
    setTimeout(() => {
        document.querySelector('.card-front').textContent = card.front;
        document.querySelector('.card-back').textContent = card.back;
    }, 200);
}

function updateStudyStats() {
    if (!studyStartTime) return;
    
    const now = new Date();
    const timeDiff = Math.floor((now - studyStartTime) / 1000); 
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    document.getElementById('studyTime').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('cardsStudied').textContent = cardsStudied;
}

function getGroupById(groupId) {
    const groups = JSON.parse(localStorage.getItem('cardGroups')) || [];
    return groups.find(g => g.id === groupId);
}

function updateGroupStudyStats(groupId, duration, cardsStudied) {
    const groups = JSON.parse(localStorage.getItem('cardGroups')) || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const group = groups[groupIndex];
    group.totalTimeStudied = (group.totalTimeStudied || 0) + duration;
    group.totalCardsStudied = (group.totalCardsStudied || 0) + cardsStudied;
    group.lastStudied = new Date().toISOString();
    
    localStorage.setItem('cardGroups', JSON.stringify(groups));
    
    const totalStudyTime = Math.floor(group.totalTimeStudied / 60);
    document.getElementById('totalStudyTime').textContent = totalStudyTime > 0 ? `${totalStudyTime}min` : '0min';
    document.getElementById('lastStudied').textContent = new Date(group.lastStudied).toLocaleDateString();
}