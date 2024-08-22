var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var cursors;
var level = 1;
var consoleScore = 0;
var challengerScore = 0;
var consoleScoreText;
var challengerScoreText;
var projectiles;
var mushrooms;
var spinners;
var bouncers;
var monsterTimer;
var pore;
var boomFrames = [];
var spinshroomFrames = [];
var vlr;
var bgVideo;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('maxine_neutral', 'assets/maxine_neutral.png');
    this.load.image('maxine_left', 'assets/maxine_left.png');
    this.load.image('maxine_right', 'assets/maxine_right.png');
    this.load.image('maxine_up', 'assets/maxine_up.png');
    this.load.image('maxine_down', 'assets/maxine_down.png');

    // Preload spore sprites
    this.load.image('spore1', 'assets/spore1.png');
    this.load.image('spore2', 'assets/spore2.png');
    this.load.image('spore3', 'assets/spore3.png');

    // Preload mushroom sprites
    this.load.image('pink_oyster1', 'assets/pink_oyster1.png');
    this.load.image('pink_oyster2', 'assets/pink_oyster2.png');

    // Preload pore sprite
    this.load.image('pore', 'assets/pore.png');

    // Preload sound files
    this.load.audio('eep', 'assets/eep.wav');
    this.load.audio('good', 'assets/good.wav');

    // Preload boom image files
    for (var i = 1; i <= 30; i++) {
        boomFrames.push({ key: 'boom' + i });
        this.load.image('boom' + i, 'assets/boom' + i + '.png');
    }

    // Preload spinshroom image files
    for (var i = 1; i <= 8; i++) {
        spinshroomFrames.push({ key: 'spinshroom' + i });
        this.load.image('spinshroom' + i, 'assets/spinshroom' + i + '.png');
    }

    // Preload bouncer image file
    this.load.image('purple_mushroom', 'assets/purple_mushroom.png');

    this.load.image('torus', 'assets/torus.png');

    // load background video
    this.load.video('mountains', 'mountains.mp4', true);
}

function create() {
    // Set up the background video
    bgVideo = this.add.video(0, 0, 'mountains').setOrigin(0);
    bgVideo.displayHeight = worldHeight;
    bgVideo.displayWidth = worldWidth;
    bgVideo.play(true);

    // Set world bounds
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // The torus
    var left = worldCenter[0];// - torusOuterWidth / 2;
    var top = worldCenter[1];// - torusOuterHeight / 2;
    torus = this.physics.add.sprite(left, top, 'torus');
    torus.setOrigin(0.5);
    // Set the scale between 0 and 1
    torus.scaleX = torusOuterWidth / 1683;
    torus.scaleY = torusOuterHeight / 1267;

    // The player and its settings
    player = this.physics.add.sprite(maxineStart[0], maxineStart[1], 'maxine_neutral');
    player.setOrigin(0.5);
    player.scale = 0.5
    player._MQoldPos = [player.x, player.y]

    //  Player physics properties.
    player.setCollideWorldBounds(true);

    // The pore.
    pore = this.physics.add.sprite(worldCenter[0], worldCenter[1], 'pore');
    pore.setOrigin(0.5);

    // Set camera bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(player);

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The scores
    consoleScoreText = this.add.text(16, 16, 'Zavier: 0', { fontSize: '32px', fill: '#0000ff' });
    consoleScoreText.setScrollFactor(0);

    challengerScoreText = this.add.text(16, 48, 'Kent: 0', { fontSize: '32px', fill: '#0000ff' });
    challengerScoreText.setScrollFactor(0);

    // Add blue rectangle outline representing the world bounds
    var graphics = this.add.graphics();
    graphics.lineStyle(4, 0x0000ff, 1);
    graphics.strokeRect(0, 0, worldWidth, worldHeight);

    // Handle window resizing
    game.events.on('resize', resizeGame);

    // Create spore animation
    this.anims.create({
        key: 'spore_anim',
        frames: [
            { key: 'spore1' },
            { key: 'spore2' },
            { key: 'spore3' }
        ],
        frameRate: 30,
        repeat: -1
    });

    // Create mushroom animation
    this.anims.create({
        key: 'mush_anim',
        frames: [
            { key: 'pink_oyster1' },
            { key: 'pink_oyster2' }
        ],
        frameRate: 2,
        repeat: -1
    });

    // Create the boom animation
    this.anims.create({
        key: 'boom',
        frames: boomFrames, //this.anims.generateFrameNames('boom', { start: 1, end: 30, prefix: 'boom', zeroPad: 0 }),
        frameRate: 30,
        repeat: 0
    });

    // Create the spinshroom animation
    this.anims.create({
        key: 'spinshroom_anim',
        frames: spinshroomFrames,
        frameRate: 10,
        repeat: -1
    });

    projectiles = this.physics.add.group();
    // Create sprite groups for different kinds of mushrooms
    mushrooms = this.physics.add.group();
    spinners = this.physics.add.group();
    bouncers = this.physics.add.group();

    // Start the monster timer
    monsterTimer = this.time.addEvent({
        delay: Phaser.Math.Between(4000, 8000),
        callback: addMonster,
        callbackScope: this,
        loop: true
    });

    // Set up collision detection between mushrooms and the pore
    this.physics.add.overlap(mushrooms, pore, mushroomHitsPore, null, this);

    // Set up collision detection between Maxine and the pore
    this.physics.add.overlap(player, pore, maxineHitsPore, null, this);

    // Set up collision detection between Maxine and the mushrooms
    this.physics.add.overlap(player, mushrooms, maxineHitsMushroom, null, this);

    // Set up collision detection between Maxine and the spinshrooms
    this.physics.add.overlap(player, spinners, maxineHitsSpinshroom, null, this);

    // Set up collision detection between Maxine and the bouncers
    // (using the same function for the same behavior)
    this.physics.add.overlap(player, bouncers, maxineHitsSpinshroom, null, this);

    // Set up collision detection between bouncers and the pore
    this.physics.add.overlap(bouncers, pore, bouncerHitsPore, null, this);

    // Set up collision detection between Maxine and the spores
    this.physics.add.overlap(player, projectiles, maxineHitsProjectile, null, this);

    // Create the vertical line ring
    vlr = new VerticalLineRing();

    this.graphics = this.add.graphics();
}

