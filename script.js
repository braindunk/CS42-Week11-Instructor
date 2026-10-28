//
// Robotron: example of using finite state machine with states for game objects
//

// define scene 1 (attractor/welcome/instructions) configuration in its own variable
let scene1 = {
  key: 'scene1',
  active: true,
  preload: scene1Preload,
  create: scene1Create,
  update: scene1Update
};

// define scene 2 (actual game) configuration in its own variable
let scene2 = {
  key: 'scene2',
  active: false,
  preload: myPreloadCode,
  create: myCreateCode,
  update: myUpdateCode
};

// define scene 3 (game over screen) configuration in its own variable
let scene3 = {
  key: 'scene3',
  active: false,
  preload: scene3Preload,
  create: scene3Create,
  update: scene3Update
};

//
// step 1. define all of the properties for a new phaser game object
//
let config = {
  width: 800,
  height: 600,
  type: Phaser.AUTO,
  physics: {
    default: "arcade",
    arcade: {
      debug: true // change to false to remove debug output
    }
  },
  scene: [scene1, scene2, scene3], // multiple scenes!
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  } // scale manager used to scale game up to fit display dimensions
};

//
// step 2. define some variables that we will use as the game's data model to represent score, or the game objects we control
//
let score; // number - game score
let lives; // number - game lives
let scoreboard; // text sprite object ref
let lifeboard; // text sprite object ref
let player; // sprite object ref
let playeranim; // string
let bullets; // sprite group object ref
let enemies; // sprite group object ref
let family; // sprite group object ref
let arrowkeys; // ref to cursor key object ref 
let spacebar; // ref to spacebar key object ref
let shot_timer; // number - timer for shot
let max_bullets = 10; // number -  # of bullets
let max_family = 20; // number - # of family
let max_enemies = 20; // number - # of enemies
let enemy_speed = 50; // number - velocity of enemy
let player_speed = 160; // number - velocity of player
let bullet_speed = 240; // number - velocity of bullet
let shoot_speed = 15; // number - frames per shot

//
// step 3. define a function for the preload event for our game's scene
//
function myPreloadCode() {
  // load all of the files that contain assets our game needs (bitmap images)
  this.load.spritesheet( 
    "sprites", 
    "robotron-spritesheet.png", 
    {
      frameWidth: 40,
      frameHeight: 40
    }
  );
}

