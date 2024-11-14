const canvas = document.getElementById('gameCanvas'); // dohvaćamo canvas element iz HTML-a
const ctx = canvas.getContext('2d'); // kontekst

// definiramo dimenzije canvas-a da zauzima gotovo cijeli prozor preglednika
function resizeCanvas() {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas); // automatsko ažuriranje dimenzija canvas-a pri promjeni veličine prozora

// objekt koji predstavlja palicu na dnu ekrana
const paddle = {
    width: 100, // širina palice
    height: 20, // visina palice
    x: canvas.width / 2 - 50, // početna pozicija palice na x-osi (u sredini)
    y: canvas.height - 30, // pozicija palice na y-osi, blizu dna
    speed: 8, // brzina pomicanja palice
    dx: 0 // trenutna brzina kretanja palice (mijenja se s pritiscima tipki)
};

// objekt koji predstavlja lopticu, koja se odbija o palicu i cigle
const ball = {
    x: canvas.width / 2, // početna pozicija loptice na x-osi
    y: paddle.y - 10, // početna pozicija loptice na y-osi, neposredno iznad palice
    size: 10, // veličina loptice
    speed: 6, // osnovna brzina loptice
    dx: 4 * (Math.random() * 2 - 1), // nasumični horizontalni smjer loptice
    dy: -4 // vertikalni smjer loptice prema gore
};

// definiramo parametre cigli koje će loptica razbijati
const brickRowCount = 9; // broj redova cigli
const brickColumnCount = 9; // broj stupaca cigli
const bricks = []; // dvodimenzionalni niz za pohranu cigli
const brickWidth = 60; // širina jedne cigle
const brickHeight = 20; // visina jedne cigle
let score = 0; // početni broj bodova
let gameOver = false; // varijabla koja prati je li igra završena

// postavljamo stanje za praćenje pritisnutih tipki za pomicanje palice
let leftPressed = false; // stanje tipke lijevo
let rightPressed = false; // stanje tipke desno

// funkcija za generiranje cigli na različitim pozicijama
function generateBricks() {
    for (let i = 0; i < brickRowCount; i++) {
        bricks[i] = [];
        for (let j = 0; j < brickColumnCount; j++) {
            const x = Math.random() * (canvas.width - brickWidth); // slučajna pozicija x unutar širine canvas-a
            const y = i * (brickHeight + 25) + 30; // raspored cigli u redove, s razmakom između redova
            bricks[i][j] = { x, y, status: 1 }; // svaka cigla ima svoj položaj i status (1 znači da je cigla aktivna)
        }
    }
}
generateBricks(); // inicijalno postavljamo cigle pozivanjem funkcije

// funkcija za crtanje palice na canvas-u
function drawPaddle() {
    ctx.fillStyle = 'red';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0; // resetiramo sjenčanje nakon crtanja palice da mi kasnije sve nema sječanje već samo cigle i palica
}

// funkcija za crtanje loptice kao kruga
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2); // crtamo krug pomoću arc funkcije
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

// funkcija za crtanje svih cigli na canvas-u
function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status) { // provjeravamo je li cigla aktivna (status 1)
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brickWidth, brickHeight); // crtamo pravokutnik za ciglu
                ctx.fillStyle = 'gray';
                ctx.shadowColor = 'red';
                ctx.shadowBlur = 5;
                ctx.fill();
                ctx.closePath();
            }
        });
    });
}

// funkcija za pomicanje loptice i provjeru kolizije
function moveBall() {
    if (gameOver) return; // ako je igra završena, zaustavljamo kretanje loptice

    ball.x += ball.dx; // pomicanje loptice po x-osi
    ball.y += ball.dy; // pomicanje loptice po y-osi

    // osiguravamo da loptica održava konstantnu brzinu
    const speedMagnitude = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    ball.dx = (ball.dx / speedMagnitude) * ball.speed; //normalizacija kretnje
    ball.dy = (ball.dy / speedMagnitude) * ball.speed;

    // provjeravamo koliziju loptice s rubovima canvas-a
    if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
        ball.dx *= -1; // preokrećemo smjer loptice po x-osi
    }
    if (ball.y - ball.size < 0) {
        ball.dy *= -1; // preokrećemo smjer loptice po y-osi
    }

    // provjeravamo koliziju loptice s palicom
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.y + ball.size > paddle.y) {
        const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); // izračunavamo točku udara
        ball.dx = hitPoint * ball.speed; // postavljamo smjer loptice po x-osi na temelju točke udara
        ball.dy = -Math.abs(ball.dy); // loptica se odbija prema gore
    }

    // provjera kolizije loptice s ciglama
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status) { // samo aktivne cigle
                if (ball.x > brick.x && ball.x < brick.x + brickWidth && ball.y - ball.size < brick.y + brickHeight && ball.y + ball.size > brick.y) {//ako je loptica unutar x intervala cigle (brick.x + brickWidth) i loptica dodiruje ciglu (ball.y + ball.size > brick.y)
                    ball.dy *= -1; // mijenjamo smjer kretanja loptice po y-osi
                    brick.status = 0; // postavljamo status cigle na 0 (nestala je)
                    score++; // povećavamo broj bodova
                    if (score === brickRowCount * brickColumnCount) { // ako su sve cigle uništene
                        showEndMessage("POBJEDA! Čestitamo!"); // prikazujemo poruku pobjede
                    }
                }
            }
        });
    });

    if (ball.y + ball.size > canvas.height) { // ako loptica izađe ispod canvas-a
        showEndMessage("GAME OVER"); // prikazujemo poruku poraza
    }
}

// funkcija za prikaz poruke na kraju igre
function showEndMessage(message) {
    gameOver = true; // postavljamo da je igra završena
    ctx.clearRect(0, 0, canvas.width, canvas.height); // brišemo canvas
    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2); // prikaz poruke u sredini ekrana
    updateBestScore(); // ažuriramo najbolji rezultat

    // prikaz najboljeg i trenutnog rezultata ispod poruke
    ctx.font = "30px Arial";
    ctx.fillText(`Best Score: ${localStorage.getItem('bestScore') || 0}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 90);
}

    //ažuriranje najboljeg rezultata
function updateBestScore() {
    const bestScore = localStorage.getItem('bestScore') || 0;
    if (score > bestScore) {
        localStorage.setItem('bestScore', score);
    }
}
    //prikaz trenutnog i najboljeg rezultata
function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";//u gornji lijevi kut
    ctx.fillText(`Score: ${score}`, 20, 40); 
    ctx.textAlign = "right";//u gornji desni kut
    ctx.fillText(`Best: ${localStorage.getItem('bestScore') || 0}`, canvas.width - 20, 40);
}
//funkcija za pomicanje palice
function movePaddle() {
    if (leftPressed && !rightPressed) {
        paddle.dx = -paddle.speed;
    } else if (rightPressed && !leftPressed) {
        paddle.dx = paddle.speed;
    } else {
        paddle.dx = 0; // zaustavi ako nisu pritisnute ni lijeva ni desna tipka
    }

    paddle.x += paddle.dx;

    // sprječavamo palicu da izađe izvan rubova canvas-a
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function update() {
    if (gameOver) return; // zaustavljamo update funkciju kad je igra završena
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle();
    drawBall();
    drawBricks();
    drawScore();
    moveBall();
    movePaddle();
    requestAnimationFrame(update);
}

// upravljanje pritiskom tipki
document.addEventListener('keydown', (e) => {
    if (gameOver) return; // zaustavi komande nakon završetka igre
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
});

update();