function update() {
    // Control player movement
    player.setVelocity(0);
    let speed = 360;

    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
        player.setTexture('maxine_left');
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(speed);
        player.setTexture('maxine_right');
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-speed);
        player.setTexture('maxine_up');
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(speed);
        player.setTexture('maxine_down');
    }

    if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
        player.setTexture('maxine_neutral');
    }

    if (pointOutsideSignalRing([player.x, player.y])) {
        [player.x, player.y] = player._MQoldPos;
    }
    player._MQoldPos = [player.x, player.y];

    // Update each mushroom's position and angle based on its spiral state
    mushrooms.children.iterate(function (mush) {
        // Update the mushroom's spiral state
        mush.spiral_state.update();

        // Set the mushroom's position based on the spiral state
        mush.setPosition(mush.spiral_state.pos[0], mush.spiral_state.pos[1]);

        // Set the mushroom's angle based on the spiral state
        mush.setAngle(mush.spiral_state.angle);
    });

    // Delete spinshrooms or projectiles that hit the torus.
    projectiles.children.iterate(function (spore) {
        // The group includes undefined objects that have been destroyed already.
        if (spore === undefined) return;

        if (pointOutsideSignalRing([spore.x, spore.y])) {
            spore.destroy();
        }
    });

    spinners.children.iterate(function (spinner) {
        if (spinner === undefined) return;

        if (pointOutsideSignalRing([spinner.x, spinner.y])) {
            spinner.destroy();
        }
    });

    let physics = this.physics;
    bouncers.children.iterate(function (bouncer) {
        var speed = 300;
        // Set the velocity based on the angle. It uses pixels per second.
        physics.velocityFromAngle(bouncer.angle, speed, bouncer.body.velocity);

        if (pointOutsideSignalRing([bouncer.x, bouncer.y])) {
            // Move back to the previous frame's position, and change angle to bounce.
            [bouncer.x, bouncer.y] = bouncer._MQoldPos;
            bounceOffWall(bouncer);
        }

        bouncer._MQoldPos = [bouncer.x, bouncer.y];
    });

    this.graphics.clear();

    // Add the lines in the signal ring
    vlr.advanceOneFrame()
    vlr.draw(this.graphics)

    var ls = document.getElementById("levelSelect");
    var value = Number(ls.options[ls.selectedIndex].value);
    var text = ls.options[ls.selectedIndex].text;
    level = value;

    updateStatusBar();
}

