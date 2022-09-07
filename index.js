import {OrbitControls} from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'
import {RGBELoader} from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';

let scene, camera, renderer, controls, clock, pointlight, ballMaterial;
let ROUGHNESS = 0;
let METALNESS = 1;
let REFLECTIVITY = 1;
let CLEARCOAT = 0;
let BASE_COLOR_MAP;
let NORMAL_MAP;
let HEIGHT_MAP;
let HEIGHT_SCALE;

let envmap, sphereOne, sphereTwo;
let buffer = false;
let bufferObj;

const totalFrames = 512;
let textureName = 'morphMaterial';
// const totalFrames = 177;
// let textureName = 'morph3-high';

var loader = new THREE.TextureLoader();
let textureRepeatX = 2;
let textureRepeatY = 1;

const duration = 10; // 4s
let paused = false;
let stopped = false;

const allBtnVars = {
    'btn1':false,
    'btn2':false,
    'btn3':false,
    'btn4':false
};

function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = 'sphereCanvas';

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    renderer.gammaOutput = true; 
    renderer.gammaFactor = 1.7; 

    camera = new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,1,1000); // 50 - FOV
    camera.position.set(0,0,250); // 500 is distance away from center
    controls = new OrbitControls(camera, renderer.domElement);

    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 2;
    // controls.enableDamping = true;

    pointlight = new THREE.PointLight(0xffffff,1); // 1 is intensity
    pointlight.position.set(200,200,200);  // light position
    scene.add(pointlight);

    clock = new THREE.Clock();

    initGeo();

}

function initGeo() {
    console.log('init sphere');
    let envmaploader = new THREE.PMREMGenerator(renderer);

    new RGBELoader().setPath('textures/').load('reflectionTexture.hdr', function(hdrmap) {
        
        envmap = envmaploader.fromCubemap(hdrmap);

        HEIGHT_SCALE = 10;


        NORMAL_MAP = loader.load("textures/"+textureName+"/normal/frame"+(1).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });
        HEIGHT_MAP = loader.load("textures/"+textureName+"/height/frame"+(1).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });     
        BASE_COLOR_MAP = loader.load("textures/"+textureName+"/base/frame"+(1).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });

        let materialOnePre = {
            transparent: true,
            opacity: 1.0,
            // emissive: 0x8b8b8b,
            roughness: ROUGHNESS,
            metalness: METALNESS,
            reflectivity: REFLECTIVITY,
            clearcoat: CLEARCOAT,
            clearcoatRoughness:0.0,
            
            map: BASE_COLOR_MAP,
            normalScale: new THREE.Vector2(1,1), 
            normalMap: NORMAL_MAP,
            displacementMap : HEIGHT_MAP,
            displacementScale : HEIGHT_SCALE,
            envMap: envmap.texture
        };
        
        
        NORMAL_MAP = loader.load("textures/"+textureName+"/normal/frame"+(2).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });
        HEIGHT_MAP = loader.load("textures/"+textureName+"/height/frame"+(2).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });     
        BASE_COLOR_MAP = loader.load("textures/"+textureName+"/base/frame"+(2).toString()+".jpg", function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( textureRepeatX, textureRepeatY );
        });

        let materialTwoPre = {
            transparent: true,
            opacity: 1.0,
            // emissive: 0x8b8b8b,
            roughness: ROUGHNESS,
            metalness: METALNESS,
            reflectivity: REFLECTIVITY,
            clearcoat: CLEARCOAT,
            clearcoatRoughness:0.0,
            
            map: BASE_COLOR_MAP,
            normalScale: new THREE.Vector2(1,1), 
            normalMap: NORMAL_MAP,
            displacementMap : HEIGHT_MAP,
            displacementScale : HEIGHT_SCALE,
            envMap: envmap.texture
        };
        //add material setting
        let materialOne = new THREE.MeshPhysicalMaterial(materialOnePre);
        let materialTwo = new THREE.MeshPhysicalMaterial(materialTwoPre);

        let ballGeo = new THREE.SphereGeometry(60,64,64);
        sphereOne = new THREE.Mesh(ballGeo, materialOne);
        sphereTwo = new THREE.Mesh(ballGeo, materialTwo);

        scene.add(sphereOne);
        
        initSliders();
        
        animate(); // rendering loop
    });
}

