gsap.registerPlugin(MotionPathPlugin);

const CAT_RUN = "assets/cat/cat-run.gif";
const CAT_IDLE = "assets/cat/Neutral.png";

const catSprite = document.getElementById("catSprite");
const startBtn = document.getElementById("startBtn");

catSprite.src = CAT_IDLE;

let frameIndex = 0;
let catInterval = null;

// Step 1: define stops
const stops = [
  { x: 666, y: 332 },
  { x: 700, y: 568 },
  { x: 568, y: 686 },
  { x: 276, y: 767 },
  { x: 540, y: 1196 }
];

// Step 2: get map container
const mapContainer = document.querySelector(".map-container");
if (!mapContainer) console.error("❌ .map-container not found");

// Step 3: render debug dots
stops.forEach(stop => {
  const dot = document.createElement("div");
  dot.classList.add("debug-dot");
  dot.style.left = `${stop.x}px`;
  dot.style.top = `${stop.y}px`;
  mapContainer.appendChild(dot);
});

function startCatRun() {
  if (catInterval) return;

  catInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % catFrames.length;
    catSprite.src = catFrames[frameIndex];
  }, 140); // speed of paws 🐾
}

function stopCatRun() {
  clearInterval(catInterval);
  catInterval = null;
  catSprite.src = "assets/cat/Neutral.png";
}