function updateStatusBar() {
    var levelFinished = false;
    if (consoleScore >= 1000) {
        document.getElementById("statusBar").textContent = "Slightly less successful";
        levelFinished = true;
    } else if (challengerScore >= 1000) {
        document.getElementById("statusBar").textContent = "You win!";
        levelFinished = true;
    }

    if (levelFinished) {
        setTimeout(resetLevel, 5000);
    }
}

function resetLevel() {
    var ls = document.getElementById("levelSelect");
    var text = ls.options[ls.selectedIndex].text;
    document.getElementById("statusBar").textContent = text;

    consoleScore = 0;
    challengerScore = 0;
    scoresChanged();
}

function increaseConsoleScore(points) {
    consoleScore += points;
    if (consoleScore > 1000) consoleScore = 1000;
    scoresChanged();
}

function increaseChallengerScore(points) {
    challengerScore += points;
    if (challengerScore > 1000) challengerScore = 1000;
    scoresChanged();
}

function scoresChanged() {
    consoleScoreText.setText('Kent: ' + consoleScore);
    challengerScoreText.setText('Zavier: ' + challengerScore);
}

// Written by an old version of Claude; doesn't work.
function resizeGame(gameSize, baseSize, displaySize, resolution) {
    var width = gameSize.width;
    var height = gameSize.height;

    game.canvas.style.width = width + "px";
    game.canvas.style.height = height + "px";

    game.canvas.style.marginLeft = (window.innerWidth - width) / 2 + "px";
    game.canvas.style.marginTop = (window.innerHeight - height) / 2 + "px";

    // Update camera viewport
    game.scene.scenes.forEach(function (scene) {
        var camera = scene.cameras.main;
        camera.setViewport(0, 0, width, height);
        camera.startFollow(player);
        camera.setBounds(0, 0, worldWidth, worldHeight);
    });
}

function mushroomHitsPore(pore, mushroom) {
    // Destroy the mushroom when it hits the pore.
    // Used for pink oysters.
    mushroom.destroy();

    // Clean up the spore timer
    if (mushroom.sporeTimer) {
        mushroom.sporeTimer.destroy();
    }
}

function bouncerHitsPore(pore, bouncer) {
    // Destroy the bouncer when it hits the pore.
    // Used for purple mushrooms (bouncers).
    bouncer.destroy();
    this.sound.play('good');

    increaseChallengerScore(100);
}

function maxineHitsPore(maxine, pore) {
    // Play the "eep" sound
    this.sound.play('eep');

    // Disable Maxine's movement
    maxine.setVelocity(0);
    maxine.setImmovable(true);
    maxine.body.enable = false;

    // Hide Maxine's sprite
    maxine.setVisible(false);

    // Create the explosion sprite at Maxine's position
    var explosion = this.add.sprite(maxine.x, maxine.y, 'boom1');
    explosion.setOrigin(0.5)

    // Play the boom animation
    explosion.play('boom');

    // Reset Maxine's position and re-enable movement after the explosion animation completes
    explosion.on('animationcomplete', function () {
        // Reset Maxine's position to the start position
        maxine.setPosition(maxineStart[0], maxineStart[1]);

        // Enable Maxine's movement
        maxine.setImmovable(false);
        maxine.body.enable = true;

        // Show Maxine's sprite
        maxine.setVisible(true);

        // Destroy the explosion sprite
        explosion.destroy();
    }, this);

    increaseConsoleScore(100);
}

function maxineHitsMushroom(maxine, mushroom) {
    // Play the "good" sound
    this.sound.play('good');
    increaseChallengerScore(100);
    mushroom.destroy();
}

function maxineHitsProjectile(maxine, projectile) {
    this.sound.play('eep');
    increaseConsoleScore(100);
    projectile.destroy();
}

function maxineHitsSpinshroom(maxine, spinshroom) {
    this.sound.play('eep');
    increaseConsoleScore(100);
    spinshroom.destroy();
}

