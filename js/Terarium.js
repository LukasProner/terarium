var camera, scene, renderer, controls;
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

var glassBox, base, spider;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;

init();
render();

function init() {
    // CAMERA
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 4);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // LIGHTS
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // OBJECTS
    addObjects();

    // PROJECTOR + MOUSE EVENTS
    projector = new THREE.Projector();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
}

function addObjects() {
    // GLASS BOX
    const glassGeo = new THREE.BoxGeometry(3.01, 1.2, 2.01);
    const glassMat = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    glassBox = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassBox);

    // BASE (SAND)
    var sandTexture = new THREE.ImageUtils.loadTexture('texture/sand.jpg');
    const baseGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const baseMat = new THREE.MeshPhongMaterial({ map: sandTexture });
    base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.55;
    scene.add(base);

    // SPIDER GROUP
    spider = new THREE.Group();

    const headGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = +0.05;
    spider.add(head);

    const bodyGeo = new THREE.SphereGeometry(0.15, 32, 32);
    const body = new THREE.Mesh(bodyGeo, headMat);

    const legMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    let angle = 0;
    for (let i = 0; i < 8; i++) {
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);

        const leg = new THREE.Mesh(legGeo, legMat);
        let angle = (i / 10) * Math.PI * 2;
        const side = i < 4 ? 1 : -1;

        if(i>4){
            angle+= (2 / 10) * Math.PI * 2;
        }
        leg.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);
        leg.rotation.y = -angle;
        leg.rotation.z = Math.PI /2.5;
        spider.add(leg);
    }
    angle+= (1/2) * Math.PI * 2 + (1/20)* Math.PI * 2;
    body.position.set(Math.cos(angle) * 0.2, 0.07, Math.sin(angle) * 0.2);
    spider.add(body);


    spider.position.y = -0.1;
    scene.add(spider);
}

function render() {
    requestAnimationFrame(render);

    // Simple idle animation (rotation)
    // spider.rotation.y += 0.005;

    renderer.render(scene, camera);
    camera.lookAt(scene.position);

    update();
}

function update() {
    var delta = clock.getDelta();
    var moveDistance = 1 * delta;

    // Pohyb pavúka pomocou klávesnice
    if (keyboard.pressed("W")) spider.translateZ(-moveDistance);
    if (keyboard.pressed("S")) spider.translateZ(moveDistance);
    if (keyboard.pressed("A")) spider.translateX(-moveDistance);
    if (keyboard.pressed("D")) spider.translateX(moveDistance);

    controls.update();

    // // Detekcia intersekcie myšou
    // var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    // projector.unprojectVector(vector, camera);
    // var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    // var intersects = ray.intersectObjects(scene.children, true);
    //
    // if (intersects.length > 0) {
    //     if (intersects[0].object != INTERSECTED) {
    //         if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    //         INTERSECTED = intersects[0].object;
    //         INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
    //         INTERSECTED.material.emissive.setHex(0x0000ff);
    //     }
    // } else {
    //     if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    //     INTERSECTED = null;
    // }
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
