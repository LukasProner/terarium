var camera, scene, renderer, controls;
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();
var gameStarted = false;
var firstMove = false;

var glassBox, base, spider, jar, lid;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;

init();
render();

function init() {
    console.log("START");
    startGame();

    // CAMERA
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 3);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);


    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // OBJECTS
    addObjects();

    // PROJECTOR + MOUSE EVENTS
    projector = new THREE.Projector();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    //SHADOWS
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

}



function addObjects() {
    //FLOOR
    var floorTexture = new THREE.ImageUtils.loadTexture( 'texture/wood_floor.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 10, 10 );
    var geometryPlane = new THREE.PlaneGeometry( 15, 15, 4, 4 );
    var materialPlane = new THREE.MeshBasicMaterial( {
        map: floorTexture,
        side: THREE.DoubleSide,
        roughness : 0.12,
        metalness: 0.35} );
    plane = new THREE.Mesh( geometryPlane, materialPlane );
    plane.position.set(0, -2.5, 4.5);
    plane.rotation.x = Math.PI / 2;
    scene.add( plane );

    addLight();

    addSpider()
    addTable(0, -0.9, 0);
    spider.scale.set(0.7, 0.7, 0.7);
    spider.position.y = -0.4;
    addRoom();

    loadGLB(`models/desk_lamp.glb`, -1.85, -0.6, -1, 0.3, 0.3, 0.3, 0, Math.PI/3, 0);
    loadGLB(`models/Untitled.glb`, -1.85, -0.6, -1, 0.3, 0.3, 0.3, 0, Math.PI/3, 0);

    //SHADOWS
    plane.receiveShadow = true;
    base.receiveShadow = true;
    glassBox.receiveShadow = true;

    // addGlassJar(2, -0.5, 1, 0.5);

    jar = createGlassJar(2, -0.5, 1, 0.5);
    lid = createJarLid(jar);


}

function render() {
    requestAnimationFrame(render);
    if (!gameStarted) return;
    // Simple idle animation (rotation)
    // spider.rotation.y += 0.005;

    renderer.render(scene, camera);
    camera.lookAt(scene.position);

    update();
}

function update() {
    var delta = clock.getDelta();
    var moveDistance = 1 * delta;
    var rotateSpeed = 5; // rýchlosť otáčania pavúka
    // const modelOffset = Math.PI / 2;

    // --- Vypočítanie pohybového smeru ---
    let moveX = 0;
    let moveZ = 0;

    if (keyboard.pressed("W")) moveZ -= 1;
    if (keyboard.pressed("S")||firstMove==false){
        moveZ += 1;
        firstMove=true;
    }
    if (keyboard.pressed("A")) moveX -= 1;
    if (keyboard.pressed("D")) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
        // Cieľový uhol pohybu (v svetových súradniciach)
        const targetAngle = Math.atan2(moveX, moveZ) + Math.PI ; // atan2(x, z)

        // Rozdiel medzi aktuálnym a cieľovým uhlom
        let angleDiff = targetAngle - spider.rotation.y;

        // Oprav rozdiel na interval [-PI, PI]
        angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

        // Plynulé otáčanie pavúka
        spider.rotation.y += (angleDiff) * Math.min(1, rotateSpeed * delta);

        // Pohyb dopredu podľa lokálneho smeru pavúka

        const oldPosition = spider.position.clone();

        // pokus o pohyb
        spider.translateZ(-moveDistance);

        // kontrola hraníc
        if (
            spider.position.x < -1.3 ||
            spider.position.x > 1.3 ||
            spider.position.z < -0.8 ||
            spider.position.z > 0.8
        ) {
            // vráť späť – pavúk narazil na hranicu
            spider.position.copy(oldPosition);
        }
    }



    if(moveX !== 0 || moveZ !== 0){
        const t = clock.elapsedTime;
        const speed =14;
        const amplitudeZ = Math.PI/8;
        const sideAmp = Math.PI/15;

        for(let i=0; i<spider.legs.length; i++){
            const leg = spider.legs[i];
            let phase = (i % 2 === 0) ? 0 : Math.PI;

            // uloženie pôvodného uhla
            if (leg.base.userData.baseAngle === undefined) {
                leg.base.userData.baseAngle = leg.base.rotation.y;
            }
            const baseAngle = leg.base.userData.baseAngle;

            let legSpeed = speed;
            if (i === 3 || i === 4) {
                legSpeed = speed * 0.55;
            }else if(i===2 || i===5){
                legSpeed = speed * 0.7;
            }
            const w = t * legSpeed + i + phase;

            const circleX = Math.cos(w) * sideAmp;
            const circleZ = Math.sin(w) * amplitudeZ;

            const dir = (i > 3) ? -1 : 1;

            // otočený smer len pre base.rotation.y
            leg.base.rotation.y = baseAngle + circleX * dir;

            // hore/dole zostáva rovnaké
            if(i===3 || i===4){
                leg.upper.rotation.z = -Math.PI/3 + circleZ;
                leg.lower.rotation.z = Math.PI/3 + circleZ * 1.5;
            }
            else if(i===2 || i===5){
                leg.upper.rotation.z = -Math.PI/3 + circleZ;
                leg.lower.rotation.z = Math.PI/3 + circleZ * 0.9;
            }else{
                leg.upper.rotation.z = -Math.PI/4 + circleZ;
                leg.lower.rotation.z = Math.PI/3 + circleZ * 0.3;
            }
        }
    }


    // var vector = new THREE.Vector3(mouse.x,mouse.y,1);
    // projector.unprojectVector( vector, camera );
    // var ray = new THREE.Raycaster( camera.position,
    //     vector.sub(camera.position ).normalize() );
    // var intersects = ray.intersectObjects( scene.children );
    //
    // if (intersects.length > 0 && intersects[0].object === jar.innerMesh) {
    //     console.log("Sklenička bola zasiahnutá!");
    // }
    // if ( intersects.length > 0 ){
    //     if( intersects[ 0 ].object != INTERSECTED && intersects[0].object === jar.innerMesh){
    //         // INTERSECTED = intersects[ 0 ].object;
    //         // INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
    //         // INTERSECTED.material.color.setHex( 0x00FF00 );
    //         console.log("Sklenička bola zasiahnutá!");
    //     }
    // }
    //

    var raycaster = new THREE.Raycaster();
    var mouseVector = new THREE.Vector2();

    mouseVector.set(mouse.x, mouse.y);
    raycaster.setFromCamera(mouseVector, camera);

    const intersects = raycaster.intersectObjects(jar.group.children, true);

    const hovered = intersects.length > 0;

    if (lid) { // lid is the pivot returned by createJarLid
        const openTarget = lid.userData.openRotation;
        const closedTarget = lid.userData.closedRotation;
        const speed = 6.0; // higher = faster animation

        // choose target based on hover
        lid.userData.targetRotationX = hovered ? openTarget : closedTarget;

        const diff = lid.userData.targetRotationX - lid.rotation.x;
        lid.rotation.x += diff * Math.min(1, speed * delta);
    }

    if (hovered) {
        console.log("Sklenička bola zasiahnutá!");
    }
    controls.update();
}

