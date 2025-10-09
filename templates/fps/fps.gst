import ghost;
import ghostengine as ge;

const engine = new ge.GhostEngine();

class Player extends ge.PC {
    builder(settings) {
        build();
        this.addComponents(
            ge.Phys(3),
            ge.Controls({
                "w": this.moveForward(3),
                "a": this.moveLeft(3),
                "s": this.moveBackward(3),
                "d": this.moveRight(3),
                "space": this.jump(3)
            })
        );
    }
}
const PlayerSettings = player.builder.settings;
PlayerSettings.requireKeys("x", "y");
PlayerSettings.allowOnlyKeys("x", "y");

const player = new Player(0, 0);
engine.add(player);

engine.start();