//
// step 4. define a function for the create event 
//
function myCreateCode() {
  // reset score, lives, and shot timer
  score = 0;
  lives = 5;
  shot_timer = 0;
  
  // local vars used in loops to create sprites inside groups (enemies, family)
  let i,x,y,p;

  // set bkgnd color
  this.cameras.main.backgroundColor.setTo(0,0,0);

  // set up heads up display (hud) ui
  scoreboard = this.add.text( 15, 15, '$' + score, 
    { 
      fontFamily: '"Press Start 2P",cursive', 
      fontSize: '30px',
      color: '#fff',
      align: 'left',
      strokeThickness: 0
    } 
  ); 
  lifeboard = this.add.text( 740, 15, '+' + lives, 
    { 
      fontFamily: '"Press Start 2P",cursive', 
      fontSize: '30px',
      color: '#0f0',
      align: 'right',
      strokeThickness: 0
    } 
  );

  // make world bounds collidable
  this.physics.world.setBounds(0, 0, 800, 600);
  // this.physics.world.setBoundsCollision(true, true, true, true);
  this.physics.world.on('worldbounds', onWorldBounds);

  //
  // player setup
  //

  // create player controlled sprite
  player = this.physics.add.sprite( 400, 300, 'sprites', 190 );

  // set hit box for collisions to 20px wide by 25px tall centered
  player.body.setSize(20,25);

  // create a custom property to make it easy to track the identity of this sprite later on
  player.custom_id = 'player';

  // enable collision with edges of world
  player.body.setCollideWorldBounds(true);
  player.body.onWorldBounds = true;

  // define animation sequences for player
  // left
  this.anims.create(
    {
      key: 'player-left', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 170, end: 172, first: 170}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // right
  this.anims.create(
    {
      key: 'player-right', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 180, end: 182, first: 180}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // down
  this.anims.create(
    {
      key: 'player-down', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 190, end: 192, first: 190}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // up
  this.anims.create(
    {
      key: 'player-up', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 200, end: 202, first: 200}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // start initial player animation and immediately pause it
  playeranim = 'player-down';
  player.anims.play(playeranim);
  player.anims.pause(player.anims.currentAnim.frames[0]);

  //
  // bullets setup
  //

  // make group of bullet sprites
  bullets = this.physics.add.group({
    defaultKey: 'sprites',
    defaultFrame: 302,
    maxSize: max_bullets
  });

  //
  // enemy sprites setup
  //

  // make group of enemy sprites
  enemies = this.physics.add.group({
    defaultKey: 'sprites',
    defaultFrame: 40,
    maxSize: max_enemies
  });

  // define animation sequences for enemies
  // move
  this.anims.create(
    {
      key: 'enemy-move', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 40, end: 42, first: 40}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // death
  this.anims.create(
    {
      key: 'enemy-death', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 280, end: 287, first: 280}),
      frameRate: 10, // speed of playback
      repeat: 0, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  
  // detect collisions between player and enemies 
  this.physics.add.collider(player, enemies, playerDies, null, this);

  // create enemies on stage
  let en;
  for (i = 0; i < max_enemies; i++) {
    // constrain the placement of enemy to within 70-120 px of sides (top, bottom, left, right)
    switch ( Phaser.Math.Between(1, 4) ) {
      case 1: // place in top
        x = Phaser.Math.Between(10, 790);
        y = Phaser.Math.Between(70, 120);
        break;
      case 2: // place in bottom
        x = Phaser.Math.Between(10, 790);
        y = Phaser.Math.Between(480, 530);
        break;
      case 3: // place in left
        x = Phaser.Math.Between(70, 120);
        y = Phaser.Math.Between(10, 590);
        break;
      case 4: // place in right
        x = Phaser.Math.Between(680, 730);
        y = Phaser.Math.Between(10, 590);
        break;
    }
    // make a sprite inside group and store in local var to modify
    en = enemies.get(x, y);
    if (en) {
      en.setActive(true);
      en.setVisible(true);
      en.body.setSize(20,25);
      en.body.setCollideWorldBounds(true);
      en.body.onWorldBounds = true;
      en.play('enemy-move');
      en.custom_id = 'enemy';
      // set initial state randomly
      switch ( Phaser.Math.Between(1, 3) ) {
        case 1:
          en.custom_state = 'wander';
          break;
        case 2:
          en.custom_state = 'attack family';
          break;
        case 3:
          en.custom_state = 'attack player';
          break;
      }
      // initialize a timer to use with states
      en.custom_state_timer = 0;
    }
  }

  // make enemies collide with each other
  this.physics.add.collider(enemies, enemies);

  // detect collisions between enemies and bullets 
  this.physics.add.collider(enemies, bullets, enemyShot, null, this);

  //
  // family sprites setup
  //

  // make group of family sprites
  family = this.physics.add.group({
    defaultKey: 'sprites',
    defaultFrame: 0,
    maxSize: max_family
  });

  // define animation sequences for family members
  // dad left
  this.anims.create(
    {
      key: 'dad-left', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 0, end: 2, first: 0}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // dad right
  this.anims.create(
    {
      key: 'dad-right', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 10, end: 12, first: 10}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // dad down
  this.anims.create(
    {
      key: 'dad-down', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 20, end: 22, first: 20}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // dad up
  this.anims.create(
    {
      key: 'dad-up', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 30, end: 32, first: 30}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // kid left
  this.anims.create(
    {
      key: 'kid-left', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 50, end: 52, first: 50}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // kid right
  this.anims.create(
    {
      key: 'kid-right', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 60, end: 62, first: 60}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // kid down
  this.anims.create(
    {
      key: 'kid-down', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 70, end: 72, first: 70}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // kid up
  this.anims.create(
    {
      key: 'kid-up', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 80, end: 82, first: 80}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // mom left
  this.anims.create(
    {
      key: 'mom-left', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 220, end: 222, first: 220}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // mom right
  this.anims.create(
    {
      key: 'mom-right', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 230, end: 232, first: 230}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // mom down
  this.anims.create(
    {
      key: 'mom-down', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 240, end: 242, first: 240}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // mom up
  this.anims.create(
    {
      key: 'mom-up', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 250, end: 252, first: 250}),
      frameRate: 5, // speed of playback
      repeat: -1, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );
  // family death
  this.anims.create(
    {
      key: 'fam-death', // name for this animation sequence (use this to play it later on)
      frames: this.anims.generateFrameNumbers('sprites', {start: 290, end: 298, first: 290}),
      frameRate: 10, // speed of playback
      repeat: 0, // repeat set to -1 means repeat forever
      yoyo: false
    }
  );

  // create family members on stage
  let fam;
  for (i = 0; i < max_family; i++) {
    // constrain the placement of family to within 60 px of sides (top, bottom, left, right)
    switch (Phaser.Math.Between(1, 4)) {
      case 1: // place in top
        x = Phaser.Math.Between(10, 790);
        y = Phaser.Math.Between(10, 60);
        p = 'top';
        break;
      case 2: // place in bottom
        x = Phaser.Math.Between(10, 790);
        y = Phaser.Math.Between(540, 590);
        p = 'bottom';
        break;
      case 3: // place in left
        x = Phaser.Math.Between(10, 60);
        y = Phaser.Math.Between(10, 590);
        p = 'left';
        break;
      case 4: // place in right
        x = Phaser.Math.Between(740, 790);
        y = Phaser.Math.Between(10, 590);
        p = 'right';
        break;
    }
    // make a sprite inside group and store in local var to modify
    fam = family.get(x, y);
    if (fam) {
      fam.setActive(true);
      fam.setVisible(true);
      fam.body.setSize(20,25);
      fam.body.setCollideWorldBounds(true);
      fam.body.onWorldBounds = true;
      // choose which family member to be
      switch ( Phaser.Math.Between(1, 3) ) {
        case 1:
          fam.custom_id = 'dad';
          break;
        case 2:
          fam.custom_id = 'mom';
          break;
        case 3:
          fam.custom_id = 'kid';
          break;
      }
      // set initial state based on placement position
      switch (p) {
        case 'top':
          fam.custom_state = 'move down';
          fam.play(fam.custom_id + '-down');
          fam.setVelocityY(-Phaser.Math.Between(50, 100));
          break;
        case 'bottom':
          fam.custom_state = 'move up';
          fam.play(fam.custom_id + '-up');
          fam.setVelocityY(Phaser.Math.Between(50, 100));
          break;
        case 'left':
          fam.custom_state = 'move right';
          fam.play(fam.custom_id + '-right');
          fam.setVelocityX(Phaser.Math.Between(50, 100));
          break;
        case 'right':
          fam.custom_state = 'move left';
          fam.play(fam.custom_id + '-left');
          fam.setVelocityX(-Phaser.Math.Between(50, 100));
          break;
      }
    }
  }

  // detect collisions between family members
  this.physics.add.collider(family, family, familyCollide, null, this);
  
  // detect collisions between family members and player 
  this.physics.add.collider(family, player, familyRescue, null, this);
  
  // detect collisions between family members and bullets 
  this.physics.add.collider(family, bullets, familyShot, null, this);
  
  // detect collisions between family members and enemies 
  this.physics.add.collider(family, enemies, familyKilled, null, this);

  // now lets enable keyboard controls using the inputmanager for our scene
  arrowkeys = this.input.keyboard.createCursorKeys();

  // now get mouse click to shoot
  // this.input.on('pointerdown', shoot, this);

  // or use the spacebar to shoot
  spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

//
// step 5. define a function for the update event 
//
function myUpdateCode() {
  // ask about the state of left/right arrowkeys
  if ( arrowkeys.left.isDown ) {
    player.setVelocityX(-player_speed);
    if (playeranim != 'player-left') {
      playeranim = 'player-left';
      player.anims.play(playeranim);
    }
  } else if ( arrowkeys.right.isDown ) {
    player.setVelocityX(player_speed);
    if (playeranim != 'player-right') {
      playeranim = 'player-right';
      player.anims.play(playeranim);
    }
  } else {
    if (!arrowkeys.up.isDown && !arrowkeys.down.isDown) {
      player.setVelocityX(0);
      player.anims.pause(player.anims.currentAnim.frames[0]);
    }
  }

  // ask about the state of up/down arrowkeys
  if ( arrowkeys.up.isDown ) {
    player.setVelocityY(-player_speed);
    if (playeranim != 'player-up') {
      playeranim = 'player-up';
      player.anims.play(playeranim);
    }
  } else if ( arrowkeys.down.isDown ) {
    player.setVelocityY(player_speed)
    if (playeranim != 'player-down') {
      playeranim = 'player-down';
      player.anims.play(playeranim);
    }
  } else {
    if (!arrowkeys.left.isDown && !arrowkeys.right.isDown) {
      player.setVelocityY(0);
      player.anims.pause(player.anims.currentAnim.frames[0]);
    }
  }

  // ask about the state of the spacebar
  if ( spacebar.isDown ) {
    shot_timer++;
    if (shot_timer > shoot_speed) {
      shot_timer = 0;
      shoot();
    }
  }

  // preserve this reference to current game scene, as context change inside forEach() will change this
  let that = this;
  // manage enemy states for each enemy
  // Phaser 4: Group.children is a native Set, so use forEach instead of iterate
  enemies.children.forEach(function (en) {
    // use switch for each different state's code block
    switch ( en.custom_state ) {
      case 'wander':
        // already wandering?
        if (en.custom_state_timer > 0) {
          en.custom_state_timer--;
        } else {
          // we could add another random conditional to decide to switch to attack player or family here
          // initial wandering state, where we pick a direction to go for awhile
          en.custom_state_timer = 30 * 10; // 30fps * 10 sec = 300 frames
          if (Phaser.Math.Between(1, 2) == 1) {
            en.setVelocityX(-enemy_speed);
          } else {
            en.setVelocityX(enemy_speed);
          }
          if (Phaser.Math.Between(1, 2) == 1) {
            en.setVelocityY(-enemy_speed);
          } else {
            en.setVelocityY(enemy_speed);
          }
        }
        break;
      case 'attack family':
        // initial attack, where we pick a family member to chase down
        // note use of local variable that which points to current game scene from let that = this; above
        en.custom_state_target = that.physics.closest(en, family.getChildren());
        if (en.custom_state_target == null) {
          // no family to chase, so change state
          en.custom_state = 'wander';
        } else {
          en.custom_state = 'pursuit';
        }
        break;
      case 'pursuit':
        // set by attack family, we are chasing a specific family member saved in en.custom_state_target
        if ( en.custom_state_target.active ) {
          // move toward target
          if (en.custom_state_target.x < en.x) {
            en.setVelocityX(-enemy_speed);
          } else {
            en.setVelocityX(enemy_speed);
          }
          if (en.custom_state_target.y < en.y) {
            en.setVelocityY(-enemy_speed);
          } else {
            en.setVelocityY(enemy_speed);
          }
        } else {
          // target died, so start another attack
          en.custom_state = 'attack family';
        }
      case 'attack player':
        // this state doesn't need an initial state, we can just go for it
        /*
        if (player.x < en.x) {
          en.setVelocityX(-enemy_speed);
        } else {
          en.setVelocityX(enemy_speed);
        }
        if (player.y < en.y) {
          en.setVelocityY(-enemy_speed);
        } else {
          en.setVelocityY(enemy_speed);
        }
        */
        break;
    }
  });

}

//
// step 6. create a new phaser game object to start the game
//
let mygame = new Phaser.Game( config );

//
// steps 7 and beyond. create a named function for each special phaser event you want to handle
//

// shoot a bullet
function shoot() {  
  let bullet = bullets.get(player.x, player.y);
  if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.setSize(8,8);
      bullet.body.setCollideWorldBounds(true);
      bullet.body.onWorldBounds = true;
      bullet.custom_id = 'bullet';

      switch (playeranim) {
        case 'player-left':
          bullet.setVelocityX(-bullet_speed);
          // deal with player moving diagonally
          bullet.setVelocityY(player.body.velocity.y * (bullet_speed / player_speed));
          break;
        case 'player-right':
          bullet.setVelocityX(bullet_speed);
          // deal with player moving diagonally
          bullet.setVelocityY(player.body.velocity.y * (bullet_speed / player_speed));
          break;
        case 'player-up':
          bullet.setVelocityY(-bullet_speed);
          // deal with player moving diagonally
          bullet.setVelocityX(player.body.velocity.x * (bullet_speed / player_speed));
          break;
        default: // down
          bullet.setVelocityY(bullet_speed);
          // deal with player moving diagonally
          bullet.setVelocityX(player.body.velocity.x * (bullet_speed / player_speed));
          break;
      }
  }
}

// any object going out of bounds calls this, so check what its custom_id property is 
// note: phaser returns a game object's BODY to this function when object exits world bounds
//       (we can use body.gameObject to retrieve the complete game object reference)
function onWorldBounds(body) {
  switch(body.gameObject.custom_id) { 
    case 'bullet':
      // remove bullet to reuse later
      body.setCollideWorldBounds(false);
      body.onWorldBounds = false;
      body.gameObject.setVelocity(0,0);
      body.gameObject.setPosition(1000,1000);
      body.gameObject.setActive(false);
      body.gameObject.setVisible(false);
      break;
    case 'enemy':
      body.setVelocityY(-body.velocity.y);
      body.setVelocityX(-body.velocity.x);
      break;
    case 'dad':
    case 'mom':
    case 'kid':
      // change state of family member
      familySwitchState(body.gameObject);
      break;
  }
}

// manage family collisions with other family members
function familyCollide(fam1, fam2) {
  familySwitchState(fam1);
  familySwitchState(fam2);
}

// change state of family member (manage switching directions)
function familySwitchState(fam) {
  switch(fam.custom_state) {
    case 'move up':
      fam.setVelocityY(Phaser.Math.Between(50, 100));
      fam.custom_state = 'move down';
      fam.play(fam.custom_id + '-down');
      break;
    case 'move down':
      fam.setVelocityY(-Phaser.Math.Between(50, 100));
      fam.custom_state = 'move up';
      fam.play(fam.custom_id + '-up');
      break;
    case 'move left':
      fam.setVelocityX(Phaser.Math.Between(50, 100));
      fam.custom_state = 'move right';
      fam.play(fam.custom_id + '-right');
      break;
    case 'move right':
      fam.setVelocityX(-Phaser.Math.Between(50, 100));
      fam.custom_state = 'move left';
      fam.play(fam.custom_id + '-left');
      break;
    case 'dying':
      console.log('dying and collided');
      break;
    default:
      console.log(fam);
  }
}

// manage family caught by enemy
function familyKilled(fam, en) {
  // show death anim and prepare to remove family members
  fam.custom_state = 'dying';
  fam.setVelocity(0,0);
  fam.disableBody(false,false);
  fam.play('fam-death');
  fam.on(
    'animationcomplete', 
    function(animation, frame) {
      fam.destroy();
    }, 
    this
  );
}

// manage bullet hit a family member
function familyShot(fam, bullet) {
  // remove bullet to reuse later
  bullet.body.setCollideWorldBounds(false);
  bullet.body.onWorldBounds = false;
  bullet.setVelocity(0,0);
  bullet.setPosition(1000,1000);
  bullet.setActive(false);
  bullet.setVisible(false);
  // show death anim and prepare to remove family members
  fam.custom_state = 'dying';
  fam.setVelocity(0,0);
  fam.disableBody(false,false);
  fam.play('fam-death');
  fam.on(
    'animationcomplete', 
    function(animation, frame) {
      fam.destroy();
    }, 
    this
  );
}

// manage bullet hit an enemy
function enemyShot(en, bullet) {
  // remove bullet to reuse later
  bullet.body.setCollideWorldBounds(false);
  bullet.body.onWorldBounds = false;
  bullet.setVelocity(0,0);
  bullet.setPosition(1000,1000);
  bullet.setActive(false);
  bullet.setVisible(false);
  // show death anim and prepare to remove enemy
  en.custom_state = 'dying';
  en.setVelocity(0,0);
  en.disableBody(false,false);
  en.play('enemy-death');
  en.on(
    'animationcomplete', 
    function(animation, frame) {
      en.destroy();
    }, 
    this
  );

  // increase score
  score = score + 10;

  // update hud
  scoreboard.setText('$' + score); 
}

// manage player dies
function playerDies(pl, enemy) {
  // decrease lives
  lives--;

  // move player to middle again (and give immunity for a little while?)
  player.setVelocity(0,0);
  player.setPosition(400,300);

  // update hud
  lifeboard.setText('+' + lives); 

  // is game over?
  if (lives < 1) {
    console.log('game over');
    this.scene.start('scene3');
  }
}

// manage player save family member
function familyRescue(obj1, obj2) {
  // console.log(obj1.custom_id + ' / ' + obj2.custom_id);
  // remove fam game object
  if (obj1.custom_id != 'player') {
    obj1.destroy();
  } else {
    obj2.destroy();
  }

  // increase score
  score = score + 100;

  // update hud
  scoreboard.setText('$' + score); 
}

//
// scene 1 (attractor loop)
//

function scene1Preload() {}
function scene1Create() {
  // set up title screen
  let titletext = this.add.text( 400, 300, ['TroboRon', ''], 
    { 
      fontFamily: '"Press Start 2P",cursive', 
      fontSize: '48px',
      color: '#f00',
      align: 'center',
      strokeThickness: 0
    } 
  ); 
  titletext.setOrigin(0.5,0.5);
  // set up title screen
  let helptext = this.add.text( 400, 400, ['Press spacebar to start.', ''], 
    { 
      fontFamily: '"Press Start 2P",cursive', 
      fontSize: '24px',
      color: '#fff',
      align: 'center',
      strokeThickness: 0
    } 
  ); 
  helptext.setOrigin(0.5,0.5);
  // add detection for user-generated space bar
  spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}
function scene1Update() {
  if (spacebar.isDown) {
    scene1Transition(this);
  }
}
function scene1Transition(that) {
  that.scene.start('scene2');
}

//
// scenes 3 (game over)
//

function scene3Preload() {}
function scene3Create() {
  // set up over screen
  let titletext = this.add.text( 400, 300, ['Game Over', ''], 
    { 
      fontFamily: '"Press Start 2P",cursive', 
      fontSize: '48px',
      color: '#f00',
      align: 'center',
      strokeThickness: 0
    } 
  ); 
  titletext.setOrigin(0.5,0.5);
  // add detection for user-generated space bar
  spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}
function scene3Update() {
  if (spacebar.isDown) {
    scene3Transition(this);
  }
}
function scene3Transition(that) {
  that.scene.start('scene1');
}