function addLight() {
    var ambientLight = new THREE.AmbientLight(0xffffff,0.8);
    scene.add(ambientLight);
    var spotlight = new THREE.SpotLight('rgb(248,248,248)');
    spotlight.angle = Math.PI/5;
    spotlight.position.set(-1.7, 0.5, -1.1);
    spotlight.intensity = 0.8;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.set(2048, 2048); // higher resolution shadow map
    spotlight.shadow.bias = -0.0005; // reduce acne
    spotlight.shadow.camera.near = 0.1;
    spotlight.shadow.camera.far = 10;
    scene.add(spotlight);
    var lightTarget = new THREE.Object3D();
    lightTarget.position.set(0,-2,0);
    scene.add(lightTarget);
    spotlight.target = lightTarget;
}

function addSpider(){
    // SPIDER GROUP
    spider = new THREE.Group();

    const headGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = +0.05;
    head.castShadow = true;
    head.receiveShadow = false;
    spider.add(head);

    const bodyGeo = new THREE.SphereGeometry(0.15, 32, 32);
    const body = new THREE.Mesh(bodyGeo, headMat);
    body.castShadow = true;
    body.receiveShadow = false;

    const legMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    spider.legs = [];

    for (let i = 4; i < 12; i++) {
        let angle = (i / 10) * Math.PI * 2;

        // nový pivot pre bočné kývanie
        const legBase = new THREE.Object3D();
        spider.add(legBase);

        // horná noha (pivot, ktorý drží smer nohy)
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        legGeo.translate(0, 0.1, 0); // pivot na dolnom konci
        const legMesh = new THREE.Mesh(legGeo, legMat);
        legMesh.castShadow = true;
        legMesh.receiveShadow = false;
        const legPivot = new THREE.Object3D();
        legPivot.position.set(Math.cos(angle)*0.07, 0, Math.sin(angle)*0.1);
        legPivot.rotation.y = -angle;
        legPivot.rotation.z = -Math.PI/3;
        legPivot.add(legMesh);

        // dolná noha
        const legGeo2 = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        legGeo2.translate(0, -0.15, 0);
        const legMesh2 = new THREE.Mesh(legGeo2, legMat);
        legMesh2.castShadow = true;
        legMesh2.receiveShadow = false;
        const legPivot2 = new THREE.Object3D();
        legPivot2.position.set(0, 0.2, 0);
        legPivot.add(legPivot2);
        legPivot2.add(legMesh2);

        // pridáme hornú nohu pod nový pivot
        legBase.add(legPivot);

        // uložíme referencie
        spider.legs.push({
            base: legBase,
            upper: legPivot,
            lower: legPivot2,
            upperMesh: legMesh,
            lowerMesh: legMesh2
        });
    }

    angle = Math.PI + (1/20)* Math.PI * 2;
    // body.position.set(Math.cos(angle) * 0.2, 0.07, Math.sin(angle) * 0.2);
    body.position.set(0, 0.07, 0.2);
    spider.add(body);

    spider.position.y = -0.1;
    spider.rotation.y = 0;
    spider.castShadow = true;
    scene.add(spider);
}

