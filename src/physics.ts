import Matter from 'matter-js';

// Physics engine setup variables
let engine: Matter.Engine;
let world: Matter.World;
let peg: Matter.Body;
export const rings: Matter.Body[] = [];

// Constants
export const PEG_DIAMETER = 12;
export const PEG_HEIGHT = 160;
export const RING_OUTER_RADIUS = 32;
export const RING_THICKNESS = 8;
const WALL_THICKNESS = 100;

// Collision categories
const CAT_WALL = 0x0001;
const CAT_PEG = 0x0002;
const CAT_RING_TOP = 0x0004;
const CAT_RING_OTHER = 0x0008;

export const initPhysics = (
    screenWidth: number,
    screenHeight: number,
    tankWidth?: number,
    tankHeight?: number,
    offsetX: number = 0,
    offsetY: number = 0
) => {
    const width = tankWidth || screenWidth;
    const height = tankHeight || screenHeight;

    // Create engine and world
    engine = Matter.Engine.create({
        enableSleeping: false,
    });
    world = engine.world;

    // High friction air for water resistance effect
    world.gravity.y = 0.5;

    // Set up boundaries relative to the tank space
    const wallFilter = { category: CAT_WALL, mask: 0xFFFFFFFF };

    // Far boundaries to ensure no escape
    const ground = Matter.Bodies.rectangle(
        offsetX + width / 2,
        offsetY + height + 50,
        width * 2,
        100,
        { isStatic: true, collisionFilter: wallFilter }
    );

    const ceiling = Matter.Bodies.rectangle(
        offsetX + width / 2,
        offsetY - 50,
        width * 2,
        100,
        { isStatic: true, collisionFilter: wallFilter }
    );

    const leftWall = Matter.Bodies.rectangle(
        offsetX - 50,
        offsetY + height / 2,
        100,
        height * 2,
        { isStatic: true, collisionFilter: wallFilter }
    );

    const rightWall = Matter.Bodies.rectangle(
        offsetX + width + 50,
        offsetY + height / 2,
        100,
        height * 2,
        { isStatic: true, collisionFilter: wallFilter }
    );

    // Set up the Peg (Center of the tank)
    // The peg only collides with the 'TOP' part of the rings
    peg = Matter.Bodies.rectangle(
        offsetX + width / 2,
        offsetY + height / 2 + 60, // Slightly below center of tank
        PEG_DIAMETER,
        PEG_HEIGHT,
        {
            isStatic: true,
            label: 'peg',
            render: { fillStyle: '#ff0000' },
            collisionFilter: {
                category: CAT_PEG,
                mask: CAT_RING_TOP
            }
        }
    );

    Matter.World.add(world, [ground, ceiling, leftWall, rightWall, peg]);

    // Handle Buoyancy and Goal Logic on every update
    Matter.Events.on(engine, 'beforeUpdate', () => {
        applyBuoyancy();
        checkAndLockRings();
    });

    return { engine, world };
};

export const createRing = (x: number, y: number, color: string) => {
    const parts: Matter.Body[] = [];
    const partCount = 8;
    const radius = RING_OUTER_RADIUS;
    const thickness = RING_THICKNESS - 2; // Slightly thinner for better clearance

    // Use a unique negative group for each ring so its internal parts don't collide
    const ringGroupId = Matter.Body.nextGroup(true);

    // Add a tiny random offset to prevent perfect initial overlap
    const offsetX = (Math.random() - 0.5) * 10;
    const spawnX = x + offsetX;

    for (let i = 0; i < partCount; i++) {
        const angle = (Math.PI * 2 * i) / partCount;
        const isTop = (i >= 5 && i <= 7);

        const filter = isTop
            ? { category: CAT_RING_TOP, mask: 0xFFFFFFFF, group: ringGroupId }
            : { category: CAT_RING_OTHER, mask: 0xFFFFFFFF & ~CAT_PEG, group: ringGroupId };

        const partWidth = Math.tan(Math.PI / partCount) * radius * 2.1;
        const partX = spawnX + Math.cos(angle) * (radius - thickness / 2);
        const partY = y + Math.sin(angle) * (radius - thickness / 2);

        const part = Matter.Bodies.rectangle(partX, partY, thickness, partWidth, {
            angle: angle,
            collisionFilter: filter,
            friction: 0.01,
            restitution: 0.3
        });

        parts.push(part);
    }

    const sensor = Matter.Bodies.circle(spawnX, y, 15, {
        isSensor: true,
        label: 'ring_sensor',
        collisionFilter: { mask: 0, group: ringGroupId }
    });
    parts.push(sensor);

    const ringBody = Matter.Body.create({
        parts: parts,
        frictionAir: 0.04,
        restitution: 0.3,
        density: 0.003, // Lighter for better separation
        label: 'ring',
        render: { fillStyle: color, sprite: { xScale: 1, yScale: 1 } }
    });

    ringBody.plugin = { color, isPegged: false };

    Matter.World.add(world, ringBody);
    rings.push(ringBody);

    return ringBody;
};