function makeSpore(shroom) {
    var spore = this.physics.add.sprite(shroom.x, shroom.y, 'spore1');
    spore.setScale(0.25);
    spore.play('spore_anim');
    spore.setOrigin(0.5);


    // Add the spore to the projectiles group. This must be done before setting its speed
    // because adding it resets the speed to 0(!). See https://phaser.discourse.group/t/confused-about-physics-specifically-velocity/3019/2
    projectiles.add(spore);

    // Calculate the direction towards Maxine
    var direction = Math.atan2(player.y - spore.y, player.x - spore.x);

    // Set the spore's velocity based on the direction and speed. Velocity is in pixels per second!
    var speed = 3 * 60;
    spore.setVelocity(Math.cos(direction) * speed, Math.sin(direction) * speed);
    //console.log("speed", Math.cos(direction) * speed, Math.sin(direction) * speed);
}

function makeMushroom(angle) {
    var mush = this.physics.add.sprite(0, 0, 'pink_oyster1');
    mush.setScale(0.5);
    mush.play('mush_anim');
    mush.setOrigin(0.5);

    // Translate the Python lines to JavaScript
    var rotation = angle - 20;
    mush.spiral_state = new SpiralState(0.5, rotation, torusInnerHeight, 1, worldCenter, torusInnerWidth / torusInnerHeight);

    // Add the mushroom to the mushrooms group
    mushrooms.add(mush);

    // Start the spore timer for the mushroom
    mush.sporeTimer = this.time.addEvent({
        delay: Phaser.Math.Between(2500, 5000),
        callback: mushroomSporeTimer,
        callbackScope: this,
        args: [mush],
        loop: true
    });
}

function makeSpinner() {
    var side = Math.random() > 0.5;

    var r = torusInnerRadius;
    var theta = side ? 0 : 180;
    var x, y;
    [x, y] = pol2cart(r, theta);
    [x, y] = adjustCoords(x, y);

    var spinner = this.physics.add.sprite(x, y, 'spinshroom1');
    spinners.add(spinner);

    spinner.play('spinshroom_anim');
    spinner.setOrigin(0.5);
    spinner.setScale(0.2);

    var speed = 3 * 60;
    if (side)
        spinner.setVelocity(-speed, 0);
    else
        spinner.setVelocity(speed, 0);

}

function makeBouncer(angle) {
    var r = torusInnerRadius;
    var theta = angle;

    var x, y
    [x, y] = pol2cart(r, theta);
    [x, y] = adjustCoords(x, y);

    var bouncer = this.physics.add.sprite(x, y, 'purple_mushroom');
    bouncer.setOrigin(0.5);
    bounceOffWall(bouncer);
    bouncer._MQoldPos = [bouncer.x, bouncer.y];

    // Add the bouncer to the group
    bouncers.add(bouncer);
}

function addMonster() {
    // Generate a random angle between 0 and 360 degrees
    var randomAngle = Phaser.Math.Between(0, 360);
    var randomNumber = Math.random();
    var ratio;

    if (level === 1 || level === 2) {

        // Boolean expressions have Bizarro World behavior in JavaScript
        //    var makeNormalMonster = (Math.random() < 0.67);

        ratio = (level === 1) ? 0.67 : 0.33;

        if (randomNumber > ratio) {
            makeSpinner.call(this);
        } else {
            // Call the makeMushroom function with the random angle
            makeMushroom.call(this, randomAngle);
        }
    } else if (level === 3) {
        ratio = 0.8;

        if (randomNumber > ratio) {
            makeSpinner.call(this);
        } else {
            makeBouncer.call(this, randomAngle);
        }
    }

    // Restart the monster timer with a new random delay
    monsterTimer.reset({
        delay: Phaser.Math.Between(2000, 6000),
        callback: addMonster,
        callbackScope: this,
        loop: true
    });
}


function mushroomSporeTimer(mush) {
    // Check if the mushroom exists and is far enough from the player
    if (mush && mush.active && Phaser.Math.Distance.Between(mush.x, mush.y, player.x, player.y) > 300) {
        // Call the makeSpore function with the mushroom
        makeSpore.call(this, mush);
    }
}

// Called when purple musrhooms start at the wall or hit the wall after moving
function bounceOffWall(monster) {
    var newDirection = Phaser.Math.Between(0, 360);
    monster.angle = newDirection;
}

function pointOutsideSignalRing(point) {
    var rx = torusInnerWidth / 2;
    var ry = torusInnerHeight / 2;
    var scaledCoords = [point[0] - worldCenter[0],
    (point[1] - worldCenter[1]) * rx / ry];

    // Calculate the 2 norm because it's what StackOverflow told me to do. It's just the distance.
    var norm = distance_points(scaledCoords, [0, 0]);
    return norm > rx;
}