function addTable(x, y, z) {
    var tableGroup = new THREE.Group();

    // Texture for the table top (replace path if needed)
    var woodTexture = new THREE.TextureLoader().load('texture/wood_texture.jpg');
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 2);

    // Top
    var topGeom = new THREE.BoxGeometry(5, 0.12, 3);
    var topMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.6, metalness: 0.1 });
    var topMesh = new THREE.Mesh(topGeom, topMat);
    topMesh.position.set(0, 0.25, 0); // relative to group
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Legs
    var legGeom = new THREE.BoxGeometry(0.2, 1.9, 0.2);
    var legMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.8 });
    var legOffsets = [
        [2, -0.7,  1.2],
        [-2, -0.7,  1.2],
        [2, -0.7, -1.2],
        [-2, -0.7, -1.2]
    ];
    legOffsets.forEach(function(offset) {
        var leg = new THREE.Mesh(legGeom, legMat);
        leg.position.set(offset[0], offset[1], offset[2]);
        leg.castShadow = true;
        leg.receiveShadow = true;
        tableGroup.add(leg);
    });

    // Position the whole table group in world coordinates
    tableGroup.position.set(x, y, z);

    // Ensure the table receives shadows from lights and contributes shadows
    tableGroup.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(tableGroup);

    // GLASS BOX
    const glassGeo = new THREE.BoxGeometry(3.01, 1.2, 2.01);
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,    // svetlomodrá farba
        transparent: true,
        opacity: 0.25,
        roughness: 0.5,       // hladký povrch = lesk
        metalness: 0.5,       // sklo nie je kov
        side: THREE.DoubleSide
    });
    glassBox = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassBox);
    var sandTexture = new THREE.ImageUtils.loadTexture('texture/sand.jpg');
    const baseGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const baseMat = new THREE.MeshPhongMaterial({ map: sandTexture });
    base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.55;
    scene.add(base);
}

function addRoom() {
    const room = new THREE.Group();
    const loader = new THREE.TextureLoader();

    // Try to load textures; if missing, fallback colors will be used
    const wallTex = loader.load('texture/bricks_wall2.jpg', undefined, undefined, () => {});
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(3, 1.2);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: 0xece3d6, side: THREE.DoubleSide });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f4 });

    const wallHeight = 5;
    const roomSize = 12;
    // Back wall
    const wallGeom = new THREE.PlaneGeometry(roomSize, wallHeight);
    const back = new THREE.Mesh(wallGeom, wallMat);
    back.position.set(0, -2.5 + wallHeight / 2, -roomSize / 2+4.5);
    room.add(back);

    // Left wall
    const left = new THREE.Mesh(wallGeom, wallMat);
    left.position.set(-roomSize / 2, -2.5 + wallHeight / 2, 4.5);
    left.rotation.y = Math.PI / 2;
    room.add(left);

    // Right wall
    const right = new THREE.Mesh(wallGeom, wallMat);
    right.position.set(roomSize / 2, -2.5 + wallHeight / 2, 4.5);
    right.rotation.y = -Math.PI / 2;
    room.add(right);


    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = -2.5 + wallHeight;
    room.add(ceiling);

    scene.add(room);

    loadGLB(
        "models/bookshelf.glb",
        -4.1, -2.4, -1,
        2, 2, 2
    );
    loadGLB(
        "models/storage_cabinet.glb",
        3.9, -2.4, -1,
        2.1, 2.1, 2.1
    );
}

