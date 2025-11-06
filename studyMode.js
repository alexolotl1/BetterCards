let studyMode = false;         
let currentCardIndex = -1;    
let studyStartTime = null;     
let cardsStudied = 0;         
let timerInterval = null;       
let currentGroupId = null;     
let currentGroup = null;      
let isKnownLearningMode = true; 
let isFlippedCardsMode = false; 

function initializeCardKnowledge(cards) {
    return cards.map(card => ({
        ...card,
        knownLevel: card.knownLevel || 0 
    }));
}

function calculateConfidenceLevels(cards) {
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = cards.length;
    
    cards.forEach(card => {
        if (card.knownLevel > 0) {
            levels[card.knownLevel]++;
        }
    });
    
    Object.keys(levels).forEach(level => {
        levels[level] = {
            count: levels[level],
            percentage: total > 0 ? (levels[level] / total) * 100 : 0
        };
    });
    
    return levels;
}

function updateConfidenceChart(levels) {
    const totalCards = Object.values(levels).reduce((sum, level) => sum + level.count, 0);
    
    // Update each bar in the chart
    for (let level = 1; level <= 5; level++) {
        const data = levels[level];
        const percentage = data.percentage;
        const bar = document.querySelector(`.chart-bar[data-level="${level}"] .bar-fill`);
        const countElem = document.querySelector(`.chart-bar[data-level="${level}"] .bar-count`);
        const labelElem = document.querySelector(`.chart-bar[data-level="${level}"] .bar-label`);
        
        if (bar && countElem && labelElem) {
            bar.style.width = `${percentage}%`;
            countElem.textContent = data.count;
            labelElem.textContent = `Level ${level}`;
        }
    }
}

function updateGroupConfidenceSummary(levels) {
    // Filter out cards that haven't been tested (no confidence level)
    const testedCards = Object.values(levels).reduce((sum, level) => sum + level.count, 0);
    
    if (testedCards === 0) {
        document.getElementById('groupConfidence').textContent = 'No cards tested yet';
        return;
    }
    
    const totalPoints = Object.entries(levels).reduce((sum, [level, data]) => {
        return sum + (level * data.count);
    }, 0);
    
    const confidencePercentage = (totalPoints / (testedCards * 5)) * 100;
    
    const summaryElem = document.getElementById('groupConfidence');
    if (summaryElem) {
        summaryElem.textContent = `Confidence: ${confidencePercentage.toFixed(1)}%`;
    }
}

//startStudyMode and stopStudyMode functions
export function startStudyMode(groupId) {
    currentGroup = getGroupById(groupId);
    if (!currentGroup || !currentGroup.cards || currentGroup.cards.length === 0) {
        alert('Add some flashcards to this group first!');
        return;
    }

    document.getElementById('normalView').classList.add('hidden');
    document.querySelector('.group-banner').classList.add('hidden');
    document.querySelector('.sidebar').classList.add('hidden');
    document.querySelector('.content-controls').classList.add('hidden');
    document.getElementById('studyView').classList.remove('hidden');
    document.getElementById('studyGroupName').textContent = currentGroup.name;

    currentGroup.cards = initializeCardKnowledge(currentGroup.cards);
    currentGroupId = groupId;
    studyMode = true;
    cardsStudied = 0;
    studyStartTime = new Date();

    const knownModeCheckbox = document.getElementById('knownLearningMode');
    const flippedModeCheckbox = document.getElementById('flippedCardsMode');
    
    isKnownLearningMode = knownModeCheckbox.checked;
    isFlippedCardsMode = flippedModeCheckbox.checked;
    
    const newKnownModeCheckbox = knownModeCheckbox.cloneNode(true);
    const newFlippedModeCheckbox = flippedModeCheckbox.cloneNode(true);
    knownModeCheckbox.parentNode.replaceChild(newKnownModeCheckbox, knownModeCheckbox);
    flippedModeCheckbox.parentNode.replaceChild(newFlippedModeCheckbox, flippedModeCheckbox);
    
    newKnownModeCheckbox.addEventListener('change', (e) => {
        isKnownLearningMode = e.target.checked;
        document.getElementById('confidenceButtons').classList.toggle('hidden', !isKnownLearningMode);
        document.getElementById('confidenceLevels').classList.toggle('hidden', !isKnownLearningMode);
        document.getElementById('nextCardBtn').classList.toggle('hidden', isKnownLearningMode);
        updateConfidenceChart(calculateConfidenceLevels(currentGroup.cards));
    });
    
    newFlippedModeCheckbox.addEventListener('change', (e) => {
        isFlippedCardsMode = e.target.checked;
        showNextStudyCard();
    });
    
    document.querySelectorAll('.confidence-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const level = parseInt(newBtn.dataset.level);
            updateCardConfidence(level);
            handleNextCard(); 
        });
    });
    
    const confidenceData = calculateConfidenceLevels(currentGroup.cards);
    updateConfidenceChart(confidenceData);
    updateGroupConfidenceSummary(confidenceData);
    document.getElementById('nextCardBtn').classList.toggle('hidden', isKnownLearningMode);
    document.getElementById('confidenceLevels').classList.toggle('hidden', !isKnownLearningMode);
    
    timerInterval = setInterval(updateStudyStats, 1000);
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
    currentGroup = null;

    document.querySelector('.group-banner').classList.remove('hidden');
    document.getElementById('normalView').classList.remove('hidden');
    document.querySelector('.sidebar').classList.remove('hidden');
    document.getElementById('studyView').classList.add('hidden');
    document.querySelector('.content-controls').classList.remove('hidden');
    
    const cardContent = document.querySelector('.study-card .card-content');
    const backText = document.querySelector('.card-text.back');
    const divider = document.querySelector('.card-divider');
    backText.classList.add('hidden');
    divider.classList.add('hidden');

    document.getElementById('confidenceButtons').classList.add('hidden');
    document.getElementById('confidenceLevels').classList.add('hidden');
}

