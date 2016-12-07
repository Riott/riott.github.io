/**
 *
 * Global Variables
 *
 **/
var width = window.innerWidth;
var height = window.innerHeight;
var controls;
var stool = [];
var snowCloud;
var snowCloud2;
var raycaster;
var mouse;
var ambientMusic;
var piano;
var vinylPlayer;
var musicBox;
var pianoScale;
var musicBoxMusic;
var ambientMusicPlaying = false;
var vinyl;
var interact;
var lampSpotLight;
//check if the browser supports pointerlockAPI
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var screenBlock = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
//pointer lock code block used from the pointerLock threeJS example
if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controlsEnabled = true;
            controls.enabled = true;
            screenBlock.style.display = 'none';
        } else {
            controls.enabled = false;
            screenBlock.style.display = '-webkit-box';
            screenBlock.style.display = '-moz-box';
            screenBlock.style.display = 'box';
            instructions.style.display = '';
        }
    };
    var pointerlockerror = function (event) {
        instructions.style.display = '';
    };

    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
    instructions.addEventListener('click', function (event) {
        instructions.style.display = 'none';
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function (event) {
                if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);
                    element.requestPointerLock();
                }
            };
            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);
            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    }, false);
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}
var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
//end code block

/**
 *
 * Function Interact, called when the user presses "E", uses a raycaster to determine what object is infront of the user
 * and if the object can be interacted with performs the interaction.
 *
 **/
function interact() {

    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.direction.copy(controls.getObject().rotation)
    raycaster.far = 10;
    raycaster.ray.intersectHidden = true;
    raycaster.setFromCamera(mouse, camera);
    var intersections = raycaster.intersectObjects(scene.children)
    for (var i = 0; i < intersections.length; i++) {
        switch (intersections[i].object.name) {
        case "album":
            if (ambientMusicPlaying) {
                pauseAmbientAudio();
            } else {
                playAmbientAudio();
            }

            break;
        case "musicBoxTrig":
            if (ambientMusicPlaying) {
                pauseAmbientAudio();
                musicBoxMusic.play();
            } else if (musicBoxMusic.isPlaying) {
                musicBoxMusic.stop();

            } else {
                musicBoxMusic.play();
            }
            break;
        case "piano":
            if (ambientMusicPlaying) {
                pauseAmbientAudio();
                pianoScale.play();
            } else if (musicBoxMusic.isPlaying) {
                pianoScale.stop();

            } else {
                pianoScale.play();
            }
            break;
        case "spotLight":
            if (lampSpotLight.intensity == 1) {
                lampSpotLight.intensity = 0;
            } else {
                lampSpotLight.intensity = 1;
            }
            break;
        }
    }
}


/**
 *
 * Initialisation function, loads all meshes, materials, creates particles, fog, lighting and shadows
 *
 **/

