class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1300;
        this.JUMP_VELOCITY = -1000;

        this.playerspawnX = 0;
        this.playerspawnY = 0;

        this.score = 0;

        this.jumpCount = 0;
        this.maxJumps = 2;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //Water Layer
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);
        this.waterLayer.setScale(2.0);

        this.objectLayer = this.map.getObjectLayer("Objects");

        this.objectLayer.objects.forEach(obj => {
            if (obj.name === "PlayerSpawn") {
                this.playerspawnX = obj.x * 2.0;
                this.playerspawnY = obj.y * 2.0;
            }
        });

        this.coins = this.physics.add.group();
        this.objectLayer.objects.forEach(obj =>{
            if (obj.name === "Coin") {
                let scale = 2.0;
                let coin = this.physics.add.sprite(obj.x * scale , (obj.y * scale), "coin1");
                coin.setScale(scale);
                coin.setImmovable(true);               
                coin.body.setAllowGravity(false);      
                coin.body.moves = false;
                this.coins.add(coin);
            }
        });


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.playerspawnX, this.playerspawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        this.physics.add.overlap(my.sprite.player, this.coins, this.collectCoin, null, this);


        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);


        this.cameras.main.startFollow(my.sprite.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * 2, this.map.heightInPixels * 2);

        this.scoreText = this.add.text(250, 160, 'Score: 0', {
            fontSize: '16px', 
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000'
        });
        this.scoreText.setScrollFactor(0); 
        this.scoreText.setDepth(99); 

    }

    update() {
        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAcceleration(0);
            my.sprite.player.body.setDrag(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        let tile = this.waterLayer.getTileAtWorldXY(
            my.sprite.player.x,
            my.sprite.player.y,
            true
        );
        
        if (tile && tile.properties.drown) {
            this.drown();
        }

        let maxSpeed = 300;  

        if (my.sprite.player.body.velocity.x > maxSpeed) {
            my.sprite.player.body.velocity.x = maxSpeed;
        }
        if (my.sprite.player.body.velocity.x < -maxSpeed) {
            my.sprite.player.body.velocity.x = -maxSpeed;
        }

        if (my.sprite.player.body.blocked.down) {
            this.jumpCount = 0;
            this.jumpReleased = true;  
        }

        if (!cursors.up.isDown) {
            this.jumpReleased = true;
        }

        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpCount === 0) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpCount++;
            this.jumpReleased = false;
        } else if (cursors.up.isDown && this.jumpCount === 1 && this.jumpReleased) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpCount++;
            this.jumpReleased = false;
        }

    }

    drown() {
        this.physics.world.pause();
        my.sprite.player.anims.stop();
        this.cameras.main.fade(1000, 0, 0, 255);
        this.time.delayedCall(1200, () => {
            this.scene.restart();  
        });
    }

    collectCoin(player, coin) {
        coin.disableBody(true,true);
        this.score = (this.score || 0) + 1;
        this.scoreText.setText('Score: ' + this.score);
    }
    
}