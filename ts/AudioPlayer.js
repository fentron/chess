export default class AudioPlayer {
    constructor(pack = 'kerim') {
        if (pack === 'kerim') {
            this.takesTracks = [
                new Audio('audio/kerim/take 1.mp3'),
                new Audio('audio/kerim/take 2.mp3'),
                new Audio('audio/kerim/take 3.mp3'),
            ];
            this.movesTracks = [
                new Audio('audio/kerim/move 1.mp3'),
                new Audio('audio/kerim/move 2.mp3'),
                new Audio('audio/kerim/move 3.mp3'),
                new Audio('audio/kerim/move 4.mp3'),
                new Audio('audio/kerim/move 5.mp3'),
            ];
            this.checksTracks = [
                new Audio('audio/kerim/check.mp3')
            ];
            this.mateTrack = new Audio('audio/kerim/check_mate.mp3');
        }
        else {
            this.takesTracks = [
                new Audio('audio/voice/takes_1.mp3'),
                new Audio('audio/voice/takes_2.mp3'),
                new Audio('audio/voice/takes_3.mp3'),
                new Audio('audio/voice/takes_4.mp3'),
            ];
            this.movesTracks = [
                new Audio('audio/voice/moves_1.mp3'),
                new Audio('audio/voice/moves_2.mp3'),
                new Audio('audio/voice/moves_4.mp3'),
                new Audio('audio/voice/moves_5.mp3'),
                new Audio('audio/voice/moves_6.mp3'),
                new Audio('audio/voice/moves_7.mp3'),
            ];
            this.checksTracks = [
                new Audio('audio/voice/check.mp3')
            ];
            this.mateTrack = new Audio('audio/voice/check_mate.mp3');
        }
    }
    playRandom(tracks) {
        tracks[Math.floor(Math.random() * tracks.length)].play();
    }
    playMove() {
        this.playRandom(this.movesTracks);
    }
    playTakes() {
        this.playRandom(this.takesTracks);
    }
    playCheck() {
        this.playRandom(this.checksTracks);
    }
    playMate() {
        this.mateTrack.play();
    }
}
//# sourceMappingURL=AudioPlayer.js.map