// Load path SVG
fetch("assets/path.svg")
  .then(res => res.text())
  .then(svgText => {
    mapContainer.insertAdjacentHTML("beforeend", svgText);

    const svg = mapContainer.querySelector("svg");
    svg.classList.add("path");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

    // Choose the longest path if multiple
    const paths = svg.querySelectorAll("path");
    let longestPath = paths[0];
    let maxLength = 0;
    paths.forEach(p => {
      const length = p.getTotalLength();
      if (length > maxLength) {
        maxLength = length;
        longestPath = p;
      }
    });
    const path = longestPath;

    // Position path so it starts near first stop
    const d = path.getAttribute("d");
    const firstPointMatch = d.match(/M\s*([\d.]+)[ ,]([\d.]+)/);
    if (firstPointMatch) {
      const pathStart = { x: parseFloat(firstPointMatch[1]), y: parseFloat(firstPointMatch[2]) };
      const firstStop = stops[0];
      const dx = firstStop.x - pathStart.x - 10;
      const dy = firstStop.y - pathStart.y;
      const pathGroup = svg.querySelector("g") || path;
      pathGroup.setAttribute("transform", `translate(${dx}, ${dy})`);
    }

    // Load card data next
    fetch("data.json")
      .then(res => res.json())
      .then(cardData => {
        const token = document.querySelector(".token");
        const firstStop = stops[0];
        token.style.position = "absolute";
        token.style.left = `${firstStop.x - 10}px`;
        token.style.top = `${firstStop.y}px`;
        token.style.transform = "translate(-50%, -50%)"; // center token

        // Move the button closer to the visible cat
        startBtn.style.position = "relative";
        startBtn.style.left = "-47%";
        startBtn.style.top = "-270px"; // adjust this until it sits just above the sprite
        startBtn.style.transform = "translateX(-50%)";
        const cards = []; // we will store card wrappers here

        cardData.forEach((data, i) => {
          const stop = stops[i];
        
          const wrapper = document.createElement("div");
          wrapper.classList.add("card-wrapper");

          if (i === 0) wrapper.classList.add("first-card");
        
          const card = document.createElement("div");
          card.classList.add("card");
        
          if (data.type === "book") {
            card.innerHTML = `
              <div class="category">${data.category}</div>
              <img src="${data.cover}" alt="Cover" class="cover">
              <div class="title">${data.title}</div>
              <div class="author">${data.author}</div>
            `;
          } else if (data.type === "stat") {
            card.innerHTML = `
              <div class="category">${data.category}</div>
              <div class="value">${data.value} ${data.emoji}</div>
            `;
          }
        
          wrapper.appendChild(card);
        
          // Triangle below card
          const triangle = document.createElement("div");
          triangle.classList.add("triangle");
          [1, 3, 5].forEach(numBlocks => {
            const row = document.createElement("div");
            row.classList.add("triangle-row");
            for (let j = 0; j < numBlocks; j++) {
              const block = document.createElement("div");
              block.classList.add("triangle-block");
              row.appendChild(block);
            }
            triangle.appendChild(row);
          });
          wrapper.appendChild(triangle);
        
          mapContainer.appendChild(wrapper);
        
          cards.push(wrapper);
        });
        
        function showFinalCard() {
          const finalCard = document.createElement("div");
          finalCard.classList.add("card-wrapper", "final-card");
        
          finalCard.innerHTML = `
            <div class="card">
              <div class="category">2025 Reading Wrap</div>
              <div class="value">23 books read 🎉</div>
              <div class="subtitle">Happy New Year! 🥳</div>
            </div>
          `;
        
          // center on map
          finalCard.style.position = "absolute";
          finalCard.style.left = "42%";
          finalCard.style.top = "50%";
          finalCard.style.transform = "translate(-50%, -50%)";
          finalCard.style.display = "flex";
          finalCard.style.flexDirection = "column";
          finalCard.style.alignItems = "center";
          finalCard.style.opacity = 1;
        
          mapContainer.appendChild(finalCard);
        
          // optional: animate appearance
          gsap.from(finalCard, {
            opacity: 0,
            scale: 0.8,
            duration: 0.6,
            ease: "back.out(1.7)"
          });
        
          // add pixel confetti
          launchPixelConfetti();
        }
        

        // Now all cards exist, start the token animation
        let currentStop = 0;
        const threshold = 25; // px
        const pauseDuration = 2000; // ms
        const flipStops = [1, 3];
        let facing = 1;

        const tween = gsap.to(token, {
        
          duration: 21,
          ease: "none",
          paused: true,
          immediateRender: false,
          motionPath: {
            path: path,
            align: path,
            alignOrigin: [0.5, 0.5],
            start: 1,
            end: 0,
            autoRotate: false
          },
          onStart() {
            // 🐈 Start running
            catSprite.src = CAT_RUN;
          },
          onUpdate() {
            if (currentStop >= stops.length) return;
        
            const rect = token.getBoundingClientRect();
            const mapRect = mapContainer.getBoundingClientRect();
        
            const tokenX = rect.left + rect.width / 2 - mapRect.left;
            const tokenY = rect.top + rect.height / 2 - mapRect.top;
        
            const stop = stops[currentStop];
            const dx = tokenX - stop.x;
            const dy = tokenY - stop.y;
            const distance = Math.hypot(dx, dy);
        
            if (distance < threshold) {
              tween.pause();
        
              // 🛑 Stop → idle cat
              catSprite.src = CAT_IDLE;
        
              const card = cards[currentStop];
              if (card) {
                card.classList.add("show");
        
                const cardHeight = card.offsetHeight + 70;
                card.style.left = `${tokenX - 75}px`;
                card.style.top = `${tokenY - cardHeight}px`;
                card.style.transform = "translateX(-50%)";
              }
        
              // 🔁 Flip ONLY at chosen stops
              if (flipStops.includes(currentStop)) {
                facing *= -1;
                gsap.to(token, {
                  scaleX: facing,
                  duration: 0.2
                });
              }
        
              currentStop++;
        
              setTimeout(() => {
                if (card) card.classList.remove("show");
              
                if (currentStop >= stops.length) {
                  // 🐈 Last stop reached → cat stays neutral
                  catSprite.src = CAT_IDLE;
              
                  // Show final center card
                  showFinalCard();
                } else {
                  // 🐈 Resume running for other stops
                  catSprite.src = CAT_RUN;
                  tween.resume();
                }
              }, pauseDuration);
              
            }
          }
          
        });
        startBtn.addEventListener("click", () => {
          startBtn.style.display = "none";
        
          catSprite.src = CAT_RUN;
          tween.play();
        });
      })
      .catch(err => console.error("Failed to load card data:", err));
  });

  function launchPixelConfetti() {
    const colors = ["#2f6fff", "#ff3c7f", "#ffd700", "#0bf2b4"];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("pixel-confetti");
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.position = "absolute";
      confetti.style.width = "4px";
      confetti.style.height = "4px";
      confetti.style.left = "50%";
      confetti.style.top = "50%";
      mapContainer.appendChild(confetti);
  
      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 300,
        rotation: Math.random() * 360,
        duration: 2 + Math.random() * 1,
        ease: "power1.out",
        onComplete: () => confetti.remove()
      });
    }
  }
  