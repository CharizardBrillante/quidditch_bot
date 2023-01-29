class Entity {
    constructor(id, x, y, vx, vy, state){
        this.id = id;
        this.pos = [x, y];
        this.speed = [vx, vy];
        this.state = state;
    }

    update( x, y, vx, vy, state){
        this.pos = [x, y];
        this.speed = [vx, vy];
        this.state = state;
    }

    getNextPos(){
        return [this.pos[0] + this.speed[0], this.pos[1] + this.speed[1]]
    }

    getDistanceFromTarget(targetPos){
        return Math.hypot(this.pos[0] - targetPos[0], this.pos[1] - targetPos[1])
    }

    getAngleBetweenMeAndTarget(targetPos){
        let meNextPosSide = this.getDistanceFromTarget(this.getNextPos());
        let meTargetSide = this.getDistanceFromTarget(targetPos);
        let nextPosTargetSide = Math.hypot(this.getNextPos()[0] - targetPos[0], this.getNextPos()[1] - targetPos[1]);
        let angle = Math.acos((meNextPosSide**2 + meTargetSide**2 - nextPosTargetSide**2) / 2*meNextPosSide*meTargetSide) * (180/Math.PI)

        if (isNaN(angle)) return 180
        return angle
    }
}
class Wizard extends Entity {
    radius = 400;

    constructor(id, x, y, vx, vy, state){
        super(id, x, y, vx, vy, state)
        this.startingY = y;
    }

    findNearestSnaffle(snaffles){
        //console.error('snaffles: ', snaffles)
        let dist = Number.MAX_VALUE;
        let nearestSnaffle = null
        let topSnaffles = snaffles.filter(s => s.pos[1] < 3750);
        let botSnaffles = snaffles.filter(s => s.pos[1] >= 3750);

        if (this.startingY < 3750) {
            topSnaffles.forEach((s) => {
                if(s.state == 0){
                    let distFromWiz = this.getDistanceFromTarget(s.pos)
                    //console.error('distFromWiz: ', distFromWiz)
                    if (distFromWiz < dist) {
                        dist = distFromWiz;
                        nearestSnaffle = s
                    }
                }
            })
        } else {
            botSnaffles.forEach((s) => {
                if(s.state == 0){
                    let distFromWiz = this.getDistanceFromTarget(s.pos)
                    //console.error('distFromWiz: ', distFromWiz)
                    if (distFromWiz < dist) {
                        dist = distFromWiz;
                        nearestSnaffle = s
                    }
                }
            })
        }
        //console.error('snaffle found')
        return nearestSnaffle;
    }

    setThurst(targetPos) {
        let proportional = Math.round(this.getAngleBetweenMeAndTarget(targetPos)/180*150) //set thrust depending on angle between wizard and target
        if (proportional < 30) return 30
        return proportional;
    }

    grab(snaffles){
        let snaffle = this.findNearestSnaffle(snaffles);
        if (snaffle == null) return null
        let snafflePos = [snaffle.pos[0], snaffle.pos[1]];
        let thurst = this.setThurst(snafflePos);
        
        //console.error('grab: ', `MOVE ${snafflePos[0]} ${snafflePos[1]} ${thurst}`)
        return `MOVE ${snafflePos[0]} ${snafflePos[1]} ${thurst}`
    }

    collide(oppoTeam){
        let dist = Number.MAX_VALUE;
        let nearestOppo = null

        oppoTeam.forEach((o) => {
            let distFromWiz = this.getDistanceFromTarget(o.pos)
            //console.error('distFromWiz: ', distFromWiz)
            if (distFromWiz < dist) {
                dist = distFromWiz;
                nearestOppo = o;
            }        
        })

        return `MOVE ${nearestOppo.pos[0]} ${nearestOppo.pos[1]} 150`
    }

    getGKPosition(oppoTeam, goal){
        console.error('getGKPosition')
        oppoTeam.forEach((op) => {
            if (goal.id == 1){ //score on the right goal
                if (op.pos[0] > this.pos[0])
                    return op.pos;
            } else { //score on the left goal
                if (op.pos[0] < this.pos[0])
                    return op.pos;
            }
        })
        return null
    }

    throwSnaffle(oppoTeam, goal){
        let action = "";
        let gkPos = this.getGKPosition(oppoTeam, goal);
        console.error('gkPos: ', gkPos)
        if (goal.id == 1) {
            if (!gkPos)
                action = `THROW 16000 3750 500`;
            else {
                if (gkPos[1] >= 3750)
                    action = `THROW 16000 ${goal.topPole[1]} 500`
                else 
                    action = `THROW 16000 ${goal.botPole[1]} 500`
            }
        } else {
            if (!gkPos)
                action = `THROW 0 3750 500`;
            else {
                if (gkPos[1] >= 3750)
                    action = `THROW 0 ${goal.topPole[1]} 500`
                else 
                    action = `THROW 0 ${goal.botPole[1]} 500`
            }
        }
        return action;
    }