export function handleCardFlip() {
    if (!studyMode) return;
    
    const studyCard = document.querySelector('.study-card');
    const backText = document.querySelector('.card-text.back');
    const divider = document.querySelector('.card-divider');
    
    studyCard.classList.add('flipping');
    
    setTimeout(() => {
        backText.classList.toggle('hidden');
        divider.classList.toggle('hidden');
        
        if (!backText.classList.contains('hidden') && isKnownLearningMode) {
            document.getElementById('confidenceButtons').classList.remove('hidden');
        }
    }, 150); 
    
    setTimeout(() => {
        studyCard.classList.remove('flipping');
    }, 300);
}

export function handleNextCard() {
    if (!studyMode) return;
    
    cardsStudied++;
    updateStudyStats();
    
    const studyCard = document.querySelector('.study-card');
    studyCard.classList.add('card-exit');

    setTimeout(() => {
        document.getElementById('confidenceButtons').classList.add('hidden');
        studyCard.classList.remove('card-exit');
        showNextStudyCard();
        
        requestAnimationFrame(() => {
            studyCard.classList.add('card-enter');
            setTimeout(() => studyCard.classList.remove('card-enter'), 300);
        });
    }, 300);
}

function selectNextCard() {
    if (!currentGroup || !currentGroup.cards.length) return null;

    if (isKnownLearningMode) {
        const weights = currentGroup.cards.map(card => {
            const level = card.knownLevel || 0;
            // Exponential decay: much higher chance of seeing low-level cards
            return Math.pow(0.5, level); 
        });
        
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        return 0;
    } else {
        // In normal mode, completely random selection
        return Math.floor(Math.random() * currentGroup.cards.length);
    }
}

function showNextStudyCard() {
    if (!currentGroup || !currentGroup.cards) return;
    
    const newIndex = selectNextCard();
    if (newIndex === null) return;
    
    currentCardIndex = newIndex;
    const card = currentGroup.cards[currentCardIndex];
    
    const cardContent = document.querySelector('.study-card .card-content');
    const frontText = document.querySelector('.card-text.front');
    const backText = document.querySelector('.card-text.back');
    const divider = document.querySelector('.card-divider');

    frontText.textContent = isFlippedCardsMode ? card.back : card.front;
    backText.textContent = isFlippedCardsMode ? card.front : card.back;
    
    frontText.classList.remove('hidden');
    backText.classList.add('hidden');
    divider.classList.add('hidden');
    
    document.getElementById('confidenceButtons').classList.add('hidden');
}

function updateCardConfidence(level) {
    if (!currentGroup || currentCardIndex === -1) return;
    
    const card = currentGroup.cards[currentCardIndex];
    card.knownLevel = level;
    
    const groups = JSON.parse(localStorage.getItem('cardGroups')) || [];
    const groupIndex = groups.findIndex(g => g.id === currentGroupId);
    if (groupIndex !== -1) {
        groups[groupIndex] = currentGroup;
        localStorage.setItem('cardGroups', JSON.stringify(groups));
    }

    updateConfidenceChart(calculateConfidenceLevels(currentGroup.cards));
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