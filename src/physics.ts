import Matter from 'matter-js';

// Physics engine setup variables
let engine: Matter.Engine;
let world: Matter.World;
let peg: Matter.Body;
export const rings: Matter.Body[] = [];

// Constants
export const PEG_DIAMETER = 10;
export const PEG_HEIGHT = 150;
export const RING_OUTER_RADIUS = 30;
export const RING_THICKNESS = 8;
const WALL_THICKNESS = 100;

export const initPhysics = (screenWidth: number, screenHeight: number) => {
    // Create engine and world
    engine = Matter.Engine.create({
        enableSleeping: false,
    });
    world = engine.world;

    // High friction air for water resistance effect
    world.gravity.y = 0.5;

    // Set up boundaries
    const ground = Matter.Bodies.rectangle(
        screenWidth / 2,
        screenHeight + WALL_THICKNESS / 2,
        screenWidth * 2,
        WALL_THICKNESS,
        { isStatic: true }
    );

    const ceiling = Matter.Bodies.rectangle(
        screenWidth / 2,
        -WALL_THICKNESS / 2,
        screenWidth * 2,
        WALL_THICKNESS,
        { isStatic: true }
    );

    const leftWall = Matter.Bodies.rectangle(
        -WALL_THICKNESS / 2,
        screenHeight / 2,
        WALL_THICKNESS,
        screenHeight * 2,
        { isStatic: true }
    );

    const rightWall = Matter.Bodies.rectangle(
        screenWidth + WALL_THICKNESS / 2,
        screenHeight / 2,
        WALL_THICKNESS,
        screenHeight * 2,
        { isStatic: true }
    );

    // Set up the Peg (Center)
    peg = Matter.Bodies.rectangle(
        screenWidth / 2,
        screenHeight / 2 + 50, // Slightly below center
        PEG_DIAMETER,
        PEG_HEIGHT,
        {
            isStatic: true,
            label: 'peg',
            render: { fillStyle: '#ff0000' }
        }
    );

    Matter.World.add(world, [ground, ceiling, leftWall, rightWall, peg]);

    // Handle Buoyancy (Anti-gravity) on every update
    Matter.Events.on(engine, 'beforeUpdate', () => {
        applyBuoyancy();
    });

    return { engine, world };
};

export const createRing = (x: number, y: number, color: string) => {
    const parts: Matter.Body[] = [];
    const partCount = 8;
    const radius = RING_OUTER_RADIUS;
    const thickness = RING_THICKNESS;

    // Create 8 rectangle parts in an octagon shape
    for (let i = 0; i < partCount; i++) {
        const angle = (Math.PI * 2 * i) / partCount;
        // Calculate the distance from center to the center of the rectangle part
        // The rect width is roughly the arc length, height is thickness
        const partWidth = Math.tan(Math.PI / partCount) * radius * 2.2;

        // Position of the part relative to body center
        const partX = x + Math.cos(angle) * (radius - thickness / 2);
        const partY = y + Math.sin(angle) * (radius - thickness / 2);

        const part = Matter.Bodies.rectangle(partX, partY, thickness, partWidth, {
            angle: angle,
        });

        parts.push(part);
    }

    // Create center sensor body for goal detection
    const sensor = Matter.Bodies.circle(x, y, radius - thickness * 1.5, {
        isSensor: true,
        label: 'ring_sensor',
    });
    parts.push(sensor);

    // Create the composite body
    const ringBody = Matter.Body.create({
        parts: parts,
        frictionAir: 0.05, // High air friction to simulate water resistance
        restitution: 0.6,  // Bounciness
        density: 0.005,
        label: 'ring',
        render: { fillStyle: color, sprite: { xScale: 1, yScale: 1 } }
    });

    // Store original color in plugin object for easy retrieval in rendering
    ringBody.plugin = { color };

    Matter.World.add(world, ringBody);
    rings.push(ringBody);

    return ringBody;
};

// Apply constant gentle upward force to all rings
const applyBuoyancy = () => {
    if (!world) return;

    rings.forEach(ring => {
        // Apply a weak upward force opposite to gravity
        // The deeper it is, the more it could float if we used water depth logic,
        // but a constant anti-gravity force works well for a basic arcade feel.
        const buoyancyForce = {
            x: 0,
            y: -0.4 * ring.mass * world.gravity.y * world.gravity.scale
        };

        // Don't apply if it's sleeping or successfully pegged (for later)
        if (!ring.isSleeping) {
            Matter.Body.applyForce(ring, ring.position, buoyancyForce);
        }
    });
};

// Apply force from nozzles to rings in range
export const applyNozzleForce = (nozzleX: number, nozzleY: number, baseForceMagnitude: number) => {
    if (!world) return;

    const maxDistance = 200; // Radius of force effect

    rings.forEach(ring => {
        // Calculate distance from nozzle
        const dx = ring.position.x - nozzleX;
        const dy = ring.position.y - nozzleY;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);

        if (distance < maxDistance) {
            // Inverse square law force (capped to avoid extreme forces at very close range)
            const forceScale = 1 - (distance / maxDistance);
            const appliedForce = baseForceMagnitude * forceScale * ring.mass;

            // Apply upward and slightly spread out force
            const forceVector = {
                x: (dx / distance) * appliedForce * 0.3, // Slight lateral push outward from nozzle
                y: -appliedForce // Strong upward push
            };

            Matter.Body.applyForce(ring, ring.position, forceVector);

            // Apply random spin for watery effect
            const spin = (Math.random() - 0.5) * 0.02 * ring.mass;
            Matter.Body.setAngularVelocity(ring, ring.angularVelocity + spin);
        }
    });
};

// Check for collision success (ring stopped inside peg)
export const checkSuccessCondition = () => {
    // To be implemented in App logic binding
};

export const updateGravity = (x: number, y: number) => {
    if (world) {
        // Limit gravity intensity for watery feel
        world.gravity.x = Math.max(-0.8, Math.min(0.8, x));
        world.gravity.y = Math.max(0.1, Math.min(0.8, y)); // Always keep SOME downward gravity
    }
};
