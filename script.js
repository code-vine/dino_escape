
{
const origResolution = {width:384,height:216};
const Application = PIXI.Application;
const app = new Application({
    width:800,
    height:500,
    transparent:false,
    antialias:true
});

app.renderer.backgroundColor = 0xaedecb;

document.body.appendChild(app.view);
const sprites = {};
const jsonData = {};


let level;
const MAXGROUNDSPEED = -333;
let groundMoveIncrease = 0.002;
let groundMoveSpeed = -1;
let gravity = 0.085;
let friction = 0.03;
let jumpValue = -3;
let playerSpeed = 0.1;
const MAXPLAERSPEED = 3;
let player;
let guy;
let gameOver = false;
let distance = 0;
let distanceText;

let foodContainer;
let obstacleContainer;

let obsCount = {current:0 , next:4000};
let foodTime = {current:0 , next:3000};

const GameState = {
    Title:'Title',
    CharacterSelect:'CharacterSelect',
    Running:'Running',
    GameOver:'GameOver',
    Credits:'Credits'
}
 
loader = new PIXI.Loader();
loader.add('ground', 'imgs/ground.png')
.add('titleBG', 'imgs/titleBg.png')
.add('food', 'imgs/food.png')
.add('props', 'imgs/props.png')
.add('bg1', 'imgs/bg1.png')
.add('bg2', 'imgs/bg2.png')
.add('bg3', 'imgs/bg3.png')
.add('bg4', 'imgs/bg4.png')
.add('dino1Run', 'json/dino1Run.json')
.add('dino2Run', 'json/dino2Run.json')
.add('dino3Run', 'json/dino3Run.json')
.add('dino4Run', 'json/dino4Run.json')
.add('guyRun', 'json/guyRun.json');

loader.load((loader,resources)=>{

    sprites.titleBG = new PIXI.Sprite(resources.titleBG.texture);
    sprites.ground = new PIXI.Sprite(resources.ground.texture);

    sprites.chicken = new PIXI.Sprite(new PIXI.Texture(resources.food.texture, {x:0,y:0,width:15,height:16}));
    sprites.pork = new PIXI.Sprite(new PIXI.Texture(resources.food.texture, {x:16,y:0,width:16,height:16}));
    sprites.crate = new PIXI.Sprite(new PIXI.Texture(resources.props.texture, {x:0,y:0,width:35,height:35}));


    for(let i=1;i<5;i++){
        sprites[`bg${i}`] = new PIXI.Sprite(resources[`bg${i}`]['texture']);
    }
    jsonData.dino1Run = resources.dino1Run;
    jsonData.dino2Run = resources.dino2Run;
    jsonData.dino3Run = resources.dino3Run;
    jsonData.dino4Run = resources.dino4Run;
    jsonData.guyRun = resources.guyRun;

    document.body.addEventListener("keydown", keyDown);
    document.body.addEventListener("keyup", keyUp);

    goToTitle();
});

function goToTitle(){
    clearAppStage();    
    level = new PIXI.Container();

    level.addChild(sprites.titleBG);

    let text = new PIXI.Text('Choose a Dino',{fontFamily : 'sans-seriff', fontSize: 28, fill : 0xffffff, dropShadow:true, strokeThickness:3});
    text.anchor.set(0.5,0.5);
    text.position.set(app.renderer.width * 0.5, text.height );
    level.addChild(text);


    for(let i=1; i<5; i++){
        let dino = createDino(i);
        dino.x = (i * 200) - 100 - dino.width * 0.5;
        dino.name = `${i}`;
        dino.y = app.renderer.height* 0.5 - dino.height * 0.5;
        dino.interactive  = true;
        dino.on('click', (event) => {
            //handle event
            startGame(parseInt(dino.name));
        });
        level.addChild(dino);

    }

    app.stage.addChild(level);

}

function startGame(dinoNumber){
    clearAppStage();
    distance = 0;
    gameOver = false;
    groundMoveSpeed = -1;
    //create level container
    obstacleContainer= new PIXI.Container();
    foodContainer= new PIXI.Container();
    level = new PIXI.Container();
    level.name = 'level';
    let bg = createBG(level);
    let ground = createGround(level);
    let player = createDino(dinoNumber);
    player.x = app.renderer.width * 0.5;
    level.addChild(player);

    createGuy(level);
    app.stage.addChild(level);
    //console.log(level)
    level.addChild(obstacleContainer);
    level.addChild(foodContainer);
    
    distanceText = new PIXI.Text('Distance: 0',
    {
        fontFamily : 'sans-seriff', 
        fontSize: 18, fill : 0xffffff,
         strokeThickness:2
    });

    level.addChild(distanceText);

    app.ticker.add(tickerFunc);

}

function tickerFunc(){
    if(! gameOver){
        processPhysics(level.getChildByName('ground'));
        handleParralax(level.getChildByName('bg'));
        groundMoveSpeed -= 0.002;

        groundMoveSpeed = groundMoveSpeed < MAXGROUNDSPEED ?
         MAXGROUNDSPEED : groundMoveSpeed;

        distance += (-groundMoveSpeed - 1) / 5000;
        distanceText.text = `Distance: ${distance.toFixed(2)}`;

        foodTime.current += app.ticker.elapsedMS;
        obsCount.current += app.ticker.elapsedMS;
        if(obsCount.current >= obsCount.next){
            createObstacle(sprites.crate, level.getChildByName('ground'));
            obsCount.current =0;
            let rand = Math.random() * 10000;
            obsCount.next = rand > 4000 ? rand : 4000;
        }

        if(foodTime.current >= foodTime.next){
            spawnFood(level.getChildByName('ground'));
            foodTime.current =0;
            let rand = Math.random() * 7000;
            foodTime.next = rand > 3000 ? rand : 3000;
        }

    }
}

let keys = {}

function keyDown(e){
    e.preventDefault();
    keys[`${e.key}`] = true;
}

function keyUp(e){
    keys[`${e.key}`] = false;
}

function clearAppStage(){
    while(app.stage.children[0]) { app.stage.removeChild(app.stage.children[0]).destroy(); }
}

//dinonumber is 1 to 4  dinoState is Idle or Run
function createDino(dinoNumber){
    let ss = jsonData[`dino${dinoNumber}Run`].spritesheet;
    player = new PIXI.AnimatedSprite(Object.values(ss.textures));
    player.scale.set(2,2);
    player.animationSpeed = 0.2;
    player.play();
    player.x = app.renderer.width * 0.5 - player.width;
    player.isOnGround = false;
    player.velocity = {x:0, y:0}
    //level.addChild(player); 
    return player;
}

function createGuy(level){
    let ss = jsonData.guyRun.spritesheet;
    guy = new PIXI.AnimatedSprite(Object.values(ss.textures));
    guy.scale.set(2);
    guy.animationSpeed = 0.2;
    guy.x = guy.width;
    guy.play();
    guy.name='guy';
    guy.isOnGround = false;
    guy.velocity = {x:0, y:0}
    level.addChild(guy); 
}

function createGround(level){
    let ground = new PIXI.Sprite(sprites.ground.texture);
    ground.name='ground';
    level.addChild(ground); 
    ground.y = app.renderer.height - ground.height;
    return ground;
}

function createFood(foodsprite, pos, ground){
    let chicken = new PIXI.Sprite(foodsprite.texture);
    chicken.scale.set(1.5);
    chicken.x = pos.x;
    chicken.y = ground.y - chicken.height - pos.y;
    foodContainer.addChild(chicken); 
}

function createObstacle(obssprite, ground){
    if(gameOver)return;
    let obs = new PIXI.Sprite(obssprite.texture);
    obs.x = app.renderer.width + obs.width * 2;
    obs.y = ground.y - obs.height + 10;
    obstacleContainer.addChild(obs); 
}

function createBG(level){
     //create bg container
     let bg = new PIXI.Container();
     for(let i=4;i>0;i--){
         bg.addChild(new PIXI.Sprite(sprites[`bg${i}`].texture));
     }
     level.addChild(bg);
     bg.name = 'bg';
     return bg;
}

function handleParralax(bgContainter){
    if( ! bgContainter)return;
    let moveVals = [0.3, 0.4, 0.6, 0.7];
    for(let i=0; i< moveVals.length; i++)
    {
        let bg = bgContainter.getChildAt(i);
        bg.x += moveVals[i] * groundMoveSpeed;
        if(bg.x < -bg.width /2)bg.x = 0;
    }
}

function processPhysics(ground){
    playerMovement(ground);
    physics(guy, ground);

    ground.x += groundMoveSpeed;
    if(ground.x <= -ground.width /2 )ground.x =0;

    processContainer(foodContainer);
    processContainer(obstacleContainer);

    checkCollision(foodContainer,(collisionData) =>{
        collisionData.container.removeChildAt(collisionData.index);
        player.x += 5;
        let maxX = app.renderer.width * 0.5;
        if(player.x > maxX) player.x = maxX;
    } )

    checkCollision(obstacleContainer,(collisionData) =>{
        let xDepth = player.x + player.width - collisionData.collider.x;
        let yDepth = player.y+ player.height * 0.9 - collisionData.collider.y;

        if(xDepth < yDepth){
            if(isColliding(player , collisionData.collider))
            player.x -= xDepth;
        }
        else{
            if(isColliding(player , collisionData.collider))
            {
                isOnGround =true;
                player.y -= yDepth;
            }
        }

    } )
}

function playerMovement(ground){
    if(! player)return;

    if(keys['ArrowUp'] && player.isOnGround){
        player.velocity.y = jumpValue;
        player.isOnGround = false;
    }

    physics(player , ground, 15);

    //// GAME OVER ////
    if(player.x < guy.x + guy.width ){ player.x = guy.x + guy.width;
        gameOver =true;
        let text = new PIXI.Text('GAME OVER\n   click here',{fontFamily : 'sans-seriff', fontSize: 40, fill : 0xff1010, dropShadow:true, strokeThickness:3});
        text.anchor.set(0.5,0.5);
        text.position.set(app.renderer.width * 0.5, app.renderer.height * 0.5);

        text.interactive  = true;
        text.on('click', (event) => {
            app.ticker.remove(tickerFunc, level.getChildByName('ground'), level.getChildByName('bg'));
            while(level.children[0]) { level.removeChild(level.children[0]).destroy(); }
            goToTitle();
        });

        app.stage.addChild(text);
        app.ticker.remove(tickerFunc);
        player.stop();
        guy.stop();
    }
    else if(player.x + player.width > app.renderer.width)
    player.x = app.renderer.width - player.width;

    
}


function physics(character , ground , overlap =10){
    if(character.velocity.x < 0) character.velocity.x += friction;
    else if(character.velocity.x > 0) character.velocity.x -= friction;
    character.x += character.velocity.x;
    character.y += character.velocity.y;
    
    let offset = (character.y + character.height) -  overlap;
    if(offset > ground.y){
        character.velocity.y = 0;
        character.y -=  offset - ground.y;
        character.isOnGround = true;  
    }
    else{
        character.velocity.y += gravity;
    }
}

function processContainer(container){
    if(container)
    {
        for(let i =0; i< container.children.length; i++)
        {
            let obj = container.getChildAt(i);
            obj.x += groundMoveSpeed;
            if(obj.x < -obj.width *2){
                container.removeChildAt(i);
                i--;
            }
        }
    }
}

function checkCollision(container , callback){
    if(container)
    {
        for(let i =0; i< container.children.length; i++)
        {
            let child = container.getChildAt(i);
            if(isColliding(player, child)){
                let collisionData = {
                    container:container,
                     collider:child, 
                     index:i
                    };
                callback(collisionData);
            }else if(isColliding(guy, child)){
                container.removeChildAt(i);
                i--;
            }
        }
    }
}

function isColliding(obj1, obj2){
    if(obj1.x + obj1.width >= obj2.x && 
       obj1.x <= obj2.x + obj2.width &&
        obj1.y + obj1.height >= obj2.y && 
        obj1.y <= obj2.y + obj2.height)return true;

    return false;
}

function spawnFood( ground){
    if(gameOver)return;
    let y = Math.random() > 0.5  ? 0: 48;
    createFood(sprites.chicken,{x:app.renderer.width + 100, y:y},ground);
}

}