// Handle pinning rings to the peg when they fall over the tip
const checkAndLockRings = () => {
    if (!peg || !world) return;

    const pegTopY = peg.position.y - PEG_HEIGHT / 2;
    const pegX = peg.position.x;

    rings.forEach(ring => {
        if (ring.plugin.isPegged) return;

        // Check distance to peg tip
        const dx = ring.position.x - pegX;
        const dy = ring.position.y - pegTopY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If close to tip and moving downwards (or slow)
        if (distance < 25 && ring.velocity.y > -0.5) {
            // Count already pegged rings to stack them
            const peggedCount = rings.filter(r => r.plugin.isPegged).length;

            ring.plugin.isPegged = true;

            // Update collision filter so pegged rings don't collide with each other
            // but still collide with the peg and walls
            ring.parts.forEach(part => {
                part.collisionFilter.mask = CAT_WALL | CAT_PEG;
            });

            // Create a constraint to hang the ring on the peg
            // We stack them by increasing the Y offset for each ring
            const stackOffset = peggedCount * 18; // Approx ring thickness + gap
            const constraint = Matter.Constraint.create({
                bodyA: peg,
                pointA: { x: 0, y: -PEG_HEIGHT / 2 + 20 + stackOffset },
                bodyB: ring,
                pointB: { x: 0, y: -RING_OUTER_RADIUS + 5 },
                stiffness: 0.1,
                damping: 0.05,
                length: 5
            });

            Matter.World.add(world, constraint);

            // Satisfying snap - stop movement almost completely
            Matter.Body.setVelocity(ring, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(ring, 0);

            // Dispatch global success event
            // @ts-ignore
            if (global.onRingSuccess) {
                // @ts-ignore
                global.onRingSuccess();
            }
        }
    });
};

// Apply constant gentle upward force to all rings
const applyBuoyancy = () => {
    if (!world) return;

    rings.forEach(ring => {
        if (ring.plugin.isPegged) return;

        const buoyancyForce = {
            x: 0,
            y: -0.42 * ring.mass * world.gravity.y * world.gravity.scale
        };

        if (!ring.isSleeping) {
            Matter.Body.applyForce(ring, ring.position, buoyancyForce);
        }
    });
};

// Apply force from nozzles to rings in range
export const applyNozzleForce = (nozzleX: number, nozzleY: number, baseForceMagnitude: number) => {
    if (!world) return;

    const maxDistance = 200;

    rings.forEach(ring => {
        if (ring.plugin.isPegged) return;

        const dx = ring.position.x - nozzleX;
        const dy = ring.position.y - nozzleY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
            const forceScale = 1 - (distance / maxDistance);
            const appliedForce = baseForceMagnitude * forceScale * ring.mass;

            const forceVector = {
                x: (dx / distance) * appliedForce * 0.4,
                y: -appliedForce
            };

            Matter.Body.applyForce(ring, ring.position, forceVector);

            const spin = (Math.random() - 0.5) * 0.05 * ring.mass;
            Matter.Body.setAngularVelocity(ring, ring.angularVelocity + spin);
        }
    });
};

export const updateGravity = (x: number, y: number) => {
    if (world) {
        world.gravity.x = Math.max(-0.6, Math.min(0.6, x));
        world.gravity.y = Math.max(0.2, Math.min(0.7, y));
    }
};
