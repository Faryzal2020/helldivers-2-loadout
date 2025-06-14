
document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('roll-button');
    
    const cardElements = {
        primary: {
            img: document.getElementById('primary-img'),
            name: document.getElementById('primary-name'),
            card: document.getElementById('primary-card'),
        },
        secondary: {
            img: document.getElementById('secondary-img'),
            name: document.getElementById('secondary-name'),
            card: document.getElementById('secondary-card'),
        },
        grenade: {
            img: document.getElementById('grenade-img'),
            name: document.getElementById('grenade-name'),
            card: document.getElementById('grenade-card'),
        },
        stratagems: Array.from({ length: 4 }, (_, i) => ({
            img: document.getElementById(`stratagem-img-${i}`),
            name: document.getElementById(`stratagem-name-${i}`),
            card: document.getElementById(`stratagem-card-${i}`),
        }))
    };

    const deploySound = document.getElementById('deploy-sound');
    const successSound = document.getElementById('success-sound');

    const BASE_URL = 'https://raw.githubusercontent.com/Faryzal2020/helldivers-2-database/main/';
    const DATA_PATHS = {
        primaries: 'data/weapons/primary.json',
        secondaries: 'data/weapons/secondary.json',
        grenades: 'data/weapons/grenades.json',
        stratagems: 'data/stratagems/list.json'
    };

    let data = { primaries: [], secondaries: [], grenades: [], stratagems: [] };
    let isRolling = false;

    async function loadData() {
        try {
            const responses = await Promise.all([
                fetch(BASE_URL + DATA_PATHS.primaries),
                fetch(BASE_URL + DATA_PATHS.secondaries),
                fetch(BASE_URL + DATA_PATHS.grenades),
                fetch(BASE_URL + DATA_PATHS.stratagems)
            ]);

            for (const res of responses) {
                if (!res.ok) throw new Error(`Failed to fetch ${res.url}`);
            }

            const [primaryData, secondaryData, grenadeData, stratagemData] = await Promise.all(responses.map(res => res.json()));
            
            data.primaries = primaryData;
            data.secondaries = secondaryData;
            data.grenades = grenadeData;
            data.stratagems = Object.values(stratagemData).flat();
            
            rollButton.disabled = false;
            rollButton.textContent = 'DEPLOY!';
        } catch (error) {
            console.error('Failed to load Helldivers data:', error);
            rollButton.textContent = 'DATA ERROR';
            rollButton.classList.add('!bg-red-600', '!text-white');
        }
    }
    
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const getUniqueStratagems = (count) => shuffleArray([...data.stratagems]).slice(0, count);
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const playSound = (audioElement) => {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.warn("Sound play failed. User interaction might be needed.", e));
    }

    async function animateRoll(card, dataArray, finalItem, duration = 1500) {
        const interval = 60;
        const steps = duration / interval;
        
        card.card.classList.add('border-yellow-400/50', 'animate-pulse');
        card.img.classList.add('blur-sm', 'scale-90');
        
        for (let i = 0; i < steps; i++) {
            const randomItem = getRandomItem(dataArray);
            card.img.src = BASE_URL + randomItem.icon;
            if(i > steps - 5) card.name.textContent = randomItem.name.toUpperCase();
            await sleep(interval);
        }
        
        card.img.src = BASE_URL + finalItem.icon;
        card.name.textContent = finalItem.name.toUpperCase();
        card.card.classList.remove('border-yellow-400/50', 'animate-pulse', 'border-zinc-700');
        card.card.classList.add('border-yellow-400');
        card.img.classList.remove('filter', 'grayscale', 'blur-sm', 'scale-90');
        card.name.classList.remove('text-zinc-400');
        card.name.classList.add('text-white');
    }

    function resetCards() {
        const allCards = [cardElements.primary, cardElements.secondary, cardElements.grenade, ...cardElements.stratagems];
        allCards.forEach(({ card, img, name }) => {
            card.classList.remove('border-yellow-400');
            card.classList.add('border-zinc-700');
            img.classList.add('filter', 'grayscale');
            name.classList.remove('text-white');
            name.classList.add('text-zinc-400');
        });
    }

    async function handleRoll() {
        if (isRolling || data.primaries.length === 0) return;
        isRolling = true;
        rollButton.disabled = true;
        rollButton.textContent = 'DEPLOYING...';
        
        playSound(deploySound);
        resetCards();
        await sleep(100);

        const selections = {
            primary: getRandomItem(data.primaries),
            secondary: getRandomItem(data.secondaries),
            grenade: getRandomItem(data.grenades),
            stratagems: getUniqueStratagems(4)
        };
        
        const animations = [
            animateRoll(cardElements.primary, data.primaries, selections.primary, 1500),
            animateRoll(cardElements.secondary, data.secondaries, selections.secondary, 1700),
            animateRoll(cardElements.grenade, data.grenades, selections.grenade, 1900),
            ...selections.stratagems.map((strat, i) => 
                animateRoll(cardElements.stratagems[i], data.stratagems, strat, 2100 + i * 200)
            )
        ];

        await Promise.all(animations);
        
        playSound(successSound);

        isRolling = false;
        rollButton.disabled = false;
        rollButton.textContent = 'GO AGAIN, DIVER!';
    }
    
    rollButton.addEventListener('click', handleRoll);
    rollButton.disabled = true;
    loadData();
});
