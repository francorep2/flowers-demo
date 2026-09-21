const game = document.getElementById("game");
const circlesContainer = document.getElementById("circles");
const counter = document.getElementById("counter");

let count = 0;

const circles = [];

const SIZE = 45;
const RADIUS = SIZE / 2;

const GRAVITY = 1500;
const BOUNCE = 0.15;
const FRICTION = 0.92;

// Flores disponibles
const flowers = [
    "fw.png",
    "fw2.png",
    "fw3.png"
];

// Hitos
const milestones = [50, 100, 150, 200];

let milestoneTimeout = null;


/* ==========================================
   TOCAR
========================================== */

game.addEventListener("pointerdown", function (event) {

    count++;

    counter.textContent = count;

    createCircle(event.clientX, event.clientY);

    // Comprobar si llegamos a un hito
    if (milestones.includes(count)) {
        showMilestone(count);
    }
});


/* ==========================================
   CREAR FLOR
========================================== */

function createCircle(x, y) {

    const element = document.createElement("img");

    element.className = "circle";

    // Elegir una flor aleatoria
    element.src =
        flowers[Math.floor(Math.random() * flowers.length)];

    element.draggable = false;

    circlesContainer.appendChild(element);


    const circle = {

        element: element,

        x: x - RADIUS,
        y: y - RADIUS,

        vx: 0,
        vy: 0,

        grounded: false
    };


    circles.push(circle);

    updateCircle(circle);
}


/* ==========================================
   HITOS
========================================== */

function showMilestone(number) {

    // Si ya había un cartel, eliminarlo
    const oldMilestone =
        document.querySelector(".milestone");

    if (oldMilestone) {
        oldMilestone.remove();
    }

    clearTimeout(milestoneTimeout);


    const milestone =
        document.createElement("div");

    milestone.className = "milestone";


    milestone.innerHTML = `
        <div class="milestone-number">
            ${number}
        </div>

        <div class="milestone-text">
            FLORES AMARILLAS
        </div>
    `;


    game.appendChild(milestone);


    // Activar animación
    requestAnimationFrame(() => {

        milestone.classList.add("show");

    });


    // Mantenerlo visible 3 segundos
    milestoneTimeout = setTimeout(() => {

        milestone.classList.remove("show");


        // Esperar a que termine la animación
        setTimeout(() => {

            if (milestone.parentNode) {
                milestone.remove();
            }

        }, 400);

    }, 1500);
}


/* ==========================================
   FÍSICA
========================================== */

let previousTime = performance.now();

function physics(time) {

    let dt =
        (time - previousTime) / 1000;

    previousTime = time;

    dt = Math.min(dt, 0.02);


    /* ======================================
       GRAVEDAD
    ====================================== */

    for (const circle of circles) {

        if (!circle.grounded) {

            circle.vy +=
                GRAVITY * dt;

            circle.x +=
                circle.vx * dt;

            circle.y +=
                circle.vy * dt;

            circle.vx *= 0.999;
        }
    }


    /* ======================================
       PAREDES
    ====================================== */

    for (const circle of circles) {

        // Pared izquierda
        if (circle.x < 0) {

            circle.x = 0;

            circle.vx *= -BOUNCE;
        }


        // Pared derecha
        if (circle.x + SIZE > window.innerWidth) {

            circle.x =
                window.innerWidth - SIZE;

            circle.vx *= -BOUNCE;
        }
    }


    /* ======================================
       PISO
    ====================================== */

    for (const circle of circles) {

        const floor =
            window.innerHeight - 5;


        if (circle.y + SIZE > floor) {

            circle.y =
                floor - SIZE;


            if (Math.abs(circle.vy) > 50) {

                circle.vy *= -BOUNCE;

            } else {

                circle.vy = 0;
            }


            circle.vx *= FRICTION;
        }
    }


    /* ======================================
       COLISIONES
    ====================================== */

    // Varias pasadas para evitar que
    // las flores se atraviesen entre sí

    for (
        let iteration = 0;
        iteration < 6;
        iteration++
    ) {

        for (
            let i = 0;
            i < circles.length;
            i++
        ) {

            for (
                let j = i + 1;
                j < circles.length;
                j++
            ) {

                resolveCollision(
                    circles[i],
                    circles[j]
                );
            }
        }
    }


    /* ======================================
       APOYO / STACK
    ====================================== */

    for (const circle of circles) {

        let supported = false;


        const floor =
            window.innerHeight - 5;


        // Apoyado sobre el piso
        if (
            Math.abs(
                (circle.y + SIZE) - floor
            ) < 1
        ) {

            supported = true;
        }


        // Apoyado sobre otra flor
        if (!supported) {

            for (const other of circles) {

                if (circle === other) {
                    continue;
                }


                const dx =
                    (circle.x + RADIUS) -
                    (other.x + RADIUS);

                const dy =
                    (circle.y + RADIUS) -
                    (other.y + RADIUS);


                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    distance <= SIZE + 0.5 &&
                    circle.y < other.y
                ) {

                    supported = true;

                    break;
                }
            }
        }


        // Si está estable, queda quieta
        if (
            supported &&
            Math.abs(circle.vy) < 15 &&
            Math.abs(circle.vx) < 15
        ) {

            circle.grounded = true;

            circle.vx = 0;
            circle.vy = 0;

        } else {

            circle.grounded = false;
        }
    }


    /* ======================================
       DIBUJAR
    ====================================== */

    for (const circle of circles) {

        updateCircle(circle);
    }


    requestAnimationFrame(physics);
}


/* ==========================================
   COLISIÓN ENTRE FLORES
========================================== */

function resolveCollision(a, b) {

    const ax =
        a.x + RADIUS;

    const ay =
        a.y + RADIUS;

    const bx =
        b.x + RADIUS;

    const by =
        b.y + RADIUS;


    let dx = bx - ax;
    let dy = by - ay;


    let distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    // Evitar división por cero
    if (distance === 0) {

        dx = 0.01;
        dy = -1;

        distance = 1;
    }


    // No hay colisión
    if (distance >= SIZE) {
        return;
    }


    const nx =
        dx / distance;

    const ny =
        dy / distance;


    const overlap =
        SIZE - distance;


    // Separar las dos flores
    const correction =
        overlap / 2 + 0.01;


    a.x -=
        nx * correction;

    a.y -=
        ny * correction;


    b.x +=
        nx * correction;

    b.y +=
        ny * correction;


    /* ======================================
       VELOCIDADES
    ====================================== */

    const relativeVelocityX =
        b.vx - a.vx;

    const relativeVelocityY =
        b.vy - a.vy;


    const velocityAlongNormal =
        relativeVelocityX * nx +
        relativeVelocityY * ny;


    // Ya se están separando
    if (velocityAlongNormal > 0) {
        return;
    }


    const impulse =
        -(1 + BOUNCE) *
        velocityAlongNormal / 2;


    if (!a.grounded) {

        a.vx -=
            impulse * nx;

        a.vy -=
            impulse * ny;
    }


    if (!b.grounded) {

        b.vx +=
            impulse * nx;

        b.vy +=
            impulse * ny;
    }


    // Fricción horizontal
    a.vx *= FRICTION;
    b.vx *= FRICTION;
}


/* ==========================================
   POSICIÓN VISUAL
========================================== */

function updateCircle(circle) {

    circle.element.style.transform =
        `translate3d(
            ${circle.x}px,
            ${circle.y}px,
            0
        )`;
}


/* ==========================================
   INICIAR FÍSICA
========================================== */

requestAnimationFrame(physics);