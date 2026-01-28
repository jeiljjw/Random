// ========================================
// Random Winner - Professional Script
// ========================================

// Web Audio API 컨텍스트
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// 드럼 롤 효과 (긴장감)
function playDrumRoll(duration, speed) {
    return new Promise((resolve) => {
        const startTime = audioContext.currentTime;
        const intervalTime = speed / 1000;
        let count = 0;
        
        const playBeat = () => {
            if (audioContext.currentTime - startTime > duration) {
                resolve();
                return;
            }
            
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80 + (count % 3) * 20, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc.start();
            osc.stop(audioContext.currentTime + 0.1);
            
            count++;
            setTimeout(playBeat, intervalTime * 1000);
        };
        
        playBeat();
    });
}

// 스네어 효과
function playSnare() {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const noise = audioContext.createBufferSource();
    
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.4, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
    noise.start();
    noise.stop(audioContext.currentTime + 0.1);
}

// 긴장감 업다운 효과
function playTensionSound() {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.2);
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
}

// 당첨 효과음 (팡파르)
function playWinnerSound() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc.start();
            osc.stop(audioContext.currentTime + 0.3);
        }, index * 100);
    });
    
    setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 1046.50;
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 1.5);
    }, notes.length * 100);
}

// ========================================
// DOM Elements
// ========================================
const drawBtn = document.getElementById('draw-btn');
const participantsInput = document.getElementById('participants');
const winnerCountInput = document.getElementById('winner-count');
const minusBtn = document.getElementById('minus-btn');
const plusBtn = document.getElementById('plus-btn');
const countSpan = document.getElementById('count');
const ladderOverlay = document.getElementById('ladder-overlay');
const ladderNames = document.getElementById('ladder-names');
const progressBar = document.getElementById('progress-bar');
const resultModal = document.getElementById('result-modal');
const winnersContainer = document.getElementById('winners');
const closeModalBtn = document.getElementById('close-modal');

// ========================================
// Event Listeners
// ========================================
drawBtn.addEventListener('click', drawWinners);
minusBtn.addEventListener('click', () => updateWinnerCount(-1));
plusBtn.addEventListener('click', () => updateWinnerCount(1));
closeModalBtn.addEventListener('click', closeResultModal);
resultModal.querySelector('.modal-backdrop').addEventListener('click', closeResultModal);

participantsInput.addEventListener('input', updateParticipantCount);

function updateParticipantCount() {
    const text = participantsInput.value.trim();
    if (text) {
        const count = text.split('\n').filter(name => name.trim() !== '').length;
        countSpan.textContent = count;
    } else {
        countSpan.textContent = '0';
    }
}

function updateWinnerCount(delta) {
    let current = parseInt(winnerCountInput.value);
    let newVal = current + delta;
    if (newVal < 1) newVal = 1;
    if (newVal > 20) newVal = 20;
    winnerCountInput.value = newVal;
}

function closeResultModal() {
    resultModal.classList.remove('show');
}

// ========================================
// Main Draw Function
// ========================================
function drawWinners() {
    initAudio();
    
    const participantsText = participantsInput.value.trim();
    const winnerCount = parseInt(winnerCountInput.value);
    
    const participants = participantsText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name !== '');
    
    if (participants.length === 0) {
        alert('참가자를 입력해주세요!');
        participantsInput.focus();
        return;
    }
    
    if (winnerCount > participants.length) {
        alert(`당첨자 수는 참가자 수(${participants.length}) 이하여야 합니다!`);
        return;
    }
    
    // 버튼 비활성화
    drawBtn.disabled = true;
    
    // 랜덤 당첨자 선정
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnerCount);
    const nonWinners = participants.filter(p => !winners.includes(p));
    
    // 사다리 애니메이션 시작
    showLadderAnimation(winners, nonWinners, participants, () => {
        showResult(winners);
        drawBtn.disabled = false;
    });
}