    play(snaffles, oppoTeam, goal){
        let grab = this.grab(snaffles);

        if (this.state == 1)  //if grabbed a snaffle, throw it
            return this.throwSnaffle(oppoTeam, goal)
        else {
            if (!grab) return this.collide(oppoTeam) //if no snaffle in his zone, collide
            else return this.grab(snaffles) //if any snaffle in his zone, grab it
        }
            
    }
}
class Snaffle extends Entity {
    radius = 150;
    constructor(id, x, y, vx, vy, state){
        super(id, x, y, vx, vy, state)
    }
}
class Bludger extends Entity {
    radius = 200
    constructor(id, x, y, vx, vy, state){
        super(id, x, y, vx, vy, state)
    }
}
class Goal {
    constructor(teamId){
        this.id = teamId;
        if (teamId == 0){
            this.topPole = [0, 1900];
            this.botPole = [0, 5600];
        } else {
            this.topPole = [16000, 1900];
            this.botPole = [16000, 5600];
        }
    }
}

const myTeamId = parseInt(readline()); // if 0 you need to score on the right of the map, if 1 you need to score on the left
let myGoal = null;
let oppoGoal = null;

if (myTeamId == 0){
    myGoal = new Goal(0);
    oppoGoal = new Goal(1);
} else {
    myGoal = new Goal(1);
    oppoGoal = new Goal(0);
}
let wiz1 = null;
let wiz2 = null;
let oppoWiz1 = null;
let oppoWiz2 = null;
let bludgers = []

// game loop
while (true) {
    let snaffles = [] //SNUFFLES
    var inputs = readline().split(' ');
    const myScore = parseInt(inputs[0]);
    const myMagic = parseInt(inputs[1]);
    var inputs = readline().split(' ');
    const opponentScore = parseInt(inputs[0]);
    const opponentMagic = parseInt(inputs[1]);
    const entities = parseInt(readline()); // number of entities still in game
    for (let i = 0; i < entities; i++) {
        var inputs = readline().split(' ');
        const entityId = parseInt(inputs[0]); // entity identifier
        const entityType = inputs[1]; // "WIZARD", "OPPONENT_WIZARD" or "SNAFFLE" (or "BLUDGER" after first league)
        const x = parseInt(inputs[2]); // position
        const y = parseInt(inputs[3]); // position
        const vx = parseInt(inputs[4]); // velocity
        const vy = parseInt(inputs[5]); // velocity
        const state = parseInt(inputs[6]); // 1 if the wizard is holding a Snaffle, 0 otherwise
        let w1Updated = false;
        let w2Updated = false;
        let oppW1Updated = false;
        let oppW2Updated = false;
        switch (entityType) { //CREATE OR UPDATE ENTITIES INSTANCES
            case "WIZARD":
                if (!wiz1) wiz1 = new Wizard(entityId, x, y, vx, vy, state)
                else if (!wiz2) wiz2 = new Wizard(entityId, x, y, vx, vy, state)
                else {
                    if (!w1Updated && entityId == wiz1.id){
                        wiz1.update(x, y, vx, vy, state)
                        w1Updated = true;
                    }else if (!w2Updated && entityId == wiz2.id){
                        wiz2.update(x, y, vx, vy, state)
                        w2Updated = true;
                    }
                }
                break;
            case "OPPONENT_WIZARD":
                if (!oppoWiz1) oppoWiz1 = new Wizard(entityId, x, y, vx, vy, state)
                else if (!oppoWiz2) oppoWiz2 = new Wizard(entityId, x, y, vx, vy, state)
                else {
                    if (!oppW1Updated && entityId == oppoWiz1.id){
                        oppoWiz1.update(x, y, vx, vy, state)
                        oppW1Updated = true;
                    }else if (!oppW2Updated && entityId == oppoWiz2.id){
                        oppoWiz2.update(x, y, vx, vy, state)
                        oppW2Updated = true;
                    }
                }
                break;
            case "SNAFFLE":
                snaffles.push(new Snaffle(entityId, x, y, vx, vy, state))
                break;
            case "BLUDGER":
                if (bludgers.length < 2) bludgers.push(new Bludger(entityId, x, y, vx, vy, state))
                else if (entityId == bludgers[0].id) bludgers[0].update(x, y, vx, vy, state)
                else if (entityId == bludgers[1].id) bludgers[1].update(x, y, vx, vy, state)
                break;
            default:
                console.error('Li mortacci!')
                break;
        }
    }
    //console.error('snaffles: ', snaffles)
    console.error('wiz1: ', wiz1)
    console.error('wiz2: ', wiz2)
    console.error('oppoWiz1: ', oppoWiz1)
    console.error('oppoWiz2: ', oppoWiz2)

    console.log(wiz1.play(snaffles, [oppoWiz1, oppoWiz2], oppoGoal))
    console.log(wiz2.play(snaffles, [oppoWiz1, oppoWiz2], oppoGoal))

}
