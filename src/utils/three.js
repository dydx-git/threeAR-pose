export function computeScreenSpaceBoundingBox(THREE, obj, camera) {
    let min;
    let max;

    // Is this an array of objects?
    if(Array.isArray(obj)) {
        for(let i = 0; i < obj.length; ++i) {
            let box2D = computeScreenSpaceBoundingBox(THREE, obj[i], camera);
            if(min === undefined) {
                min = box2D.min.clone();
                max = box2D.max.clone();
            } else {
                min.min(box2D.min);
                max.max(box2D.max);
            }
        }
    }

    // Does this object have geometry?
    if(obj.geometry !== undefined) {
        let vertices = obj.geometry.vertices;
        if(vertices === undefined
            && obj.geometry.attributes !== undefined
            && 'position' in obj.geometry.attributes) {
            // Buffered geometry
            let vertex = new THREE.Vector3();       
            let pos = obj.geometry.attributes.position;
            for(let i = 0; i < pos.count * pos.itemSize; i += pos.itemSize)
            {
                vertex.set(pos.array[i], pos.array[i + 1], pos.array[1 + 2]);
                let vertexWorldCoord = vertex.applyMatrix4(obj.matrixWorld);
                let vertexScreenSpace = vertexWorldCoord.project(camera);
                if(min === undefined) {
                    min = vertexScreenSpace.clone();
                    max = vertexScreenSpace.clone();
                }
                min.min(vertexScreenSpace);
                max.max(vertexScreenSpace);
            }
        } else {
            // Regular geometry
            let vertex = new THREE.Vector3();       
            for(let i = 0; i < vertices.length; ++i) {
                let vertexWorldCoord = vertex.copy(vertices[i]).applyMatrix4(obj.matrixWorld);
                let vertexScreenSpace = vertexWorldCoord.project(camera);
                if(min === undefined) {
                    min = vertexScreenSpace.clone();
                    max = vertexScreenSpace.clone();
                }
                min.min(vertexScreenSpace);
                max.max(vertexScreenSpace);
            }
        }
    }
    
    // Does this object have children?
    if(obj.children !== undefined) {
        for(let i = 0; i < obj.children.length; ++i) {
            let box2D = computeScreenSpaceBoundingBox(THREE, obj.children[i], camera);
            if(min === undefined) {
                min = box2D.min.clone();
                max = box2D.max.clone();
            } else {
                min.min(box2D.min);
                max.max(box2D.max);
            }
        }
    }
    
    return new THREE.Box2(min, max);
}

export function normalizedToPixels(coord, renderWidthPixels, renderHeightPixels) {
    let halfScreen = new THREE.Vector2(renderWidthPixels/2, renderHeightPixels/2)
    return coord.clone().multiply(halfScreen);
}