function init() {
    //setup the renderer including shadow map
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(width, height);
    //antialiasing on shadows
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    //enable shadows
    renderer.shadowMap.enabled = true;
    //render scene to canvas
    document.getElementById("scene").appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc7d1e0);
    //creates the fog around the scene, keeps it at a distance so it never appears foggy inside the penthouse
    scene.fog = new THREE.Fog(0xc7d1e0, 0.015, 600);
    //camera setup
    //was 60 fov now 45
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    controlsEnabled = false;
    //setup meshes such as ceiling and floor
    var floorplane = new THREE.BoxBufferGeometry(100, 1, 200);
    //calls the createNormalMesh function to return a mesh with normal map attached.
    var floorMesh = createNormalMesh(floorplane, "./textures/finewood1.jpg", "./textures/floor.png", 15, 15, 0.1, true)
    floorMesh.rotation.x = 180 * (Math.PI / 180);
    var ceilingGeo = new THREE.BoxBufferGeometry(100, 1, 200);
    var ceilingMesh = createNormalMesh(ceilingGeo, "./textures/plaster.jpg", "./textures/plaster.png", 5, 5, 1, true)
    ceilingMesh.rotation.x = 180 * (Math.PI / 180);
    ceilingMesh.position.set(0, 20, 0);
    ceilingMesh.castShadow = true;
    /**
     *
     * create the scene's main walls such as the outer walls, partitions and the bar/kitchen areas
     *
     **/
    //array of every wall in the scene
    var walls = []
    var shortWallGeo = new THREE.BoxBufferGeometry(1, 20, 100);
    shortWallGeo.computeBoundingSphere()
    var longWallGeo = new THREE.BoxBufferGeometry(1, 20, 200);
    longWallGeo.computeBoundingSphere()
    longWallGeo.computeFaceNormals();
    var divideWallGeo = new THREE.BoxBufferGeometry(0.5, 20, 40);
    var barWallGeo = new THREE.BoxBufferGeometry(0.5, 8, 40);
    var barGeo = new THREE.BoxBufferGeometry(0.5, 2.5, 40);
    var kitchenCounterGeo = new THREE.BoxBufferGeometry(0.5, 9.98, 28)
    walls[0] = createNormalMesh(longWallGeo, "./textures/window.png", "./textures/windowNormal.png", 4, 1, 10, true);
    walls[0].position.set(-50.5, 10.5, 0);
    walls[1] = createNormalMesh(longWallGeo, "./textures/wall2.jpg", "./textures/wall2.png", 4, 1, 3, true);
    walls[1].position.set(50.5, 10.5, 0);
    walls[2] = createNormalMesh(shortWallGeo, "./textures/window.png", "./textures/windowNormal.png", 2, 1, 10, true);
    walls[2].position.set(0, 10.5, 100.5);
    walls[2].rotation.set(0, 90 * (Math.PI / 180), 0)
    walls[3] = createNormalMesh(shortWallGeo, "./textures/wall2.jpg", "./textures/wall2.png", 4, 1, 3, true);
    walls[3].position.set(0, 10.5, -100.5);
    walls[3].rotation.set(0, 90 * (Math.PI / 180), 0);
    walls[4] = new THREE.Mesh(divideWallGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    walls[4].position.set(30, 10.5, 40);
    walls[4].rotation.set(0, 90 * (Math.PI / 180), 0)
    walls[4].castShadow = true;
    walls[5] = new THREE.Mesh(divideWallGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    walls[5].position.set(30, 10.5, -40);
    walls[5].rotation.set(0, 90 * (Math.PI / 180), 0)
    walls[5].castShadow = true;
    walls[6] = new THREE.Mesh(barWallGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    walls[6].position.set(6, 4.1, 80);
    walls[6].castShadow = true;
    walls[7] = new THREE.Mesh(barWallGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    walls[7].position.set(6, 4.1, 80);
    walls[7].rotation.set(90 * (Math.PI / 180), 0, 0)
    walls[7].castShadow = true;
    walls[8] = new THREE.Mesh(barGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    walls[8].position.set(7.5, 7.5, 80);
    walls[8].rotation.set(0, 0, 90 * (Math.PI / 180))
    walls[8].castShadow = true;
    walls[9] = createNormalMesh(kitchenCounterGeo, "./textures/worktop.jpg", "./textures/worktop.png", 12, 3, 0.4, false);
    walls[9].position.set(47.5, 7.04, 86)
    walls[9].rotation.set(0, 0, 90 * (Math.PI / 180))
    walls[9].castShadow = true;
    walls[10] = createNormalMesh(kitchenCounterGeo, "./textures/worktop.jpg", "./textures/worktop.png", 12, 3, 0.4, false);
    walls[10].position.set(47.5, 7.04, 54)
    walls[10].castShadow = true;
    walls[10].rotation.set(0, 0, 90 * (Math.PI / 180))
    for (var i = 0; i < walls.length; i++) {
        scene.add(walls[i]);
        walls[i].receiveShadow = true;
        walls[i].frustumCulled = false;


    }
    /**
     *
     * create light blockers behind the wooden textures to imitate the effect of light outside hitting the beams
     *
     **/
    var doubleBeamGeo = new THREE.BoxBufferGeometry(0.1, 20, 12.5);
    var singleBeamGeo = new THREE.BoxBufferGeometry(0.1, 20, 6.25);
    var simpleMat = new THREE.MeshLambertMaterial({
        color: 0x000000,
        alpha: 0
    });
    var blockers = [];
    blockers[0] = new THREE.Mesh(doubleBeamGeo, simpleMat);
    blockers[0].position.set(-50.2, 10.5, 0);
    blockers[1] = new THREE.Mesh(doubleBeamGeo, simpleMat);
    blockers[1].position.set(-50.2, 10.5, 50);
    blockers[2] = new THREE.Mesh(doubleBeamGeo, simpleMat);
    blockers[2].position.set(0, 10.5, 100.2);
    blockers[2].rotation.y = 90 * (Math.PI / 180);
    blockers[3] = new THREE.Mesh(singleBeamGeo, simpleMat);
    blockers[3].position.set(-47, 10.5, 100.1);
    blockers[3].rotation.y = 90 * (Math.PI / 180);
    blockers[4] = new THREE.Mesh(singleBeamGeo, simpleMat);
    blockers[4].position.set(-50.2, 10.5, 97);
    blockers[5] = new THREE.Mesh(singleBeamGeo, simpleMat);
    blockers[5].position.set(-50.2, 10.5, -47);
    blockers[6] = new THREE.Mesh(singleBeamGeo, simpleMat);
    blockers[6].position.set(-50.2, 10.5, -53);

    for (var i = 0; i < blockers.length; i++) {
        scene.add(blockers[i]);
        blockers[i].castShadow = true;
        blockers[i].frustumCulled = false;
    }

    //bedroom stands

    var standGeo = new THREE.BoxBufferGeometry(3, 8, 3);
    var stand1 = new THREE.Mesh(standGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    var stand2 = new THREE.Mesh(standGeo, new THREE.MeshPhongMaterial({
        color: 0xafceff
    }));
    stand1.name = "MusicBoxStand";
    stand1.position.set(48, 3.5, -43.5);
    stand1.castShadow = true;
    stand1.receiveShadow = true;
    stand2.name = "SpotlightStand";
    stand2.position.set(48, 3.5, -53.5);
    stand2.castShadow = true;
    stand2.receiveShadow = true;
    //create photo on bookshelf
    var photoGeo = new THREE.BoxBufferGeometry(3, 0.2, 2);
    var photo = createNormalMesh(photoGeo, "./textures/besties.png", "./textures/photoNormal.png", 1, 1, 0.4, false);
    photo.position.set(35, 6, 36);
    photo.rotation.set(-45 * Math.PI / 180, 180 * (Math.PI / 180), 0);





    /**
     *
     * import Obj Models exported from 3ds Max
     * uses the Obj and MTL loader to import model and apply basic materials
     *
     * loops through every object in mesh and calculates shadows and geometry
     *
     **/
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load("./models/desk.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/desk.obj", function (object) {
            object.position.set(-25, 0, 90);
            object.rotation.y += 180 * (Math.PI / 180)
            object.scale.set(0.5, 0.5, 0.5)
            object.castShadow = true;
            object.name = "album";
            object.add(ambientMusic);
            vinylPlayer = object;
            vinylPlayer.userData.name = "album";
            scene.add(vinylPlayer);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load("./models/musicbox.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/musicbox.obj", function (object) {
            object.position.set(48, 7.5, -43.5);
            object.rotation.y += 180 * (Math.PI / 180)
            object.scale.set(0.1, 0.1, 0.1)
            object.castShadow = true;
            object.name = "musicBox";
            musicBox = object;
            object.add(musicBoxMusic);
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });

    mtlLoader.load("./models/fire.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/fire.obj", function (object) {
            object.position.set(50, 0, 0);
            object.rotation.y += -90 * (Math.PI / 180)
            object.scale.set(0.25, 0.25, 0.25)
            object.castShadow = true;
            object.name = "fire";
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });
    mtlLoader.load("./models/sofa.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/sofa.obj", function (object) {
            object.position.set(18, 0, 2.5);
            object.rotation.y += -90 * (Math.PI / 180)
            object.scale.set(0.25, 0.25, 0.25)
            object.castShadow = true;
            object.name = "sofa";
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });

    mtlLoader.load("./models/piano.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/piano.obj", function (object) {
            object.position.set(-35, 0, 2.5);
            object.scale.set(0.25, 0.25, 0.25)
            object.castShadow = true;
            object.name = "piano";

            object.add(pianoScale);
            piano = object;
            piano.name = "piano";
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();
                    object.name = "piano";

                }
            })
        });
    });

    mtlLoader.load("./models/cupboard.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/cupboard.obj", function (object) {
            object.position.set(49.90, 12.5, 65);
            object.rotation.y += 90 * (Math.PI / 180)
            object.scale.set(0.45, 0.45, 0.45)
            object.castShadow = true;
            object.name = "cupboard";
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();
                    object.name = "cupboard";

                }
            })
        });
    });

    mtlLoader.load("./models/stool.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/stool.obj", function (object) {
            object.position.set(11, 0.5, 72);
            object.rotation.y += -90 * (Math.PI / 180)
            object.scale.set(0.25, 0.25, 0.25)
            object.castShadow = true;
            object.name = "stool";
            stool[0] = object.clone();
            stool[1] = object.clone();
            stool[2] = object.clone();
            stool[0].position.set(11, 0.5, 88);
            stool[1].position.set(11, 0.5, 98);
            stool[2].position.set(11, 0.5, 65);
            scene.add(object);
            scene.add(stool[0]);
            scene.add(stool[1]);
            scene.add(stool[2]);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;


                    obj.geometry.computeVertexNormals();



                }
            });
            for (var i = 0; i < stool.length; i++) {
                stool[i].traverse(function (obj) {
                    if (obj instanceof THREE.Mesh) {
                        obj.receiveShadow = true;
                        obj.castShadow = true;


                        obj.geometry.computeVertexNormals();



                    }
                });
            }
        });

    });
    mtlLoader.load("./models/cooker.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/cooker.obj", function (object) {
            object.position.set(46.2, 0, 65);
            object.rotation.y += -90 * (Math.PI / 180)
            object.scale.set(0.18, 0.18, 0.18)
            object.castShadow = true;
            object.name = "cooker";

            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });
    mtlLoader.load("./models/chair.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/chair.obj", function (object) {
            object.position.set(45, 0, -90);
            object.rotation.y += -70 * (Math.PI / 180)
            object.scale.set(0.4, 0.4, 0.4)
            object.castShadow = true;
            object.name = "chair";

            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });




    mtlLoader.load("./models/table.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/table.obj", function (object) {
            object.position.set(30, 0, 0);
            object.rotation.y += -90 * (Math.PI / 180)
            object.scale.set(0.25, 0.25, 0.25)
            object.castShadow = true;
            object.name = "table";
            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });
    mtlLoader.load("./models/bookshelf.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/bookshelf.obj", function (object) {
            object.position.set(35, 1.5, 39);
            object.scale.set(0.5, 0.5, 0.5)
            object.castShadow = true;
            object.name = "bookshelf";

            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });



    mtlLoader.load("./models/lamp.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/lamp.obj", function (object) {
            object.position.set(48, 7.5, -53.5);
            object.rotation.y += 98 * (Math.PI / 180)
            object.scale.set(0.1, 0.1, 0.1)
            object.castShadow = true;
            object.name = "lamp";

            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.geometry.computeVertexNormals();

                }
            })
        });
    });
    mtlLoader.load("./models/bed.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./models/bed.obj", function (object) {
            object.position.set(37.5, 0.5, -70);
            object.rotation.y += 90 * (Math.PI / 180)
            object.scale.set(0.12, 0.12, 0.12)
            object.castShadow = true;
            object.name = "bed";

            scene.add(object);
            object.traverse(function (obj) {
                if (obj instanceof THREE.Mesh) {
                    obj.receiveShadow = true;
                    obj.castShadow = true;
                    obj.name = "bed";
                    obj.geometry.computeVertexNormals();


                }
            })
        });

    });



    //misc Objects on desk
    var desk = scene.getObjectByName("desk")
    console.log("desk:" + desk);
    var vinylGeo = new THREE.CylinderBufferGeometry(1.2, 1.2, 0.05, 32);
    vinyl = createNormalMesh(vinylGeo, "./textures/vinyl.png", "./textures/vinylNormal.png", 1, 1, 0.1, true);
    vinyl.position.set(-21.2, 6.2, 89.93);
    vinyl.name = "album"
    var albumGeo = new THREE.BoxBufferGeometry(5, 0.2, 5);
    var album = createNormalMesh(albumGeo, "./textures/album.png", "./textures/albumNormal.png", 1, 1, 0.1, true);
    album.position.set(-30, 5.8, 90);
    album.rotation.y = 165 * (Math.PI / 180);
    album.name = "album";

    //invisible trigger meshes 
    /**
     *
     * Raycaster has difficulty intersecting objects imported from 3ds Max
     * so I put an invisible trigger mesh around the objects in order to aid interaction
     *
     * 
     *
     **/
    var bigTriggerGeo = new THREE.BoxBufferGeometry(20, 10, 10);
    var smallTriggerGeo = new THREE.BoxBufferGeometry(5, 10, 5);
    var deskTrigger = new THREE.Mesh(bigTriggerGeo, new THREE.MeshLambertMaterial());
    deskTrigger.position.set(-25, 5, 90);
    deskTrigger.name = "album";
    deskTrigger.material.visible = false;
    scene.add(deskTrigger);
    var pianoTrigger = new THREE.Mesh(bigTriggerGeo, new THREE.MeshLambertMaterial());
    pianoTrigger.position.set(-30, 5, 2.5);
    pianoTrigger.rotation.set(0, 90 * (Math.PI / 180), 0);
    pianoTrigger.name = "piano";
    pianoTrigger.material.visible = false;
    scene.add(pianoTrigger);

    var musicBoxTrigger = new THREE.Mesh(smallTriggerGeo, new THREE.MeshLambertMaterial());
    musicBoxTrigger.position.set(48, 5, -42.5);

    musicBoxTrigger.name = "musicBoxTrig";
    musicBoxTrigger.material.visible = false;
    scene.add(musicBoxTrigger);

    var spotLightTrigger = new THREE.Mesh(smallTriggerGeo, new THREE.MeshLambertMaterial());
    spotLightTrigger.position.set(48, 5, -52.5);

    spotLightTrigger.name = "spotLight";
    spotLightTrigger.material.visible = false;
    scene.add(spotLightTrigger);

    /**
     *
     * 
     * Here I create a skyline of basic skyscraper like buildings
     * to aid immersion of being on a high rise
     *
     * 
     *
     **/
    var buildings = [];
    for (var i = 0; i < 10; i++) {

        var r = Math.floor(Math.random() * 90)
        console.log(r);
        var geo = new THREE.BoxBufferGeometry(100, 500 + r, 100);
        var material = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });
        buildings[i] = new THREE.Mesh(geo, material);
        if (i > 0) {
            var j = i - 1;
            console.log(j);
            console.log(buildings[j]);
            console.log(buildings[i]);
            var newR = Math.floor(Math.random() * 120);
            buildings[i].position.set(buildings[j].position.x + 100 + newR, -300, buildings[j].position.z + 100 + newR);
        } else {
            buildings[i].position.set(r - 800, -300, r - 200);
        }
        scene.add(buildings[i]);
    }

    /**
     *
     * 
     * Here i use particles to create two point clouds for the snow outside, in addition to this I also create a pointcloud for the fire in the main living space
     * 
     *
     **/
    var snowTexture = THREE.ImageUtils.loadTexture("./textures/snowdrop.png");
    var snowMat = new THREE.PointCloudMaterial({
        size: 2,
        transparent: true,
        opacity: true,
        map: snowTexture,
        blending: THREE.AdditiveBlending,
        sizeAtennuation: true,
        color: 0xffffff
    })
    var area = 600;
    var snowGeo = new THREE.Geometry
    for (var i = 0; i < 1500; i++) {
        var particle = new THREE.Vector3(Math.random() * area - area / 2, Math.random() * 2000 - 1000 /*Math.random() * area * 1.5*/ , Math.random() * area - area / 2);
        particle.velocityX = (Math.random() - 0.5) / 3;
        particle.velocityY = 0.02 + (Math.random() / 5);
        snowGeo.vertices.push(particle);
    }



    snowGeo.computeBoundingSphere();
    snowCloud = new THREE.Points(snowGeo, snowMat);
    snowCloud.sortParticles = true;

    snowCloud.frustumCulled = false;
    snowCloud.position.set(-400, 0, 0);
    snowCloud2 = new THREE.Points(snowGeo, snowMat);
    snowCloud2.position.set(0, 0, 400);
    snowCloud2.frustumCulled = false;
    //adding to camera in attempt to reduce the effects of frustum culling (disappearing snow, still happens occasionally)
    camera.add(snowCloud);
    camera.add(snowCloud2);
    //fire setup
    var fireArea = 4;
    var fireGeo = new THREE.Geometry;
    var fireTex = THREE.ImageUtils.loadTexture("./textures/fire.png");
    var fireMat = new THREE.PointCloudMaterial({
        size: 1,
        transparent: true,
        opacity: true,
        map: fireTex,
        blending: THREE.AdditiveBlending,
        sizeAtennuation: true,
        color: 0xff7700
    })
    for (var i = 0; i < 1500; i++) {
        var particle = new THREE.Vector3(Math.random() * fireArea - fireArea / 2, Math.random() * 2000 - 1000 /*Math.random() * area * 1.5*/ , Math.random() * fireArea - fireArea / 2);
        particle.velocityX = (Math.random() - 0.5) / 3 * 0.2;
        particle.velocityY = 0.02 + (Math.random() / 5 * 0.2);
        fireGeo.vertices.push(particle);
    }
    fire = new THREE.Points(fireGeo, fireMat);
    fire.position.set(48, 0, 0);
    /**
     *
     * 
     * Music
     * I create positional music pieces, the main piece winterlude is played ambiently at the start and can be toggled from the vinyl player, 
     * the other sound effects such as the Music Box and Major scale are
     * played during user interaction.
     *
     **/
    var listener = new THREE.AudioListener();
    camera.add(listener);
    var audioLoader = new THREE.AudioLoader();
    ambientMusic = new THREE.PositionalAudio(listener);
    audioLoader.load("./sounds/Winterlude.mp3", function (buffer) {
        ambientMusic.setBuffer(buffer);
        ambientMusic.setRefDistance(20);
        ambientMusic.setLoop(true);
        ambientMusic.play();
        ambientMusicPlaying = true;
    });
    musicBoxMusic = new THREE.PositionalAudio(listener);
    audioLoader.load("./sounds/music-box.mp3", function (buffer) {
        musicBoxMusic.setBuffer(buffer);
        musicBoxMusic.setRefDistance(20);
        musicBoxMusic.setLoop(false);
    });
    pianoScale = new THREE.PositionalAudio(listener);
    audioLoader.load("./sounds/majorscale.mp3", function (buffer) {
        pianoScale.setBuffer(buffer);
        pianoScale.setRefDistance(20);
        pianoScale.setLoop(false);
    });
    /**
     *
     * 
     * Lighting
     * I use a grey directional light as the main source of "natural" light in the scene
     *  
     * in addition to this I setup light from the fire to invoke the feeling of warmth, with a bit of white ambient light
     * 
     * There is also a interactable yellow/white spotlight in the bed area
     * and finally white ceiling pointlights as the main source of "artificial" light.
     **/
    var firePointLight = new THREE.PointLight(0xff7700, 1, 50);
    firePointLight.position.set(50, -10, 0);
    firePointLight.castShadow = true;
    var ambient = new THREE.AmbientLight(0xffffff, 0.1);
    var directionalLight = new THREE.DirectionalLight(0xc7d1e0, 0.7);
    lampSpotLight = new THREE.SpotLight(0xffbb73, 1, 14);
    lampSpotLight.castShadow = true;
    lampSpotLight.exponent = 10;
    lampSpotLight.target = stand1;
    lampSpotLight.angle = 60 * (Math.PI / 180);
    lampSpotLight.penumbra = 2;
    lampSpotLight.position.set(48, 9.8, -52.3);
    directionalLight.position.set(0, 2, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = camera.far;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.shadowDarkness = 0.5;
    directionalLight.visible = true;
    directionalLight.position.set(-200, 10, 70);
    floorMesh.receiveShadow = true;
    var ceilingLights = [];
    for (var i = 0; i < 6; i++) {
        var pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        var lightGeo = new THREE.CylinderBufferGeometry(0.4, 0.4, 0.2, 16);
        var lightMat = new THREE.MeshLambertMaterial(0xffffff);
        var lightMesh = new THREE.Mesh(lightGeo, lightMat);
        lightMesh.add(pointLight);

        ceilingLights.push(lightMesh);
        pointLight.position.set(lightMesh.position.x, lightMesh.position.y - 2, lightMesh.position.z)
        pointLight.castShadow = true;
        var j = i - 1;
        console.log(j);
        if (i > 0) {
            console.log(ceilingLights[j]);
            lightMesh.position.set(2, 19.5, ceilingLights[j].position.z + 34);


        } else {
            lightMesh.position.set(2, 19.5, -98);
        }
    }
    for (var i = 0; i < ceilingLights.length; i++) {
        scene.add(ceilingLights[i]);
    }
    var kitchenPointLight = new THREE.PointLight(0xffffff, 0.7, 60);
    kitchenPointLight.castShadow = true;
    var kitchenLightGeo = new THREE.CylinderBufferGeometry(0.4, 0.4, 0.2, 16);
    var kitchenLightMat = new THREE.MeshLambertMaterial(0xffffff);
    var kitchenLightMesh = new THREE.Mesh(kitchenLightGeo, kitchenLightMat);
    kitchenLightMesh.add(kitchenPointLight);
    kitchenLightMesh.position.set(25, 19.5, 68);
    kitchenPointLight.position.set(kitchenLightMesh.position.x, kitchenLightMesh.position.y - 2, kitchenLightMesh.position.z);
    //add majority of items to the scene
    scene.add(directionalLight);
    scene.add(floorMesh);
    scene.add(ceilingMesh);
    scene.add(ambient);
    scene.add(firePointLight);
    scene.add(lampSpotLight);
    scene.add(mesh);
    scene.add(snowCloud);
    scene.add(snowCloud2);
    scene.add(fire);
    scene.add(vinyl);
    scene.add(album);
    scene.add(stand1);
    scene.add(stand2);
    scene.add(photo);
    scene.add(kitchenLightMesh);
    scene.add(kitchenPointLight);

    /*
     *
     *control handling
     */

    controls = new THREE.PointerLockControls(camera);
    var controller = controls.getObject();
    controller.rotation.y = 180 * (Math.PI / 180);
    controller.position.set(0, 10, -80);
    controller.frustumCulled = false;
    scene.add(controls.getObject());
    var onKeyDown = function (event) {
        switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            break;
        case 69: // e interact with objects
            interact();
            break;
        }
    };
    var onKeyUp = function (event) {
        switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;
        case 88:
            //toggle ambient music
            if (ambientMusic.isPlaying) {
                ambientMusic.pause();
            } else {
                ambientMusic.play();
            }
            break;
        }
    };
    //event listeners
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResize, false);
    //define raycaster
    raycaster = new THREE.Raycaster();
}
/*
 *
 * return mouse pos for interaction
 * 
 */