function initSliders() {

    $("#slider1" ).on( "drag", slider1func());
    $("#slider2" ).on( "drag", slider2func());
    $("#slider3" ).on( "drag", slider3func());
    $("#slider4" ).on( "drag", slider4func());

}

const xrot = 0;
const yrot = 0;
const zrot = 0;

function animate() {
    sphereOne.rotation.z += .001;
    sphereTwo.rotation.z += .001;
    controls.update();
    if (!paused) {
        if (!stopped) {
            const time = clock.getElapsedTime();
            animateMaterial(time)
        }
    
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

}

let lastTen = [0,0,0,0,0,0,0,0,0,0];

let oldT;
let tt=0;
let h = 0;
let materialInterval = 1;
let autoSlideSpeed = 1;
let colorSkip = false;
function animateMaterial(t) {
    // camera.rotation.z += .1;
    function autoSlide(num) {
        let cur = $("#slider"+(num).toString()).roundSlider("getValue");
        if (num == 1) {
            if (!colorSkip) {
                cur += autoSlideSpeed;
                colorSkip = true;
            } else {
                colorSkip = false;
            }
        } else {
            cur += autoSlideSpeed;
        }
        if (cur >= 100) {
            cur = 0;
        }
        $("#slider"+(num).toString()).roundSlider("setValue", cur);
    }
    oldT = tt;
    tt = Math.floor(t*10);
    if (tt > oldT) {
        if (tt % materialInterval == 0){

            for (let i = 0; i < 4; i++) {
                let key = 'btn'+(i+1).toString();
                // console.log('  ===  key :'+key);
                // console.log('  ===  val :'+allBtnVars[key]);
                // console.log('   ');
                if (allBtnVars[key]) {
                    autoSlide(i+1);
                }
            } 
            slider1func();
            slider2func();
            slider3func();
            slider4func();

            // console.log('updating geo');
            if (!buffer) {
                scene.remove(sphereOne);
                scene.add(sphereTwo);
                buffer = true;
                bufferObj = sphereOne;
            } else {
                scene.remove(sphereTwo);
                scene.add(sphereOne);
                buffer = false;
                bufferObj = sphereTwo;
            }
            // generateMaterial();
            updateBufferGeo(bufferObj);
        }
    }
}


function updateBufferGeo(obj) {
    obj.material.map.dispose();
    obj.material.normalMap.dispose();
    obj.material.displacementMap.dispose();
    obj.material.map = BASE_COLOR_MAP;
    obj.material.normalMap = NORMAL_MAP;
    obj.material.displacementMap = HEIGHT_MAP;
    // obj.material.displacementScale = HEIGHT_SCALE;
} 


function slider1func() {
    // console.log('changing color value');
    h = $("#slider1").roundSlider("getValue");
    h = h*3.6;
    let hh = h.toString();
    let newCol = new THREE.Color('hsl('+hh+',100%,75%)');
    sphereOne.material.color = newCol;
    sphereTwo.material.color = newCol;
}
function slider2func() {
    // BUMP
    // console.log('changing BUMP maps');
    let bumpCount = $("#slider2").roundSlider("getValue");
    bumpCount = Math.round(bumpCount * totalFrames/100);
    if (bumpCount == 0){bumpCount = 1};
    NORMAL_MAP = loader.load("textures/"+textureName+"/normal/frame"+(bumpCount).toString()+".jpg", function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set( 0, 0 );
        texture.repeat.set( textureRepeatX, textureRepeatY );
    });        
    HEIGHT_MAP = new THREE.TextureLoader().load("textures/"+textureName+"/height/frame"+(bumpCount).toString()+".jpg", function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set( 0, 0 );
        texture.repeat.set( textureRepeatX, textureRepeatY );
    });     
}
function slider3func() {
    // BASE
    // console.log('changing BASE color map');
    let baseCount = $("#slider3").roundSlider("getValue");
    baseCount = Math.round(baseCount * totalFrames/100);
    if (baseCount == 0){baseCount = 1};
    BASE_COLOR_MAP = new THREE.TextureLoader().load("textures/"+textureName+"/base/frame"+(baseCount).toString()+".jpg", function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set( 0, 0 );
        texture.repeat.set( textureRepeatX, textureRepeatY );
    });         
}
function slider4func() {
    // BASE
    // console.log('changing SHINYNESS');
    let shiny = $("#slider4").roundSlider("getValue");
    if (shiny < 50) {
        shiny = shiny*2 / 33.3;
    } else {
        shiny = (100 - shiny)*2 / 33.3;
    }
    if (shiny < 1){
        ROUGHNESS = 1 - shiny;
        REFLECTIVITY = 0;
        METALNESS = 0;
    } else if (shiny < 2) {
        ROUGHNESS = 0;
        REFLECTIVITY = shiny - 1;
        METALNESS = 0;
    } else {
        ROUGHNESS = 0;
        REFLECTIVITY = 1;
        METALNESS = shiny - 2;
    }
    sphereOne.material.roughness = ROUGHNESS;
    sphereOne.material.reflectivity = REFLECTIVITY;
    sphereOne.material.metalness = METALNESS;
    sphereTwo.material.roughness = ROUGHNESS;
    sphereTwo.material.reflectivity = REFLECTIVITY;
    sphereTwo.material.metalness = METALNESS;
}





