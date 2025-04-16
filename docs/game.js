const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('background', 'GameAssets/background.png');
  this.load.image('hunter', 'GameAssets/hunter.png');
  this.load.image('wolf', 'GameAssets/wolf.png');
  this.load.image('treeTop', 'GameAssets/treeTop.png');
  this.load.image('treeBottom', 'GameAssets/treeBottom.png');
  this.load.image('rock', 'GameAssets/rock.png');
  this.load.image('kunai', 'GameAssets/kunai.png'); 
  this.load.image('eagle', 'GameAssets/eagle.png');
  this.load.image('arrow', 'GameAssets/arrow.png');

  //Load jump animation asset
  for (let i = 1; i <= 10; i++) {
    this.load.image(`hunter_run_${i}`, `GameAssets/Run__${i}.png`);
  }

  // Load idle animation assets
  for (let i = 1; i <= 9; i++) {
    this.load.image(`hunter_idle_${i}`, `GameAssets/Idle__${i}.png`);
  }

  // Load jump animation assets
  for (let i = 1; i <= 10; i++) {
    this.load.image(`hunter_jump_${i}`, `GameAssets/Jump__${i}.png`);
  }


}

function create() {
  // Add a tile sprite for the background that will repeat
  this.background = this.add.tileSprite(400, 200, 800, 400, 'background');
  this.background.setScrollFactor(0);
  // Add the floor
  this.floor = this.physics.add.staticGroup();
  //this.floor.create(400, 390, 'rock').setScale(1).refreshBody();


    // Create hunter animation
    this.anims.create({
      key: 'run',
      frames: [
        { key: 'hunter_run_1' },
        { key: 'hunter_run_2' },
        { key: 'hunter_run_3' },
        { key: 'hunter_run_4' },
        { key: 'hunter_run_5' },
        { key: 'hunter_run_6' },
        { key: 'hunter_run_7' },
        { key: 'hunter_run_8' },
        { key: 'hunter_run_9' },
        { key: 'hunter_run_10' },
      ],
      frameRate: 10,
      repeat: -1
    });
  
    this.anims.create({
      key: 'idle',
      frames: [
        { key: 'hunter_idle_1' },
        { key: 'hunter_idle_2' },
        { key: 'hunter_idle_3' },
        { key: 'hunter_idle_4' },
        { key: 'hunter_idle_5' },
        { key: 'hunter_idle_6' },
        { key: 'hunter_idle_7' },
        { key: 'hunter_idle_8' },
        { key: 'hunter_idle_9' },
      ],
      frameRate: 9,
      repeat: -1
    });
    



    this.hunter = this.physics.add.sprite(100, 350, 'hunter_idle_1');
    this.hunter.setCollideWorldBounds(true);
    this.hunter.play('idle'); // Start with the idle animation
    this.hunter.setDepth(20);
    
    // Set smaller hitbox
    this.hunter.setSize(this.hunter.width * 0.5, this.hunter.height * 0.75); // Adjusting the scale as needed
    this.hunter.setOffset(this.hunter.width * 0.25, this.hunter.height * 0.25); // Center the hitbox within the sprite
    

    //Add arrow for kunai throw direction
    this.arrow = this.add.sprite(this.hunter.x, this.hunter.y, 'arrow');
    this.arrow.setOrigin(0.5); // Set origin to center
    this.arrow.setDepth(25);

  // Add wolves group
  this.wolves = this.physics.add.group({
    maxSize: 10,

  });

  // Add kunai group
  this.kunais = this.physics.add.group({
    defaultKey: 'kunai',
    maxSize: 5,
    allowGravity: true
  });

  // Add environment objects group
  this.trees = this.physics.add.group({
    immovable: true,
    allowGravity: false
    
  });
  this.rocks = this.physics.add.group({
    immovable: true,
    allowGravity: false
  });
  this.eagles = this.physics.add.group({
    defaultKey: 'eagle',
    allowGravity: true,
    maxSize: 10
  });

  this.physics.add.collider(this.hunter, this.floor);
  //this.physics.add.collider(this.hunter, this.trees);
  this.physics.add.collider(this.hunter, this.rocks);

  this.physics.add.collider(this.wolves, this.floor);
  //this.physics.add.collider(this.wolves, this.rocks);
  //this.physics.add.collider(this.wolves, this.trees);
  this.physics.add.collider(this.eagles, this.trees);
  this.physics.add.collider(this.kunais, this.eagles, killEagle, null, this);

  this.physics.add.collider(this.kunais, this.floor);

  //Input settings
  this.WASD = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });
  this.input.on('pointerdown', throwKunai, this);

  this.score = 0;
  this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '50px', fill: '#fff' });
  this.scoreText.setScrollFactor(0);

  this.physics.add.overlap(this.hunter, this.wolves, gameOver, null, this);
  this.physics.add.overlap(this.hunter, this.eagles, gameOver, null, this);
  this.physics.add.overlap(this.kunais, this.wolves, killWolf, null, this);

  // Spawn wolves every 2 seconds and eagles every 3 seconds
  this.time.addEvent({
    delay: 2000,
    callback: spawnWolf,
    callbackScope: this,
    loop: true
  });
  this.time.addEvent({
    delay: 3000, // Adjust spawn rate as needed
    callback: spawnEagle,
    callbackScope: this,
    loop: true
  });

  // Create the text object to display kunai count
  kunaiCountText = this.add.text(16, 350, 'Kunai: 0', { fontSize: '24px', fill: '#fff' });
  kunaiCountText.setScrollFactor(0); // Ensure the text stays fixed on the screen
  kunaiCountText.setDepth(10); // Set a higher depth to ensure it's on top

  // Camera follows the hunter
  this.cameras.main.startFollow(this.hunter);
  this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 400);
  this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 400); // Adjust width as needed

  // Spawn initial obstacles
  this.nextTree = 800;  // Position to spawn the next tree
  this.nextRock = 1200; // Position to spawn the next rock

  // Add instructions text
  const instructionText = 
  'A / D : Move Left / Right\n' +
  'W : Jump\n' +
  'Spacebar / Left Mouse Click : Throw Kunai\n' +
  'Mouse Cursor: Throw Direction';


