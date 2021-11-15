/**
 * Chooses a random legal moves
 */
export default class BigInter {
    async makeMove(board) {
        return board.getAllLegalMoves()[Math.floor(Math.random() * board.getAllLegalMoves().length)];
    }
}
//# sourceMappingURL=BigInter.js.map