function onMouseMove(event) {
    mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

/*
 *
 * Function createNormalMesh
 * returns a mesh with normal mapping created from from the given geometry, texture and normal path in order to create more realistic looking meshes
 *
 *Params:
 * geom - geometry of object
 * texturePath - path to texture
 * normalPath - path to texture normal map
 * repeatScaleX - how many times the texture is repeated on the X axis
 * repeatScaleY - how many times the texture is repeated on the Y axis
 * NormalScale - intensity scale of normal map
 * transparent - boolean true if texture has transparency
 */

function createNormalMesh(geom, texturePath, normalPath, repeatScaleX, repeatScaleY, NormalScale, transparent) {

    var texture = THREE.ImageUtils.loadTexture(texturePath);
    if (!isNaN(repeatScaleX) & !isNaN(repeatScaleY)) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        texture.repeat.set(repeatScaleX, repeatScaleY);
    } else {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatScaleX);
    }

    var normal = THREE.ImageUtils.loadTexture(normalPath);
    if (!isNaN(repeatScaleX) & !isNaN(repeatScaleY)) {
        normal.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(repeatScaleX, repeatScaleY);
    }
    var material = new THREE.MeshPhongMaterial({
        map: texture,
        normalMap: normal
    });
    if (!isNaN(NormalScale)) {
        material.normalScale.set(NormalScale, 2);
    }

    if (transparent) material.transparent = true;
    material.minFilter = THREE.NearestFilter;
    mesh = new THREE.Mesh(geom, material)
    return mesh;

}