function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadGLB(path, x, y, z, scalex, scaley, scalez, rotX = 0, rotY = 0, rotZ = 0) {
    const loader = new THREE.GLTFLoader();

    loader.load(path, function (gltf) {
        const model = gltf.scene;

        model.position.set(x, y, z);
        model.scale.set(scalex, scaley, scalez);

        // Apply rotation (radians)
        model.rotation.set(rotX, rotY, rotZ);

        scene.add(model);
    });
}

// Example usage: rotate 45 degrees around Y (Math.PI/4)


function loadObjWithMTL(objPath, MTLpath, scalex, scaley, scalez,
                        posX, posY, posZ){
// ak nie je potrebná globálna premenná tu definujte objekt objcar;
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load( MTLpath, function( materials ) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(objPath, function(object)
        {
            objcar = object;
            objcar.position.set(posX,posY,posZ);
            objcar.scale.set(scalex,scaley,scalez);
            // objcar.rotation.y = Math.PI / 2;
            // objcar.rotation.x = Math.PI / 2;
            // objcar.rotation.z = Math.PI;

            scene.add( objcar );

        });
    });
}



// JavaScript
function createGlassJar(x = 0, y = 0, z = 0, scale = 1) {
    const texLoader = new THREE.TextureLoader();
    const envTex = texLoader.load('texture/sky.jpg');
    envTex.encoding = THREE.sRGBEncoding;
    envTex.mapping = THREE.EquirectangularReflectionMapping;

    const height = 1.0 * scale;
    const outerRadius = 0.4 * scale;
    const thickness = 0.03 * scale;
    const radialSegments = 64;

    const jarGroup = new THREE.Group();

    const outerGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, height, radialSegments, 1, true);
    const innerGeo = new THREE.CylinderGeometry(outerRadius - thickness, outerRadius - thickness, height - 0.02 * scale, radialSegments, 1, true);

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        transparent: true,
        opacity: 0.25,
        ior: 1.45,
        thickness: thickness,
        envMap: envTex,
        side: THREE.FrontSide,
        depthWrite: false
    });

    const innerMat = glassMat.clone();
    innerMat.side = THREE.BackSide;

    const outerMesh = new THREE.Mesh(outerGeo, glassMat);
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);

    outerMesh.position.y = height / 2 - 0.01 * scale;
    innerMesh.position.copy(outerMesh.position);

    const bottomGeo = new THREE.CircleGeometry(outerRadius, 32);
    const bottomMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 1,
        roughness: 0.4
    });

    const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    bottomMesh.rotation.x = -Math.PI / 2;

    jarGroup.add(bottomMesh);
    jarGroup.add(innerMesh);
    jarGroup.add(outerMesh);

    jarGroup.position.set(x, y, z);

    // Raycast bude fungovať čisto pre jarGroup.children
    jarGroup.children.forEach(m => m.userData.isJar = true);

    scene.add(jarGroup);

    return { group: jarGroup, outerMesh, innerMesh, bottomMesh };
}

function createJarLid(jarObj) {
    const outerMesh = jarObj.outerMesh;
    const height = outerMesh.geometry.parameters.height;
    const outerRadius = outerMesh.geometry.parameters.radiusTop;
    const scale = 1;

    const lidHeight = 0.05;
    const lidGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, lidHeight, 32);

    const lidMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        metalness: 0.5,
        roughness: 0.15
    });

    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;

    // Pivot placed at the rim plane (where the lid meets the jar)
    const lidPivot = new THREE.Object3D();
    lidPivot.position.copy(outerMesh.position);
    lidPivot.position.y += (height / 2);

    lidMesh.position.set(0, lidHeight / 2, 0);

    // Add lid to pivot. Rotating the pivot will tilt the lid.
    lidPivot.add(lidMesh);

    // Mark the actual mesh so raycaster still hits it
    lidMesh.userData.isJar = true;

    // Animation targets on the pivot (rotate around X to tilt backward)
    lidPivot.userData.closedRotation = 0;
    lidPivot.userData.openRotation = -Math.PI / 4; // tilt ~45 deg backward
    lidPivot.userData.targetRotationX = 0;

    // Add to jar group
    jarObj.group.add(lidPivot);
    return lidPivot;
}



function startGame() {
    document.getElementById("menu").style.display = "none";
    // console.log("Starting Game");
    gameStarted = true;
    // init()
}

function showControls() {
    alert("WASD - pohyb\nMouse - kamera");
}

function exitGame() {
    window.close(); // nemusí fungovať v prehliadači
}


