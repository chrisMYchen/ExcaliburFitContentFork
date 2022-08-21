import { PostCollisionEvent, PreCollisionEvent } from '../../Events';
import { CollisionType } from '../CollisionType';
import { Side } from '../Side';
import { BodyComponent } from '../BodyComponent';
/**
 * ArcadeSolver is the default in Excalibur. It solves collisions so that there is no overlap between contacts,
 * and negates velocity along the collision normal.
 *
 * This is usually the type of collisions used for 2D games that don't need a more realistic collision simulation.
 *
 */
export class ArcadeSolver {
    constructor() {
        this.directionMap = new Map();
        this.distanceMap = new Map();
    }
    solve(contacts) {
        // Events and init
        this.preSolve(contacts);
        // Remove any canceled contacts
        contacts = contacts.filter(c => !c.isCanceled());
        // Sort contacts by distance to avoid artifacts with seams
        // It's important to solve in a specific order
        contacts.sort((a, b) => {
            const aDist = this.distanceMap.get(a.id);
            const bDist = this.distanceMap.get(b.id);
            return aDist - bDist;
        });
        for (const contact of contacts) {
            // Solve position first in arcade
            this.solvePosition(contact);
            // Solve velocity second in arcade
            this.solveVelocity(contact);
        }
        // Events and any contact house-keeping the solver needs
        this.postSolve(contacts);
        return contacts;
    }
    preSolve(contacts) {
        for (const contact of contacts) {
            const side = Side.fromDirection(contact.mtv);
            const mtv = contact.mtv.negate();
            const distance = contact.colliderA.worldPos.squareDistance(contact.colliderB.worldPos);
            this.distanceMap.set(contact.id, distance);
            // Publish collision events on both participants
            contact.colliderA.events.emit('precollision', new PreCollisionEvent(contact.colliderA, contact.colliderB, side, mtv));
            contact.colliderB.events.emit('precollision', new PreCollisionEvent(contact.colliderB, contact.colliderA, Side.getOpposite(side), mtv.negate()));
        }
    }
    postSolve(contacts) {
        var _a, _b;
        for (const contact of contacts) {
            if (contact.isCanceled()) {
                continue;
            }
            const colliderA = contact.colliderA;
            const colliderB = contact.colliderB;
            const bodyA = (_a = colliderA.owner) === null || _a === void 0 ? void 0 : _a.get(BodyComponent);
            const bodyB = (_b = colliderB.owner) === null || _b === void 0 ? void 0 : _b.get(BodyComponent);
            if (bodyA && bodyB) {
                if (bodyA.collisionType === CollisionType.Passive || bodyB.collisionType === CollisionType.Passive) {
                    continue;
                }
            }
            const side = Side.fromDirection(contact.mtv);
            const mtv = contact.mtv.negate();
            // Publish collision events on both participants
            contact.colliderA.events.emit('postcollision', new PostCollisionEvent(contact.colliderA, contact.colliderB, side, mtv));
            contact.colliderB.events.emit('postcollision', new PostCollisionEvent(contact.colliderB, contact.colliderA, Side.getOpposite(side), mtv.negate()));
        }
    }
    solvePosition(contact) {
        var _a, _b;
        const epsilon = .0001;
        // if bounds no longer intersect skip to the next
        // this removes jitter from overlapping/stacked solid tiles or a wall of solid tiles
        if (!contact.colliderA.bounds.overlaps(contact.colliderB.bounds, epsilon)) {
            // Cancel the contact to prevent and solving
            contact.cancel();
            return;
        }
        if (Math.abs(contact.mtv.x) < epsilon && Math.abs(contact.mtv.y) < epsilon) {
            // Cancel near 0 mtv collisions
            contact.cancel();
            return;
        }
        let mtv = contact.mtv;
        const colliderA = contact.colliderA;
        const colliderB = contact.colliderB;
        const bodyA = (_a = colliderA.owner) === null || _a === void 0 ? void 0 : _a.get(BodyComponent);
        const bodyB = (_b = colliderB.owner) === null || _b === void 0 ? void 0 : _b.get(BodyComponent);
        if (bodyA && bodyB) {
            if (bodyA.collisionType === CollisionType.Passive || bodyB.collisionType === CollisionType.Passive) {
                return;
            }
            if (bodyA.collisionType === CollisionType.Active && bodyB.collisionType === CollisionType.Active) {
                // split overlaps if both are Active
                mtv = mtv.scale(0.5);
            }
            // Resolve overlaps
            if (bodyA.collisionType === CollisionType.Active) {
                bodyA.globalPos.x -= mtv.x;
                bodyA.globalPos.y -= mtv.y;
                colliderA.update(bodyA.transform.get());
            }
            if (bodyB.collisionType === CollisionType.Active) {
                bodyB.globalPos.x += mtv.x;
                bodyB.globalPos.y += mtv.y;
                colliderB.update(bodyB.transform.get());
            }
        }
    }
    solveVelocity(contact) {
        var _a, _b;
        if (contact.isCanceled()) {
            return;
        }
        const colliderA = contact.colliderA;
        const colliderB = contact.colliderB;
        const bodyA = (_a = colliderA.owner) === null || _a === void 0 ? void 0 : _a.get(BodyComponent);
        const bodyB = (_b = colliderB.owner) === null || _b === void 0 ? void 0 : _b.get(BodyComponent);
        if (bodyA && bodyB) {
            if (bodyA.collisionType === CollisionType.Passive || bodyB.collisionType === CollisionType.Passive) {
                return;
            }
            const normal = contact.normal;
            const opposite = normal.negate();
            if (bodyA.collisionType === CollisionType.Active) {
                // only adjust velocity if the contact normal is opposite to the current velocity
                // this avoids catching edges on a platform when sliding off
                if (bodyA.vel.normalize().dot(opposite) < 0) {
                    // Cancel out velocity opposite direction of collision normal
                    const velAdj = normal.scale(normal.dot(bodyA.vel.negate()));
                    bodyA.vel = bodyA.vel.add(velAdj);
                }
            }
            if (bodyB.collisionType === CollisionType.Active) {
                // only adjust velocity if the contact normal is opposite to the current velocity
                // this avoids catching edges on a platform
                if (bodyB.vel.normalize().dot(normal) < 0) {
                    const velAdj = opposite.scale(opposite.dot(bodyB.vel.negate()));
                    bodyB.vel = bodyB.vel.add(velAdj);
                }
            }
        }
    }
}
//# sourceMappingURL=ArcadeSolver.js.map