$("#btn" ).on("click", function( event, ui ) {
        console.log('clickk');
        paused = !paused;
        console.log('pause state: '+paused);
        animate(); // rendering loop
});

const allResults = [
    'bumpy',
    'smooth',
    'rough',
    'soft',
    'hard',
    'strong',
    'weak',
    'heavy',
    'light',
    'silky',
    'greasy',
    'grimy',
    'slimy',
    'hairy',
    'soggy',
    'spiky',
    'fuzzy',
    'stiff',
    'dry',
    'moist',
    'tough',
    'prickly',
    'firm',
    'fluffy',
    'wet',
    'furry',
    'precious',
    'coarse',
    'durable',
    'cheap',
    'alive',
    'delicate'
]

$("#select-btn" ).on("click", function( event, ui ) {
    console.log('clickk slider button');
    $("#slider-container").hide();
    $("#slider-button-container").hide();
    stopped = true;
    let v1 = $("#slider1").roundSlider("getValue");
    let v2 = $("#slider2").roundSlider("getValue");
    let v3 = $("#slider3").roundSlider("getValue");
    let v4 = $("#slider4").roundSlider("getValue");
    if (v4 > 50) {v4 = 100 - v4;}
    v4 = v4*2;
    console.log("v1:"+ v1);
    console.log("v2:"+ v2);
    console.log("v3:"+ v3);
    console.log("v4:"+ v4);
    let totalScore = v1+v2+v3+v4;
    console.log("total score:"+ totalScore);
    let scoreNormalized = Math.floor(totalScore*.91);
    console.log("norm:"+ scoreNormalized);
    let result = allResults[scoreNormalized];
    console.log("result:"+ result);
    $('#results-text').text(result);
    $("#results-container").show();
});

$(".rs-handle" ).on("click", function( event, ui ) {
    console.log('drag click');
    console.log(' ');
});
$(".slider-indiv-container" ).on("click", function( event, ui ) {
    console.log('clickk slider button');
    let id = this.id;
    // console.log("id is "+id);
    let idNum  = id.substr(id.length - 1);
    let btnVar = "btn"+(idNum).toString();
    // console.log(allBtnVars[btnVar]);
    if (allBtnVars[btnVar]) {
        $( "#slider"+(idNum).toString() ).removeClass( "activeBtn" );
        allBtnVars[btnVar] = false;
    } else {
        allBtnVars[btnVar] = true;
        $( "#slider"+(idNum).toString() ).addClass( "activeBtn" );
    }
    // console.log(allBtnVars);
});
init();



// $("#tooltip2").roundSlider();

const sliderColor = 'black';
$(".circle-slider").roundSlider({
    showTooltip: false,    
    // editableTooltip: false,
    // tooltipFormat: "tooltipVal1",

    mouseScrollAction: true,
    svgMode: true,
    borderWidth: 0, // ^ dont change

    borderColor: sliderColor,
    pathColor: sliderColor,
    radius: 45,
    width: 2, // path width
    handleSize: 22,

    startAngle: 90,
    min: 0,
    max: 100,
    step: 1,
    value: 0
});

