import * as Poses from './posenet';

let  rotateJoint = (jointA,jointB,jointC,poses) => {
    let jA = Poses.getPart(jointA,poses)[0];
    let jB = Poses.getPart(jointB,poses)[0];
    let jC = Poses.getPart(jointC,poses)[0];
    
    let angle = (p1,p2,p3) => {
        const p13 = Math.sqrt(Math.pow((p1.position.x - p3.position.x), 2) + Math.pow((p1.position.y - p3.position.y), 2));
        const p12 = Math.sqrt(Math.pow((p1.position.x - p2.position.x), 2) + Math.pow((p1.position.y - p2.position.y), 2));
        const p23 = Math.sqrt(Math.pow((p2.position.x - p3.position.x), 2) + Math.pow((p2.position.y - p3.position.y), 2));
        const resultRadian = Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13));
        return resultRadian;
    }
    let Angle = angle(jA,jB,jC)
    return {Angle};
}


export {rotateJoint} ;