// ========================================
// Ladder Animation
// ========================================
function showLadderAnimation(winners, nonWinners, participantsList, onComplete) {
    ladderNames.innerHTML = '';
    ladderOverlay.classList.add('show');
    progressBar.style.width = '0%';
    
    // 참가자 표시
    participantsList.forEach(name => {
        const nameElement = document.createElement('div');
        nameElement.className = 'ladder-name';
        nameElement.textContent = name;
        nameElement.dataset.name = name;
        ladderNames.appendChild(nameElement);
    });
    
    const nameElements = Array.from(ladderNames.querySelectorAll('.ladder-name'));
    let speed = 80;
    let minSpeed = 250;
    let round = 0;
    const maxRounds = 4 + Math.floor(Math.random() * 2);
    
    // 드럼 롤 시작
    let drumInterval = setInterval(() => {
        playTensionSound();
    }, speed);
    
    function highlightRandom() {
        nameElements.forEach(el => el.classList.add('scrolling'));
        
        let currentIndex = 0;
        const interval = setInterval(() => {
            nameElements.forEach(el => {
                el.style.background = '';
                el.style.color = '';
            });
            
            const randomIndex = Math.floor(Math.random() * nameElements.length);
            nameElements[randomIndex].style.background = '#6366f1';
            nameElements[randomIndex].style.color = 'white';
            
            if (currentIndex % 2 === 0) {
                playSnare();
            }
            
            currentIndex++;
            
            // 라운드 종료
            if (currentIndex >= 6 || currentIndex >= 25) {
                clearInterval(interval);
                nameElements.forEach(el => {
                    el.classList.remove('scrolling');
                    el.style.background = '';
                    el.style.color = '';
                });
                
                // 진행률 업데이트
                const progress = ((round + 1) / maxRounds) * 100;
                progressBar.style.width = `${progress}%`;
                
                // 탈락자 표시
                if (round < maxRounds - 1 && nonWinners.length > winners.length) {
                    const eliminateCount = Math.max(1, Math.floor(nonWinners.length / (maxRounds - round)));
                    const shuffledNonWinners = [...nonWinners].sort(() => Math.random() - 0.5);
                    
                    for (let i = 0; i < eliminateCount && shuffledNonWinners.length > 0; i++) {
                        const eliminatedName = shuffledNonWinners.pop();
                        const eliminatedElement = nameElements.find(el => el.dataset.name === eliminatedName);
                        if (eliminatedElement) {
                            eliminatedElement.classList.add('eliminated');
                        }
                        const idx = nonWinners.indexOf(eliminatedName);
                        if (idx > -1) nonWinners.splice(idx, 1);
                    }
                }
                
                round++;
                speed = Math.min(speed + 50, minSpeed);
                
                clearInterval(drumInterval);
                drumInterval = setInterval(() => {
                    playTensionSound();
                }, speed);
                
                if (round < maxRounds) {
                    setTimeout(highlightRandom, speed);
                } else {
                    clearInterval(drumInterval);
                    
                    // 최종 당첨자
                    nameElements.forEach(el => {
                        el.classList.remove('scrolling');
                        el.style.background = '';
                        el.style.color = '';
                    });
                    
                    winners.forEach(winner => {
                        const winnerElement = nameElements.find(el => el.dataset.name === winner);
                        if (winnerElement) {
                            winnerElement.classList.add('selected');
                        }
                    });
                    
                    // 마지막 스네어
                    setTimeout(() => {
                        for (let i = 0; i < 3; i++) {
                            setTimeout(() => playSnare(), i * 120);
                        }
                    }, 300);
                    
                    setTimeout(() => {
                        ladderOverlay.classList.remove('show');
                        onComplete();
                    }, 1500);
                }
            }
        }, speed);
    }
    
    setTimeout(highlightRandom, 500);
}

// ========================================
// Show Result
// ========================================
function showResult(winners) {
    winnersContainer.innerHTML = '';
    playWinnerSound();
    
    winners.forEach((winner, index) => {
        setTimeout(() => {
            const winnerElement = document.createElement('div');
            winnerElement.className = 'winner';
            winnerElement.innerHTML = `<i class="fas fa-crown"></i> ${winner}`;
            winnersContainer.appendChild(winnerElement);
        }, index * 200);
    });
    
    resultModal.classList.add('show');
}

// ========================================
// Initialize
// ========================================
updateParticipantCount();