// Adjust text position to top right corner
this.instructions = this.add.text(20, 60, instructionText, {
  font: '12px Arial',
  fill: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3
});
}

function update() {
  
  //Arrow Update
  this.arrow.setPosition(this.hunter.x + 5, this.hunter.y - 15);
  
  let angle = Phaser.Math.Angle.Between(this.hunter.x, this.hunter.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
  this.arrow.setRotation(angle);
  // Update the background position to create an endless scrolling effect
  this.background.tilePositionX += 2; // Adjust speed as necessary
  // Check for horizontal movement (left/right)
  if (this.WASD.left.isDown) {
    this.hunter.setVelocityX(-200);
    this.hunter.scaleX = -1; // Flip hunter image horizontally
    this.hunter.play('run', true); // Play running animation
    this.score -= 1;
  } else if (this.WASD.right.isDown) {
    this.hunter.setVelocityX(200);
    this.hunter.scaleX = 1; // Reset to normal orientation
    this.hunter.play('run', true); // Play running animation
    this.score += 1;
  } else {
    this.hunter.setVelocityX(0);
    if (this.hunter.body.velocity.y === 0) {
      this.hunter.play('idle', true); // Play idle animation when not moving
    }
  }

  // Check for vertical movement (jumping)
  if (this.WASD.up.isDown && (this.hunter.body.onFloor() || this.hunter.body.touching.down)) {
    this.hunter.setVelocityY(-350);
  }



  if (Phaser.Input.Keyboard.JustDown(this.WASD.space) || this.input.activePointer.isPlaying) {
    throwKunai.call(this);
  }

  this.scoreText.setText('Score: ' + this.score);

  // Update the background position to create an endless scrolling effect
  this.background.tilePositionX = this.cameras.main.scrollX;

  // Spawn trees and rocks as the hunter moves right
  if (this.hunter.x < this.nextTree) {
    this.trees.create(this.nextTree, 173, 'treeTop');
    this.trees.create(this.nextTree, 355, 'treeBottom');
    this.nextTree += Phaser.Math.Between(2000, 2500);
 
  }
  if (this.hunter.x < this.nextRock) {
    this.rocks.create(this.nextRock, 370, 'rock');
    this.nextRock += Phaser.Math.Between(200, 900); // Random distance for the next rock
    
  }

   // Destroy trees and rocks that are far behind the hunter
   this.trees.children.each(function(tree) {
    if (tree.active && tree.x < this.hunter.x - 800) {
      tree.destroy();
      tree = null; // Clear the reference
    }
  }, this);

  this.rocks.children.each(function(rock) {
    if (rock.active && rock.x < this.hunter.x - 800) {
      rock.destroy();
      rock = null; // Clear the reference
    }
  }, this);
  
   // Update wolf movement
  this.wolves.children.iterate(wolf => {
    if (wolf.active) {
      const distanceToHunter = Phaser.Math.Distance.Between(wolf.x, wolf.y, this.hunter.x, this.hunter.y);

      if (distanceToHunter < 400) {
        // Wolf detects hunter and starts chasing
        const angle = Phaser.Math.Angle.Between(wolf.x, wolf.y, this.hunter.x, this.hunter.y);
        if (wolf.body.onFloor() || wolf.body.touching.down) {
          // Wolf jumps towards hunter when on the ground
          wolf.setVelocity(Math.cos(angle) * 400, -200);
        }
        
        if (distanceToHunter < 200) {
          // Call nearby wolves for help
          this.wolves.children.iterate(otherWolf => {
            if (otherWolf !== wolf && Phaser.Math.Distance.Between(otherWolf.x, otherWolf.y, wolf.x, wolf.y) < 300) {
              const helpAngle = Phaser.Math.Angle.Between(otherWolf.x, otherWolf.y, this.hunter.x, this.hunter.y);
              if (otherWolf.body.onFloor()) {
                otherWolf.setVelocity(Math.cos(helpAngle) * 100, -300);
              }
            }
          });
        }
      } else {
        // Random movement when not chasing
        if (Math.random() < 0.01 && wolf.body.onFloor()) {
          wolf.setVelocity(Phaser.Math.Between(-100, 100), 0);
        }
      }

      // Flip wolf image based on movement direction
      if (wolf.body.velocity.x > 0) {
        wolf.flipX = true; // Set to normal orientation (facing right)
      } else if (wolf.body.velocity.x < 0) {
        wolf.flipX = false; // Flip image horizontally (facing left)
      }
    }
  });


  kunaiCountText.setText('Kunai: '+  (5 - this.kunais.countActive(true)) + '/5'); // Count active kunai

  //spinning animation
  this.kunais.children.iterate(function(kunai) {
    if (kunai.active) {
      if (kunai.body.velocity.x > 0) {
        kunai.angle += 10; // Spin clockwise (rightward throw)
      } else if (kunai.body.velocity.x < 0) {
        kunai.angle -= 10; // Spin counter-clockwise (leftward throw)
      } else {
        kunai.angle += 2; // Spin counter-clockwise (leftward throw)
      }
    }
  });

  // Destroy wolves that are far behind the hunter or after 10 seconds
  this.wolves.children.each(function(wolf) {
    if (wolf.x < this.hunter.x - 800) {
      wolf.destroy();
    }
  }, this);

}


function throwKunai() {
  kunai = this.kunais.get(this.hunter.x, this.hunter.y - 20);
  if (kunai) {
    kunai.setActive(true);
    kunai.setVisible(true);
    kunai.body.setGravityY(600); // Ensure the kunai falls down

    // Adjust cursor position relative to the camera scroll
    const cursorX = game.input.mousePointer.worldX;
    const cursorY = game.input.mousePointer.worldY;

    // Calculate the difference between cursor and hunter positions
    const deltaX = cursorX - this.hunter.x;
    const deltaY = cursorY - this.hunter.y;

    // Calculate the angle (radians) using Math.atan2
    const angle = Math.atan2(deltaY, deltaX);

    // Set kunai velocity based on angle and desired throwing speed
    const throwingSpeed = 750; // Adjust this value to control kunai speed
    kunai.body.velocity.x = throwingSpeed * Math.cos(angle);
    kunai.body.velocity.y = throwingSpeed * Math.sin(angle);

    // Set kunai rotation to match throwing angle
    kunai.rotation = angle;
    // Add a timer to destroy the kunai after 5 seconds
    this.time.addEvent({
      delay: 3000,
      callback: destroyKunai,
      callbackScope: this,
      args: [kunai], // Pass the kunai as an argument
    });
  }
}

function spawnWolf() {
  const wolf = this.wolves.create(this.hunter.x + Phaser.Math.Between(600, 1000), 350, 'wolf');

  wolf.setCollideWorldBounds(true);
  wolf.setBounce(0);
  wolf.setVelocity(Phaser.Math.Between(-100, 100), 20);

  // Set a timer to destroy the wolf after 10 seconds so that the game will not LAG
  this.time.delayedCall(10000, () => {
    if (wolf.active) { // Check if the wolf is still active
      wolf.destroy();
    }
  }, null, this);
}

function spawnEagle() {
  const eagle = this.eagles.create(Phaser.Math.Between(this.hunter.x - 50, this.hunter.x + 300), -50, 'eagle');
  eagle.setCollideWorldBounds(true);
  eagle.setGravityY(500); // Adjust bounce as needed

  // Set a timer to destroy the eagles after 1.2 seconds 
  this.time.delayedCall(1200, () => {
    if (eagle.active) { // Check if the eagle is still active
      eagle.destroy();
    }
  }, null, this);
}

function killEagle(kunai, eagle) {
  eagle.destroy();
  kunai.destroy();
}

function killWolf(kunai, wolf) {
  wolf.destroy();
  kunai.destroy();
}

function destroyKunai(kunai) {
  if (kunai) { 
    kunai.destroy();
  }
}
function destroyEagle(eagle) {
  if (eagle) { 
    eagle.destroy();
  }
}

function gameOver(hunter) {
  this.scene.pause();
  hunter.setTint(0xff0000);
  this.GameOverText = this.add.text(180, 150, 'Game Over', { fontSize: '75px', fill: '#fff' });
  this.PressF5 = this.add.text(210, 220, 'Press F5 to Restart', { fontSize: '30px', fill: '#fff' });
  this.GameOverText.setScrollFactor(0);
  this.PressF5.setScrollFactor(0);

}