/*
 *
 * resize screen based on window height/width
 * 
 */
function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = (window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
}

/*
 *
 * plays the ambient audio
 * 
 */

function playAmbientAudio() {
    if (!ambientMusicPlaying) {
        ambientMusic.play();
        ambientMusicPlaying = true;
    }

}

/*
 *
 * pauses the ambient audio
 * 
 */
function pauseAmbientAudio() {
    if (ambientMusicPlaying) {
        ambientMusic.pause();
        ambientMusicPlaying = false;
    }

}



/*
 *
 * calls requestAnimationFrame and handles any animation and changes that occur in the scene such as during interaction or when moving the camera.
 * 
 */

function animate() {
    requestAnimationFrame(animate);
    //rotate vinyl while music is playing
    if (ambientMusic.isPlaying) {
        vinyl.rotation.y += Math.sin(2) * (Math.PI / 180) * 0.8;

    }
    //rotate music box if it's playing
    if (musicBoxMusic.isPlaying) {
        scene.getChildByName("musicBox").rotation.y += Math.sin(2) * (Math.PI / 180) * 0.8;

    }
    //another code block from the pointerLock example I have changed the raycaster settings and told it to look at all the children in the scene and removed the ability to jump
    if (controlsEnabled) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.direction.copy(controls.getObject().rotation)
        raycaster.far = 10;
        raycaster.setFromCamera(mouse, camera);
        var intersections = raycaster.intersectObjects(scene.children)
        var time = performance.now();
        var delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 5.0 * delta;
        velocity.z -= velocity.z * 5.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        if (moveForward) velocity.z -= 200.0 * delta;
        if (moveBackward) velocity.z += 200.0 * delta;
        if (moveLeft) velocity.x -= 200.0 * delta;
        if (moveRight) velocity.x += 200.0 * delta;
        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);
        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;

        }
        prevTime = time;



    }
    // apply velocity to each snowflake to create the falling effect
    var snow = snowCloud.geometry.vertices;
    snow.forEach(function (v) {
        v.y = v.y - (v.velocityY);
        v.x = v.x - (v.velocityX);
        if (v.y <= 0) v.y = 60;
        if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
    });
    snowCloud.geometry.verticesNeedUpdate = true;
    var snow2 = snowCloud2.geometry.vertices;
    snow2.forEach(function (v) {
        v.y = v.y - (v.velocityY);
        v.x = v.x - (v.velocityX);
        if (v.y <= 0) v.y = 60;
        if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
    });
    /*
     *
     * pauses the ambient audio
     * 
     */
    snowCloud2.geometry.verticesNeedUpdate = true;

    // create the moving fire effect
    var fireCloud = fire.geometry.vertices;
    fireCloud.forEach(function (v) {

        v.y = v.y + (v.velocityY);
        v.x = v.x + (v.velocityX);
        if (v.y >= 9) v.y = 0;
        if (v.x >= 5 || v.x <= -5) v.velocityX = v.velocityX * -1;
    });
    fire.geometry.verticesNeedUpdate = true;

    //call the render function to render the scene
    render();


}
/*
 *
 * renders the scene
 * 
 */
function render() {
    renderer.render(scene, camera);
}

init();
animate();