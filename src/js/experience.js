import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

((d, w) => {
  const gui = new GUI({ title: "options" });

  const canvas = d.querySelector("canvas.webgl");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    w.innerWidth / w.innerHeight,
    0.1,
    100
  );
  camera.position.z = 5;
  camera.position.y = 4;
  camera.position.x = 4;
  const control = new OrbitControls(camera, canvas);
  control.enableDamping = true;

  const sunLigt = new THREE.AmbientLight("white", 1);
  scene.add(sunLigt);

  const directLight = new THREE.DirectionalLight("white", 1);
  directLight.castShadow = true;
  directLight.position.x = -6;
  directLight.position.y = 1.6;
  directLight.position.z = -1.1;

  scene.add(directLight);

  let mixer;
  let actions = {};
  let activeAction;
  let previusAnimation;

  const playAnimation = (type)=>{
    previusAnimation = activeAction;
    activeAction = actions[type];

    if(previusAnimation !== activeAction){
        if (previusAnimation) {
            previusAnimation.fadeOut(0.2);
        }
    }
    activeAction.reset().fadeIn(0.2).play();
  } 

  const animateActions = {
    Run: () => playAnimation("Run"),
    Walk: () => playAnimation("Walk"),
    Survey: () => playAnimation("Survey"),
  };

  const gltfLoader = new GLTFLoader();

  gltfLoader.load("../../public/img/fox/fox.gltf", (model) => {
    const fox = model.scene;
    fox.castShadow = true;
    fox.children[1].castShadow = true;
    fox.scale.set(0.03, 0.03, 0.03);
    scene.add(fox);

    mixer = new THREE.AnimationMixer(fox);
    model.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
    });

    activeAction = actions[model.animations[0].name];
    activeAction.play();
    console.log(actions);

    gui.add(animateActions, "Run").name("Correr");
    gui.add(animateActions, "Walk").name("Caminar");
    gui.add(animateActions, "Survey").name("Ver");
  });

  const textureLoader = new THREE.TextureLoader();

  const floorArmTexture = textureLoader.load(
    "../../public/img/floor/textures/sparse_grass_arm_1k.jpg"
  );
  const floorNormalTexture = textureLoader.load(
    "../../public/img/floor/textures/sparse_grass_nor_gl_1k.png"
  );
  const floorMapTexture = textureLoader.load(
    "../../public/img/floor/textures/sparse_grass_diff_1k.jpg"
  );
  floorMapTexture.colorSpace = THREE.SRGBColorSpace;
  floorMapTexture.wrapS = THREE.RepeatWrapping;
  floorMapTexture.wrapT = THREE.RepeatWrapping;
  floorMapTexture.repeat.set(6, 6);

  const floorDispTexture = textureLoader.load(
    "../../public/img/floor/textures/sparse_grass_disp_1k.jpg"
  );

  const floorGeometry = new THREE.PlaneGeometry(24, 24, 1, 1);
  const floorMaterial = new THREE.MeshStandardMaterial({
    aoMap: floorArmTexture,
    roughnessMap: floorArmTexture,
    metalnessMap: floorArmTexture,
    normalMap: floorNormalTexture,
    map: floorMapTexture,
    displacementMap: floorDispTexture,
    displacementBias: 0.1,
    displacementScale: 0.06,
  });

  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.receiveShadow = true;
  floorMesh.rotation.x = -Math.PI * 0.5;
  scene.add(floorMesh);

  const render = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFSoftShadowMap;
  render.setSize(w.innerWidth, w.innerHeight);
  render.render(scene, camera);

  const clock = new THREE.Clock();

  const tick = () => {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    control.update();
    render.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();

  w.addEventListener("resize", () => {
    camera.aspect = w.innerWidth / w.innerHeight;
    camera.updateProjectionMatrix();
    render.setSize(w.innerWidth, w.innerHeight);
    render.render(scene, camera);
  });
})(document, window);
