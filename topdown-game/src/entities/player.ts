class Player {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.health = 100;
        this.speed = 5;
        this.sprite = null; // Placeholder for the player's sprite
    }

    move(direction) {
        switch (direction) {
            case 'up':
                this.y -= this.speed;
                break;
            case 'down':
                this.y += this.speed;
                break;
            case 'left':
                this.x -= this.speed;
                break;
            case 'right':
                this.x += this.speed;
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }

    isAlive() {
        return this.health > 0;
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    update() {
        // Update player logic, e.g., handle input, animations, etc.
    }

    render(context) {
        if (this.sprite) {
            context.drawImage(this.sprite, this.x, this.y);
        }
    }
}

export default Player;